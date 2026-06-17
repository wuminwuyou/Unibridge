package com.unibridge.backend.domain.feed;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.domain.feed.dto.ContentVO;
import com.unibridge.backend.domain.feed.dto.FeedShuffleResponse;
import com.unibridge.backend.domain.feed.dto.HomeFeedResponse;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.infrastructure.entities.note.Note;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.unibridge.backend.infrastructure.entities.interaction.UserInterestTag;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.interaction.UserInterestTagMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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
import java.util.stream.Collectors;

/**
 * Feed 推荐服务（Spring Cache 渐进式架构）。
 * <p>
 * 当前 {@code @Cacheable} 由 {@link com.unibridge.backend.infrastructure.config.CacheConfig} 托管至本地内存；
 * 未来引入 Redis 后仅需替换 CacheManager，本类<strong>零改动</strong>。
 * </p>
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
    private static final String ANONYMOUS_USER = "anonymous";

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final UserInterestTagMapper userInterestTagMapper;
    private final NoteMapper noteMapper;
    private final ProjectMapper projectMapper;
    private final FeedShuffleCacheService feedShuffleCacheService;
    private final ContentUidResolver contentUidResolver;
    private final ProjectCardAssembler projectCardAssembler;
    private final NoteCardAssembler noteCardAssembler;

    public FeedRecommendationService(UserInterestTagMapper userInterestTagMapper,
                                     NoteMapper noteMapper,
                                     ProjectMapper projectMapper,
                                     @Lazy FeedShuffleCacheService feedShuffleCacheService,
                                     ContentUidResolver contentUidResolver,
                                     ProjectCardAssembler projectCardAssembler,
                                     NoteCardAssembler noteCardAssembler) {
        this.userInterestTagMapper = userInterestTagMapper;
        this.noteMapper = noteMapper;
        this.projectMapper = projectMapper;
        this.feedShuffleCacheService = feedShuffleCacheService;
        this.contentUidResolver = contentUidResolver;
        this.projectCardAssembler = projectCardAssembler;
        this.noteCardAssembler = noteCardAssembler;
    }

    /**
     * 首页个性化推送：笔记 5 条 + 项目 10 条，分别按推荐分排序。
     * <p>
     * 缓存键：{@code userUid}。匿名用户使用 {@code anonymous} 走冷启动。
     * </p>
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

        List<ContentVO> projects = scoreProjects(loadPublicProjects(HOME_CANDIDATE_LIMIT), tagWeights).stream()
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

    /**
     * 首页「换一换」混排推送（笔记 + 项目打碎）。
     */
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
        List<ContentVO> pool = buildHomeFeedRankedPool(tagWeights);
        return slicePage(pool, page, size);
    }

    public List<ContentVO> buildProjectFeedCachedPage(String userUid, String category, int page, int size) {
        Map<String, Double> tagWeights = loadUserTagWeights(userUid);
        List<ContentVO> pool = buildProjectFeedRankedPool(category, tagWeights);
        return slicePage(pool, page, size);
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
        Map<String, Double> tagWeights = loadUserTagWeights(effectiveUserUid);

        List<ContentVO> projects = scoreProjects(
                loadPublicProjects(HOME_CANDIDATE_LIMIT, normalizedCategory), tagWeights).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .limit(safeLimit)
                .map(ScoredContent::vo)
                .collect(Collectors.toList());

        log.debug("Project feed computed: userUid={}, category={}, size={}",
                effectiveUserUid, normalizedCategory, projects.size());
        return projects;
    }

    @Cacheable(value = "note_feed", key = "#userUid + ':' + #noteType + ':' + #limit")
    public List<ContentVO> getNoteFeed(String userUid, String noteType, int limit) {
        String normalizedNoteType = normalizeNoteType(noteType);
        int safeLimit = normalizeFeedLimit(limit, ZONE_FEED_DEFAULT_LIMIT);
        String effectiveUserUid = normalizeUserUid(userUid);
        Map<String, Double> tagWeights = loadUserTagWeights(effectiveUserUid);

        List<ContentVO> notes = scoreNotes(
                loadPublishedNotes(HOME_CANDIDATE_LIMIT, normalizedNoteType), tagWeights).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .limit(safeLimit)
                .map(ScoredContent::vo)
                .collect(Collectors.toList());

        log.debug("Note feed computed: userUid={}, noteType={}, size={}",
                effectiveUserUid, normalizedNoteType, notes.size());
        return notes;
    }

    /**
     * 相似笔记推荐：同源标签 Jaccard 相似度 + 点赞数 tie-break。
     * <p>
     * <b>场景一（保持静止）</b>：{@code @Cacheable(similar_notes, key=noteUid)} 锁死缓存；
     * 同一 {@code noteUid} 无论前端如何刷新，均返回完全一致的结果，不重新计算。
     * </p>
     */
    @Cacheable(value = "similar_notes", key = "#noteUid")
    public List<ContentVO> getSimilarNotes(String noteUid, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 30);

        Note source = contentUidResolver.requireNoteByUid(noteUid);
        if (!NOTE_STATUS_PUBLISHED.equals(source.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        Long sourceInternalId = source.getId();

        Set<String> sourceTags = new HashSet<>(parseTags(source.getTags()));
        if (sourceTags.isEmpty()) {
            return loadTopLikedNotes(sourceInternalId, safeLimit).stream()
                    .map(note -> toNoteVo(note, 0.0))
                    .collect(Collectors.toList());
        }

        List<Note> candidates = loadPublishedNotes(SIMILAR_CANDIDATE_LIMIT).stream()
                .filter(note -> !note.getId().equals(sourceInternalId))
                .collect(Collectors.toList());

        List<ScoredContent> scored = new ArrayList<>();
        for (Note note : candidates) {
            Set<String> tags = new HashSet<>(parseTags(note.getTags()));
            double similarity = jaccardSimilarity(sourceTags, tags);
            if (similarity <= 0) {
                continue;
            }
            double popularity = Math.log1p(nullSafe(note.getLikeCount()));
            double score = similarity * 10 + popularity;
            scored.add(new ScoredContent(toNoteVo(note, score), score));
        }

        scored.sort(Comparator.comparingDouble(ScoredContent::score).reversed());
        return scored.stream()
                .limit(safeLimit)
                .map(ScoredContent::vo)
                .collect(Collectors.toList());
    }

    private Map<String, Double> loadUserTagWeights(String userUid) {
        if (userUid == null || userUid.isBlank() || ANONYMOUS_USER.equals(userUid)) {
            return Map.of();
        }
        LambdaQueryWrapper<UserInterestTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserInterestTag::getUserUid, userUid)
                .orderByDesc(UserInterestTag::getWeight)
                .last("LIMIT 50");
        List<UserInterestTag> interests = userInterestTagMapper.selectList(wrapper);
        Map<String, Double> weights = new HashMap<>();
        for (UserInterestTag interest : interests) {
            if (interest.getWeight() != null && StringUtils.hasText(interest.getTag())) {
                weights.put(interest.getTag().trim(), interest.getWeight().doubleValue());
            }
        }
        return weights;
    }

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
                .orderByDesc(Note::getLikeCount)
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

    private List<ScoredContent> scoreNotes(List<Note> notes, Map<String, Double> tagWeights) {
        List<ScoredContent> result = new ArrayList<>();
        for (Note note : notes) {
            double score = computeScore(parseTags(note.getTags()), tagWeights,
                    resolvePublishTime(note.getPublishedAt(), note.getCreatedAt()),
                    nullSafe(note.getLikeCount()), nullSafe(note.getCollectCount()));
            result.add(new ScoredContent(toNoteVo(note, score), score));
        }
        return result;
    }

    private List<ScoredContent> scoreProjects(List<Project> projects, Map<String, Double> tagWeights) {
        List<ScoredContent> result = new ArrayList<>();
        for (Project project : projects) {
            double score = computeScore(parseTags(project.getTags()), tagWeights,
                    resolvePublishTime(project.getPublishedAt(), project.getCreatedAt()),
                    0, 0);
            result.add(new ScoredContent(projectCardAssembler.toFeedProjectVo(project, score), score));
        }
        return result;
    }

    /**
     * 综合分 = (标签匹配分 + 冷启动底分) × 时间衰减 × 0.7 + 热度分 × 0.3
     */
    private double computeScore(List<String> contentTags,
                                Map<String, Double> userTagWeights,
                                LocalDateTime publishTime,
                                int likes,
                                int collects) {
        double tagScore = 0;
        for (String tag : contentTags) {
            tagScore += userTagWeights.getOrDefault(tag, 0.0);
        }
        if (tagScore <= 0) {
            tagScore = userTagWeights.isEmpty() ? 1.0 : 0.2;
        }

        long days = Math.max(0, ChronoUnit.DAYS.between(publishTime.toLocalDate(), LocalDateTime.now().toLocalDate()));
        double timeDecay = 1.0 / (1.0 + days * 0.05);
        double popularity = Math.log1p(likes + collects * 1.5);

        return tagScore * timeDecay * 0.7 + popularity * 0.3;
    }

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

    private String formatPublishTime(LocalDateTime time) {
        return time == null ? "" : time.format(PUBLISH_TIME_FORMATTER);
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

    private double roundScore(double score) {
        return Math.round(score * 1000.0) / 1000.0;
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

    private String resolveNoteType(String contentTypeCode) {
        if (StringUtils.hasText(contentTypeCode)
                && contentTypeCode.trim().toUpperCase().startsWith(NOTE_CODE_PREFIX_VIDEO)) {
            return NOTE_TYPE_VIDEO;
        }
        return NOTE_TYPE_IMAGE_TEXT;
    }

    // -------------------------------------------------------------------------
    // 「换一换」机制 A / B 内部实现
    // -------------------------------------------------------------------------

    private List<ContentVO> buildHomeFeedRankedPool(Map<String, Double> tagWeights) {
        List<ScoredContent> notes = scoreNotes(loadPublishedNotes(HOME_CANDIDATE_LIMIT), tagWeights);
        List<ScoredContent> projects = scoreProjects(loadPublicProjects(HOME_CANDIDATE_LIMIT), tagWeights);
        List<ScoredContent> merged = new ArrayList<>(notes.size() + projects.size());
        merged.addAll(notes);
        merged.addAll(projects);
        merged.sort(Comparator.comparingDouble(ScoredContent::score).reversed());
        return merged.stream().map(ScoredContent::vo).collect(Collectors.toList());
    }

    private List<ContentVO> buildProjectFeedRankedPool(String category, Map<String, Double> tagWeights) {
        return scoreProjects(loadPublicProjects(HOME_CANDIDATE_LIMIT, category), tagWeights).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .map(ScoredContent::vo)
                .collect(Collectors.toList());
    }

    private List<ContentVO> buildNoteFeedRankedPool(String noteType, Map<String, Double> tagWeights) {
        return scoreNotes(loadPublishedNotes(HOME_CANDIDATE_LIMIT, noteType), tagWeights).stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .map(ScoredContent::vo)
                .collect(Collectors.toList());
    }

    /**
     * 机制 B：拉取候选后在 Java 层跨类型混排（与首页 shuffle 一致，避免 MySQL {@code RAND(seed)} 排序失效）。
     */
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

    /**
     * 分页保护防空窗：{@code page * size > total} 时自动重置为第 1 页，实现缓存池内循环滚动。
     */
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

    /** 将 seed 归一化为非负 long，供 {@link Random} 使用。 */
    private long sanitizeRandSeed(Long seed) {
        return Math.abs(seed);
    }

    private record PageWindow(int page, boolean wrapped) {
    }

    private record ScoredContent(ContentVO vo, double score) {
    }
}
