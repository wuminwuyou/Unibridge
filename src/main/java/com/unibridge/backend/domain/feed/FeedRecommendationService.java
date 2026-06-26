package com.unibridge.backend.domain.feed;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.domain.feed.dto.ContentVO;
import com.unibridge.backend.domain.feed.dto.FeedShuffleResponse;
import com.unibridge.backend.domain.feed.dto.HomeFeedResponse;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.infrastructure.entities.note.Note;
import com.unibridge.backend.infrastructure.entities.note.NoteCounter;
import com.unibridge.backend.infrastructure.entities.note.NoteDetail;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.interaction.UserInterestTag;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteCounterMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteDetailMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.interaction.UserInterestTagMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Feed 推荐服务（HN 时间衰减 + 兴趣标签裂变召回 + Redis ZSET + 能力等级匹配）。
 *
 * <h3>核心算法</h3>
 * <ol>
 *   <li><b>兴趣标签召回</b>：加载用户兴趣标签（Redis 缓存 → DB），
 *       遍历笔记 tags 进行加权匹配命中</li>
 *   <li><b>高亲和度裂变召回</b>：标签匹配分高于均值的笔记，提取
 *       parent_content_type_code 将同父兄弟笔记纳入候选池（裂变系数 0.8）</li>
 *   <li><b>Hacker News 热度分</b>：
 *       score = (likes×5 + collects×10 + comments×8) / (hours + 1)^1.5 × tagFactor</li>
 *   <li><b>Redis ZSET 倒序分页</b>：笔记得分写入 per-user ZSET，ZREVRANGE 高效输出</li>
 *   <li><b>能力等级匹配（项目）</b>：用户 p_user_profile.level 匹配 project.level，
 *       同等级 ×1.0，差 1 级 ×0.8，差 ≥2 级不推荐</li>
 * </ol>
 */
