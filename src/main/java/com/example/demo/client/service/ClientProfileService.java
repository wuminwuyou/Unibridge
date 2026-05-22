package com.example.demo.client.service;

import com.example.demo.client.dto.ProfileMenuResponse;
import com.example.demo.client.entity.ClientUser;
import com.example.demo.client.entity.ClientUserProfile;
import com.example.demo.client.mapper.ClientUserMapper;
import com.example.demo.client.mapper.ClientUserProfileMapper;
import com.example.demo.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ClientProfileService {
    private static final String CLIENT_USER_TOKEN_TYPE = "CLIENT_USER";

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ClientUserMapper clientUserMapper;

    @Autowired
    private ClientUserProfileMapper clientUserProfileMapper;

    public ProfileMenuResponse getProfileMenu(String authorization) {
        String token = extractBearerToken(authorization);

        String userType;
        String userIdRaw;
        try {
            userType = jwtUtil.getUserType(token);
            userIdRaw = jwtUtil.getUserId(token);
        } catch (ExpiredJwtException ex) {
            throw new RuntimeException("ACCESS_TOKEN_EXPIRED");
        } catch (Exception ex) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        if (!CLIENT_USER_TOKEN_TYPE.equals(userType)) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        Long userId;
        try {
            userId = Long.parseLong(userIdRaw);
        } catch (Exception ex) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        ClientUser user = clientUserMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("USER_NOT_FOUND");
        }

        ClientUserProfile profile = clientUserProfileMapper.selectById(userId);
        String nickname = profile != null && profile.getNickName() != null ? profile.getNickName() : "";
        String avatarUrl = profile != null && profile.getAvatarUrl() != null ? profile.getAvatarUrl() : "";
        String level = profile != null && profile.getLevel() != null ? profile.getLevel() : "";
        String verifiedOrganization = profile != null && profile.getCurrentEntityName() != null ? profile.getCurrentEntityName() : "";

        return new ProfileMenuResponse(
                userId,
                nickname,
                level,
                avatarUrl,
                verifiedOrganization
        );
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new RuntimeException("UNAUTHORIZED");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            throw new RuntimeException("UNAUTHORIZED");
        }
        return token;
    }
}
