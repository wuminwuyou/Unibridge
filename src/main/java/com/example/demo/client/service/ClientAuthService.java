package com.example.demo.client.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.client.dto.*;
import com.example.demo.client.entity.ClientEntity;
import com.example.demo.client.entity.ClientUser;
import com.example.demo.client.entity.UserAuthLink;
import com.example.demo.client.mapper.ClientEntityMapper;
import com.example.demo.client.mapper.ClientUserMapper;
import com.example.demo.client.mapper.UserAuthLinkMapper;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Client 端认证服务：
 * 覆盖个人注册、个人多方式登录、验证码下发、主体两步登录。
 *
 * 当前验证码与 challenge 采用内存存储，便于开发联调。
 */
@Service
public class ClientAuthService {
    private static final int CODE_EXPIRE_SEC = 300;
    private static final int CODE_RETRY_AFTER_SEC = 60;
    private static final int OTP_EXPIRE_SEC = 300;
    private static final int ACCESS_TOKEN_EXPIRE_SEC = 30 * 60;
    private static final int REFRESH_TOKEN_EXPIRE_SEC = 7 * 24 * 60 * 60;
    private static final long REFRESH_TOKEN_EXPIRE_MS = REFRESH_TOKEN_EXPIRE_SEC * 1000L;

    private final Map<String, CodeRecord> codeStore = new ConcurrentHashMap<>();
    private final Map<String, ChallengeRecord> challengeStore = new ConcurrentHashMap<>();
    private final Map<String, String> activeRefreshTokenStore = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong(1);

    @Autowired
    private ClientUserMapper clientUserMapper;

    @Autowired
    private ClientEntityMapper clientEntityMapper;

    @Autowired
    private UserAuthLinkMapper userAuthLinkMapper;

    @Autowired
    private JwtUtil jwtUtil;

    /** 个人账号注册。 */
    public RegisterResponse registerPersonal(PersonalRegisterRequest request) {
        String account = normalize(request.getAccount());
        String channel = normalizeOrDefault(request.getChannel(), "sms");

        if (!isPhone(account)) {
            throw new RuntimeException("ACCOUNT_FORMAT_INVALID");
        }
        if (!Objects.equals(request.getPassword(), request.getConfirmPassword())) {
            throw new RuntimeException("PASSWORD_NOT_MATCH");
        }
        if (request.getPassword() == null || request.getPassword().length() < 32) {
            throw new RuntimeException("WEAK_PASSWORD");
        }
        if (!verifyCode(account, channel, request.getVerifyCode(), "register")) {
            throw new RuntimeException("INVALID_VERIFY_CODE");
        }

        LambdaQueryWrapper<ClientUser> existsWrapper = new LambdaQueryWrapper<>();
        existsWrapper.eq(ClientUser::getPhone, account);
        if (clientUserMapper.selectOne(existsWrapper) != null) {
            throw new RuntimeException("ACCOUNT_ALREADY_EXISTS");
        }

        ClientUser user = new ClientUser();
        user.setPhone(account);
        user.setPasswordHash(request.getPassword());
        clientUserMapper.insert(user);

        TokenPair tokenPair = issueTokenPair(user.getId(), "CLIENT_USER", "CLIENT_USER_REFRESH");
        String accessToken = tokenPair.accessToken();
        String refreshToken = tokenPair.refreshToken();
        return new RegisterResponse(user.getId(), null, "unverified", true, accessToken, refreshToken);
    }

    /** 个人密码登录。 */
    public LoginResponse loginPersonalByPassword(PersonalPasswordLoginRequest request) {
        ClientUser user = loadPersonalUserByAccount(request.getAccount());
        if (!Objects.equals(user.getPasswordHash(), request.getPassword())) {
            throw new RuntimeException("ACCOUNT_OR_PASSWORD_INVALID");
        }
        return buildPersonalLoginResponse(user);
    }

