package com.unibridge.backend.domain.note;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.note.dto.NoteDetailResponse;
import com.unibridge.backend.domain.note.dto.PublishNoteDraftResponse;
import com.unibridge.backend.domain.note.dto.PublishNoteRequest;
import com.unibridge.backend.domain.note.dto.PublishNoteResponse;
import com.unibridge.backend.infrastructure.entities.note.NoteDetail;
import com.unibridge.backend.infrastructure.entities.note.NoteCounter;
import com.unibridge.backend.infrastructure.entities.note.Note;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteDetailMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteCounterMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
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
import java.util.stream.Collectors;

@Service
public class NoteService {

    private static final ZoneId ZONE_SHANGHAI = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter ISO_OFFSET_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    private static final String PUBLISH_ACTION_DRAFT = "DRAFT";
    private static final String PUBLISH_ACTION_PUBLISH = "PUBLISH";
    private static final String CONTENT_TYPE_IMAGE_TEXT = "图文";
    private static final String CONTENT_TYPE_VIDEO = "视频";
    private static final int MAX_CONTENT_LENGTH_IMAGE_TEXT = 20000;
    private static final int MAX_CONTENT_LENGTH_CHILD_NOTE = 10000;
    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_REVIEWING = "REVIEWING";
    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final String STATUS_BANNED = "BANNED";
    private static final String VISIBILITY_PUBLIC = "PUBLIC";
    private static final String VISIBILITY_PRIVATE = "PRIVATE";

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final AccessService clientAccessService;
    private final NoteMapper noteMapper;
    private final NoteDetailMapper noteDetailMapper;
    private final NoteCounterMapper noteCounterMapper;
    private final UserProfileMapper userProfileMapper;
    private final UserIdentityMapper userIdentityMapper;
    private final NoteViewTracker noteViewTracker;
    private final ContentUidResolver contentUidResolver;
    private final NoteAuthorResolver noteAuthorResolver;

