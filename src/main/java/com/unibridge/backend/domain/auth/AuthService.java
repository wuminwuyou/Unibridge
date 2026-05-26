package com.unibridge.backend.domain.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.domain.auth.dto.HandleLogoutRequest;
import com.unibridge.backend.domain.auth.dto.LoginResponse;
import com.unibridge.backend.domain.auth.dto.OrganizationCredentialLoginRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationCredentialResponse;
import com.unibridge.backend.domain.auth.dto.OrganizationOtpLoginRequest;
import com.unibridge.backend.domain.auth.dto.PersonalEmailLoginRequest;
import com.unibridge.backend.domain.auth.dto.PersonalPasswordLoginRequest;
import com.unibridge.backend.domain.auth.dto.PersonalRegisterRequest;
import com.unibridge.backend.domain.auth.dto.PersonalSmsLoginRequest;
import com.unibridge.backend.domain.auth.dto.RefreshTokenRequest;
import com.unibridge.backend.domain.auth.dto.RefreshTokenResponse;
import com.unibridge.backend.domain.auth.dto.RegisterResponse;
import com.unibridge.backend.domain.auth.dto.SendCodeRequest;
import com.unibridge.backend.domain.auth.dto.SendCodeResponse;
import com.unibridge.backend.infrastructure.entities.ClientEntity;
import com.unibridge.backend.infrastructure.entities.ClientUser;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import com.unibridge.backend.infrastructure.entities.SysCreditLog;
import com.unibridge.backend.infrastructure.entities.SysCreditProfile;
import com.unibridge.backend.infrastructure.entities.UserAuthLink;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.SysCreditLogMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.SysCreditProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserAuthLinkMapper;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import com.unibridge.backend.infrastructure.util.UserUidGenerator;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String DEFAULT_AVATAR_URL = "https://api.dicebear.com/9.x/initials/svg?seed=U&backgroundColor=cbd5e1&color=ffffff";
    private static final int CODE_EXPIRE_SEC = 300;
    private static final int CODE_RETRY_AFTER_SEC = 60;
    private static final int OTP_EXPIRE_SEC = 300;
    private static final int ACCESS_TOKEN_EXPIRE_SEC = 30 * 60;
    private static final int REFRESH_TOKEN_EXPIRE_SEC = 7 * 24 * 60 * 60;
    private static final long REFRESH_TOKEN_EXPIRE_MS = REFRESH_TOKEN_EXPIRE_SEC * 1000L;
    private static final int DEFAULT_CREDIT_SCORE = 600;
    private static final String CREDIT_BIZ_REGISTER = "REGISTER";
    private static final String CREDIT_OPERATOR_SYSTEM = "SYSTEM";

    private final Map<String, CodeRecord> codeStore = new ConcurrentHashMap<>();
    private final Map<String, ChallengeRecord> challengeStore = new ConcurrentHashMap<>();
    private final Map<String, String> activeRefreshTokenStore = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> revokedTokenStore = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong(1);

    @Autowired
    private ClientUserMapper clientUserMapper;

    @Autowired
    private ClientUserProfileMapper clientUserProfileMapper;

    @Autowired
    private ClientEntityMapper clientEntityMapper;

    @Autowired
    private UserAuthLinkMapper userAuthLinkMapper;

    @Autowired
    private SysCreditProfileMapper sysCreditProfileMapper;

    @Autowired
    private SysCreditLogMapper sysCreditLogMapper;

    @Autowired
    private JwtUtil jwtUtil;

    /** 个人账号注册。 */
    @Transactional(rollbackFor = Exception.class)
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
        user.setUserUid(UserUidGenerator.generate(this::isUserUidUnique));
        user.setPhone(account);
        user.setPasswordHash(request.getPassword());
        user.setAccountStatus("ACTIVE");
        clientUserMapper.insert(user);
        createDefaultUserProfile(user.getUserUid(), account);
        createDefaultCreditProfile(user.getUserUid());

        TokenPair tokenPair = issueTokenPair(user.getUserUid(), "CLIENT_USER", "CLIENT_USER_REFRESH");
        String accessToken = tokenPair.accessToken();
        String refreshToken = tokenPair.refreshToken();
        return new RegisterResponse(user.getUserUid(), null, "unverified", true, accessToken, refreshToken);
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
        log.info("[ClientAuth] send code channel={}, account={}, code={}, bizType={}", channel, account, code, bizType);

        return new SendCodeResponse(requestId, CODE_EXPIRE_SEC, CODE_RETRY_AFTER_SEC);
    }

    /** 主体登录第一步：机构代码 + 密码校验，返回 challenge。 */
    public OrganizationCredentialResponse loginOrganizationCredentials(OrganizationCredentialLoginRequest request) {
        if (isBlank(request.getInstitutionCode()) || isBlank(request.getPassword())) {
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
        assertEntityAccountActive(entity);

        String otpCode = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        String challengeId = "chl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        challengeStore.put(challengeId, new ChallengeRecord(entity.getId(), otpCode, LocalDateTime.now().plusSeconds(OTP_EXPIRE_SEC)));
        log.info("[ClientAuth] organization otp challengeId={}, otpCode={}", challengeId, otpCode);

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
        assertEntityAccountActive(entity);

        entity.setLastLoginAt(LocalDateTime.now());
        clientEntityMapper.updateById(entity);
        challengeStore.remove(request.getChallengeId());

        TokenPair tokenPair = issueTokenPair(entity.getEntityCode(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        String accessToken = tokenPair.accessToken();
        String refreshToken = tokenPair.refreshToken();
        return new LoginResponse(entity.getEntityCode(), "organization-admin", "verified", accessToken, refreshToken, ACCESS_TOKEN_EXPIRE_SEC);
    }

    /** 使用 refreshToken 换取新的 accessToken（并轮换 refreshToken）。 */
    public synchronized RefreshTokenResponse refreshAccessToken(RefreshTokenRequest request) {
        if (request == null || isBlank(request.getRefreshToken())) {
            throw new RuntimeException("REFRESH_TOKEN_REQUIRED");
        }
        if (isTokenRevoked(request.getRefreshToken())) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }
        if (!jwtUtil.validateToken(request.getRefreshToken())) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }

        String oldRefreshToken = request.getRefreshToken();
        String userType = jwtUtil.getUserType(oldRefreshToken);
        String subject = jwtUtil.getUserId(oldRefreshToken);
        if (!isClientRefreshType(userType)) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }
        if (subject == null || subject.isBlank()) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }

        String accessTokenType = mapToAccessTokenType(userType);
        String subjectKey = buildRefreshSubjectKey(subject.trim(), userType);
        String activeRefreshToken = activeRefreshTokenStore.get(subjectKey);
        if (activeRefreshToken == null || !Objects.equals(activeRefreshToken, oldRefreshToken)) {
            throw new RuntimeException("REFRESH_TOKEN_INVALID");
        }

        if ("CLIENT_USER".equals(accessTokenType)) {
            LambdaQueryWrapper<ClientUser> userWrapper = new LambdaQueryWrapper<>();
            userWrapper.eq(ClientUser::getUserUid, subject.trim()).last("LIMIT 1");
            ClientUser user = clientUserMapper.selectOne(userWrapper);
            if (user == null) {
                throw new RuntimeException("ACCOUNT_NOT_FOUND");
            }
            assertUserAccountActive(user);
        } else {
            LambdaQueryWrapper<ClientEntity> entityWrapper = new LambdaQueryWrapper<>();
            entityWrapper.eq(ClientEntity::getEntityCode, subject.trim()).last("LIMIT 1");
            ClientEntity entity = clientEntityMapper.selectOne(entityWrapper);
            if (entity == null) {
                throw new RuntimeException("CHALLENGE_NOT_FOUND");
            }
            assertEntityAccountActive(entity);
        }

        TokenPair tokenPair = issueTokenPair(subject.trim(), accessTokenType, userType);
        String newAccessToken = tokenPair.accessToken();
        String newRefreshToken = tokenPair.refreshToken();
        return new RefreshTokenResponse(newAccessToken, newRefreshToken, ACCESS_TOKEN_EXPIRE_SEC);
    }

    /** 退出登录：销毁 accessToken 与 refreshToken。 */
    public synchronized void handleLogout(HandleLogoutRequest request) {
        if (request == null || isBlank(request.getAccessToken()) || isBlank(request.getRefreshToken())) {
            throw new RuntimeException("LOGOUT_TOKENS_REQUIRED");
        }

        String accessToken = request.getAccessToken().trim();
        String refreshToken = request.getRefreshToken().trim();

        revokeToken(accessToken);
        revokeToken(refreshToken);

        if (jwtUtil.validateToken(refreshToken)) {
            String refreshType = jwtUtil.getUserType(refreshToken);
            String subject = jwtUtil.getUserId(refreshToken);
            if (isClientRefreshType(refreshType) && subject != null && !subject.isBlank()) {
                String subjectKey = buildRefreshSubjectKey(subject.trim(), refreshType);
                String currentActiveRefresh = activeRefreshTokenStore.get(subjectKey);
                if (Objects.equals(currentActiveRefresh, refreshToken)) {
                    activeRefreshTokenStore.remove(subjectKey);
                }
            }
        }
    }

    private LoginResponse buildPersonalLoginResponse(ClientUser user) {
        assertUserAccountActive(user);
        user.setLastLoginAt(LocalDateTime.now());
        clientUserMapper.updateById(user);

        AuthMeta authMeta = resolveUserAuthMeta(user.getUserUid());
        TokenPair tokenPair = issueTokenPair(user.getUserUid(), "CLIENT_USER", "CLIENT_USER_REFRESH");
        String accessToken = tokenPair.accessToken();
        String refreshToken = tokenPair.refreshToken();
        return new LoginResponse(user.getUserUid(), authMeta.userRole, authMeta.authStatus, accessToken, refreshToken, ACCESS_TOKEN_EXPIRE_SEC);
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

    private AuthMeta resolveUserAuthMeta(String userUid) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getUserUid, userUid)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        UserAuthLink link = userAuthLinkMapper.selectOne(wrapper);
        if (link == null) {
            return new AuthMeta("student", "unverified");
        }

        String authStatus = "APPROVED".equalsIgnoreCase(link.getAuditStatus()) ? "verified" : "unverified";
        String userRole = mapBusinessRole(link.getRole());
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

    private void createDefaultUserProfile(String userUid, String phone) {
        String suffix = phone.substring(phone.length() - 4);
        ClientUserProfile profile = new ClientUserProfile();
        profile.setUserUid(userUid);
        profile.setAvatarUrl(DEFAULT_AVATAR_URL);
        profile.setNickName("用户#" + suffix);
        clientUserProfileMapper.insert(profile);
    }

    /** 注册时初始化信用主档，并写入 REGISTER 流水。 */
    private void createDefaultCreditProfile(String userUid) {
        LocalDateTime now = LocalDateTime.now();

        SysCreditProfile profile = new SysCreditProfile();
        profile.setUserUid(userUid);
        profile.setCreditScore(DEFAULT_CREDIT_SCORE);
        profile.setAccountStatus("ACTIVE");
        profile.setLastChangedAt(now);
        sysCreditProfileMapper.insert(profile);

        SysCreditLog creditLog = new SysCreditLog();
        creditLog.setUserUid(userUid);
        creditLog.setChangeAmount(DEFAULT_CREDIT_SCORE);
        creditLog.setScoreBefore(0);
        creditLog.setScoreAfter(DEFAULT_CREDIT_SCORE);
        creditLog.setBizType(CREDIT_BIZ_REGISTER);
        creditLog.setOperatorKey(CREDIT_OPERATOR_SYSTEM);
        creditLog.setRemark("注册初始化信用分");
        sysCreditLogMapper.insert(creditLog);
    }

    private boolean isUserUidUnique(String userUid) {
        LambdaQueryWrapper<ClientUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUser::getUserUid, userUid);
        return clientUserMapper.selectCount(wrapper) == 0;
    }

    private void assertUserAccountActive(ClientUser user) {
        String status = user.getAccountStatus() == null ? "ACTIVE" : user.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(status)) {
            throw new RuntimeException("ACCOUNT_FROZEN");
        }
        if ("DEACTIVATED".equals(status)) {
            throw new RuntimeException("ACCOUNT_DEACTIVATED");
        }
        if (!"ACTIVE".equals(status)) {
            throw new RuntimeException("ACCOUNT_DISABLED");
        }
    }

    private void assertEntityAccountActive(ClientEntity entity) {
        String status = entity.getAccountStatus() == null ? "ACTIVE" : entity.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_FROZEN");
        }
        if ("DEACTIVATED".equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DEACTIVATED");
        }
        if (!"ACTIVE".equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DISABLED");
        }
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

    private String generateAccessToken(String subject, String userType) {
        return jwtUtil.generateToken(subject, userType, 0);
    }

    private String generateRefreshToken(String subject, String userType) {
        return jwtUtil.generateToken(subject, userType, 0, REFRESH_TOKEN_EXPIRE_MS);
    }

    /**
     * 刷新 token 采用一次性设计：
     * 每次签发新 refreshToken 都会覆盖旧值，旧 token 立刻失效。
     */
    private TokenPair issueTokenPair(String subject, String accessTokenType, String refreshTokenType) {
        String accessToken = generateAccessToken(subject, accessTokenType);
        String refreshToken = generateRefreshToken(subject, refreshTokenType);
        activeRefreshTokenStore.put(buildRefreshSubjectKey(subject, refreshTokenType), refreshToken);
        return new TokenPair(accessToken, refreshToken);
    }

    private String buildRefreshSubjectKey(String subject, String refreshTokenType) {
        return subject + "|" + refreshTokenType;
    }

    private boolean isClientRefreshType(String userType) {
        return "CLIENT_USER_REFRESH".equals(userType) || "CLIENT_ORG_REFRESH".equals(userType);
    }

    private String mapToAccessTokenType(String refreshType) {
        return "CLIENT_ORG_REFRESH".equals(refreshType) ? "CLIENT_ORG" : "CLIENT_USER";
    }

    private void revokeToken(String token) {
        try {
            Claims claims = jwtUtil.parseToken(token);
            LocalDateTime expireAt = LocalDateTime.ofInstant(claims.getExpiration().toInstant(), java.time.ZoneId.systemDefault());
            revokedTokenStore.put(token, expireAt);
        } catch (Exception ignored) {
            revokedTokenStore.put(token, LocalDateTime.now().plusMinutes(30));
        }
    }

    private boolean isTokenRevoked(String token) {
        LocalDateTime expireAt = revokedTokenStore.get(token);
        if (expireAt == null) {
            return false;
        }
        if (expireAt.isBefore(LocalDateTime.now())) {
            revokedTokenStore.remove(token);
            return false;
        }
        return true;
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
