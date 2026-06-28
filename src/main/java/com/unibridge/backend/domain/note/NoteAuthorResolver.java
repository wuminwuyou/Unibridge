package com.unibridge.backend.domain.note;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.application.shared.UserVerificationService;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 解析笔记作者栏：昵称、所属组织、头像。
 * <p>
 * 组织字段仅在用户同时满足「实名认证已完成」与「组织绑定已审核通过」时返回；
 * 未认证或审核中的用户 author.organization 为空字符串，前端不应渲染组织标签。
 * </p>
 */
@Component
public class NoteAuthorResolver {

    private final UserProfileMapper userProfileMapper;
    private final UserVerificationService userVerificationService;

    public NoteAuthorResolver(UserProfileMapper userProfileMapper,
                              UserVerificationService userVerificationService) {
        this.userProfileMapper = userProfileMapper;
        this.userVerificationService = userVerificationService;
    }

    public NoteAuthorContext resolve(String userUid) {
        if (userUid == null || userUid.isBlank()) {
            return NoteAuthorContext.empty();
        }

        UserProfile profile = loadUserProfile(userUid);
        String authorNickName = resolveAuthorNickName(profile);
        String authorAvatar = profile != null ? trimToNull(profile.getAvatarUrl()) : null;
        String authorOrganization = resolveOrganization(userUid);
        return new NoteAuthorContext(authorNickName, authorOrganization, authorAvatar);
    }

    private String resolveAuthorNickName(UserProfile profile) {
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            return profile.getNickName().trim();
        }
        return "用户";
    }

    /**
     * 解析作者所属组织名称。
     * <p>仅当用户认证状态为 {@code "verified"} 时返回组织名，否则返回空字符串。</p>
     */
    private String resolveOrganization(String userUid) {
        return userVerificationService.resolveVerifiedOrganization(userUid);
    }

    private UserProfile loadUserProfile(String userUid) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getUserUid, userUid).last("LIMIT 1");
        return userProfileMapper.selectOne(wrapper);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    public record NoteAuthorContext(String authorNickName, String authorOrganization, String authorAvatar) {
        static NoteAuthorContext empty() {
            return new NoteAuthorContext("用户", "", null);
        }
    }
}
