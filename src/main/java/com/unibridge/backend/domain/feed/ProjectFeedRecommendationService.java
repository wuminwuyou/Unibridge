package com.unibridge.backend.domain.feed;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.domain.feed.dto.ContentVO;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 项目 Feed 推荐流 Service（方案 B）。
 *
 * <h2>核心公式</h2>
 * <pre>
 *   finalScore = baseScore + urgencyBoost − conversionPenalty
 *
 *   baseScore       = budgetNormalized × 100 / (hoursSincePublish + 1)^0.8
 *   urgencyBoost    = beta / (deadlineDaysLeft + 1)^1.5
 *   conversionPenalty = gamma × (viewCount / (chatUniqueUsers + 1))
 * </pre>
 *
 * <h2>计数器来源：FeedCounterService（Redis 优先）</h2>
 * <ul>
 *   <li>浏览量 → {@code proj:cnt:{projectUid}:view}</li>
 *   <li>收藏数 → {@code proj:cnt:{projectUid}:collect}（前端「感兴趣」按钮）</li>
 *   <li>私聊去重人数 → {@code proj:chat:{projectUid}}（HyperLogLog）</li>
 *   <li>最终得分 → {@code feed:proj:{userUid}:{category}}（ZSET）</li>
 * </ul>
 */
@Service
public class ProjectFeedRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(ProjectFeedRecommendationService.class);

    // ── Redis Keys ──
    private static final String PROJ_CHAT_KEY = "proj:chat:";
    private static final String FEED_ZSET_KEY = "feed:proj:";
    private static final Duration ZSET_TTL = Duration.ofMinutes(30);

    // ── 公式参数 ──
    private static final double BUDGET_BASE = 1000.0;
    static final double BETA = 50.0;
    static final double GAMMA = 30.0;
    static final double BASE_TIME_EXPONENT = 0.8;

    private static final int MAX_CANDIDATES = 2000;
    private static final int MAX_PAGE_SIZE = 50;

    private static final Set<String> FEED_PROJECT_STATUSES = Set.of("OPEN", "ONGOING");
    private static final String ANONYMOUS_USER = "anonymous";

    /** 等级序值：UR(5) > SSR(4) > SR(3) > R(2) > N(1) */
    static final Map<String, Integer> LEVEL_ORDER = Map.of(
            "UR", 5, "SSR", 4, "SR", 3, "R", 2, "N", 1
    );
    static final double LEVEL_MATCH_SAME = 1.0;
    static final double LEVEL_MATCH_ADJACENT = 0.8;

    private final StringRedisTemplate stringRedisTemplate;
    private final ProjectMapper projectMapper;
    private final UserProfileMapper userProfileMapper;
    private final ProjectCardAssembler projectCardAssembler;
    private final FeedCounterService feedCounterService;

    public ProjectFeedRecommendationService(StringRedisTemplate stringRedisTemplate,
                                            ProjectMapper projectMapper,
                                            UserProfileMapper userProfileMapper,
                                            ProjectCardAssembler projectCardAssembler,
                                            FeedCounterService feedCounterService) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.projectMapper = projectMapper;
        this.userProfileMapper = userProfileMapper;
        this.projectCardAssembler = projectCardAssembler;
        this.feedCounterService = feedCounterService;
    }

    // ============================================================================
    //  对外 API
    // ============================================================================

    /**
     * 获取项目推荐流分页。
     */
    public List<ContentVO> getProjectFeed(String userUid, String category, int limit) {
        String effectiveUserUid = normalizeUserUid(userUid);
        String effectiveCategory = normalizeCategory(category);
        int safeLimit = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);

        String zsetKey = FEED_ZSET_KEY + effectiveUserUid + ":" + effectiveCategory;

        if (Boolean.FALSE.equals(stringRedisTemplate.hasKey(zsetKey))) {
            rebuildProjectZSet(effectiveUserUid, effectiveCategory);
        }

        return getProjectFeedFromZSet(effectiveUserUid, effectiveCategory, 1, safeLimit);
    }

    // ============================================================================
    //  ZSET 重建
    // ============================================================================

    private void rebuildProjectZSet(String userUid, String category) {
        String zsetKey = FEED_ZSET_KEY + userUid + ":" + category;

        String userLevel = loadUserLevel(userUid);

        List<Project> candidates = loadFeedProjects(MAX_CANDIDATES, category);
        if (candidates.isEmpty()) return;

        for (Project project : candidates) {
            // 等级过滤：差值 ≥2 级不推荐
            if (computeLevelFactor(resolveLevelOrder(userLevel), resolveLevelOrder(project.getLevel())) <= 0) {
                continue;
            }
            int viewCount = feedCounterService.getProjectViewCount(project.getProjectUid());
            long chatUnique = feedCounterService.getProjectChatUniqueCount(project.getProjectUid());
            double score = computeFinalScore(project, viewCount, chatUnique);
            stringRedisTemplate.opsForZSet().add(zsetKey, project.getProjectUid(), score);
        }

        stringRedisTemplate.expire(zsetKey, ZSET_TTL.getSeconds(), TimeUnit.SECONDS);

        log.info("Project feed ZSET rebuilt: userUid={}, category={}, size={}",
                userUid, category, safeZSetSize(zsetKey));
    }

    // ============================================================================
    //  核心得分公式
    // ============================================================================

    static double computeFinalScore(Project project, int viewCount, long chatUnique) {
        double baseScore = computeBaseScore(project);
        double urgencyBoost = computeUrgencyBoost(project);
        double conversionPenalty = computeConversionPenalty(viewCount, chatUnique);
        return baseScore + urgencyBoost - conversionPenalty;
    }

    private static double computeBaseScore(Project project) {
        double budgetNormalized = budgetNormalize(project.getBudget());
        LocalDateTime publishTime = project.getPublishedAt() != null
                ? project.getPublishedAt() : project.getCreatedAt();
        if (publishTime == null) publishTime = LocalDateTime.now();
        long hours = Math.max(0, ChronoUnit.HOURS.between(publishTime, LocalDateTime.now()));
        double timeDecay = 1.0 / Math.pow(hours + 1.0, BASE_TIME_EXPONENT);
        return budgetNormalized * 100.0 * timeDecay;
    }

    static double computeUrgencyBoost(Project project) {
        LocalDate deadline = project.getDeadline();
        if (deadline == null) return 0.0;
        long daysLeft = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), deadline));
        return BETA / Math.pow(daysLeft + 1.0, 1.5);
    }

    static double computeConversionPenalty(int viewCount, long chatUnique) {
        if (viewCount == 0) return 0.0;
        return GAMMA * viewCount / (double) (chatUnique + 1);
    }

    static double budgetNormalize(BigDecimal budget) {
        double value = budget != null ? Math.max(0.0, budget.doubleValue()) : 0.0;
        return Math.log1p(value) / Math.log1p(BUDGET_BASE);
    }

    // ============================================================================
    //  ZSET 分页
    // ============================================================================

    private List<ContentVO> getProjectFeedFromZSet(String userUid, String category, int page, int size) {
        String zsetKey = FEED_ZSET_KEY + userUid + ":" + category;
        Long total = stringRedisTemplate.opsForZSet().size(zsetKey);
        if (total == null || total == 0) return Collections.emptyList();

        int offset = (page - 1) * size;
        int end = (int) Math.min(offset + size - 1, total - 1);

        Set<String> projectUids = stringRedisTemplate.opsForZSet().reverseRange(zsetKey, offset, end);
        if (projectUids == null || projectUids.isEmpty()) return Collections.emptyList();

        List<Project> projects = loadProjectsByUids(projectUids);

        Map<String, Project> projectMap = projects.stream()
                .collect(Collectors.toMap(Project::getProjectUid, p -> p, (a, b) -> a));

        List<ContentVO> result = new ArrayList<>();
        for (String uid : projectUids) {
            Project project = projectMap.get(uid);
            if (project != null) {
                Double score = stringRedisTemplate.opsForZSet().score(zsetKey, uid);
                result.add(projectCardAssembler.toFeedProjectVo(project, score != null ? score : 0.0));
            }
        }
        return result;
    }

    // ============================================================================
    //  DB 加载
    // ============================================================================

    private List<Project> loadFeedProjects(int limit, String category) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Project::getStatus, FEED_PROJECT_STATUSES)
                .gt(Project::getDeadline, LocalDate.now())
                .eq(Project::getCategory, category)
                .orderByDesc(Project::getPublishedAt)
                .orderByDesc(Project::getCreatedAt)
                .last("LIMIT " + limit);
        return projectMapper.selectList(wrapper);
    }

    private List<Project> loadProjectsByUids(Set<String> projectUids) {
        if (projectUids.isEmpty()) return Collections.emptyList();
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Project::getProjectUid, projectUids);
        return projectMapper.selectList(wrapper);
    }

    // ============================================================================
    //  工具
    // ============================================================================

    private long safeZSetSize(String key) {
        Long size = stringRedisTemplate.opsForZSet().size(key);
        return size == null ? 0 : size;
    }

    private String normalizeUserUid(String userUid) {
        if (userUid == null || userUid.isBlank()) return ANONYMOUS_USER;
        return userUid.trim();
    }

    private String normalizeCategory(String category) {
        if (!StringUtils.hasText(category)) return "COMMERCIAL";
        return category.trim().toUpperCase();
    }

    // ============================================================================
    //  等级过滤（与 FeedRecommendationService 保持一致）
    // ============================================================================

    static int resolveLevelOrder(String level) {
        if (level == null || level.isBlank()) return 0;
        return LEVEL_ORDER.getOrDefault(level.trim().toUpperCase(), 0);
    }

    static double computeLevelFactor(int userLevelOrder, int projectLevelOrder) {
        if (userLevelOrder == 0 || projectLevelOrder == 0) return 1.0;
        int diff = Math.abs(userLevelOrder - projectLevelOrder);
        if (diff == 0) return LEVEL_MATCH_SAME;
        if (diff == 1) return LEVEL_MATCH_ADJACENT;
        return 0.0;
    }

    private String loadUserLevel(String userUid) {
        if (userUid == null || userUid.isBlank() || ANONYMOUS_USER.equals(userUid)) {
            return null;
        }
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getUserUid, userUid)
                .select(UserProfile::getLevel)
                .last("LIMIT 1");
        UserProfile profile = userProfileMapper.selectOne(wrapper);
        return profile != null ? profile.getLevel() : null;
    }
}
