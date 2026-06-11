package com.unibridge.backend.domain.note;

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
 * 解析笔记作者栏：昵称、所属组织、头像。
 */
@Component
public class NoteAuthorResolver {

    private final UserAuthLinkMapper userAuthLinkMapper;
    private final ClientEntityProfileMapper clientEntityProfileMapper;
    private final ClientUserProfileMapper clientUserProfileMapper;

    public NoteAuthorResolver(UserAuthLinkMapper userAuthLinkMapper,
                              ClientEntityProfileMapper clientEntityProfileMapper,
                              ClientUserProfileMapper clientUserProfileMapper) {
        this.userAuthLinkMapper = userAuthLinkMapper;
        this.clientEntityProfileMapper = clientEntityProfileMapper;
        this.clientUserProfileMapper = clientUserProfileMapper;
    }

    public NoteAuthorContext resolve(String userUid) {
        if (userUid == null || userUid.isBlank()) {
            return NoteAuthorContext.empty();
        }

        ClientUserProfile profile = loadUserProfile(userUid);
        String authorNickName = resolveAuthorNickName(profile);
        String authorAvatar = profile != null ? trimToNull(profile.getAvatarUrl()) : null;
        String authorOrganization = resolveOrganization(userUid, profile);
        return new NoteAuthorContext(authorNickName, authorOrganization, authorAvatar);
    }

    private String resolveAuthorNickName(ClientUserProfile profile) {
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            return profile.getNickName().trim();
        }
        return "用户";
    }

    private String resolveOrganization(String userUid, ClientUserProfile profile) {
        UserAuthLink authLink = loadActiveAuthLink(userUid);
        if (authLink != null && authLink.getEntityCode() != null) {
            ClientEntityProfile entityProfile = loadEntityProfile(authLink.getEntityCode());
            if (entityProfile != null && StringUtils.hasText(entityProfile.getName())) {
                return entityProfile.getName().trim();
            }
        }
        return "";
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

    public record NoteAuthorContext(String authorNickName, String authorOrganization, String authorAvatar) {
        static NoteAuthorContext empty() {
            return new NoteAuthorContext("用户", "", null);
        }
    }
}