    /** 个人短信验证码登录。 */
    public LoginResponse loginPersonalBySms(PersonalSmsLoginRequest request) {
        String account = normalize(request.getAccount());
        if (!verifyCode(account, "sms", request.getSmsCode(), "login")) {
            throw new RuntimeException("SMS_CODE_INVALID");
        }
        ClientUser user = loadPersonalUserByAccount(account);
        return buildPersonalLoginResponse(user);
    }

    /** 个人邮箱验证码登录。 */
    public LoginResponse loginPersonalByEmail(PersonalEmailLoginRequest request) {
        String account = normalize(request.getAccount());
        if (!verifyCode(account, "email", request.getEmailCode(), "login")) {
            throw new RuntimeException("SMS_CODE_INVALID");
        }
        ClientUser user = loadPersonalUserByAccount(account);
        return buildPersonalLoginResponse(user);
    }

    /** 下发个人登录/注册验证码（开发模式打印日志）。 */
    public SendCodeResponse sendPersonalCode(SendCodeRequest request) {
        String account = normalize(request.getAccount());
        String bizType = normalizeOrDefault(request.getBizType(), "login");
        String channel = normalizeOrDefault(request.getChannel(), "sms");
        String key = buildCodeKey(account, channel, bizType);
        LocalDateTime now = LocalDateTime.now();

        CodeRecord existing = codeStore.get(key);
        if (existing != null && existing.createdAt.plusSeconds(CODE_RETRY_AFTER_SEC).isAfter(now)) {
            throw new RuntimeException("TOO_FREQUENT_REQUEST");
        }

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        String requestId = "req_" + System.currentTimeMillis() + "_" + requestCounter.getAndIncrement();

        CodeRecord record = new CodeRecord(requestId, code, now, now.plusSeconds(CODE_EXPIRE_SEC));
        codeStore.put(key, record);
        System.out.println("[ClientAuth] send code for " + channel + " account=" + account + ", code=" + code + ", bizType=" + bizType);

        return new SendCodeResponse(requestId, CODE_EXPIRE_SEC, CODE_RETRY_AFTER_SEC);
    }

    /** 主体登录第一步：机构代码 + 账号 + 密码校验，返回 challenge。 */
    public OrganizationCredentialResponse loginOrganizationCredentials(OrganizationCredentialLoginRequest request) {
        if (isBlank(request.getInstitutionCode()) || isBlank(request.getAccount()) || isBlank(request.getPassword())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }

        LambdaQueryWrapper<ClientEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntity::getEntityCode, request.getInstitutionCode());
        ClientEntity entity = clientEntityMapper.selectOne(wrapper);

