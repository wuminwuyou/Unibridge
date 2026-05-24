package com.example.demo.client.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.client.dto.ContentInteractionRequest;
import com.example.demo.client.dto.ContentViewSyncRequest;
import com.example.demo.client.entity.ClientNote;
import com.example.demo.client.entity.UserContentInteraction;
import com.example.demo.client.mapper.ClientNoteMapper;
import com.example.demo.client.mapper.UserContentInteractionMapper;
import com.example.demo.common.BusinessException;
import com.example.demo.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Set;

/**
 * 互动数据同步：点赞/收藏/播放计数 → 数据库计数器 + 缓存失效（双写一致性）。
 * API 层使用 {@code targetUid}，内部映射为 {@code target_id}。
 */
@Service
public class ContentInteractionService {

    private static final String TARGET_NOTE = "NOTE";
    private static final String TARGET_PROJECT = "PROJECT";
    private static final String NOTE_STATUS_PUBLISHED = "PUBLISHED";

    private static final Set<String> VALID_TARGET_TYPES = Set.of(TARGET_NOTE, TARGET_PROJECT);

    private final ClientAccessService clientAccessService;
    private final ClientNoteMapper clientNoteMapper;
    private final UserContentInteractionMapper interactionMapper;
    private final NoteViewTracker noteViewTracker;
    private final ContentUidResolver contentUidResolver;

    public ContentInteractionService(ClientAccessService clientAccessService,
                                     ClientNoteMapper clientNoteMapper,
                                     UserContentInteractionMapper interactionMapper,
                                     NoteViewTracker noteViewTracker,
                                     ContentUidResolver contentUidResolver) {
        this.clientAccessService = clientAccessService;
        this.clientNoteMapper = clientNoteMapper;
        this.interactionMapper = interactionMapper;
        this.noteViewTracker = noteViewTracker;
        this.contentUidResolver = contentUidResolver;
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true)
    public void syncLike(String authorization, ContentInteractionRequest request) {
        syncToggle(authorization, request, InteractionField.LIKE);
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true)
    public void syncCollect(String authorization, ContentInteractionRequest request) {
        syncToggle(authorization, request, InteractionField.COLLECT);
    }

    @Transactional
    public void syncView(String authorization, ContentViewSyncRequest request, HttpServletRequest httpRequest) {
        validateViewRequest(request);
        if (!TARGET_NOTE.equalsIgnoreCase(request.getTargetType())) {
            return;
        }

        ClientNote note = contentUidResolver.requireNoteByUid(request.getTargetUid());
        if (!NOTE_STATUS_PUBLISHED.equals(note.getStatus())) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }

        Long currentUserId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        if (currentUserId != null && currentUserId.equals(note.getUserId())) {
            return;
        }
        String viewerKey = currentUserId != null ? "u:" + currentUserId : "ip:" + IpUtil.resolveClientIp(httpRequest);
        if (!noteViewTracker.shouldCountView(viewerKey, note.getId())) {
            return;
        }

        ClientNote update = new ClientNote();
        update.setId(note.getId());
        update.setViewCount((note.getViewCount() == null ? 0 : note.getViewCount()) + 1);
        clientNoteMapper.updateById(update);
    }

    private void syncToggle(String authorization, ContentInteractionRequest request, InteractionField field) {
        Long userId = clientAccessService.requireCurrentUserId(authorization);
        validateInteractionRequest(request);

        boolean active = Boolean.TRUE.equals(request.getActive());
        String targetType = request.getTargetType().toUpperCase(Locale.ROOT);
        Long targetInternalId = contentUidResolver.resolveTargetInternalId(targetType, request.getTargetUid());

        UserContentInteraction interaction = loadOrCreateInteraction(userId, targetType, targetInternalId);
        int before = field == InteractionField.LIKE ? nullSafe(interaction.getLiked()) : nullSafe(interaction.getCollected());
        int after = active ? 1 : 0;
        if (before == after) {
            return;
        }

        if (field == InteractionField.LIKE) {
            interaction.setLiked(after);
        } else {
            interaction.setCollected(after);
        }
        if (interaction.getId() == null) {
            interactionMapper.insert(interaction);
        } else {
            interactionMapper.updateById(interaction);
        }

        if (TARGET_NOTE.equals(targetType)) {
            applyNoteCounterDelta(targetInternalId, field, after - before);
        }
    }

    private void applyNoteCounterDelta(Long noteId, InteractionField field, int delta) {
        if (delta == 0) {
            return;
        }
        ClientNote note = clientNoteMapper.selectById(noteId);
        if (note == null) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        ClientNote update = new ClientNote();
        update.setId(noteId);
        if (field == InteractionField.LIKE) {
            int next = Math.max(0, nullSafe(note.getLikeCount()) + delta);
            update.setLikeCount(next);
        } else {
            int next = Math.max(0, nullSafe(note.getCollectCount()) + delta);
            update.setCollectCount(next);
        }
        clientNoteMapper.updateById(update);
    }

    private UserContentInteraction loadOrCreateInteraction(Long userId, String targetType, Long targetId) {
        LambdaQueryWrapper<UserContentInteraction> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserContentInteraction::getUserId, userId)
                .eq(UserContentInteraction::getTargetType, targetType)
                .eq(UserContentInteraction::getTargetId, targetId)
                .last("LIMIT 1");
        UserContentInteraction existing = interactionMapper.selectOne(wrapper);
        if (existing != null) {
            return existing;
        }
        UserContentInteraction created = new UserContentInteraction();
        created.setUserId(userId);
        created.setTargetType(targetType);
        created.setTargetId(targetId);
        created.setLiked(0);
        created.setCollected(0);
        return created;
    }

    private void validateInteractionRequest(ContentInteractionRequest request) {
        if (request == null || !StringUtils.hasText(request.getTargetUid()) || request.getActive() == null) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getTargetType())
                || !VALID_TARGET_TYPES.contains(request.getTargetType().toUpperCase(Locale.ROOT))) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
    }

    private void validateViewRequest(ContentViewSyncRequest request) {
        if (request == null || !StringUtils.hasText(request.getTargetUid())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getTargetType())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
    }

    private int nullSafe(Integer value) {
        return value == null ? 0 : value;
    }

    private enum InteractionField {
        LIKE, COLLECT
    }
}
