package com.unibridge.backend.domain.auth;

import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

/**
 * Client 端 JWT 解析，供发布等业务模块复用。
 * <p>
 * JWT subject 存对外标识：个人用户 {@code user_uid}，机构登录 {@code entity_code}。
 * 兼容 UID 迁移前 token / 查询参数中的数值 {@code user.id}。
 * </p>
 */
@Service
public class AccessService {

    private static final String CLIENT_USER_TOKEN_TYPE = "CLIENT_USER";

    /** 个人空间查看上下文：token 当前用户 vs query 目标用户。 */
    public record ProfileViewContext(String currentUserUid, String targetUserUid, boolean viewingOwnSpace) {
    }

    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    public AccessService(JwtUtil jwtUtil, UserMapper userMapper) {
        this.jwtUtil = jwtUtil;
        this.userMapper = userMapper;
    }

    /** 从 Authorization 头解析当前登录用户 UID。 */
    public String requireCurrentUserUid(String authorization) {
        String token = extractBearerToken(authorization);

        String userType;
        String subject;
        try {
            userType = jwtUtil.getUserType(token);
            subject = jwtUtil.getUserId(token);
        } catch (ExpiredJwtException ex) {
            throw BusinessException.unauthorized("ACCESS_TOKEN_EXPIRED");
        } catch (Exception ex) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        if (!CLIENT_USER_TOKEN_TYPE.equals(userType)) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        if (subject == null || subject.isBlank()) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        return resolveClientUserUid(subject);
    }

    /**
     * 解析个人空间查看上下文：
     * <ol>
     *   <li>从 access_token 解码 {@code currentUserUid}</li>
     *   <li>从 query {@code uid}（或兼容参数）解析 {@code targetUserUid}；缺省时等于 currentUserUid</li>
     *   <li>{@code viewingOwnSpace} = 两者逐字符完全一致</li>
     * </ol>
     */
    public ProfileViewContext resolveProfileView(String authorization, String queryUid, String legacyUserUid,
                                                 Long legacyUserId) {
        String currentUserUid = requireCurrentUserUid(authorization);
        String targetUserUid = resolveQueryTargetUserUid(queryUid, legacyUserUid, legacyUserId, currentUserUid);
        return new ProfileViewContext(currentUserUid, targetUserUid, isSameUserUid(currentUserUid, targetUserUid));
    }

    /**
     * 解析目标用户 UID：优先 query {@code uid}，其次 {@code userUid} / 数值 {@code userId}，否则从 access_token 解码当前用户。
     */
    public String resolveTargetUserUid(String authorization, String queryUid, String legacyUserUid, Long legacyUserId) {
        return resolveProfileView(authorization, queryUid, legacyUserUid, legacyUserId).targetUserUid();
    }

    /**
     * 逐字符比较两个 user_uid 是否完全一致（区分大小写，trim 后按位比对）。
     */
    public static boolean isSameUserUid(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        String a = left.trim();
        String b = right.trim();
        int length = a.length();
        if (length != b.length()) {
            return false;
        }
        for (int i = 0; i < length; i++) {
            if (a.charAt(i) != b.charAt(i)) {
                return false;
            }
        }
        return true;
    }

    private String resolveQueryTargetUserUid(String queryUid, String legacyUserUid, Long legacyUserId,
                                             String defaultUid) {
        if (queryUid != null && !queryUid.isBlank()) {
            return resolveClientUserUid(queryUid.trim());
        }
        if (legacyUserUid != null && !legacyUserUid.isBlank()) {
            return resolveClientUserUid(legacyUserUid.trim());
        }
        if (legacyUserId != null) {
            return resolveClientUserUid(String.valueOf(legacyUserId));
        }
        return defaultUid;
    }

    /**
     * 两次机会机制：首次 token 过期抛 ACCESS_TOKEN_EXPIRED 提醒前端刷新；
     * 前端刷新后重试带 X-Token-Refresh-Failed=1 头，此时仍过期则返回 null（走匿名 404）。
     */
    public String resolveOptionalCurrentUserUid(String authorization, HttpServletRequest request) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            return null;
        }
        try {
            String userType = jwtUtil.getUserType(token);
            String subject = jwtUtil.getUserId(token);
            if (!CLIENT_USER_TOKEN_TYPE.equals(userType)) {
                return null;
            }
            if (subject == null || subject.isBlank()) {
                return null;
            }
            return resolveClientUserUid(subject);
        } catch (ExpiredJwtException ex) {
            if ("1".equals(request.getHeader("X-Token-Refresh-Failed"))) {
                return null;
            }
            throw new BusinessException(401, "ACCESS_TOKEN_EXPIRED");
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * 从 Authorization 头解析当前登录用户 UID；无有效 token 时返回 {@code null}。
     * <p>
     * 与两阶段版本不同，本方法在 token 过期时统一抛 401，防止过期 token 被静默降级为匿名用户
     * 导致 Feed 流等级穿透。无请求上下文时，前端应自行管理 token 刷新节奏。
     * </p>
     */
    public String resolveOptionalCurrentUserUid(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            return null;
        }
        try {
            String userType = jwtUtil.getUserType(token);
            String subject = jwtUtil.getUserId(token);
            if (!CLIENT_USER_TOKEN_TYPE.equals(userType)) {
                return null;
            }
            if (subject == null || subject.isBlank()) {
                return null;
            }
            return resolveClientUserUid(subject);
        } catch (ExpiredJwtException ex) {
            throw BusinessException.unauthorized("ACCESS_TOKEN_EXPIRED");
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * 将 JWT subject / 查询参数解析为 {@code user.user_uid}。
     * 旧 token 仅存数值 id 时，通过主键回查 uid。
     */
    public String resolveClientUserUid(String subjectOrLegacyId) {
        if (subjectOrLegacyId == null || subjectOrLegacyId.isBlank()) {
            throw BusinessException.badRequest("USER_UID_REQUIRED");
        }
        String trimmed = subjectOrLegacyId.trim();
        if (!isLegacyNumericUserId(trimmed)) {
            return trimmed;
        }
        User user = userMapper.selectById(Long.parseLong(trimmed));
        if (user == null || user.getUserUid() == null || user.getUserUid().isBlank()) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }
        return user.getUserUid();
    }

    private boolean isLegacyNumericUserId(String value) {
        if (value.isEmpty()) {
            return false;
        }
        for (int i = 0; i < value.length(); i++) {
            if (!Character.isDigit(value.charAt(i))) {
                return false;
            }
        }
        return true;
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
