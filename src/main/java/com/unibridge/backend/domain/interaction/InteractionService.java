package com.unibridge.backend.domain.interaction;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.interaction.dto.ContentInteractionRequest;
import com.unibridge.backend.domain.interaction.dto.ContentViewSyncRequest;
import com.unibridge.backend.domain.note.NoteViewTracker;
import com.unibridge.backend.infrastructure.entities.ClientNote;
import com.unibridge.backend.infrastructure.entities.UserContentInteraction;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientNoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserContentInteractionMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Set;

/**
 * 互动数据同步：点赞/收藏/播放计数 → 数据库计数器 + 缓存失效（双写一致性）。
 * API 层使用 {@code targetUid}，库内直接存 {@code target_uid}。
 */
@Service
public class InteractionService {

    private static final String TARGET_NOTE = "NOTE";
    private static final String TARGET_PROJECT = "PROJECT";
    private static final String NOTE_STATUS_PUBLISHED = "PUBLISHED";

    private static final Set<String> VALID_TARGET_TYPES = Set.of(TARGET_NOTE, TARGET_PROJECT);

    private final AccessService clientAccessService;
    private final ClientNoteMapper clientNoteMapper;
    private final UserContentInteractionMapper interactionMapper;
    private final NoteViewTracker noteViewTracker;
    private final ContentUidResolver contentUidResolver;

    public InteractionService(AccessService clientAccessService,
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

    /**
     * 浏览量同步（数据库原子自增）。
     * <p>
     * 【并发安全】使用数据库原子自增替代 read-modify-write，
     * 由行级锁保证并发安全，避免丢失更新。
     * </p>
     */
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

        String currentUserUid = clientAccessService.resolveOptionalCurrentUserUid(authorization);
        if (currentUserUid != null && currentUserUid.equals(note.getUserUid())) {
            return;
        }
        String viewerKey = currentUserUid != null ? "u:" + currentUserUid : "ip:" + IpUtil.resolveClientIp(httpRequest);
        if (!noteViewTracker.shouldCountView(viewerKey, note.getId())) {
            return;
        }

        // 数据库原子自增，避免 read-modify-write 竞态
        LambdaUpdateWrapper<ClientNote> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(ClientNote::getId, note.getId())
                .setSql("view_count = COALESCE(view_count, 0) + 1");
        clientNoteMapper.update(null, wrapper);
    }

    /**
     * 互动开关同步（点赞/收藏）。
     * <p>
     * 【并发安全】互动记录使用 LambdaUpdateWrapper 仅更新目标字段，
     * 避免 updateById 全字段覆盖导致并发的 LIKE 与 COLLECT 操作互相覆盖。
     * 首次创建由数据库唯一索引 {@code uk_user_content_target} 兜底。
     * </p>
     */
    private void syncToggle(String authorization, ContentInteractionRequest request, InteractionField field) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        validateInteractionRequest(request);

        boolean active = Boolean.TRUE.equals(request.getActive());
        String targetType = request.getTargetType().toUpperCase(Locale.ROOT);
        String targetUid = normalizeTargetUid(targetType, request.getTargetUid());

        UserContentInteraction interaction = loadOrCreateInteraction(userUid, targetType, targetUid);
        int before = field == InteractionField.LIKE ? nullSafe(interaction.getLiked()) : nullSafe(interaction.getCollected());
        int after = active ? 1 : 0;
        if (before == after) {
            return; // 状态未变化，无需更新
        }

        // 使用条件更新仅写目标字段，防止并发的 LIKE/COLLECT 互相覆盖
        LambdaUpdateWrapper<UserContentInteraction> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(UserContentInteraction::getUserUid, userUid)
                .eq(UserContentInteraction::getTargetType, targetType)
                .eq(UserContentInteraction::getTargetUid, targetUid);
        if (field == InteractionField.LIKE) {
            updateWrapper.set(UserContentInteraction::getLiked, after);
        } else {
            updateWrapper.set(UserContentInteraction::getCollected, after);
        }
        interactionMapper.update(null, updateWrapper);

        if (TARGET_NOTE.equals(targetType)) {
            Long noteId = contentUidResolver.requireNoteByUid(targetUid).getId();
            applyNoteCounterDelta(noteId, field, after - before);
        }
    }

    private String normalizeTargetUid(String targetType, String targetUid) {
        if ("NOTE".equals(targetType)) {
            return contentUidResolver.requireNoteByUid(targetUid).getContentTypeCode();
        }
        return contentUidResolver.requireProjectByUid(targetUid).getProjectUid();
    }

    /**
     * 笔记计数器增量更新（点赞/收藏）。
     * <p>
     * 【并发安全】使用数据库原子自增替代 read-modify-write，
     * 由行级锁保证并发安全，避免丢失更新。
     * </p>
     */
    private void applyNoteCounterDelta(Long noteId, InteractionField field, int delta) {
        if (delta == 0) {
            return;
        }
        String column = field == InteractionField.LIKE ? "like_count" : "collect_count";
        LambdaUpdateWrapper<ClientNote> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(ClientNote::getId, noteId)
                .setSql(column + " = GREATEST(0, COALESCE(" + column + ", 0) + " + delta + ")");
        clientNoteMapper.update(null, wrapper);
    }

    /**
     * 加载或创建互动记录。
     * <p>
     * 【并发安全】先 select，若不存在再 insert。存在 TOCTOU 竞态。
     * 数据库 {@code uk_user_content_target (user_uid, target_type, target_uid)}
     * 唯一索引兜底：并发 insert 时会触发 DuplicateKeyException，
     * 此时回退为重新 select，由事务回滚或异常捕获保护数据一致性。
     * </p>
     */
    private UserContentInteraction loadOrCreateInteraction(String userUid, String targetType, String targetUid) {
        LambdaQueryWrapper<UserContentInteraction> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserContentInteraction::getUserUid, userUid)
                .eq(UserContentInteraction::getTargetType, targetType)
                .eq(UserContentInteraction::getTargetUid, targetUid)
                .last("LIMIT 1");
        UserContentInteraction existing = interactionMapper.selectOne(wrapper);
        if (existing != null) {
            return existing;
        }
        UserContentInteraction created = new UserContentInteraction();
        created.setUserUid(userUid);
        created.setTargetType(targetType);
        created.setTargetUid(targetUid);
        created.setLiked(0);
        created.setCollected(0);
        // 并发 insert 由数据库唯一索引 uk_user_content_target 兜底
        try {
            interactionMapper.insert(created);
            return created;
        } catch (DuplicateKeyException e) {
            // 并发请求先一步创建了记录，重新查询返回
            return interactionMapper.selectOne(wrapper);
        }
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