    public NoteService(AccessService clientAccessService,
                             NoteMapper noteMapper,
                             NoteDetailMapper noteDetailMapper,
                             NoteCounterMapper noteCounterMapper,
                             UserProfileMapper userProfileMapper,
                             UserIdentityMapper userIdentityMapper,
                             NoteViewTracker noteViewTracker,
                             ContentUidResolver contentUidResolver,
                             NoteAuthorResolver noteAuthorResolver) {
        this.clientAccessService = clientAccessService;
        this.noteMapper = noteMapper;
        this.noteDetailMapper = noteDetailMapper;
        this.noteCounterMapper = noteCounterMapper;
        this.userProfileMapper = userProfileMapper;
        this.userIdentityMapper = userIdentityMapper;
        this.noteViewTracker = noteViewTracker;
        this.contentUidResolver = contentUidResolver;
        this.noteAuthorResolver = noteAuthorResolver;
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishNoteResponse createNote(String authorization, PublishNoteRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        validateRequest(request, null);

        Note note = new Note();
        note.setUserUid(userUid);
        note.setContentTypeCode(generateContentTypeCode(request.getContentType()));
        applyRequestToNote(note, request, null);
        noteMapper.insert(note);

        // 拆分写入：正文到 t_user_note_detail，计数器到 t_user_note_counter
        saveNoteDetail(note.getContentTypeCode(), request);
        saveNoteCounter(note.getContentTypeCode());

        Note persisted = noteMapper.selectById(note.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishNoteResponse updateNote(String authorization, String noteUid, PublishNoteRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        Note note = requireOwnedNote(noteUid, userUid);

        validateRequest(request, note);
        assertContentTypeImmutable(note, request.getContentType());

        applyRequestToNote(note, request, note.getContentTypeCode());
        noteMapper.updateById(note);

        // 同步更新 body 大文本到垂直拆分表
        upsertNoteDetail(note.getContentTypeCode(), request);

        Note persisted = noteMapper.selectById(note.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    public PublishNoteDraftResponse getNoteDraft(String authorization, String noteUid) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        Note note = requireOwnedNote(noteUid, userUid);

        NoteDetail detail = loadNoteDetail(note.getContentTypeCode());
        return PublishNoteDraftResponse.builder()
                .uid(note.getContentTypeCode())
                .publishAction(STATUS_DRAFT.equals(note.getStatus()) ? PUBLISH_ACTION_DRAFT : PUBLISH_ACTION_PUBLISH)
                .title(note.getTitle())
                .summary(note.getSummary())
                .contentType(mapContentTypeCodeToDisplay(note.getContentTypeCode()))
                .content(detail != null ? detail.getContent() : null)
                .tags(parseJsonStringList(note.getTags()))
                .coverUrl(note.getCoverUrl())
                .videoUrl(note.getVideoUrl())
                .videoDuration(note.getVideoDuration())
                .parentContentTypeCode(detail != null ? detail.getParentContentTypeCode() : null)
                .visibility(note.getVisibility())
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
        Note note = contentUidResolver.requireNoteByUid(noteUid);
        if (STATUS_BANNED.equals(note.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }

        String currentUserUid = clientAccessService.resolveOptionalCurrentUserUid(authorization, request);
        assertNoteReadable(note, currentUserUid);

        if (tryIncrementViewCount(note.getContentTypeCode(), currentUserUid, request)) {
            // counter updated in separate table, no need to reload note
        }

        return buildNoteDetailResponse(note);
    }

    private NoteDetailResponse buildNoteDetailResponse(Note note) {
        UserProfile profile = loadUserProfile(note.getUserUid());
        LocalDateTime displayPublishTime = resolveDisplayTime(note.getPublishedAt(), note.getCreatedAt());
        NoteCounter counter = loadNoteCounter(note.getContentTypeCode());
        NoteDetail detail = loadNoteDetail(note.getContentTypeCode());

        NoteDetailResponse.ParentNote parentNote = null;
        if (detail != null && StringUtils.hasText(detail.getParentContentTypeCode())) {
            parentNote = loadParentNote(detail.getParentContentTypeCode());
        }

        return NoteDetailResponse.builder()
                .uid(note.getContentTypeCode())
                .contentType(mapContentTypeCodeToDisplay(note.getContentTypeCode()))
                .title(note.getTitle())
                .summary(note.getSummary())
                .body(detail != null ? detail.getContent() : null)
                .tags(parseJsonStringList(note.getTags()))
                .coverUrl(note.getCoverUrl())
                .videoUrl(note.getVideoUrl())
                .videoDuration(note.getVideoDuration())
                .visibility(note.getVisibility())
                .author(buildAuthor(profile, note.getUserUid()))
                .publishTime(formatOffsetDateTime(displayPublishTime))
                .updateTime(formatOffsetDateTime(note.getUpdatedAt()))
                .views(counter != null && counter.getViewCount() != null ? counter.getViewCount() : 0)
                .comments(counter != null && counter.getCommentCount() != null ? counter.getCommentCount() : 0)
                .favorites(counter != null && counter.getCollectCount() != null ? counter.getCollectCount() : 0)
                .status(note.getStatus())
                .parentNote(parentNote)
                .build();
    }

    private void assertNoteReadable(Note note, String currentUserUid) {
        if (STATUS_PUBLISHED.equals(note.getStatus())) {
            // PRIVATE 笔记仅 owner 可读（Feed 流已过滤，此处防御直接 URL 访问）
            if (VISIBILITY_PRIVATE.equals(note.getVisibility())) {
                if (currentUserUid == null || !currentUserUid.equals(note.getUserUid())) {
                    throw BusinessException.notFound("NOTE_NOT_FOUND");
                }
            }
            return;
        }
        if (STATUS_REVIEWING.equals(note.getStatus())) {
            // 审核中的笔记仅 owner 可见
            if (currentUserUid == null || !currentUserUid.equals(note.getUserUid())) {
                throw BusinessException.notFound("NOTE_NOT_FOUND");
            }
            return;
        }
        if (STATUS_DRAFT.equals(note.getStatus())) {
            if (currentUserUid == null) {
                throw BusinessException.notFound("NOTE_NOT_FOUND");
            }
            if (!currentUserUid.equals(note.getUserUid())) {
                throw new BusinessException(403, "NOTE_NOT_OWNER");
            }
            return;
        }
        throw BusinessException.notFound("NOTE_NOT_FOUND");
    }

    /**
     * 已发布笔记浏览量 +1 条件：非发布者本人，且同一访问者 30 分钟内未计次。
     *
     * @return 是否已执行 +1（便于调用方决定是否重新加载 note）
     */
    private boolean tryIncrementViewCount(String contentTypeCode, String currentUserUid, HttpServletRequest request) {
        if (contentTypeCode == null) {
            return false;
        }
        // Use a simple viewer key based on contentTypeCode
        String viewerKey = resolveViewerKey(currentUserUid, request);
        if (!noteViewTracker.shouldCountView(viewerKey, (long) (contentTypeCode.hashCode() & 0x7FFFFFFF))) {
            return false;
        }
        incrementViewCount(contentTypeCode);
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
    private void incrementViewCount(String contentTypeCode) {
        LambdaUpdateWrapper<NoteCounter> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(NoteCounter::getContentTypeCode, contentTypeCode)
                .setSql("view_count = COALESCE(view_count, 0) + 1");
        noteCounterMapper.update(null, wrapper);
    }

    private UserProfile loadUserProfile(String userUid) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getUserUid, userUid).last("LIMIT 1");
        return userProfileMapper.selectOne(wrapper);
    }

    private NoteDetailResponse.Author buildAuthor(UserProfile profile, String userUid) {
        String name = "用户";
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            name = profile.getNickName().trim();
        } else if (profile != null) {
            UserIdentity identity = loadIdentity(profile.getUserUid());
            if (identity != null && StringUtils.hasText(identity.getRealNameMask())) {
                name = identity.getRealNameMask().trim();
            }
        }

        String organization = resolveAuthorOrganization(userUid, profile);

        return NoteDetailResponse.Author.builder()
                .uid(userUid)
                .name(name)
                .organization(organization)
                .avatarUrl(profile == null ? null : profile.getAvatarUrl())
                .build();
    }

    private String resolveAuthorOrganization(String userUid, UserProfile profile) {
        return noteAuthorResolver.resolve(userUid).authorOrganization();
    }

    private LocalDateTime resolveDisplayTime(LocalDateTime publishedAt, LocalDateTime createdAt) {
        return publishedAt != null ? publishedAt : createdAt;
    }

    private Note requireOwnedNote(String noteUid, String userUid) {
        Note note = contentUidResolver.requireNoteByUid(noteUid);
        if (!userUid.equals(note.getUserUid())) {
            throw new BusinessException(403, "NOTE_NOT_OWNER");
        }
        return note;
    }

    /**
     * 查询视频笔记下所有便捷图文子笔记。
     * <p>
     * 通过 t_user_note_detail.parent_content_type_code 查找关联的图文笔记。
     * </p>
     */
    public List<PublishNoteDraftResponse> getNoteChildren(String authorization, String parentNoteUid) {
        clientAccessService.resolveOptionalCurrentUserUid(authorization);
        Note parentNote = contentUidResolver.requireNoteByUid(parentNoteUid);
        if (STATUS_BANNED.equals(parentNote.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }

        LambdaQueryWrapper<NoteDetail> detailWrapper = new LambdaQueryWrapper<>();
        detailWrapper.eq(NoteDetail::getParentContentTypeCode, parentNote.getContentTypeCode());
        List<NoteDetail> childDetails = noteDetailMapper.selectList(detailWrapper);
        if (childDetails.isEmpty()) {
            return List.of();
        }

        List<String> childCodes = childDetails.stream()
                .map(NoteDetail::getContentTypeCode)
                .collect(Collectors.toList());

        LambdaQueryWrapper<Note> noteWrapper = new LambdaQueryWrapper<>();
        noteWrapper.in(Note::getContentTypeCode, childCodes)
                .eq(Note::getStatus, STATUS_PUBLISHED)
                .eq(Note::getVisibility, "PUBLIC");
        List<Note> childNotes = noteMapper.selectList(noteWrapper);

        return childNotes.stream().map(child -> {
            NoteDetail detail = childDetails.stream()
                    .filter(d -> d.getContentTypeCode().equals(child.getContentTypeCode()))
                    .findFirst().orElse(null);
            return PublishNoteDraftResponse.builder()
                    .uid(child.getContentTypeCode())
                    .publishAction(PUBLISH_ACTION_PUBLISH)
                    .title(child.getTitle())
                    .summary(child.getSummary())
                    .contentType(mapContentTypeCodeToDisplay(child.getContentTypeCode()))
                    .content(detail != null ? detail.getContent() : null)
                    .tags(parseJsonStringList(child.getTags()))
                    .coverUrl(child.getCoverUrl())
                    .videoUrl(child.getVideoUrl())
                    .videoDuration(child.getVideoDuration())
                    .parentContentTypeCode(detail != null ? detail.getParentContentTypeCode() : null)
                    .visibility(child.getVisibility())
                    .build();
        }).collect(Collectors.toList());
    }

    private void validateRequest(PublishNoteRequest request, Note existingNote) {
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
                // 字数限制：便捷子笔记 10000 字，独立图文笔记 20000 字
                int maxLen = StringUtils.hasText(request.getParentContentTypeCode())
                        ? MAX_CONTENT_LENGTH_CHILD_NOTE : MAX_CONTENT_LENGTH_IMAGE_TEXT;
                int codePoints = request.getContent().codePointCount(0, request.getContent().length());
                if (codePoints > maxLen) {
                    throw BusinessException.badRequest("CONTENT_TOO_LONG");
                }
            } else if (!StringUtils.hasText(request.getVideoUrl())) {
                throw BusinessException.badRequest("VIDEO_REQUIRED");
            }
        }
    }

    private void assertContentTypeImmutable(Note note, String requestedContentType) {
        String existingDisplay = mapContentTypeCodeToDisplay(note.getContentTypeCode());
        if (!Objects.equals(existingDisplay, requestedContentType)) {
            throw BusinessException.badRequest("NOTE_TYPE_IMMUTABLE");
        }
    }

    private void applyRequestToNote(Note note, PublishNoteRequest request, String existingContentTypeCode) {
        note.setTitle(request.getTitle().trim());
        note.setSummary(StringUtils.hasText(request.getSummary()) ? request.getSummary().trim() : "");
        note.setTags(toJsonStringList(request.getTags()));
        note.setCoverUrl(request.getCoverUrl().trim());
        note.setVisibility(normalizeVisibility(request.getVisibility()));

        if (CONTENT_TYPE_IMAGE_TEXT.equals(request.getContentType())) {
            note.setVideoUrl(null);
            note.setVideoDuration(0);
        } else {
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
            // 发布时统一变更为审核中（PUBLIC / PRIVATE 均需审核）
            note.setStatus(STATUS_REVIEWING);
            note.setPublishedAt(null);
        }
    }

    /**
     * 将笔记正文保存到 t_user_note_detail 垂直拆分表。
     */
    private void saveNoteDetail(String contentTypeCode, PublishNoteRequest request) {
        NoteDetail detail = new NoteDetail();
        detail.setContentTypeCode(contentTypeCode);
        detail.setParentContentTypeCode(trimToNull(request.getParentContentTypeCode()));
        if (CONTENT_TYPE_IMAGE_TEXT.equals(request.getContentType())) {
            detail.setContent(StringUtils.hasText(request.getContent()) ? request.getContent() : null);
        } else {
            detail.setContent(null);
        }
        noteDetailMapper.insert(detail);
    }

    /**
     * 保存初始计数器到 t_user_note_counter 垂直拆分表。
     */
    private void saveNoteCounter(String contentTypeCode) {
        NoteCounter counter = new NoteCounter();
        counter.setContentTypeCode(contentTypeCode);
        counter.setViewCount(0);
        counter.setLikeCount(0);
        counter.setCollectCount(0);
        counter.setCommentCount(0);
        noteCounterMapper.insert(counter);
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
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getContentTypeCode, code);
        return noteMapper.selectCount(wrapper) == 0;
    }

    private PublishNoteResponse buildResponse(Note note, String publishAction) {
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

    /** 可见性归一化：默认 PUBLIC，非法值 → BAD_REQUEST */
    private String normalizeVisibility(String value) {
        if (!StringUtils.hasText(value)) {
            return VISIBILITY_PUBLIC;
        }
        String normalized = value.trim().toUpperCase();
        if (!VISIBILITY_PUBLIC.equals(normalized) && !VISIBILITY_PRIVATE.equals(normalized)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        return normalized;
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

    private UserIdentity loadIdentity(String userUid) {
        LambdaQueryWrapper<UserIdentity> w = new LambdaQueryWrapper<>();
        w.eq(UserIdentity::getUserUid, userUid).last("LIMIT 1");
        return userIdentityMapper.selectOne(w);
    }

    private NoteDetail loadNoteDetail(String contentTypeCode) {
        LambdaQueryWrapper<NoteDetail> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteDetail::getContentTypeCode, contentTypeCode).last("LIMIT 1");
        return noteDetailMapper.selectOne(wrapper);
    }

    private NoteCounter loadNoteCounter(String contentTypeCode) {
        LambdaQueryWrapper<NoteCounter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteCounter::getContentTypeCode, contentTypeCode).last("LIMIT 1");
        return noteCounterMapper.selectOne(wrapper);
    }

    /** 加载父笔记简要信息（含计数器），用于 parentNote 嵌套对象。
     * <p>仅当父笔记存在、已发布且公开时才返回；已删除/封禁/私有不返回，避免泄漏不可见内容。</p>
     */
    private NoteDetailResponse.ParentNote loadParentNote(String parentContentTypeCode) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getContentTypeCode, parentContentTypeCode).last("LIMIT 1");
        Note parentNote = noteMapper.selectOne(wrapper);
        // 父笔记不存在、已删除、已封禁、未发布或私有 → 一律返回 null
        if (parentNote == null) {
            return null;
        }
        String parentStatus = parentNote.getStatus();
        if (parentStatus == null || STATUS_BANNED.equals(parentStatus) || "DELETED".equals(parentStatus)) {
            return null;
        }
        if (!STATUS_PUBLISHED.equals(parentStatus) || !VISIBILITY_PUBLIC.equals(parentNote.getVisibility())) {
            return null;
        }
        NoteCounter parentCounter = loadNoteCounter(parentContentTypeCode);
        return NoteDetailResponse.ParentNote.builder()
                .uid(parentNote.getContentTypeCode())
                .title(parentNote.getTitle())
                .summary(parentNote.getSummary() != null ? parentNote.getSummary() : "")
                .contentType(mapContentTypeCodeToDisplay(parentNote.getContentTypeCode()))
                .tags(parseJsonStringList(parentNote.getTags()))
                .cover(parentNote.getCoverUrl())
                .views(parentCounter != null && parentCounter.getViewCount() != null ? parentCounter.getViewCount() : 0)
                .comments(parentCounter != null && parentCounter.getCommentCount() != null ? parentCounter.getCommentCount() : 0)
                .favorites(parentCounter != null && parentCounter.getCollectCount() != null ? parentCounter.getCollectCount() : 0)
                .build();
    }