@Service
public class FeedRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(FeedRecommendationService.class);
    private static final DateTimeFormatter PUBLISH_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private static final String CONTENT_TYPE_NOTE = "NOTE";
    private static final String CONTENT_TYPE_PROJECT = "PROJECT";
    private static final String NOTE_STATUS_PUBLISHED = "PUBLISHED";
    private static final Set<String> PUBLIC_PROJECT_STATUS = Set.of("OPEN", "ONGOING", "CLOSED");

    private static final String PROJECT_CATEGORY_COMMERCIAL = "COMMERCIAL";
    private static final String PROJECT_CATEGORY_RECRUITMENT = "RECRUITMENT";
    private static final Set<String> VALID_PROJECT_CATEGORIES = Set.of(
            PROJECT_CATEGORY_COMMERCIAL, PROJECT_CATEGORY_RECRUITMENT);

    private static final String NOTE_TYPE_IMAGE_TEXT = "IMAGE_TEXT";
    private static final String NOTE_TYPE_VIDEO = "VIDEO";
    private static final Set<String> VALID_NOTE_TYPES = Set.of(NOTE_TYPE_IMAGE_TEXT, NOTE_TYPE_VIDEO);
    private static final String NOTE_CODE_PREFIX_IMAGE_TEXT = "TX";
    private static final String NOTE_CODE_PREFIX_VIDEO = "VD";

    /** 首页推送：笔记条数 */
    private static final int HOME_NOTE_LIMIT = 5;
    /** 首页推送：项目条数 */
    private static final int HOME_PROJECT_LIMIT = 10;
    /** 专区 Feed 默认条数 */
    private static final int ZONE_FEED_DEFAULT_LIMIT = 10;
    /** Feed 单页最大条数 */
    private static final int FEED_MAX_LIMIT = 30;
    /** 首页「换一换」默认混排条数（≈ 5 笔记 + 10 项目） */
    private static final int HOME_SHUFFLE_DEFAULT_SIZE = 15;
    /** 机制 A：Spring Cache 分页 */
    static final String SHUFFLE_MODE_CACHE_PAGE = "CACHE_PAGE";
    /** 机制 B：Java Collections.shuffle + Random(seed)，不缓存 */
    static final String SHUFFLE_MODE_RANDOM_SEED = "RANDOM_SEED";
    /** 首页候选池上限（单类型） */
    private static final int HOME_CANDIDATE_LIMIT = 400;
    /** 相似笔记候选池 */
    private static final int SIMILAR_CANDIDATE_LIMIT = 200;
    /** 笔记 Feed 候选池上限（用于 ZSET 重建） */
    private static final int NOTE_FEED_CANDIDATE_LIMIT = 2000;
    private static final String ANONYMOUS_USER = "anonymous";

    // ── Hacker News 公式参数 ──
    private static final double LIKE_WEIGHT = 5.0;
    private static final double COLLECT_WEIGHT = 10.0;
    private static final double COMMENT_WEIGHT = 8.0;
    private static final double TIME_DECAY_EXPONENT = 1.5;
    private static final double TIME_SMOOTH = 1.0;

    // ── 裂变召回 ──
    private static final double FISSION_DECAY = 0.8;
    private static final double FISSION_TAG_INHERIT = 0.7;

    // ── 能力等级排序 ──
    /** 等级序值：UR(5) > SSR(4) > SR(3) > R(2) > N(1) */
    private static final Map<String, Integer> LEVEL_ORDER = Map.of(
            "UR", 5, "SSR", 4, "SR", 3, "R", 2, "N", 1
    );
    /** 项目等级匹配系数：同等级=1.0，差1级=0.8，差≥2级=0.0（不推荐） */
    private static final double LEVEL_MATCH_SAME = 1.0;
    private static final double LEVEL_MATCH_ADJACENT = 0.8;

    // ── Redis ZSET ──
    private static final String FEED_ZSET_PREFIX = "feed:note:";
    private static final Duration ZSET_TTL = Duration.ofMinutes(30);

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final UserInterestTagMapper userInterestTagMapper;
    private final NoteMapper noteMapper;
    private final NoteCounterMapper noteCounterMapper;
    private final NoteDetailMapper noteDetailMapper;
    private final ProjectMapper projectMapper;
    private final UserProfileMapper userProfileMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final FeedShuffleCacheService feedShuffleCacheService;
    private final FeedCounterService feedCounterService;
    private final ProjectFeedRecommendationService projectFeedRecService;
    private final ContentUidResolver contentUidResolver;
    private final ProjectCardAssembler projectCardAssembler;
    private final NoteCardAssembler noteCardAssembler;

    public FeedRecommendationService(UserInterestTagMapper userInterestTagMapper,
                                     NoteMapper noteMapper,
                                     NoteCounterMapper noteCounterMapper,
                                     NoteDetailMapper noteDetailMapper,
                                     ProjectMapper projectMapper,
                                     UserProfileMapper userProfileMapper,
                                     StringRedisTemplate stringRedisTemplate,
                                     @Lazy FeedShuffleCacheService feedShuffleCacheService,
                                     FeedCounterService feedCounterService,
                                     ProjectFeedRecommendationService projectFeedRecService,
                                     ContentUidResolver contentUidResolver,
                                     ProjectCardAssembler projectCardAssembler,
                                     NoteCardAssembler noteCardAssembler) {
        this.userInterestTagMapper = userInterestTagMapper;
        this.noteMapper = noteMapper;
        this.noteCounterMapper = noteCounterMapper;
        this.noteDetailMapper = noteDetailMapper;
        this.projectMapper = projectMapper;
        this.userProfileMapper = userProfileMapper;
        this.stringRedisTemplate = stringRedisTemplate;
        this.feedShuffleCacheService = feedShuffleCacheService;
        this.feedCounterService = feedCounterService;
        this.projectFeedRecService = projectFeedRecService;
        this.contentUidResolver = contentUidResolver;
        this.projectCardAssembler = projectCardAssembler;
        this.noteCardAssembler = noteCardAssembler;
    }

    // ============================================================================
    //  对外 API（保持兼容）
    // ============================================================================

    /**
     * 首页个性化推送：笔记 5 条 + 项目 10 条，分别按 HN 推荐分排序。
     */
    @Cacheable(value = "home_feed", key = "#userUid != null ? #userUid : 'anonymous'")
    public HomeFeedResponse getHomeFeed(String userUid) {
        String effectiveUserUid = normalizeUserUid(userUid);
        Map<String, Double> tagWeights = loadUserTagWeights(effectiveUserUid);

        List<ContentVO> notes = scoreNotes(loadPublishedNotes(HOME_CANDIDATE_LIMIT), tagWeights).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .limit(HOME_NOTE_LIMIT)
                .map(ScoredContent::vo)
                .collect(Collectors.toList());

        List<ContentVO> projects = scoreProjects(loadPublicProjects(HOME_CANDIDATE_LIMIT), tagWeights, loadUserLevel(effectiveUserUid)).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .limit(HOME_PROJECT_LIMIT)
                .map(ScoredContent::vo)
                .collect(Collectors.toList());

        log.debug("Home feed computed: userUid={}, notes={}, projects={}",
                effectiveUserUid, notes.size(), projects.size());
        return HomeFeedResponse.builder()
                .notes(notes)
                .projects(projects)
                .build();
    }

    public List<ContentVO> getHomeFeedWithShuffle(String userUid, Long seed, int page, int size) {
        return getHomeFeedShuffleResponse(userUid, seed, page, size).getItems();
    }

    public FeedShuffleResponse getHomeFeedShuffleResponse(String userUid, Long seed, int page, int size) {
        String effectiveUserUid = normalizeUserUid(userUid);
        int safeSize = normalizeShuffleSize(size, HOME_SHUFFLE_DEFAULT_SIZE);
        long total = countHomeFeedTotal();

        if (seed != null) {
            long safeSeed = sanitizeRandSeed(seed);
            PageWindow window = resolvePageWindow(page, safeSize, total);
            List<ContentVO> items = buildHomeFeedRandomPage(effectiveUserUid, safeSeed, window.page(), safeSize);
            log.debug("Home shuffle RANDOM_SEED: userUid={}, seed={}, page={}, size={}, total={}",
                    effectiveUserUid, safeSeed, window.page(), safeSize, total);
            return toShuffleResponse(items, window, safeSize, total, SHUFFLE_MODE_RANDOM_SEED, safeSeed);
        }

        PageWindow window = resolvePageWindow(page, safeSize, total);
        List<ContentVO> items = feedShuffleCacheService.getHomeFeedCachedPage(effectiveUserUid, window.page(), safeSize);
        log.debug("Home shuffle CACHE_PAGE: userUid={}, page={}, size={}, total={}, wrapped={}",
                effectiveUserUid, window.page(), safeSize, total, window.wrapped());
        return toShuffleResponse(items, window, safeSize, total, SHUFFLE_MODE_CACHE_PAGE, null);
    }

    public FeedShuffleResponse getProjectFeedShuffleResponse(String userUid,
                                                             String category,
                                                             Long seed,
                                                             int page,
                                                             int size) {
        String normalizedCategory = normalizeProjectCategory(category);
        String effectiveUserUid = normalizeUserUid(userUid);
        int safeSize = normalizeShuffleSize(size, ZONE_FEED_DEFAULT_LIMIT);
        long total = countPublicProjects(normalizedCategory);

        if (seed != null) {
            long safeSeed = sanitizeRandSeed(seed);
            PageWindow window = resolvePageWindow(page, safeSize, total);
            List<ContentVO> items = buildProjectFeedRandomPage(
                    effectiveUserUid, normalizedCategory, safeSeed, window.page(), safeSize);
            return toShuffleResponse(items, window, safeSize, total, SHUFFLE_MODE_RANDOM_SEED, safeSeed);
        }

        PageWindow window = resolvePageWindow(page, safeSize, total);
        List<ContentVO> items = feedShuffleCacheService.getProjectFeedCachedPage(
                effectiveUserUid, normalizedCategory, window.page(), safeSize);
        return toShuffleResponse(items, window, safeSize, total, SHUFFLE_MODE_CACHE_PAGE, null);
    }

    public FeedShuffleResponse getNoteFeedShuffleResponse(String userUid,
                                                          String noteType,
                                                          Long seed,
                                                          int page,
                                                          int size) {
        String normalizedNoteType = normalizeNoteType(noteType);
        String effectiveUserUid = normalizeUserUid(userUid);
        int safeSize = normalizeShuffleSize(size, ZONE_FEED_DEFAULT_LIMIT);
        long total = countPublishedNotes(normalizedNoteType);

        if (seed != null) {
            long safeSeed = sanitizeRandSeed(seed);
            PageWindow window = resolvePageWindow(page, safeSize, total);
            List<ContentVO> items = buildNoteFeedRandomPage(
                    effectiveUserUid, normalizedNoteType, safeSeed, window.page(), safeSize);
            return toShuffleResponse(items, window, safeSize, total, SHUFFLE_MODE_RANDOM_SEED, safeSeed);
        }

        PageWindow window = resolvePageWindow(page, safeSize, total);
        List<ContentVO> items = feedShuffleCacheService.getNoteFeedCachedPage(
                effectiveUserUid, normalizedNoteType, window.page(), safeSize);
        return toShuffleResponse(items, window, safeSize, total, SHUFFLE_MODE_CACHE_PAGE, null);
    }

    public List<ContentVO> buildHomeFeedCachedPage(String userUid, int page, int size) {
        Map<String, Double> tagWeights = loadUserTagWeights(userUid);
        String userLevel = loadUserLevel(userUid);
        List<ContentVO> pool = buildHomeFeedRankedPool(tagWeights, userLevel);
        return slicePage(pool, page, size);
    }

    public List<ContentVO> buildProjectFeedCachedPage(String userUid, String category, int page, int size) {
        return projectFeedRecService.getProjectFeed(userUid, category, size);
    }

    public List<ContentVO> buildNoteFeedCachedPage(String userUid, String noteType, int page, int size) {
        Map<String, Double> tagWeights = loadUserTagWeights(userUid);
        List<ContentVO> pool = buildNoteFeedRankedPool(noteType, tagWeights);
        return slicePage(pool, page, size);
    }

    @Cacheable(value = "project_feed", key = "#userUid + ':' + #category + ':' + #limit")
    public List<ContentVO> getProjectFeed(String userUid, String category, int limit) {
        String normalizedCategory = normalizeProjectCategory(category);
        int safeLimit = normalizeFeedLimit(limit, ZONE_FEED_DEFAULT_LIMIT);
        String effectiveUserUid = normalizeUserUid(userUid);
        return projectFeedRecService.getProjectFeed(effectiveUserUid, normalizedCategory, safeLimit);
    }

    /**
     * 笔记专区推送：HN 热度分 + 裂变召回 + Redis ZSET 分页。
     */
    @Cacheable(value = "note_feed", key = "#userUid + ':' + #noteType + ':' + #limit")
    public List<ContentVO> getNoteFeed(String userUid, String noteType, int limit) {
        String normalizedNoteType = normalizeNoteType(noteType);
        int safeLimit = normalizeFeedLimit(limit, ZONE_FEED_DEFAULT_LIMIT);
        String effectiveUserUid = normalizeUserUid(userUid);
        Map<String, Double> tagWeights = loadUserTagWeights(effectiveUserUid);

        // 若 ZSET 不存在，先重建
        String zsetKey = noteFeedZSetKey(effectiveUserUid, normalizedNoteType);
        if (Boolean.FALSE.equals(stringRedisTemplate.hasKey(zsetKey))) {
            rebuildNoteFeedZSet(effectiveUserUid, normalizedNoteType, tagWeights);
        }

        // 从 ZSET 读取分页
        List<ContentVO> fromZSet = getNoteFeedFromZSet(effectiveUserUid, normalizedNoteType, 1, safeLimit);
        if (fromZSet != null && !fromZSet.isEmpty()) {
            log.debug("Note feed served from ZSET: userUid={}, noteType={}, size={}",
                    effectiveUserUid, normalizedNoteType, fromZSet.size());
            return fromZSet;
        }

        // 退化路径：DB 直接打分
        List<ContentVO> notes = scoreNotes(
                loadPublishedNotes(NOTE_FEED_CANDIDATE_LIMIT, normalizedNoteType), tagWeights).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .limit(safeLimit)
                .map(ScoredContent::vo)
                .collect(Collectors.toList());

        log.debug("Note feed computed: userUid={}, noteType={}, size={}",
                effectiveUserUid, normalizedNoteType, notes.size());
        return notes;
    }

    /**
     * 相似笔记推荐：标签 Jaccard 相似度 + 关联关系加权 + HN 热度 tie-break。
     */
    @Cacheable(value = "similar_notes", key = "#noteUid")
    public List<ContentVO> getSimilarNotes(String noteUid, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 30);

        Note source = contentUidResolver.requireNoteByUid(noteUid);
        if (!NOTE_STATUS_PUBLISHED.equals(source.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        Long sourceInternalId = source.getId();
        String sourceCode = source.getContentTypeCode();

        NoteDetail sourceDetail = loadNoteDetail(sourceCode);
        String sourceParentCode = sourceDetail != null ? sourceDetail.getParentContentTypeCode() : null;

        Set<String> sourceTags = new HashSet<>(parseTags(source.getTags()));

        if (sourceTags.isEmpty() && sourceParentCode == null) {
            return loadTopLikedNotes(sourceInternalId, safeLimit).stream()
                    .map(note -> toNoteVo(note, 0.0))
                    .collect(Collectors.toList());
        }

        List<Note> candidates = loadPublishedNotes(SIMILAR_CANDIDATE_LIMIT).stream()
                .filter(note -> !note.getId().equals(sourceInternalId))
                .collect(Collectors.toList());

        List<String> candidateCodes = candidates.stream()
                .map(Note::getContentTypeCode).collect(Collectors.toList());
        Map<String, NoteCounter> counterMap = loadNoteCounters(candidateCodes);
        Map<String, NoteDetail> detailMap = loadNoteDetails(candidateCodes);

        NoteCounter emptyCounter = new NoteCounter();
        emptyCounter.setViewCount(0); emptyCounter.setLikeCount(0); emptyCounter.setCollectCount(0); emptyCounter.setCommentCount(0);

        List<ScoredContent> scored = new ArrayList<>();
        for (Note note : candidates) {
            String candidateCode = note.getContentTypeCode();
            Set<String> tags = new HashSet<>(parseTags(note.getTags()));

            double similarity = sourceTags.isEmpty() ? 0.0 : jaccardSimilarity(sourceTags, tags);

            double relationBoost = computeRelationBoost(sourceCode, sourceParentCode,
                    candidateCode, detailMap.get(candidateCode));

            // HN 热度替代原 log1p 热度
            NoteCounter cnt = counterMap.getOrDefault(candidateCode, emptyCounter);
            double hnScore = computeHackerNewsScore(
                    resolvePublishTime(note.getPublishedAt(), note.getCreatedAt()),
                    nullSafe(cnt.getLikeCount()),
                    nullSafe(cnt.getCollectCount()),
                    nullSafe(cnt.getCommentCount()));

            double score = (similarity + relationBoost) * 10 + hnScore;
            scored.add(new ScoredContent(toNoteVo(note, score), score));
        }

        scored.sort(Comparator.comparingDouble(ScoredContent::score).reversed());
        return scored.stream()
                .limit(safeLimit)
                .map(ScoredContent::vo)
                .collect(Collectors.toList());
    }

    /**
     * 互动变更后失效笔记 Feed ZSET，下次请求自动重建。
     */
    public void invalidateFeed(String userUid) {
        String effectiveUserUid = normalizeUserUid(userUid);
        // 删除所有 noteType 的 ZSET
        for (String noteType : VALID_NOTE_TYPES) {
            stringRedisTemplate.delete(FEED_ZSET_PREFIX + effectiveUserUid + ":" + noteType);
            stringRedisTemplate.delete(FEED_ZSET_PREFIX + effectiveUserUid + ":ALL");
        }
        log.debug("Invalidated note feed ZSETs for user: {}", effectiveUserUid);
    }

    // ============================================================================
    //  Redis ZSET Feed（笔记专区）
    // ============================================================================

    private String noteFeedZSetKey(String userUid, String noteType) {
        return FEED_ZSET_PREFIX + userUid + ":" + noteType;
    }

    /**
     * 重建用户笔记 Feed ZSET（按 noteType）。
     */
    private void rebuildNoteFeedZSet(String userUid, String noteType, Map<String, Double> tagWeights) {
        String zsetKey = noteFeedZSetKey(userUid, noteType);
        List<Note> candidates = loadPublishedNotes(NOTE_FEED_CANDIDATE_LIMIT, noteType);

        List<String> codes = candidates.stream().map(Note::getContentTypeCode).collect(Collectors.toList());
        Map<String, NoteCounter> counterMap = loadNoteCounters(codes);
        Map<String, NoteDetail> detailMap = loadNoteDetails(codes);

        // 打分（含裂变召回）
        Map<String, Double> scores = scoreNotesWithFission(candidates, tagWeights, counterMap, detailMap);

        // 写入 ZSET
        for (Map.Entry<String, Double> entry : scores.entrySet()) {
            stringRedisTemplate.opsForZSet().add(zsetKey, entry.getKey(), entry.getValue());
        }
        stringRedisTemplate.expire(zsetKey, ZSET_TTL.getSeconds(), TimeUnit.SECONDS);

        log.info("Note feed ZSET rebuilt: userUid={}, noteType={}, size={}",
                userUid, noteType, scores.size());
    }

    /**
     * 从 ZSET 读取笔记 Feed 分页。
     *
     * @return 分页结果，ZSET 不存在返回 null
     */
    private List<ContentVO> getNoteFeedFromZSet(String userUid, String noteType, int page, int size) {
        String zsetKey = noteFeedZSetKey(userUid, noteType);
        if (Boolean.FALSE.equals(stringRedisTemplate.hasKey(zsetKey))) {
            return null;
        }

        Long total = stringRedisTemplate.opsForZSet().size(zsetKey);
        if (total == null || total == 0) return Collections.emptyList();

        int offset = (page - 1) * size;
        int end = (int) Math.min(offset + size - 1, total - 1);
        Set<String> codes = stringRedisTemplate.opsForZSet()
                .reverseRange(zsetKey, offset, end);
        if (codes == null || codes.isEmpty()) return Collections.emptyList();

        return resolveNotesByCodes(userUid, noteType, codes);
    }

    /**
     * 将 contentTypeCode 集合解析为 ContentVO 列表，保持 ZSET 排序顺序。
     */
    private List<ContentVO> resolveNotesByCodes(String userUid, String noteType, Set<String> contentTypeCodes) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Note::getContentTypeCode, contentTypeCodes);
        List<Note> notes = noteMapper.selectList(wrapper);

        Map<String, Note> noteMap = notes.stream()
                .collect(Collectors.toMap(Note::getContentTypeCode, n -> n, (a, b) -> a));

        String zsetKey = noteFeedZSetKey(userUid, noteType);
        List<ContentVO> result = new ArrayList<>();
        for (String code : contentTypeCodes) {
            Note note = noteMap.get(code);
            if (note != null) {
                Double score = stringRedisTemplate.opsForZSet().score(zsetKey, code);
                result.add(noteCardAssembler.toFeedNoteVo(note, score != null ? score : 0.0));
            }
        }
        return result;
    }

    // ============================================================================
    //  打分通道（HN 热度 + 裂变召回）
    // ============================================================================

    /**
     * 笔记打分 + 裂变召回核心逻辑。
     *
     * @return contentTypeCode → 综合分
     */
    private Map<String, Double> scoreNotesWithFission(List<Note> notes,
                                                      Map<String, Double> tagWeights,
                                                      Map<String, NoteCounter> counterMap,
                                                      Map<String, NoteDetail> detailMap) {
        NoteCounter emptyCounter = new NoteCounter();
        emptyCounter.setViewCount(0); emptyCounter.setLikeCount(0); emptyCounter.setCollectCount(0); emptyCounter.setCommentCount(0);

        Map<String, Double> tagScores = new HashMap<>();
        Map<String, Double> hnScores = new HashMap<>();
        Set<String> recalled = new HashSet<>();
        double maxTagScore = 0.0;

        for (Note note : notes) {
            String code = note.getContentTypeCode();
            NoteCounter cnt = counterMap.getOrDefault(code, emptyCounter);

            double tagScore = computeTagMatchScore(parseTags(note.getTags()), tagWeights);
            tagScores.put(code, tagScore);
            if (tagScore > maxTagScore) maxTagScore = tagScore;

            double hnScore = computeHackerNewsScore(
                    resolvePublishTime(note.getPublishedAt(), note.getCreatedAt()),
                    nullSafe(cnt.getLikeCount()),
                    nullSafe(cnt.getCollectCount()),
                    nullSafe(cnt.getCommentCount()));
            hnScores.put(code, hnScore);

            if (tagWeights.isEmpty() || tagScore > 0) {
                recalled.add(code);
            }
        }

        if (tagWeights.isEmpty()) {
            recalled.addAll(notes.stream().map(Note::getContentTypeCode).collect(Collectors.toSet()));
        }

        // 裂变召回
        double avgTagScore = recalled.stream()
                .mapToDouble(code -> tagScores.getOrDefault(code, 0.0))
                .filter(v -> v > 0).average().orElse(0.0);
        Set<String> fissionRecalled = new HashSet<>();

        if (avgTagScore > 0) {
            for (String code : new ArrayList<>(recalled)) {
                double tagScore = tagScores.getOrDefault(code, 0.0);
                if (tagScore >= avgTagScore) {
                    NoteDetail detail = detailMap.get(code);
                    if (detail != null && StringUtils.hasText(detail.getParentContentTypeCode())) {
                        String parentCode = detail.getParentContentTypeCode();
                        for (Map.Entry<String, NoteDetail> entry : detailMap.entrySet()) {
                            String siblingCode = entry.getKey();
                            NoteDetail siblingDetail = entry.getValue();
                            if (!recalled.contains(siblingCode)
                                    && !fissionRecalled.contains(siblingCode)
                                    && siblingDetail != null
                                    && parentCode.equals(siblingDetail.getParentContentTypeCode())) {
                                fissionRecalled.add(siblingCode);
                                tagScores.put(siblingCode, tagScore * FISSION_TAG_INHERIT);
                            }
                        }
                    }
                }
            }
            recalled.addAll(fissionRecalled);
        }

        // 综合分
        Map<String, Double> finalScores = new HashMap<>();
        for (String code : recalled) {
            double baseHN = hnScores.getOrDefault(code, 0.0);
            double tagFactor = 1.0;
            if (maxTagScore > 0) {
                double t = tagScores.getOrDefault(code, 0.0);
                tagFactor += t / maxTagScore;
            }
            double fissionFactor = fissionRecalled.contains(code) ? FISSION_DECAY : 1.0;
            finalScores.put(code, baseHN * tagFactor * fissionFactor);
        }

        return finalScores;
    }

    /**
     * scoreNotes() — 供 Java 内存排序路径使用（首页、专区小候选池）。
     */
    private List<ScoredContent> scoreNotes(List<Note> notes, Map<String, Double> tagWeights) {
        List<String> codes = notes.stream().map(Note::getContentTypeCode).collect(Collectors.toList());
        Map<String, NoteCounter> counterMap = loadNoteCounters(codes);
        Map<String, NoteDetail> detailMap = loadNoteDetails(codes);

        Map<String, Double> scores = scoreNotesWithFission(notes, tagWeights, counterMap, detailMap);

        List<ScoredContent> result = new ArrayList<>();
        for (Note note : notes) {
            double score = scores.getOrDefault(note.getContentTypeCode(), 0.0);
            result.add(new ScoredContent(toNoteVo(note, score), score));
        }
        return result;
    }

    // ============================================================================
    //  Hacker News 时间衰减热度公式
    // ============================================================================

    /**
     * score = (likes×5 + collects×10 + comments×8) / (hoursSincePublish + 1) ^ 1.5
     */
    static double computeHackerNewsScore(LocalDateTime publishTime,
                                         int likes, int collects, int comments) {
        long hours = Math.max(0, ChronoUnit.HOURS.between(publishTime, LocalDateTime.now()));
        double numerator = likes * LIKE_WEIGHT + collects * COLLECT_WEIGHT + comments * COMMENT_WEIGHT;
        double denominator = Math.pow(hours + TIME_SMOOTH, TIME_DECAY_EXPONENT);
        return numerator / denominator;
    }

    // ============================================================================
    //  标签匹配
    // ============================================================================

    private double computeTagMatchScore(List<String> contentTags, Map<String, Double> userTagWeights) {
        if (contentTags.isEmpty() || userTagWeights.isEmpty()) {
            return 0.0;
        }
        double score = 0.0;
        for (String tag : contentTags) {
            score += userTagWeights.getOrDefault(tag, 0.0);
        }
        return score;
    }

    private Map<String, Double> loadUserTagWeights(String userUid) {
        if (userUid == null || userUid.isBlank() || ANONYMOUS_USER.equals(userUid)) {
            return Map.of();
        }
        // 优先从 Redis Hash 读取
        String cacheKey = "user:tags:" + userUid;
        Map<Object, Object> cached = stringRedisTemplate.opsForHash().entries(cacheKey);
        if (cached != null && !cached.isEmpty()) {
            Map<String, Double> result = new HashMap<>();
            for (Map.Entry<Object, Object> entry : cached.entrySet()) {
                try {
                    result.put(entry.getKey().toString(), Double.parseDouble(entry.getValue().toString()));
                } catch (NumberFormatException ignored) {
                }
            }
            return result;
        }

        // DB 兜底
        LambdaQueryWrapper<UserInterestTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserInterestTag::getUserUid, userUid)
                .orderByDesc(UserInterestTag::getWeight)
                .last("LIMIT 50");
        List<UserInterestTag> interests = userInterestTagMapper.selectList(wrapper);

        if (interests.isEmpty()) {
            stringRedisTemplate.opsForHash().put(cacheKey, "__empty__", "0");
            stringRedisTemplate.expire(cacheKey, Duration.ofMinutes(60).getSeconds(), TimeUnit.SECONDS);
            return Map.of();
        }

        Map<String, Double> weights = new HashMap<>();
        Map<String, String> hashEntries = new HashMap<>();
        for (UserInterestTag interest : interests) {
            if (interest.getWeight() != null && StringUtils.hasText(interest.getTag())) {
                String tag = interest.getTag().trim();
                double w = interest.getWeight().doubleValue();
                weights.put(tag, w);
                hashEntries.put(tag, String.valueOf(w));
            }
        }

        stringRedisTemplate.opsForHash().putAll(cacheKey, hashEntries);
        stringRedisTemplate.expire(cacheKey, Duration.ofMinutes(60).getSeconds(), TimeUnit.SECONDS);
        return weights;
    }

    // ============================================================================
    //  项目打分（保持标签加权 + HN 风格时间衰减）
    // ============================================================================

    /**
     * 项目打分：标签匹配分 × 等级匹配 × 时间衰减。
     * <p>
     * 等级匹配规则：同等级 → ×1.0，差1级 → ×0.8，差≥2级 → 0（不推荐）。
     * 匿名用户不传等级，所有项目均可推荐。
     */
    private List<ScoredContent> scoreProjects(List<Project> projects, Map<String, Double> tagWeights, String userLevel) {
        boolean tagsEmpty = tagWeights == null || tagWeights.isEmpty();
        int userLevelOrder = resolveLevelOrder(userLevel);
        List<ScoredContent> result = new ArrayList<>();
        for (Project project : projects) {
            // 等级匹配
            double levelFactor = computeLevelFactor(userLevelOrder, resolveLevelOrder(project.getLevel()));
            if (levelFactor <= 0) {
                continue; // 等级差距过大，不推荐
            }

            double tagScore = computeTagMatchScore(parseTags(project.getTags()), tagWeights);
            if (tagScore <= 0) {
                tagScore = tagsEmpty ? 1.0 : 0.2;
            }
            LocalDateTime publishTime = resolvePublishTime(project.getPublishedAt(), project.getCreatedAt());
            long hours = Math.max(0, ChronoUnit.HOURS.between(publishTime, LocalDateTime.now()));
            double timeDecay = 1.0 / Math.pow(hours + TIME_SMOOTH, 1.0);
            double score = tagScore * levelFactor * timeDecay;
            result.add(new ScoredContent(projectCardAssembler.toFeedProjectVo(project, score), score));
        }
        return result;
    }

    /** 解析等级到序值：UR=5, SSR=4, SR=3, R=2, N=1。未知等级=0（匿名/冷启动）。 */
    static int resolveLevelOrder(String level) {
        if (level == null || level.isBlank()) return 0;
        return LEVEL_ORDER.getOrDefault(level.trim().toUpperCase(), 0);
    }

    /** 计算等级匹配系数：同等级=1.0，差1级=0.8，差≥2级=0，匿名=1.0。 */
    static double computeLevelFactor(int userLevelOrder, int projectLevelOrder) {
        if (userLevelOrder == 0 || projectLevelOrder == 0) return 1.0;
        int diff = Math.abs(userLevelOrder - projectLevelOrder);
        if (diff == 0) return LEVEL_MATCH_SAME;
        if (diff == 1) return LEVEL_MATCH_ADJACENT;
        return 0.0;
    }

    /** 加载用户能力等级（从 p_user_profile.level）。 */
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

    // ============================================================================
    //  数据加载辅助
    // ============================================================================

    private String normalizeUserUid(String userUid) {
        if (userUid == null || userUid.isBlank()) {
            return ANONYMOUS_USER;
        }
        return userUid.trim();
    }

    private List<Note> loadPublishedNotes(int limit) {
        return loadPublishedNotes(limit, null);
    }

    private List<Note> loadPublishedNotes(int limit, String noteType) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getStatus, NOTE_STATUS_PUBLISHED);
        if (noteType != null) {
            wrapper.likeRight(Note::getContentTypeCode, noteTypeToCodePrefix(noteType));
        }
        wrapper.orderByDesc(Note::getPublishedAt)
                .orderByDesc(Note::getCreatedAt)
                .last("LIMIT " + limit);
        return noteMapper.selectList(wrapper);
    }

    private List<Note> loadTopLikedNotes(Long excludeId, int limit) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getStatus, NOTE_STATUS_PUBLISHED)
                .ne(Note::getId, excludeId)
                .orderByDesc(Note::getPublishedAt)
                .last("LIMIT " + limit);
        return noteMapper.selectList(wrapper);
    }

    private List<Project> loadPublicProjects(int limit) {
        return loadPublicProjects(limit, null);
    }

    private List<Project> loadPublicProjects(int limit, String category) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Project::getStatus, PUBLIC_PROJECT_STATUS);
        if (category != null) {
            wrapper.eq(Project::getCategory, category);
        }
        wrapper.orderByDesc(Project::getPublishedAt)
                .orderByDesc(Project::getCreatedAt)
                .last("LIMIT " + limit);
        return projectMapper.selectList(wrapper);
    }

    private Map<String, NoteCounter> loadNoteCounters(List<String> contentTypeCodes) {
        return feedCounterService.loadNoteCounters(contentTypeCodes);
    }

    private NoteDetail loadNoteDetail(String contentTypeCode) {
        LambdaQueryWrapper<NoteDetail> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteDetail::getContentTypeCode, contentTypeCode).last("LIMIT 1");
        return noteDetailMapper.selectOne(wrapper);
    }

    private Map<String, NoteDetail> loadNoteDetails(List<String> contentTypeCodes) {
        if (contentTypeCodes.isEmpty()) return Map.of();
        LambdaQueryWrapper<NoteDetail> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(NoteDetail::getContentTypeCode, contentTypeCodes);
        List<NoteDetail> list = noteDetailMapper.selectList(wrapper);
        Map<String, NoteDetail> map = new HashMap<>();
        for (NoteDetail d : list) {
            map.put(d.getContentTypeCode(), d);
        }
        return map;
    }

    private double computeRelationBoost(String sourceCode,
                                        String sourceParentCode,
                                        String candidateCode,
                                        NoteDetail candidateDetail) {
        if (candidateDetail == null) {
            return 0.0;
        }
        String candidateParentCode = candidateDetail.getParentContentTypeCode();

        if (sourceParentCode != null
                && candidateParentCode != null
                && sourceParentCode.equals(candidateParentCode)) {
            return 0.3;
        }

        if (candidateParentCode != null && candidateParentCode.equals(sourceCode)) {
            return 0.5;
        }

        if (sourceParentCode != null && sourceParentCode.equals(candidateCode)) {
            return 0.5;
        }

        return 0.0;
    }

    // ============================================================================
    //  工具方法
    // ============================================================================

    private double jaccardSimilarity(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) {
            return 0;
        }
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        return union.isEmpty() ? 0 : (double) intersection.size() / union.size();
    }

    private ContentVO toNoteVo(Note note, double score) {
        return noteCardAssembler.toFeedNoteVo(note, score);
    }

    private ContentVO toProjectVo(Project project, double score) {
        return projectCardAssembler.toFeedProjectVo(project, score);
    }

    private LocalDateTime resolvePublishTime(LocalDateTime publishedAt, LocalDateTime createdAt) {
        return publishedAt != null ? publishedAt : (createdAt != null ? createdAt : LocalDateTime.now());
    }

    private List<String> parseTags(String json) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(json, STRING_LIST_TYPE);
        } catch (Exception ex) {
            return List.of();
        }
    }

    private int nullSafe(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalizeProjectCategory(String category) {
        if (!StringUtils.hasText(category)) {
            throw BusinessException.badRequest("PROJECT_CATEGORY_REQUIRED");
        }
        String normalized = category.trim().toUpperCase();
        if (!VALID_PROJECT_CATEGORIES.contains(normalized)) {
            throw BusinessException.badRequest("INVALID_PROJECT_CATEGORY");
        }
        return normalized;
    }

    private String normalizeNoteType(String noteType) {
        if (!StringUtils.hasText(noteType)) {
            throw BusinessException.badRequest("NOTE_TYPE_REQUIRED");
        }
        String normalized = noteType.trim().toUpperCase();
        if (!VALID_NOTE_TYPES.contains(normalized)) {
            throw BusinessException.badRequest("INVALID_NOTE_TYPE");
        }
        return normalized;
    }

    private int normalizeFeedLimit(int limit, int defaultLimit) {
        if (limit <= 0) {
            return defaultLimit;
        }
        return Math.min(limit, FEED_MAX_LIMIT);
    }

    private String noteTypeToCodePrefix(String noteType) {
        return NOTE_TYPE_VIDEO.equals(noteType) ? NOTE_CODE_PREFIX_VIDEO : NOTE_CODE_PREFIX_IMAGE_TEXT;
    }

    // -------------------------------------------------------------------------
    // 「换一换」机制 A / B 内部实现
    // -------------------------------------------------------------------------

    private List<ContentVO> buildHomeFeedRankedPool(Map<String, Double> tagWeights, String userLevel) {
        List<ScoredContent> notes = scoreNotes(loadPublishedNotes(HOME_CANDIDATE_LIMIT), tagWeights);
        List<ScoredContent> projects = scoreProjects(loadPublicProjects(HOME_CANDIDATE_LIMIT), tagWeights, userLevel);
        List<ScoredContent> merged = new ArrayList<>(notes.size() + projects.size());
        merged.addAll(notes);
        merged.addAll(projects);
        merged.sort(Comparator.comparingDouble(ScoredContent::score).reversed());
        return merged.stream().map(ScoredContent::vo).collect(Collectors.toList());
    }

    private List<ContentVO> buildProjectFeedRankedPool(String category, Map<String, Double> tagWeights, String userLevel) {
        return scoreProjects(loadPublicProjects(HOME_CANDIDATE_LIMIT, category), tagWeights, userLevel).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .map(ScoredContent::vo)
                .collect(Collectors.toList());
    }

    private List<ContentVO> buildNoteFeedRankedPool(String noteType, Map<String, Double> tagWeights) {
        return scoreNotes(loadPublishedNotes(NOTE_FEED_CANDIDATE_LIMIT, noteType), tagWeights).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .map(ScoredContent::vo)
                .collect(Collectors.toList());
    }

    private List<ContentVO> buildHomeFeedRandomPage(String userUid, long seed, int page, int size) {
        List<Note> notes = loadPublishedNotes(HOME_CANDIDATE_LIMIT, null);
        List<Project> projects = loadPublicProjects(HOME_CANDIDATE_LIMIT, null);
        List<ContentVO> pool = new ArrayList<>(notes.size() + projects.size());
        for (Note note : notes) {
            pool.add(toNoteVo(note, 0.0));
        }
        for (Project project : projects) {
            pool.add(toProjectVo(project, 0.0));
        }
        Collections.shuffle(pool, new Random(seed));
        return slicePage(pool, page, size);
    }

    private List<ContentVO> buildProjectFeedRandomPage(String userUid,
                                                       String category,
                                                       long seed,
                                                       int page,
                                                       int size) {
        List<ContentVO> pool = loadPublicProjects(HOME_CANDIDATE_LIMIT, category).stream()
                .map(project -> toProjectVo(project, 0.0))
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.shuffle(pool, new Random(seed));
        return slicePage(pool, page, size);
    }

    private List<ContentVO> buildNoteFeedRandomPage(String userUid,
                                                    String noteType,
                                                    long seed,
                                                    int page,
                                                    int size) {
        List<ContentVO> pool = loadPublishedNotes(HOME_CANDIDATE_LIMIT, noteType).stream()
                .map(note -> toNoteVo(note, 0.0))
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.shuffle(pool, new Random(seed));
        return slicePage(pool, page, size);
    }

    private PageWindow resolvePageWindow(int page, int size, long total) {
        int safePage = page <= 0 ? 1 : page;
        boolean wrapped = false;
        if (total > 0 && (long) safePage * size > total) {
            safePage = 1;
            wrapped = true;
        }
        return new PageWindow(safePage, wrapped);
    }

    private List<ContentVO> slicePage(List<ContentVO> pool, int page, int size) {
        if (pool.isEmpty()) {
            return List.of();
        }
        int offset = (page - 1) * size;
        if (offset >= pool.size()) {
            return List.of();
        }
        int end = Math.min(offset + size, pool.size());
        return new ArrayList<>(pool.subList(offset, end));
    }

    private FeedShuffleResponse toShuffleResponse(List<ContentVO> items,
                                                  PageWindow window,
                                                  int size,
                                                  long total,
                                                  String shuffleMode,
                                                  Long seed) {
        return FeedShuffleResponse.builder()
                .items(items)
                .page(window.page())
                .size(size)
                .total(total)
                .pageWrapped(window.wrapped())
                .shuffleMode(shuffleMode)
                .seed(seed)
                .build();
    }

    private long countHomeFeedTotal() {
        return countPublishedNotes(null) + countPublicProjects(null);
    }

    private long countPublishedNotes(String noteType) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getStatus, NOTE_STATUS_PUBLISHED);
        if (noteType != null) {
            wrapper.likeRight(Note::getContentTypeCode, noteTypeToCodePrefix(noteType));
        }
        return noteMapper.selectCount(wrapper);
    }

    private long countPublicProjects(String category) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Project::getStatus, PUBLIC_PROJECT_STATUS);
        if (category != null) {
            wrapper.eq(Project::getCategory, category);
        }
        return projectMapper.selectCount(wrapper);
    }

    private int normalizeShuffleSize(int size, int defaultSize) {
        if (size <= 0) {
            return defaultSize;
        }
        return Math.min(size, FEED_MAX_LIMIT);
    }

    /** 将 seed 归一化为非负 long */
    private long sanitizeRandSeed(Long seed) {
        return Math.abs(seed);
    }

    private record PageWindow(int page, boolean wrapped) {
    }

    record ScoredContent(ContentVO vo, double score) {
    }
}
