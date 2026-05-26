package com.unibridge.backend.domain.project;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.infrastructure.entities.ClientEntityProfile;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import com.unibridge.backend.infrastructure.entities.UserAuthLink;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserAuthLinkMapper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 解析项目发布人（owner）所属主体信息，供项目卡片 Feed / 个人空间共用。
 */
@Component
public class ProjectPublisherEntityResolver {

    private final UserAuthLinkMapper userAuthLinkMapper;
    private final ClientEntityProfileMapper clientEntityProfileMapper;
    private final ClientUserProfileMapper clientUserProfileMapper;

    public ProjectPublisherEntityResolver(UserAuthLinkMapper userAuthLinkMapper,
                                          ClientEntityProfileMapper clientEntityProfileMapper,
                                          ClientUserProfileMapper clientUserProfileMapper) {
        this.userAuthLinkMapper = userAuthLinkMapper;
        this.clientEntityProfileMapper = clientEntityProfileMapper;
        this.clientUserProfileMapper = clientUserProfileMapper;
    }

    public PublisherEntityContext resolve(String ownerUid) {
        if (ownerUid == null || ownerUid.isBlank()) {
            return PublisherEntityContext.empty();
        }

        UserAuthLink authLink = loadActiveAuthLink(ownerUid);
        if (authLink != null && authLink.getEntityCode() != null) {
            ClientEntityProfile entityProfile = loadEntityProfile(authLink.getEntityCode());
            if (entityProfile != null) {
                String logoUrl = trimToNull(entityProfile.getLogoUrl());
                String orgName = StringUtils.hasText(entityProfile.getName())
                        ? entityProfile.getName().trim()
                        : fallbackOrganizationName(ownerUid);
                return new PublisherEntityContext(orgName, logoUrl, logoUrl);
            }
        }

        return new PublisherEntityContext(fallbackOrganizationName(ownerUid), null, null);
    }

    private UserAuthLink loadActiveAuthLink(String userUid) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getUserUid, userUid)
                .eq(UserAuthLink::getIsActive, 1)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        return userAuthLinkMapper.selectOne(wrapper);
    }

    private ClientEntityProfile loadEntityProfile(String entityCode) {
        LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntityProfile::getEntityCode, entityCode).last("LIMIT 1");
        return clientEntityProfileMapper.selectOne(wrapper);
    }

    private String fallbackOrganizationName(String ownerUid) {
        ClientUserProfile profile = loadUserProfile(ownerUid);
        if (profile != null && StringUtils.hasText(profile.getCurrentEntityName())) {
            return profile.getCurrentEntityName().trim();
        }
        return "";
    }

    private ClientUserProfile loadUserProfile(String userUid) {
        LambdaQueryWrapper<ClientUserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUserProfile::getUserUid, userUid).last("LIMIT 1");
        return clientUserProfileMapper.selectOne(wrapper);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    public record PublisherEntityContext(String ownerOrganization, String coverUrl, String logoSvgUrl) {
        static PublisherEntityContext empty() {
            return new PublisherEntityContext("", null, null);
        }
    }
}
