package com.unibridge.backend.domain.project;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.application.shared.CareerDataParser;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 解析项目发布人（owner）所属主体信息，供项目卡片 Feed / 个人空间 / 项目详情共用。
 */
@Component
public class ProjectPublisherEntityResolver {

    private final UserOrganizationBindingMapper userOrganizationBindingMapper;
    private final TenantOrgProfileMapper tenantOrgProfileMapper;
    private final UserProfileMapper userProfileMapper;
    private final UserIdentityMapper userIdentityMapper;

    public ProjectPublisherEntityResolver(UserOrganizationBindingMapper userOrganizationBindingMapper,
                                          TenantOrgProfileMapper tenantOrgProfileMapper,
                                          UserProfileMapper userProfileMapper,
                                          UserIdentityMapper userIdentityMapper) {
        this.userOrganizationBindingMapper = userOrganizationBindingMapper;
        this.tenantOrgProfileMapper = tenantOrgProfileMapper;
        this.userProfileMapper = userProfileMapper;
        this.userIdentityMapper = userIdentityMapper;
    }

    public PublisherEntityContext resolve(String ownerUid) {
        if (ownerUid == null || ownerUid.isBlank()) {
            return PublisherEntityContext.empty();
        }

        UserProfile profile = loadUserProfile(ownerUid);
        String publisherName = resolvePublisherName(profile, ownerUid);
        String publisherAvatar = resolvePublisherAvatar(profile);

        UserOrganizationBinding authLink = loadActiveAuthLink(ownerUid);
        if (authLink != null && authLink.getEntityCode() != null) {
            TenantOrgProfile entityProfile = loadEntityProfile(authLink.getEntityCode());
            if (entityProfile != null) {
                String logoUrl = trimToNull(entityProfile.getLogoUrl());
                String orgName = StringUtils.hasText(entityProfile.getName())
                        ? entityProfile.getName().trim()
                        : fallbackOrganizationName(ownerUid);
                return new PublisherEntityContext(orgName, logoUrl, logoUrl, publisherName, publisherAvatar);
            }
        }

        return new PublisherEntityContext(fallbackOrganizationName(ownerUid), null, null, publisherName, publisherAvatar);
    }

    /**
     * 解析项目详情页所需的发布者身份信息。
     */
    public OwnerContext resolveOwner(String ownerUid) {
        if (ownerUid == null || ownerUid.isBlank()) {
            return OwnerContext.empty();
        }

        UserProfile profile = loadUserProfile(ownerUid);
        String name = "用户";
        String avatarUrl = null;
        List<String> careerData = null;
        if (profile != null) {
            if (StringUtils.hasText(profile.getNickName())) {
                name = profile.getNickName().trim();
            }
            avatarUrl = trimToNull(profile.getAvatarUrl());
            List<String> parsedCareer = CareerDataParser.parse(profile.getCareerData());
            careerData = parsedCareer.isEmpty() ? null : parsedCareer;
        }

        String organization = null;
        String location = null;
        UserOrganizationBinding authLink = loadActiveAuthLink(ownerUid);
        if (authLink != null && authLink.getEntityCode() != null) {
            TenantOrgProfile entityProfile = loadEntityProfile(authLink.getEntityCode());
            if (entityProfile != null) {
                organization = trimToNull(entityProfile.getName());
                location = trimToNull(entityProfile.getLocation());
            }
        }

        return new OwnerContext(ownerUid.trim(), name, avatarUrl, careerData, organization, location);
    }

    /**
     * 解析发布人展示名称（nick_name > real_name_mask > null）。
     * 卡片场景禁止返回实名原文，优先展示昵称，其次展示脱敏实名。
     */
    private String resolvePublisherName(UserProfile profile, String ownerUid) {
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            return profile.getNickName().trim();
        }
        UserIdentity identity = loadUserIdentity(ownerUid);
        if (identity != null && StringUtils.hasText(identity.getRealNameMask())) {
            return identity.getRealNameMask().trim();
        }
        return null;
    }

    /**
     * 解析发布人头像 URL。
     */
    private String resolvePublisherAvatar(UserProfile profile) {
        if (profile == null) {
            return null;
        }
        return trimToNull(profile.getAvatarUrl());
    }

    private UserIdentity loadUserIdentity(String userUid) {
        LambdaQueryWrapper<UserIdentity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserIdentity::getUserUid, userUid).last("LIMIT 1");
        return userIdentityMapper.selectOne(wrapper);
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

    private String fallbackOrganizationName(String ownerUid) {
        return "";
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

    public record PublisherEntityContext(String ownerOrganization, String coverUrl, String logoSvgUrl,
                                          String publisherName, String publisherAvatar) {
        static PublisherEntityContext empty() {
            return new PublisherEntityContext("", null, null, null, null);
        }
    }

    public record OwnerContext(String uid, String name, String avatarUrl, List<String> careerData,
                               String organization, String location) {
        static OwnerContext empty() {
            return new OwnerContext("", "用户", null, null, null, null);
        }
    }
}
