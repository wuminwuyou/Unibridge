package com.unibridge.backend.domain.note;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 解析笔记作者栏：昵称、所属组织、头像。
 */
@Component
public class NoteAuthorResolver {

    private final UserOrganizationBindingMapper userOrganizationBindingMapper;
    private final TenantOrgProfileMapper tenantOrgProfileMapper;
    private final UserProfileMapper userProfileMapper;

    public NoteAuthorResolver(UserOrganizationBindingMapper userOrganizationBindingMapper,
                              TenantOrgProfileMapper tenantOrgProfileMapper,
                              UserProfileMapper userProfileMapper) {
        this.userOrganizationBindingMapper = userOrganizationBindingMapper;
        this.tenantOrgProfileMapper = tenantOrgProfileMapper;
        this.userProfileMapper = userProfileMapper;
    }

    public NoteAuthorContext resolve(String userUid) {
        if (userUid == null || userUid.isBlank()) {
            return NoteAuthorContext.empty();
        }

        UserProfile profile = loadUserProfile(userUid);
        String authorNickName = resolveAuthorNickName(profile);
        String authorAvatar = profile != null ? trimToNull(profile.getAvatarUrl()) : null;
        String authorOrganization = resolveOrganization(userUid, profile);
        return new NoteAuthorContext(authorNickName, authorOrganization, authorAvatar);
    }

    private String resolveAuthorNickName(UserProfile profile) {
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            return profile.getNickName().trim();
        }
        return "用户";
    }

    private String resolveOrganization(String userUid, UserProfile profile) {
        UserOrganizationBinding authLink = loadActiveAuthLink(userUid);
        if (authLink != null && authLink.getEntityCode() != null) {
            TenantOrgProfile entityProfile = loadEntityProfile(authLink.getEntityCode());
            if (entityProfile != null && StringUtils.hasText(entityProfile.getName())) {
                return entityProfile.getName().trim();
            }
        }
        return "";
    }

    private UserOrganizationBinding loadActiveAuthLink(String userUid) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getIsActive, 1)
                .orderByDesc(UserOrganizationBinding::getUpdatedAt)
                .last("LIMIT 1");
        return userOrganizationBindingMapper.selectOne(wrapper);
    }

    private TenantOrgProfile loadEntityProfile(String entityCode) {
        LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrgProfile::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrgProfileMapper.selectOne(wrapper);
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
