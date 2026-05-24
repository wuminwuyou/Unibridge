package com.example.demo.client.service;

import com.example.demo.common.BusinessException;
import com.example.demo.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.stereotype.Service;

/**
 * Client 端 JWT 解析，供发布等业务模块复用。
 */
@Service
public class ClientAccessService {

    private static final String CLIENT_USER_TOKEN_TYPE = "CLIENT_USER";

    private final JwtUtil jwtUtil;

    public ClientAccessService(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    /** 从 Authorization 头解析当前登录用户 ID。 */
    public Long requireCurrentUserId(String authorization) {
        String token = extractBearerToken(authorization);

        String userType;
        String userIdRaw;
        try {
            userType = jwtUtil.getUserType(token);
            userIdRaw = jwtUtil.getUserId(token);
        } catch (ExpiredJwtException ex) {
            throw BusinessException.unauthorized("ACCESS_TOKEN_EXPIRED");
        } catch (Exception ex) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        if (!CLIENT_USER_TOKEN_TYPE.equals(userType)) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        try {
            return Long.parseLong(userIdRaw);
        } catch (Exception ex) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
    }

    /** 从 Authorization 头解析当前登录用户 ID；无有效 token 时返回 {@code null}（用于公开读接口）。 */
    public Long resolveOptionalCurrentUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            return null;
        }
        try {
            String userType = jwtUtil.getUserType(token);
            String userIdRaw = jwtUtil.getUserId(token);
            if (!CLIENT_USER_TOKEN_TYPE.equals(userType)) {
                return null;
            }
            return Long.parseLong(userIdRaw);
        } catch (Exception ex) {
            return null;
        }
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        return token;
    }
}