        if (entity == null || !Objects.equals(entity.getPasswordHash(), request.getPassword())) {
            throw new RuntimeException("ORGANIZATION_CREDENTIAL_INVALID");
        }
        if (!"APPROVED".equalsIgnoreCase(entity.getAuditStatus())) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DISABLED");
        }

        String otpCode = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        String challengeId = "chl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        challengeStore.put(challengeId, new ChallengeRecord(entity.getId(), otpCode, LocalDateTime.now().plusSeconds(OTP_EXPIRE_SEC)));
        System.out.println("[ClientAuth] organization OTP challengeId=" + challengeId + ", otpCode=" + otpCode);

        return new OrganizationCredentialResponse(challengeId, digestPreview(request.getPassword()), OTP_EXPIRE_SEC, maskInstitutionCode(request.getInstitutionCode()));
    }

    /**
     * 主体登录第二步：challenge + OTP 校验，签发 token。
     * TODO: 后续补齐首次登录绑定 totp_secret 流程；当前为模拟 TOTP 验证。
     */
    public LoginResponse loginOrganizationOtp(OrganizationOtpLoginRequest request) {
        ChallengeRecord challenge = challengeStore.get(request.getChallengeId());
        if (challenge == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        if (challenge.expireAt.isBefore(LocalDateTime.now())) {
            challengeStore.remove(request.getChallengeId());
            throw new RuntimeException("CHALLENGE_EXPIRED");
        }
        if (!Objects.equals(challenge.otpCode, request.getOtpCode())) {
            throw new RuntimeException("OTP_INVALID");
        }

        ClientEntity entity = clientEntityMapper.selectById(challenge.entityId);
        if (entity == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }

        entity.setLastLoginAt(LocalDateTime.now());
        clientEntityMapper.updateById(entity);
        challengeStore.remove(request.getChallengeId());

        TokenPair tokenPair = issueTokenPair(entity.getId(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        String accessToken = tokenPair.accessToken();
        String refreshToken = tokenPair.refreshToken();
        return new LoginResponse(entity.getId(), "organization-admin", "verified", accessToken, refreshToken, ACCESS_TOKEN_EXPIRE_SEC);
    }

    /** 使用 refreshToken 换取新的 accessToken（并轮换 refreshToken）。 */
    public synchronized RefreshTokenResponse refreshAccessToken(RefreshTokenRequest request) {
        if (request == null || isBlank(request.getRefreshToken())) {
            throw new RuntimeException("REFRESH_TOKEN_REQUIRED");
        }
        if (!jwtUtil.validateToken(request.getRefreshToken())) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }

        String oldRefreshToken = request.getRefreshToken();
        String userType = jwtUtil.getUserType(oldRefreshToken);
        String userId = jwtUtil.getUserId(oldRefreshToken);
        if (!isClientRefreshType(userType)) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }

        Long numericUserId;
        try {
            numericUserId = Long.parseLong(userId);
        } catch (NumberFormatException ex) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }

        String accessTokenType = mapToAccessTokenType(userType);
        String subjectKey = buildRefreshSubjectKey(numericUserId, userType);
        String activeRefreshToken = activeRefreshTokenStore.get(subjectKey);
        if (activeRefreshToken == null || !Objects.equals(activeRefreshToken, oldRefreshToken)) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }

        if ("CLIENT_USER".equals(accessTokenType)) {
            ClientUser user = clientUserMapper.selectById(numericUserId);
            if (user == null) {
                throw new RuntimeException("ACCOUNT_NOT_FOUND");
            }
        } else {
            ClientEntity entity = clientEntityMapper.selectById(numericUserId);
            if (entity == null) {
                throw new RuntimeException("CHALLENGE_NOT_FOUND");
            }
        }

        TokenPair tokenPair = issueTokenPair(numericUserId, accessTokenType, userType);
        String newAccessToken = tokenPair.accessToken();
        String newRefreshToken = tokenPair.refreshToken();
        return new RefreshTokenResponse(newAccessToken, newRefreshToken, ACCESS_TOKEN_EXPIRE_SEC);
    }

    private LoginResponse buildPersonalLoginResponse(ClientUser user) {
        user.setLastLoginAt(LocalDateTime.now());
        clientUserMapper.updateById(user);

        AuthMeta authMeta = resolveUserAuthMeta(user.getId());
        TokenPair tokenPair = issueTokenPair(user.getId(), "CLIENT_USER", "CLIENT_USER_REFRESH");
        String accessToken = tokenPair.accessToken();
        String refreshToken = tokenPair.refreshToken();
        return new LoginResponse(user.getId(), authMeta.userRole, authMeta.authStatus, accessToken, refreshToken, ACCESS_TOKEN_EXPIRE_SEC);
    }

    private ClientUser loadPersonalUserByAccount(String accountRaw) {
        String account = normalize(accountRaw);
        LambdaQueryWrapper<ClientUser> wrapper = new LambdaQueryWrapper<>();
        if (isEmail(account)) {
            wrapper.eq(ClientUser::getEmail, account.toLowerCase(Locale.ROOT));
        } else {
            wrapper.eq(ClientUser::getPhone, account);
        }
        ClientUser user = clientUserMapper.selectOne(wrapper);
        if (user == null) {
            throw new RuntimeException("ACCOUNT_NOT_FOUND");
        }
        return user;
    }

    private AuthMeta resolveUserAuthMeta(Long userId) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getUserId, userId)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        UserAuthLink link = userAuthLinkMapper.selectOne(wrapper);
        if (link == null) {
            return new AuthMeta("student", "unverified");
        }

        String authStatus = "APPROVED".equalsIgnoreCase(link.getAuditStatus()) ? "verified" : "unverified";
        String userRole = mapBusinessRole(link.getBusinessRole());
        return new AuthMeta(userRole, authStatus);
    }

    private String mapBusinessRole(String role) {
        if (role == null) {
            return "student";
        }
        return switch (role.toUpperCase(Locale.ROOT)) {
            case "PM" -> "pm";
            case "MENTOR", "FACULTY" -> "mentor";
            case "STUDENT" -> "student";
            default -> "student";
        };
    }

    private boolean verifyCode(String accountRaw, String channelRaw, String verifyCode, String bizTypeRaw) {
        String account = normalize(accountRaw);
        String channel = normalizeOrDefault(channelRaw, "sms");
        String bizType = normalizeOrDefault(bizTypeRaw, "login");
        String key = buildCodeKey(account, channel, bizType);

        CodeRecord record = codeStore.get(key);
        if (record == null) {
            return false;
        }
        if (record.expireAt.isBefore(LocalDateTime.now())) {
            codeStore.remove(key);
            throw new RuntimeException("VERIFY_CODE_EXPIRED");
        }
        if (!Objects.equals(record.code, verifyCode)) {
            return false;
        }
        codeStore.remove(key);
        return true;
    }

    private String buildCodeKey(String account, String channel, String bizType) {
        return account + "|" + channel + "|" + bizType;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeOrDefault(String value, String defaultValue) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? defaultValue : normalized.toLowerCase(Locale.ROOT);
    }

    private boolean isPhone(String value) {
        return value != null && value.matches("^\\d{11}$");
    }

    private boolean isEmail(String value) {
        return value != null && value.contains("@");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String digestPreview(String password) {
        String normalized = normalize(password);
        if (normalized.length() <= 12) {
            return normalized;
        }
        return normalized.substring(0, 12);
    }

    private String maskInstitutionCode(String institutionCode) {
        String normalized = normalize(institutionCode);
        if (normalized.length() <= 2) {
            return "***";
        }
        return normalized.substring(0, 1) + "***" + normalized.substring(normalized.length() - 1);
    }

    private String generateAccessToken(Long userId, String userType) {
        return jwtUtil.generateToken(String.valueOf(userId), userType, 0);
    }

    private String generateRefreshToken(Long userId, String userType) {
        return jwtUtil.generateToken(String.valueOf(userId), userType, 0, REFRESH_TOKEN_EXPIRE_MS);
    }

    /**
     * 刷新 token 采用一次性设计：
     * 每次签发新 refreshToken 都会覆盖旧值，旧 token 立刻失效。
     */
    private TokenPair issueTokenPair(Long userId, String accessTokenType, String refreshTokenType) {
        String accessToken = generateAccessToken(userId, accessTokenType);
        String refreshToken = generateRefreshToken(userId, refreshTokenType);
        activeRefreshTokenStore.put(buildRefreshSubjectKey(userId, refreshTokenType), refreshToken);
        return new TokenPair(accessToken, refreshToken);
    }

    private String buildRefreshSubjectKey(Long userId, String refreshTokenType) {
        return userId + "|" + refreshTokenType;
    }

    private boolean isClientRefreshType(String userType) {
        return "CLIENT_USER_REFRESH".equals(userType) || "CLIENT_ORG_REFRESH".equals(userType);
    }

    private String mapToAccessTokenType(String refreshType) {
        return "CLIENT_ORG_REFRESH".equals(refreshType) ? "CLIENT_ORG" : "CLIENT_USER";
    }

    private record AuthMeta(String userRole, String authStatus) {
    }

    private record CodeRecord(String requestId, String code, LocalDateTime createdAt, LocalDateTime expireAt) {
    }

    private record ChallengeRecord(Long entityId, String otpCode, LocalDateTime expireAt) {
    }

    private record TokenPair(String accessToken, String refreshToken) {
    }
}