    // ===================== 应用层外键级联 =====================

    /**
     * 物理删除笔记及其关联的 detail / counter（替代已移除的 DB 外键 CASCADE）。
     * <p>
     * 软删除场景（status=DELETED）不调用此方法；仅管理员物理清除时使用。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteNoteCascade(String contentTypeCode) {
        // 子表先删（避免主表删后残留）
        LambdaQueryWrapper<NoteDetail> detailWrapper = new LambdaQueryWrapper<>();
        detailWrapper.eq(NoteDetail::getContentTypeCode, contentTypeCode);
        noteDetailMapper.delete(detailWrapper);

        LambdaQueryWrapper<NoteCounter> counterWrapper = new LambdaQueryWrapper<>();
        counterWrapper.eq(NoteCounter::getContentTypeCode, contentTypeCode);
        noteCounterMapper.delete(counterWrapper);

        // 最后删主表
        LambdaQueryWrapper<Note> noteWrapper = new LambdaQueryWrapper<>();
        noteWrapper.eq(Note::getContentTypeCode, contentTypeCode);
        noteMapper.delete(noteWrapper);
    }

    /**
     * 更新笔记时同步更新 detail 大文本内容（upsert 模式）。
     * <p>
     * 使用 saveOrUpdate 保证：detail 行不存在时自动插入，存在时原地更新，
     * 避免 ON DELETE CASCADE 缺失情况下 detail/counter 不同步的问题。
     * </p>
     */
    private void upsertNoteDetail(String contentTypeCode, PublishNoteRequest request) {
        LambdaQueryWrapper<NoteDetail> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteDetail::getContentTypeCode, contentTypeCode).last("LIMIT 1");
        NoteDetail existing = noteDetailMapper.selectOne(wrapper);

        NoteDetail detail = new NoteDetail();
        detail.setContentTypeCode(contentTypeCode);
        detail.setParentContentTypeCode(trimToNull(request.getParentContentTypeCode()));
        if (CONTENT_TYPE_IMAGE_TEXT.equals(request.getContentType())) {
            detail.setContent(StringUtils.hasText(request.getContent()) ? request.getContent() : null);
        } else {
            detail.setContent(null);
        }

        if (existing != null) {
            detail.setId(existing.getId());
            noteDetailMapper.updateById(detail);
        } else {
            noteDetailMapper.insert(detail);
        }
    }
}
