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

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 项目 Feed 推荐流 Service（方案 B）。
 *
 * <h2>核心公式（沟通热度 + 沟通率惩罚 + 冷启动）</h2>
 * <pre>
 *   沟通率 = (chatUnique + collectCount×0.5) / (viewCount + 1)
 *   热度分 = log1p(chatUnique + collectCount×0.5) × 10
 *   时效系数 = 1 / pow(hoursSincePublish + 1, 0.8)
 *   惩罚系数 = 沟通率 &lt; 0.05 ? 0.5 : 1.0
 *   Deadline加分 = daysLeft &gt; 0 ? 50 / pow(daysLeft + 1, 1.5) : 50
 *
 *   最终分 = 热度分 × 时效系数 × 惩罚系数 + Deadline加分
 * </pre>
 *
 * <h2>冷启动机制</h2>
 * <ul>
 *   <li>触发条件：发布 &lt; 24h 且 浏览量 &lt; 10</li>
 *   <li>实现：随机插入到推荐列表第 3-8 位</li>
 *   <li>曝光配额：Redis 计数器 cold_start:{projectUid}:{date}，TTL 24h，上限 50 次/天</li>
 * </ul>
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
    private static final String COLD_START_KEY = "cold_start:";
    private static final Duration ZSET_TTL = Duration.ofMinutes(30);

    // ── 公式参数 ──
    static final double BETA = 50.0;
    static final double BASE_TIME_EXPONENT = 0.8;

    // ── 热度分 ──
    private static final double HEAT_FACTOR = 10.0;

    // ── 沟通率惩罚 ──
    private static final double CONVERSION_THRESHOLD = 0.05;
    private static final double CONVERSION_PENALTY_FACTOR = 0.5;

    // ── 冷启动 ──
    private static final long COLD_START_HOURS = 24;
    private static final int COLD_START_MAX_VIEWS = 10;
    private static final int COLD_START_MIN_POSITION = 3;
    private static final int COLD_START_MAX_POSITION = 8;
    private static final int COLD_START_DAILY_QUOTA = 50;

    private static final int MAX_CANDIDATES = 2000;
    private static final int MAX_PAGE_SIZE = 50;

    private static final Set<String> FEED_PROJECT_STATUSES = Set.of("OPEN", "ONGOING");
    private static final String ANONYMOUS_USER = "anonymous";

    /** 等级序值：S(6) > A(5) > B(4) > C(3) > D(2) > E(1) */
    static final Map<String, Integer> LEVEL_ORDER = Map.of(
            "S", 6, "A", 5, "B", 4, "C", 3, "D", 2, "E", 1
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
     * 获取项目推荐流分页（含冷启动注入）。
     */
    public List<ContentVO> getProjectFeed(String userUid, String category, int limit) {
        String effectiveUserUid = normalizeUserUid(userUid);
        String effectiveCategory = normalizeCategory(category);
        int safeLimit = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);

        String zsetKey = FEED_ZSET_KEY + effectiveUserUid + ":" + effectiveCategory;

        if (Boolean.FALSE.equals(stringRedisTemplate.hasKey(zsetKey))) {
            rebuildProjectZSet(effectiveUserUid, effectiveCategory);
        }

        List<ContentVO> sortedItems = getProjectFeedFromZSet(effectiveUserUid, effectiveCategory, 1, safeLimit);

        // 冷启动注入（仅第一页）
        List<Project> coldCandidates = collectColdStartCandidates(category);
        if (!coldCandidates.isEmpty()) {
            sortedItems = injectColdStartItems(sortedItems, coldCandidates, new HashMap<>());
        }

        return sortedItems;
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
            int collectCount = feedCounterService.getProjectCollectCount(project.getProjectUid());
            long chatUnique = feedCounterService.getProjectChatUniqueCount(project.getProjectUid());
            double score = computeFinalScore(project, viewCount, collectCount, chatUnique);
            stringRedisTemplate.opsForZSet().add(zsetKey, project.getProjectUid(), score);
        }

        stringRedisTemplate.expire(zsetKey, ZSET_TTL.getSeconds(), TimeUnit.SECONDS);

        log.info("Project feed ZSET rebuilt: userUid={}, category={}, size={}",
                userUid, category, safeZSetSize(zsetKey));
    }

    // ============================================================================
    //  核心得分公式
    // ============================================================================

    /**
     * 综合评分公式：
     * <pre>
     *   沟通率 = (chatUnique + collectCount×0.5) / (viewCount + 1)
     *   热度分 = log1p(chatUnique + collectCount×0.5) × 10
     *   时效系数 = 1 / pow(hoursSincePublish + 1, 0.8)
     *   惩罚系数 = 沟通率 &lt; 0.05 ? 0.5 : 1.0
     *   Deadline加分 = daysLeft &gt; 0 ? 50 / pow(daysLeft + 1, 1.5) : 50
     *
     *   最终分 = 热度分 × 时效系数 × 惩罚系数 + Deadline加分
     * </pre>
     */
    static double computeFinalScore(Project project, int viewCount, int collectCount, long chatUnique) {
        double heatScore = computeHeatScore(chatUnique, collectCount);
        double timeDecay = computeTimeDecay(project);
        double conversionRate = computeConversionRate(viewCount, collectCount, chatUnique);
        double penaltyFactor = computeConversionPenalty(conversionRate);
        double urgencyBoost = computeUrgencyBoost(project);
        return heatScore * timeDecay * penaltyFactor + urgencyBoost;
    }

    /** 热度分 = log1p(chatUnique + collectCount×0.5) × 10 */
    static double computeHeatScore(long chatUnique, int collectCount) {
        return Math.log1p(chatUnique + collectCount * 0.5) * HEAT_FACTOR;
    }

    /** 时效系数 = 1 / pow(hoursSincePublish + 1, 0.8) */
    static double computeTimeDecay(Project project) {
        LocalDateTime publishTime = project.getPublishedAt() != null
                ? project.getPublishedAt() : project.getCreatedAt();
        if (publishTime == null) publishTime = LocalDateTime.now();
        long hours = Math.max(0, ChronoUnit.HOURS.between(publishTime, LocalDateTime.now()));
        return 1.0 / Math.pow(hours + 1.0, BASE_TIME_EXPONENT);
    }

    /** 沟通率 = (chatUnique + collectCount×0.5) / (viewCount + 1) */
    static double computeConversionRate(int viewCount, int collectCount, long chatUnique) {
        double numerator = chatUnique + collectCount * 0.5;
        return numerator / (viewCount + 1.0);
    }

    /** 沟通率惩罚：沟通率 &lt; 5% 时 ×0.5，否则 ×1.0 */
    static double computeConversionPenalty(double conversionRate) {
        return conversionRate < CONVERSION_THRESHOLD ? CONVERSION_PENALTY_FACTOR : 1.0;
    }

    static double computeUrgencyBoost(Project project) {
        LocalDate deadline = project.getDeadline();
        if (deadline == null) return 0.0;
        long daysLeft = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), deadline));
        if (daysLeft == 0) {
            return BETA; // deadline 当天或已过期，给满额加分
        }
        return BETA / Math.pow(daysLeft + 1.0, 1.5);
    }

    // ============================================================================
    //  冷启动机制
    // ============================================================================

    /**
     * 判断项目是否处于冷启动期：发布 &lt; 24h 且 浏览量 &lt; 10。
     */
    static boolean isColdStartCandidate(Project project, int viewCount) {
        if (viewCount >= COLD_START_MAX_VIEWS) {
            return false;
        }
        LocalDateTime publishTime = project.getPublishedAt() != null
                ? project.getPublishedAt() : project.getCreatedAt();
        if (publishTime == null) {
            return false;
        }
        long hoursSincePublish = ChronoUnit.HOURS.between(publishTime, LocalDateTime.now());
        return hoursSincePublish >= 0 && hoursSincePublish < COLD_START_HOURS;
    }

    /**
     * 检查冷启动曝光配额是否已用完（Redis 计数器，每天最多 50 次）。
     * Key: cold_start:{projectUid}:{yyyy-MM-dd}，TTL 24h。
     */
    private boolean checkColdStartQuota(String projectUid) {
        String today = LocalDate.now().toString();
        String key = COLD_START_KEY + projectUid + ":" + today;
        Long count = stringRedisTemplate.opsForValue().increment(key);
        if (count == null) {
            return false;
        }
        if (count == 1) {
            stringRedisTemplate.expire(key, Duration.ofHours(24));
        }
        return count <= COLD_START_DAILY_QUOTA;
    }

    /**
     * 从数据库收集所有满足冷启动条件的项目。
     */
    private List<Project> collectColdStartCandidates(String category) {
        List<Project> candidates = loadFeedProjects(MAX_CANDIDATES, category);
        List<Project> coldCandidates = new ArrayList<>();
        for (Project project : candidates) {
            int viewCount = feedCounterService.getProjectViewCount(project.getProjectUid());
            if (isColdStartCandidate(project, viewCount)) {
                coldCandidates.add(project);
            }
        }
        log.info("Cold start candidates collected: category={}, count={}", category, coldCandidates.size());
        return coldCandidates;
    }

    /** 将冷启动项目随机插入到推荐列表的第 3-8 位。 */
    private List<ContentVO> injectColdStartItems(List<ContentVO> sortedItems,
                                                  List<Project> coldStartCandidates,
                                                  Map<String, Integer> collectCounts) {
        if (coldStartCandidates.isEmpty() || sortedItems.size() < COLD_START_MIN_POSITION) {
            return sortedItems;
        }

        java.util.Random random = new java.util.Random();
        List<ContentVO> result = new ArrayList<>(sortedItems);

        for (Project candidate : coldStartCandidates) {
            if (!checkColdStartQuota(candidate.getProjectUid())) {
                continue;
            }
            // 避免重复插入
            boolean alreadyInList = result.stream()
                    .anyMatch(vo -> candidate.getProjectUid().equals(vo.getUid()));
            if (alreadyInList) {
                continue;
            }

            int insertPos = COLD_START_MIN_POSITION + random.nextInt(
                    COLD_START_MAX_POSITION - COLD_START_MIN_POSITION + 1);
            // 确保插入位置不超出列表范围
            insertPos = Math.min(insertPos, result.size());
            Integer collectCnt = collectCounts.getOrDefault(candidate.getProjectUid(), 0);
            ContentVO vo = projectCardAssembler.toFeedProjectVo(candidate, 0.0);
            result.add(insertPos, vo);

            log.info("Cold start injected: projectUid={}, insertPos={}, views={}, collect={}",
                    candidate.getProjectUid(), insertPos,
                    feedCounterService.getProjectViewCount(candidate.getProjectUid()), collectCnt);
        }

        return result;
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
