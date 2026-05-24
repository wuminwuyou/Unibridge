package com.example.demo.client.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.client.entity.ClientNote;
import com.example.demo.client.entity.ClientProject;
import com.example.demo.client.mapper.ClientNoteMapper;
import com.example.demo.client.mapper.ClientProjectMapper;
import com.example.demo.common.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Set;

/**
 * 双 ID 解析器：API 层仅接受对外 {@code uid}，内部一律映射为自增 {@code id}。
 * <ul>
 *   <li>笔记：{@code uid} = {@code note.content_type_code}（TX/VD + 11 位）</li>
 *   <li>项目：{@code uid} = {@code project.project_uid}（PR + 11 位）</li>
 *   <li>商业敏感表 {@code project_commercial_secret} 仅通过内部 {@code project.id} 访问，永不暴露</li>
 * </ul>
 */
@Service
public class ContentUidResolver {

    private static final Set<String> VALID_TARGET_TYPES = Set.of("NOTE", "PROJECT");

    private final ClientNoteMapper clientNoteMapper;
    private final ClientProjectMapper clientProjectMapper;

    public ContentUidResolver(ClientNoteMapper clientNoteMapper,
                              ClientProjectMapper clientProjectMapper) {
        this.clientNoteMapper = clientNoteMapper;
        this.clientProjectMapper = clientProjectMapper;
    }

    /** 笔记对外 UID（即 content_type_code）。 */
    public static String notePublicUid(ClientNote note) {
        return note == null ? null : note.getContentTypeCode();
    }

    /** 项目对外 UID。 */
    public static String projectPublicUid(ClientProject project) {
        return project == null ? null : project.getProjectUid();
    }

    public ClientNote requireNoteByUid(String noteUid) {
        String normalized = normalizeUid(noteUid, "NOTE_UID_REQUIRED");
        LambdaQueryWrapper<ClientNote> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientNote::getContentTypeCode, normalized).last("LIMIT 1");
        ClientNote note = clientNoteMapper.selectOne(wrapper);
        if (note == null) {
            throw BusinessException.notFound("NOTE_NOT_FOUND");
        }
        return note;
    }

    public ClientProject requireProjectByUid(String projectUid) {
        String normalized = normalizeUid(projectUid, "PROJECT_UID_REQUIRED");
        LambdaQueryWrapper<ClientProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientProject::getProjectUid, normalized).last("LIMIT 1");
        ClientProject project = clientProjectMapper.selectOne(wrapper);
        if (project == null) {
            throw BusinessException.notFound("PROJECT_NOT_FOUND");
        }
        return project;
    }

    public Long resolveNoteInternalId(String noteUid) {
        return requireNoteByUid(noteUid).getId();
    }

    public Long resolveProjectInternalId(String projectUid) {
        return requireProjectByUid(projectUid).getId();
    }

    public Long resolveTargetInternalId(String targetType, String targetUid) {
        String normalizedType = targetType == null ? "" : targetType.trim().toUpperCase(Locale.ROOT);
        if (!VALID_TARGET_TYPES.contains(normalizedType)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        return "NOTE".equals(normalizedType)
                ? resolveNoteInternalId(targetUid)
                : resolveProjectInternalId(targetUid);
    }

    private String normalizeUid(String uid, String emptyErrorCode) {
        if (!StringUtils.hasText(uid)) {
            throw BusinessException.badRequest(emptyErrorCode);
        }
        return uid.trim();
    }
}
