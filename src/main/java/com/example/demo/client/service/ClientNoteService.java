package com.example.demo.client.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.client.dto.NoteDetailResponse;
import com.example.demo.client.dto.PublishNoteDraftResponse;
import com.example.demo.client.dto.PublishNoteRequest;
import com.example.demo.client.dto.PublishNoteResponse;
import com.example.demo.client.entity.ClientNote;
import com.example.demo.client.entity.ClientUserProfile;
import com.example.demo.client.mapper.ClientNoteMapper;
import com.example.demo.client.mapper.ClientUserProfileMapper;
import com.example.demo.common.BusinessException;
import com.example.demo.util.NoteContentTypeCodeGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class ClientNoteService {

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

    private final ClientAccessService clientAccessService;
    private final ClientNoteMapper clientNoteMapper;
    private final ClientUserProfileMapper clientUserProfileMapper;

    public ClientNoteService(ClientAccessService clientAccessService,
                             ClientNoteMapper clientNoteMapper,
                             ClientUserProfileMapper clientUserProfileMapper) {
        this.clientAccessService = clientAccessService;
        this.clientNoteMapper = clientNoteMapper;
        this.clientUserProfileMapper = clientUserProfileMapper;
    }

    @Transactional
    public PublishNoteResponse createNote(String authorization, PublishNoteRequest request) {
        Long userId = clientAccessService.requireCurrentUserId(authorization);
        validateRequest(request, null);

        ClientNote note = new ClientNote();
        note.setUserId(userId);
        note.setContentTypeCode(generateContentTypeCode(request.getContentType()));
        applyRequestToNote(note, request, null);
        clientNoteMapper.insert(note);

        ClientNote persisted = clientNoteMapper.selectById(note.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    @Transactional
    public PublishNoteResponse updateNote(String authorization, Long noteId, PublishNoteRequest request) {
        Long userId = clientAccessService.requireCurrentUserId(authorization);
        ClientNote note = requireOwnedNote(noteId, userId);

        validateRequest(request, note);
        assertContentTypeImmutable(note, request.getContentType());

        applyRequestToNote(note, request, note.getContentTypeCode());
        clientNoteMapper.updateById(note);

        ClientNote persisted = clientNoteMapper.selectById(note.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    public PublishNoteDraftResponse getNoteDraft(String authorization, Long noteId) {
        Long userId = clientAccessService.requireCurrentUserId(authorization);
        ClientNote note = requireOwnedNote(noteId, userId);

        return PublishNoteDraftResponse.builder()
                .noteId(note.getId())
                .contentTypeCode(note.getContentTypeCode())
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
     *   <li>PUBLISHED：可不登录；返回前 view_count +1</li>
     *   <li>DRAFT：仅 owner 可读</li>
     *   <li>BANNED：对外统一 404</li>
     * </ul>
     */
    @Transactional
    public NoteDetailResponse getNoteDetail(String authorization, Long noteId) {
        ClientNote note = clientNoteMapper.selectById(noteId);
        if (note == null || STATUS_BANNED.equals(note.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }

        Long currentUserId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        assertNoteReadable(note, currentUserId);

        if (STATUS_PUBLISHED.equals(note.getStatus())) {
            incrementViewCount(noteId);
            note = clientNoteMapper.selectById(noteId);
        }

        return buildNoteDetailResponse(note);
    }

    private NoteDetailResponse buildNoteDetailResponse(ClientNote note) {
        ClientUserProfile profile = loadUserProfile(note.getUserId());
        LocalDateTime displayPublishTime = resolveDisplayTime(note.getPublishedAt(), note.getCreatedAt());

        return NoteDetailResponse.builder()
                .noteId(note.getId())
                .contentType(mapContentTypeCodeToDisplay(note.getContentTypeCode()))
                .contentTypeCode(note.getContentTypeCode())
                .title(note.getTitle())
                .summary(note.getSummary())
                .body(note.getContent())
                .editorType(defaultEditorType(note.getEditorType()))
                .tags(parseJsonStringList(note.getTags()))
                .coverUrl(note.getCoverUrl())
                .videoUrl(note.getVideoUrl())
                .videoDuration(note.getVideoDuration())
                .author(buildAuthor(profile, note.getUserId()))
                .publishTime(formatOffsetDateTime(displayPublishTime))
                .updateTime(formatOffsetDateTime(note.getUpdatedAt()))
                .views(note.getViewCount() == null ? 0 : note.getViewCount())
                .comments(note.getCommentCount() == null ? 0 : note.getCommentCount())
                .favorites(note.getCollectCount() == null ? 0 : note.getCollectCount())
                .status(note.getStatus())
                .build();
    }

    private void assertNoteReadable(ClientNote note, Long currentUserId) {
        if (STATUS_PUBLISHED.equals(note.getStatus())) {
            return;
        }
        if (!STATUS_DRAFT.equals(note.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        if (currentUserId == null) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        if (!currentUserId.equals(note.getUserId())) {
            throw new BusinessException(403, "NOTE_NOT_OWNER");
        }
    }

    private void incrementViewCount(Long noteId) {
        ClientNote existing = clientNoteMapper.selectById(noteId);
        if (existing == null) {
            return;
        }
        ClientNote update = new ClientNote();
        update.setId(noteId);
        update.setViewCount((existing.getViewCount() == null ? 0 : existing.getViewCount()) + 1);
        clientNoteMapper.updateById(update);
    }

    private ClientUserProfile loadUserProfile(Long userId) {
        LambdaQueryWrapper<ClientUserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUserProfile::getUserId, userId).last("LIMIT 1");
        return clientUserProfileMapper.selectOne(wrapper);
    }

    private NoteDetailResponse.Author buildAuthor(ClientUserProfile profile, Long userId) {
        String name = "用户";
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            name = profile.getNickName().trim();
        } else if (profile != null && StringUtils.hasText(profile.getRealName())) {
            name = profile.getRealName().trim();
        }

        return NoteDetailResponse.Author.builder()
                .name(name)
                .handle(buildAuthorHandle(profile, userId))
                .avatarUrl(profile == null ? null : profile.getAvatarUrl())
                .build();
    }

    private String buildAuthorHandle(ClientUserProfile profile, Long userId) {
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            String slug = profile.getNickName().trim()
                    .replaceAll("\\s+", "")
                    .toLowerCase(Locale.ROOT);
            if (!slug.isEmpty()) {
                return slug;
            }
        }
        return "user_" + userId;
    }

    private LocalDateTime resolveDisplayTime(LocalDateTime publishedAt, LocalDateTime createdAt) {
        return publishedAt != null ? publishedAt : createdAt;
    }

    private String defaultEditorType(String editorType) {
        return StringUtils.hasText(editorType) ? editorType : EDITOR_TYPE_MARKDOWN;
    }

    private ClientNote requireOwnedNote(Long noteId, Long userId) {
        ClientNote note = clientNoteMapper.selectById(noteId);
        if (note == null) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        if (!userId.equals(note.getUserId())) {
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
                .noteId(note.getId())
                .contentTypeCode(note.getContentTypeCode())
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
