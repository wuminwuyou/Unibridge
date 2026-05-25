package com.example.demo.client.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.client.entity.ClientEntityProfile;
import com.example.demo.client.entity.ClientUserProfile;
import com.example.demo.client.entity.UserAuthLink;
import com.example.demo.client.mapper.ClientEntityProfileMapper;
import com.example.demo.client.mapper.ClientUserProfileMapper;
import com.example.demo.client.mapper.UserAuthLinkMapper;
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

    public NoteAuthorContext resolve(Long userId) {
        if (userId == null) {
            return NoteAuthorContext.empty();
        }

        ClientUserProfile profile = loadUserProfile(userId);
        String authorNickName = resolveAuthorNickName(profile);
        String authorAvatar = profile != null ? trimToNull(profile.getAvatarUrl()) : null;
        String authorOrganization = resolveOrganization(userId, profile);
        return new NoteAuthorContext(authorNickName, authorOrganization, authorAvatar);
    }

    private String resolveAuthorNickName(ClientUserProfile profile) {
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            return profile.getNickName().trim();
        }
        return "用户";
    }

    private String resolveOrganization(Long userId, ClientUserProfile profile) {
        UserAuthLink authLink = loadActiveAuthLink(userId);
        if (authLink != null && authLink.getEntityId() != null) {
            ClientEntityProfile entityProfile = loadEntityProfile(authLink.getEntityId());
            if (entityProfile != null && StringUtils.hasText(entityProfile.getName())) {
                return entityProfile.getName().trim();
            }
        }
        if (profile != null && StringUtils.hasText(profile.getCurrentEntityName())) {
            return profile.getCurrentEntityName().trim();
        }
        return "";
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

    public record NoteAuthorContext(String authorNickName, String authorOrganization, String authorAvatar) {
        static NoteAuthorContext empty() {
            return new NoteAuthorContext("用户", "", null);
        }
    }
}
