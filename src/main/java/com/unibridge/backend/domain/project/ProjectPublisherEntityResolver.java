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
 * <p>
 * {@code coverUrl} 与 {@code logoSvgUrl} 均取自 {@code entity_profile.logo_url}（发布人当前活跃机构身份关联的主体）。
 * </p>
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

    /**
     * @param ownerId 项目 {@code project.owner_id}
     */
    public PublisherEntityContext resolve(Long ownerId) {
        if (ownerId == null) {
            return PublisherEntityContext.empty();
        }

        UserAuthLink authLink = loadActiveAuthLink(ownerId);
        if (authLink != null && authLink.getEntityId() != null) {
            ClientEntityProfile entityProfile = loadEntityProfile(authLink.getEntityId());
            if (entityProfile != null) {
                String logoUrl = trimToNull(entityProfile.getLogoUrl());
                String orgName = StringUtils.hasText(entityProfile.getName())
                        ? entityProfile.getName().trim()
                        : fallbackOrganizationName(ownerId);
                return new PublisherEntityContext(orgName, logoUrl, logoUrl);
            }
        }

        return new PublisherEntityContext(fallbackOrganizationName(ownerId), null, null);
    }

    private UserAuthLink loadActiveAuthLink(Long userId) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getUserId, userId)
                .eq(UserAuthLink::getIsActive, 1)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        return userAuthLinkMapper.selectOne(wrapper);
    }

    private ClientEntityProfile loadEntityProfile(Long entityId) {
        LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntityProfile::getEntityId, entityId).last("LIMIT 1");
        return clientEntityProfileMapper.selectOne(wrapper);
    }

    private String fallbackOrganizationName(Long ownerId) {
        ClientUserProfile profile = loadUserProfile(ownerId);
        if (profile != null && StringUtils.hasText(profile.getCurrentEntityName())) {
            return profile.getCurrentEntityName().trim();
        }
        return "";
    }

    private ClientUserProfile loadUserProfile(Long userId) {
        LambdaQueryWrapper<ClientUserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUserProfile::getUserId, userId).last("LIMIT 1");
        return clientUserProfileMapper.selectOne(wrapper);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    /**
     * @param ownerOrganization 发布主体名称
     * @param coverUrl          项目卡片封面（= 主体 {@code logo_url}）
     * @param logoSvgUrl        主体 Logo（= 主体 {@code logo_url}，与 coverUrl 同源）
     */
    public record PublisherEntityContext(String ownerOrganization, String coverUrl, String logoSvgUrl) {
        static PublisherEntityContext empty() {
            return new PublisherEntityContext("", null, null);
        }
    }
}
