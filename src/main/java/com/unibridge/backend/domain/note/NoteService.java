package com.unibridge.backend.domain.note;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.note.dto.NoteDetailResponse;
import com.unibridge.backend.domain.note.dto.PublishNoteDraftResponse;
import com.unibridge.backend.domain.note.dto.PublishNoteRequest;
import com.unibridge.backend.domain.note.dto.PublishNoteResponse;
import com.unibridge.backend.infrastructure.entities.ClientNote;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientNoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserProfileMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.util.IpUtil;
import com.unibridge.backend.infrastructure.util.NoteContentTypeCodeGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class NoteService {

    private static final ZoneId ZONE_SHANGHAI = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter ISO_OFFSET_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    private static final String PUBLISH_ACTION_DRAFT = "DRAFT";
    private static final String PUBLISH_ACTION_PUBLISH = "PUBLISH";
    private static final String CONTENT_TYPE_IMAGE_TEXT = "图文";
    private static final String CONTENT_TYPE_VIDEO = "视频";
    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final String STATUS_BANNED = "BANNED";
    private static final String EDITOR_TYPE_MARKDOWN = "MARKDOWN";

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final AccessService clientAccessService;
    private final ClientNoteMapper clientNoteMapper;
    private final ClientUserProfileMapper clientUserProfileMapper;
    private final NoteViewTracker noteViewTracker;
    private final ContentUidResolver contentUidResolver;

    public NoteService(AccessService clientAccessService,
                             ClientNoteMapper clientNoteMapper,
                             ClientUserProfileMapper clientUserProfileMapper,
                             NoteViewTracker noteViewTracker,
                             ContentUidResolver contentUidResolver) {
        this.clientAccessService = clientAccessService;
        this.clientNoteMapper = clientNoteMapper;
        this.clientUserProfileMapper = clientUserProfileMapper;
        this.noteViewTracker = noteViewTracker;
        this.contentUidResolver = contentUidResolver;
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishNoteResponse createNote(String authorization, PublishNoteRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        validateRequest(request, null);

        ClientNote note = new ClientNote();
        note.setUserUid(userUid);
        note.setContentTypeCode(generateContentTypeCode(request.getContentType()));
        applyRequestToNote(note, request, null);
        clientNoteMapper.insert(note);

        ClientNote persisted = clientNoteMapper.selectById(note.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishNoteResponse updateNote(String authorization, String noteUid, PublishNoteRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        ClientNote note = requireOwnedNote(noteUid, userUid);

        validateRequest(request, note);
        assertContentTypeImmutable(note, request.getContentType());

        applyRequestToNote(note, request, note.getContentTypeCode());
        clientNoteMapper.updateById(note);

        ClientNote persisted = clientNoteMapper.selectById(note.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    public PublishNoteDraftResponse getNoteDraft(String authorization, String noteUid) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        ClientNote note = requireOwnedNote(noteUid, userUid);

        return PublishNoteDraftResponse.builder()
                .uid(note.getContentTypeCode())
                .publishAction(STATUS_DRAFT.equals(note.getStatus()) ? PUBLISH_ACTION_DRAFT : PUBLISH_ACTION_PUBLISH)
                .title(note.getTitle())
                .summary(note.getSummary())
                .contentType(mapContentTypeCodeToDisplay(note.getContentTypeCode()))
                .content(note.getContent())
                .tags(parseJsonStringList(note.getTags()))
                .coverUrl(note.getCoverUrl())
                .videoUrl(note.getVideoUrl())
                .videoDuration(note.getVideoDuration())
                .editorType(defaultEditorType(note.getEditorType()))
                .build();
    }

    /**
     * 查询笔记详情（公开读 + 草稿 owner 读）。
     * <ul>
     *   <li>PUBLISHED：可不登录；非发布者且非短时重复访问时 view_count +1</li>
     *   <li>DRAFT：仅 owner 可读</li>
     *   <li>BANNED：对外统一 404</li>
     * </ul>
     */
    @Transactional
    public NoteDetailResponse getNoteDetail(String authorization, String noteUid, HttpServletRequest request) {
        ClientNote note = contentUidResolver.requireNoteByUid(noteUid);
        if (STATUS_BANNED.equals(note.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }

        String currentUserUid = clientAccessService.resolveOptionalCurrentUserUid(authorization);
        assertNoteReadable(note, currentUserUid);

        if (tryIncrementViewCount(note, currentUserUid, request)) {
            note = clientNoteMapper.selectById(note.getId());
        }

        return buildNoteDetailResponse(note);
    }

    private NoteDetailResponse buildNoteDetailResponse(ClientNote note) {
        ClientUserProfile profile = loadUserProfile(note.getUserUid());
        LocalDateTime displayPublishTime = resolveDisplayTime(note.getPublishedAt(), note.getCreatedAt());

        return NoteDetailResponse.builder()
                .uid(note.getContentTypeCode())
                .contentType(mapContentTypeCodeToDisplay(note.getContentTypeCode()))
                .title(note.getTitle())
                .summary(note.getSummary())
                .body(note.getContent())
                .editorType(defaultEditorType(note.getEditorType()))
                .tags(parseJsonStringList(note.getTags()))
                .coverUrl(note.getCoverUrl())
                .videoUrl(note.getVideoUrl())
                .videoDuration(note.getVideoDuration())
                .author(buildAuthor(profile, note.getUserUid()))
                .publishTime(formatOffsetDateTime(displayPublishTime))
                .updateTime(formatOffsetDateTime(note.getUpdatedAt()))
                .views(note.getViewCount() == null ? 0 : note.getViewCount())
                .comments(note.getCommentCount() == null ? 0 : note.getCommentCount())
                .favorites(note.getCollectCount() == null ? 0 : note.getCollectCount())
                .status(note.getStatus())
                .build();
    }

    private void assertNoteReadable(ClientNote note, String currentUserUid) {
        if (STATUS_PUBLISHED.equals(note.getStatus())) {
            return;
        }
        if (!STATUS_DRAFT.equals(note.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        if (currentUserUid == null) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        if (!currentUserUid.equals(note.getUserUid())) {
            throw new BusinessException(403, "NOTE_NOT_OWNER");
        }
    }

    /**
     * 已发布笔记浏览量 +1 条件：非发布者本人，且同一访问者 30 分钟内未计次。
     *
     * @return 是否已执行 +1（便于调用方决定是否重新加载 note）
     */
    private boolean tryIncrementViewCount(ClientNote note, String currentUserUid, HttpServletRequest request) {
        if (!STATUS_PUBLISHED.equals(note.getStatus())) {
            return false;
        }
        if (currentUserUid != null && currentUserUid.equals(note.getUserUid())) {
            return false;
        }
        String viewerKey = resolveViewerKey(currentUserUid, request);
        if (!noteViewTracker.shouldCountView(viewerKey, note.getId())) {
            return false;
        }
        incrementViewCount(note.getId());
        return true;
    }

    private String resolveViewerKey(String currentUserUid, HttpServletRequest request) {
        if (currentUserUid != null) {
            return "u:" + currentUserUid;
        }
        return "ip:" + IpUtil.resolveClientIp(request);
    }

    /**
     * 浏览量 +1（数据库原子操作）。
     * <p>
     * 【并发安全】原实现为 read-modify-write（select → 加 1 → updateById），
     * 并发场景下会丢失更新。改为数据库原子 UPDATE：
     * {@code SET view_count = COALESCE(view_count, 0) + 1}，
     * 由数据库的行级锁和原子运算保证计数器正确性。
     * </p>
     */
    private void incrementViewCount(Long noteId) {
        // 使用 MyBatis-Plus LambdaUpdateWrapper 执行原子自增
        LambdaUpdateWrapper<ClientNote> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(ClientNote::getId, noteId)
                .setSql("view_count = COALESCE(view_count, 0) + 1");
        clientNoteMapper.update(null, wrapper);
    }

    private ClientUserProfile loadUserProfile(String userUid) {
        LambdaQueryWrapper<ClientUserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUserProfile::getUserUid, userUid).last("LIMIT 1");
        return clientUserProfileMapper.selectOne(wrapper);
    }

    private NoteDetailResponse.Author buildAuthor(ClientUserProfile profile, String userUid) {
        String name = "用户";
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            name = profile.getNickName().trim();
        } else if (profile != null && StringUtils.hasText(profile.getRealName())) {
            name = profile.getRealName().trim();
        }

        return NoteDetailResponse.Author.builder()
                .name(name)
                .handle(buildAuthorHandle(profile, userUid))
                .avatarUrl(profile == null ? null : profile.getAvatarUrl())
                .build();
    }

    private String buildAuthorHandle(ClientUserProfile profile, String userUid) {
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            String slug = profile.getNickName().trim()
                    .replaceAll("\\s+", "")
                    .toLowerCase(Locale.ROOT);
            if (!slug.isEmpty()) {
                return slug;
            }
        }
        return userUid.toLowerCase(Locale.ROOT);
    }

    private LocalDateTime resolveDisplayTime(LocalDateTime publishedAt, LocalDateTime createdAt) {
        return publishedAt != null ? publishedAt : createdAt;
    }

    private String defaultEditorType(String editorType) {
        return StringUtils.hasText(editorType) ? editorType : EDITOR_TYPE_MARKDOWN;
    }

    private ClientNote requireOwnedNote(String noteUid, String userUid) {
        ClientNote note = contentUidResolver.requireNoteByUid(noteUid);
        if (!userUid.equals(note.getUserUid())) {
            throw new BusinessException(403, "NOTE_NOT_OWNER");
        }
        return note;
    }

    private void validateRequest(PublishNoteRequest request, ClientNote existingNote) {
        if (request == null) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        String publishAction = normalizeRequired(request.getPublishAction(), "publishAction");
        if (!PUBLISH_ACTION_DRAFT.equals(publishAction) && !PUBLISH_ACTION_PUBLISH.equals(publishAction)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (!StringUtils.hasText(request.getTitle())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (!StringUtils.hasText(request.getCoverUrl())) {
            throw BusinessException.badRequest("COVER_REQUIRED");
        }

        String contentType = normalizeRequired(request.getContentType(), "contentType");
        if (!CONTENT_TYPE_IMAGE_TEXT.equals(contentType) && !CONTENT_TYPE_VIDEO.equals(contentType)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (request.getTags() == null) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (PUBLISH_ACTION_PUBLISH.equals(publishAction)) {
            if (!StringUtils.hasText(request.getSummary())) {
                throw BusinessException.badRequest("VALIDATION_FAILED");
            }
            if (request.getTags().isEmpty()) {
                throw BusinessException.badRequest("VALIDATION_FAILED");
            }
            if (CONTENT_TYPE_IMAGE_TEXT.equals(contentType)) {
                if (!StringUtils.hasText(request.getContent())) {
                    throw BusinessException.badRequest("CONTENT_REQUIRED");
                }
            } else if (!StringUtils.hasText(request.getVideoUrl())) {
                throw BusinessException.badRequest("VIDEO_REQUIRED");
            }
        }
    }

    private void assertContentTypeImmutable(ClientNote note, String requestedContentType) {
        String existingDisplay = mapContentTypeCodeToDisplay(note.getContentTypeCode());
        if (!Objects.equals(existingDisplay, requestedContentType)) {
            throw BusinessException.badRequest("NOTE_TYPE_IMMUTABLE");
        }
    }

    private void applyRequestToNote(ClientNote note, PublishNoteRequest request, String existingContentTypeCode) {
        note.setTitle(request.getTitle().trim());
        note.setSummary(StringUtils.hasText(request.getSummary()) ? request.getSummary().trim() : "");
        note.setEditorType(EDITOR_TYPE_MARKDOWN);
        note.setTags(toJsonStringList(request.getTags()));
        note.setCoverUrl(request.getCoverUrl().trim());

        if (CONTENT_TYPE_IMAGE_TEXT.equals(request.getContentType())) {
            note.setContent(StringUtils.hasText(request.getContent()) ? request.getContent() : null);
            note.setVideoUrl(null);
            note.setVideoDuration(0);
        } else {
            note.setContent(null);
            note.setVideoUrl(trimToNull(request.getVideoUrl()));
            note.setVideoDuration(request.getVideoDuration() == null ? 0 : request.getVideoDuration());
        }

        if (existingContentTypeCode != null) {
            note.setContentTypeCode(existingContentTypeCode);
        }

        if (PUBLISH_ACTION_DRAFT.equals(request.getPublishAction())) {
            note.setStatus(STATUS_DRAFT);
            note.setPublishedAt(null);
        } else {
            note.setStatus(STATUS_PUBLISHED);
            note.setPublishedAt(LocalDateTime.now());
        }

        if (note.getViewCount() == null) {
            note.setViewCount(0);
        }
        if (note.getLikeCount() == null) {
            note.setLikeCount(0);
        }
        if (note.getCollectCount() == null) {
            note.setCollectCount(0);
        }
        if (note.getCommentCount() == null) {
            note.setCommentCount(0);
        }
    }

    private String generateContentTypeCode(String contentType) {
        if (CONTENT_TYPE_IMAGE_TEXT.equals(contentType)) {
            return NoteContentTypeCodeGenerator.generateImageTextCode(this::isContentTypeCodeUnique);
        }
        if (CONTENT_TYPE_VIDEO.equals(contentType)) {
            return NoteContentTypeCodeGenerator.generateVideoCode(this::isContentTypeCodeUnique);
        }
        throw BusinessException.badRequest("INVALID_CONTENT_TYPE_CODE");
    }

    private boolean isContentTypeCodeUnique(String code) {
        LambdaQueryWrapper<ClientNote> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientNote::getContentTypeCode, code);
        return clientNoteMapper.selectCount(wrapper) == 0;
    }

    private PublishNoteResponse buildResponse(ClientNote note, String publishAction) {
        return PublishNoteResponse.builder()
                .uid(note.getContentTypeCode())
                .publishAction(publishAction)
                .status(note.getStatus())
                .publishedAt(formatOffsetDateTime(note.getPublishedAt()))
                .createdAt(formatOffsetDateTime(note.getCreatedAt()))
                .updatedAt(formatOffsetDateTime(note.getUpdatedAt()))
                .build();
    }

    private String mapContentTypeCodeToDisplay(String contentTypeCode) {
        if (contentTypeCode == null || contentTypeCode.isBlank()) {
            return "";
        }
        if (contentTypeCode.startsWith("TX")) {
            return CONTENT_TYPE_IMAGE_TEXT;
        }
        if (contentTypeCode.startsWith("VD")) {
            return CONTENT_TYPE_VIDEO;
        }
        return "";
    }

    private String normalizeRequired(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String toJsonStringList(List<String> values) {
        try {
            return OBJECT_MAPPER.writeValueAsString(values == null ? List.of() : values);
        } catch (JsonProcessingException ex) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
    }

    private List<String> parseJsonStringList(String jsonText) {
        if (!StringUtils.hasText(jsonText)) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(jsonText, STRING_LIST_TYPE);
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private String formatOffsetDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(ZONE_SHANGHAI).format(ISO_OFFSET_FORMATTER);
    }
}
