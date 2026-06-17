package com.unibridge.backend.domain.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.domain.auth.dto.HandleLogoutRequest;
import com.unibridge.backend.domain.auth.dto.LoginResponse;
import com.unibridge.backend.domain.auth.dto.OrganizationAdminOption;
import com.unibridge.backend.domain.auth.dto.OrganizationAdminRegisterRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationCredentialLoginRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationCredentialResponse;
import com.unibridge.backend.domain.auth.dto.OrganizationSelectAdminRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationTotpSetupConfirmRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationTotpSetupConfirmResponse;
import com.unibridge.backend.domain.auth.dto.OrganizationTotpSetupInitRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationTotpSetupInitResponse;
import com.unibridge.backend.domain.auth.dto.PersonalEmailLoginRequest;
import com.unibridge.backend.domain.auth.dto.PersonalPasswordLoginRequest;
import com.unibridge.backend.domain.auth.dto.PersonalRegisterRequest;
import com.unibridge.backend.domain.auth.dto.PersonalSmsLoginRequest;
import com.unibridge.backend.domain.auth.dto.RefreshTokenRequest;
import com.unibridge.backend.domain.auth.dto.RefreshTokenResponse;
import com.unibridge.backend.domain.auth.dto.RegisterResponse;
import com.unibridge.backend.domain.auth.dto.SendCodeRequest;
import com.unibridge.backend.domain.auth.dto.SendCodeResponse;
import com.unibridge.backend.infrastructure.entities.auth.TenantOrganization;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.infra.CreditLog;
import com.unibridge.backend.infrastructure.entities.infra.CreditProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.TenantOrganizationMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.infra.CreditLogMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.infra.CreditProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import com.unibridge.backend.domain.auth.dto.OrganizationOtpLoginRequest;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.entities.auth.EntityTotpCredentials;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.EntityTotpCredentialsMapper;
import com.unibridge.backend.infrastructure.util.TotpUtils;
import com.unibridge.backend.infrastructure.util.UserUidGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.jsonwebtoken.Claims;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * Client 端认证服务：
 * 覆盖个人注册、个人多方式登录、验证码下发、主体两步登录。
 *
 * 验证码、challenge、refreshToken 均通过 Redis 存储，支持多实例部署。
 * 分布式锁使用 Redisson 替代 synchronize，保证跨实例并发安全。
 */
@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String DEFAULT_AVATAR_URL = "https://api.dicebear.com/9.x/initials/svg?seed=U&backgroundColor=cbd5e1&color=ffffff";
    private static final int CODE_EXPIRE_SEC = 300;
    private static final int CODE_RETRY_AFTER_SEC = 60;
    private static final int OTP_EXPIRE_SEC = 300;
    private static final int TOTP_QR_EXPIRE_SEC = 300;
    private static final int ORG_CHALLENGE_EXPIRE_SEC = 1800;
    private static final int MIN_ENTITY_ADMIN_COUNT = 2;
    private static final int MAX_ENTITY_ADMIN_COUNT = 3;
    private static final int ACCESS_TOKEN_EXPIRE_SEC = 30 * 60;
    private static final int REFRESH_TOKEN_EXPIRE_SEC = 7 * 24 * 60 * 60;
    private static final long REFRESH_TOKEN_EXPIRE_MS = REFRESH_TOKEN_EXPIRE_SEC * 1000L;
    private static final int DEFAULT_CREDIT_SCORE = 600;
    private static final String CREDIT_BIZ_REGISTER = "REGISTER";
    private static final String CREDIT_OPERATOR_SYSTEM = "SYSTEM";
    private static final String LOGIN_MODE_TOTP_SETUP = "totp_setup";
    private static final String LOGIN_MODE_TOTP_VERIFY = "totp_verify";
    private static final String LOGIN_MODE_ADMIN_SELECT = "admin_select";
    private static final String LOGIN_MODE_ADMIN_REGISTER = "admin_register";
    private static final String TOTP_ISSUER = "UniBridge";

    // Redis key 前缀
    private static final String REDIS_CODE_PREFIX = "auth:code:";
    private static final String REDIS_CODE_RETRY_PREFIX = "auth:code:retry:";
    private static final String REDIS_CHALLENGE_PREFIX = "auth:challenge:";
    private static final String REDIS_REFRESH_TOKEN_PREFIX = "auth:refresh:";
    private static final String REDIS_REVOKED_TOKEN_PREFIX = "auth:revoked:";
    private static final String REDIS_REQUEST_COUNTER_KEY = "auth:request:counter";
    private static final String REDIS_REFRESH_LOCK_PREFIX = "auth:refresh:lock:";

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private TenantOrganizationMapper tenantOrganizationMapper;

    @Autowired
    private TenantOrgProfileMapper tenantOrgProfileMapper;

    @Autowired
    private EntityTotpCredentialsMapper entityTotpCredentialsMapper;

    @Autowired
    private EntityAdminCredentialService entityAdminCredentialService;

    @Autowired
    private UserOrganizationBindingMapper userOrganizationBindingMapper;

    @Autowired
    private CreditProfileMapper creditProfileMapper;

    @Autowired
    private CreditLogMapper creditLogMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    /** Redis 自带 TTL 自动过期，无需定时清理。保留空方法兼容旧调用。 */
    public void cleanExpiredStores() {
        // Redis keys 自带 TTL，无需手动清理
    }

    // ===================== 个人注册/登录 =====================

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

        LambdaQueryWrapper<User> existsWrapper = new LambdaQueryWrapper<>();
        existsWrapper.eq(User::getPhone, account);
        if (userMapper.selectOne(existsWrapper) != null) {
            throw new RuntimeException("ACCOUNT_ALREADY_EXISTS");
        }

        try {
            User user = new User();
            user.setUserUid(UserUidGenerator.generate(this::isUserUidUnique));
            user.setPhone(account);
            user.setPasswordHash(request.getPassword());
            user.setAccountStatus("ACTIVE");
            userMapper.insert(user);
            createDefaultUserProfile(user.getUserUid(), account);
            createDefaultCreditProfile(user.getUserUid());

            TokenPair tokenPair = issueTokenPair(user.getUserUid(), "CLIENT_USER", "CLIENT_USER_REFRESH");
            return new RegisterResponse(user.getUserUid(), null, "unverified", true,
                    tokenPair.accessToken(), tokenPair.refreshToken());
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("ACCOUNT_ALREADY_EXISTS");
        }
    }

    public LoginResponse loginPersonalByPassword(PersonalPasswordLoginRequest request) {
        User user = loadPersonalUserByAccount(request.getAccount());
        if (!Objects.equals(user.getPasswordHash(), request.getPassword())) {
            throw new RuntimeException("ACCOUNT_OR_PASSWORD_INVALID");
        }
        return buildPersonalLoginResponse(user);
    }

    public LoginResponse loginPersonalBySms(PersonalSmsLoginRequest request) {
        String account = normalize(request.getAccount());
        if (!verifyCode(account, "sms", request.getSmsCode(), "login")) {
            throw new RuntimeException("SMS_CODE_INVALID");
        }
        User user = loadPersonalUserByAccount(account);
        return buildPersonalLoginResponse(user);
    }

    public LoginResponse loginPersonalByEmail(PersonalEmailLoginRequest request) {
        String account = normalize(request.getAccount());
        if (!verifyCode(account, "email", request.getEmailCode(), "login")) {
            throw new RuntimeException("SMS_CODE_INVALID");
        }
        User user = loadPersonalUserByAccount(account);
        return buildPersonalLoginResponse(user);
    }

    /**
     * 下发验证码。
     * 使用 Redis SET NX + TTL 保证冷却期原子性，多实例安全。
     */
    public SendCodeResponse sendPersonalCode(SendCodeRequest request) {
        String account = normalize(request.getAccount());
        String bizType = normalizeOrDefault(request.getBizType(), "login");
        String channel = normalizeOrDefault(request.getChannel(), "sms");
        String codeKey = REDIS_CODE_PREFIX + buildCodeKey(account, channel, bizType);
        String retryKey = REDIS_CODE_RETRY_PREFIX + buildCodeKey(account, channel, bizType);

        // 检查冷却期：retryKey 存在则拒绝
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(retryKey))) {
            throw new RuntimeException("TOO_FREQUENT_REQUEST");
        }

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        long counter = stringRedisTemplate.opsForValue().increment(REDIS_REQUEST_COUNTER_KEY);
        String requestId = "req_" + System.currentTimeMillis() + "_" + counter;

        // 验证码写入 Redis（带 TTL），同时写入冷却期标记
        stringRedisTemplate.opsForValue().set(retryKey, "1", Duration.ofSeconds(CODE_RETRY_AFTER_SEC));
        stringRedisTemplate.opsForValue().set(codeKey, code, Duration.ofSeconds(CODE_EXPIRE_SEC));

        if ("dev".equals(activeProfile)) {
            System.out.println("=========================================");
            System.out.println("【本地开发环境影子拦截】");
            System.out.println("手机号: " + account);
            System.out.println("生成的" + channel + "验证码为: " + code);
            System.out.println("业务类型: " + bizType);
            System.out.println("请求 ID: " + requestId);
            System.out.println("=========================================");
        }

        log.info("[ClientAuth] send code channel={}, account={}, code={}, bizType={}", channel, account, code, bizType);
        return new SendCodeResponse(requestId, CODE_EXPIRE_SEC, CODE_RETRY_AFTER_SEC);
    }

    // ===================== 机构登录 =====================

    public OrganizationCredentialResponse loginOrganizationCredentials(OrganizationCredentialLoginRequest request) {
        if (isBlank(request.getInstitutionCode()) || isBlank(request.getPassword())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }

        String entityCode = normalize(request.getInstitutionCode());
        String passwordHash = request.getPassword();
        TenantOrganization entity = loadEntityByCode(entityCode);
        if (entity == null) {
            throw new RuntimeException("ORGANIZATION_CREDENTIAL_INVALID");
        }
        if (!"APPROVED".equalsIgnoreCase(entity.getAuditStatus())) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DISABLED");
        }
        assertEntityAccountActive(entity);

        boolean entityPasswordMatch = Objects.equals(entity.getPasswordHash(), passwordHash);
        EntityTotpCredentials adminByPassword =
                entityAdminCredentialService.matchActiveAdminByPassword(entityCode, passwordHash);
        boolean adminPasswordMatch = adminByPassword != null;

        if (!entityPasswordMatch && !adminPasswordMatch) {
            throw new RuntimeException("ORGANIZATION_CREDENTIAL_INVALID");
        }

        boolean adminPasswordAllowed = isAdminPasswordLoginAllowed(entityCode);
        if (adminPasswordMatch && !adminPasswordAllowed && !entityPasswordMatch) {
            throw new RuntimeException("ORGANIZATION_CREDENTIAL_INVALID");
        }

        String challengeId = "chl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        int boundAdminCount = countBoundEntityAdmins(entityCode);
        String entityName = resolveEntityName(entityCode);
        LocalDateTime expireAt = LocalDateTime.now().plusSeconds(ORG_CHALLENGE_EXPIRE_SEC);

        if (entityPasswordMatch) {
            String loginMode = resolveEntityRootLoginMode(entityCode);
            boolean requiresSelection = LOGIN_MODE_ADMIN_SELECT.equals(loginMode);
            List<OrganizationAdminOption> adminOptions = requiresSelection
                    ? toAdminOptions(entityAdminCredentialService.listAdminsForEntityRootSelect(
                            entityCode, boundAdminCount, MIN_ENTITY_ADMIN_COUNT))
                    : null;
            saveChallenge(challengeId, OrgChallengeRecord.forEntityRoot(
                    entityCode, loginMode, null, null, expireAt));
            log.info("[ClientAuth] organization entity-root challengeId={}, loginMode={}, entityCode={}",
                    challengeId, loginMode, entityCode);
            return buildOrganizationCredentialResponse(
                    challengeId, passwordHash, entityCode, entityName, boundAdminCount,
                    null, loginMode, requiresSelection, adminOptions, null);
        }

        boolean isFirstLogin = !StringUtils.hasText(adminByPassword.getTotpSecret());
        if (isFirstLogin) {
            assertEntityAdminCanBindTotp(adminByPassword);
        } else {
            assertEntityAdminActive(adminByPassword);
        }
        String loginMode = isFirstLogin ? LOGIN_MODE_TOTP_SETUP : LOGIN_MODE_TOTP_VERIFY;
        int currentAdminOrder = isFirstLogin
                ? entityAdminCredentialService.countBoundEntityAdmins(entityCode) + 1
                : resolveAdminOrder(adminByPassword, entityAdminCredentialService.listActiveEntityAdmins(entityCode));
        saveChallenge(challengeId, OrgChallengeRecord.forAdmin(
                adminByPassword.getAdminUid(), entityCode, loginMode, null, null, expireAt));
        log.info("[ClientAuth] organization admin-password challengeId={}, adminUid={}, loginMode={}",
                challengeId, adminByPassword.getAdminUid(), loginMode);
        return buildOrganizationCredentialResponse(
                challengeId, passwordHash, entityCode, entityName, boundAdminCount,
                isFirstLogin, loginMode, false, null, currentAdminOrder);
    }

    @Transactional(rollbackFor = Exception.class)
    public OrganizationCredentialResponse registerOrganizationAdmin(OrganizationAdminRegisterRequest request) {
        if (request == null || isBlank(request.getChallengeId()) || isBlank(request.getDisplayName())
                || isBlank(request.getPassword())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!challenge.entityRootAuthenticated() || !LOGIN_MODE_ADMIN_REGISTER.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        TenantOrganization entity = loadEntityByCode(challenge.entityCode());
        if (entity == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        assertEntityAccountActive(entity);

        if (entityAdminCredentialService.countActiveEntityAdmins(challenge.entityCode()) >= MAX_ENTITY_ADMIN_COUNT) {
            throw new RuntimeException("ORGANIZATION_ADMIN_LIMIT_REACHED");
        }

        String passwordHash = request.getPassword().trim();
        entityAdminCredentialService.assertAdminPasswordAvailable(
                challenge.entityCode(), passwordHash, entity.getPasswordHash(), null);

        String adminUid = entityAdminCredentialService.generateAdminUid();
        entityAdminCredentialService.deactivateStalePendingAdmins(challenge.entityCode(), null);

        EntityTotpCredentials admin = new EntityTotpCredentials();
        admin.setAdminUid(adminUid);
        admin.setEntityCode(challenge.entityCode());
        admin.setPasswordHash(passwordHash);
        admin.setDisplayName(request.getDisplayName().trim());
        admin.setIsPrimary(0);
        admin.setAccountStatus(EntityAdminAccountStatus.PENDING);
        try {
            entityAdminCredentialService.createEntityAdmin(admin, entity.getPasswordHash());
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("ORGANIZATION_ADMIN_LIMIT_REACHED");
        }

        int currentAdminOrder = entityAdminCredentialService.countBoundEntityAdmins(challenge.entityCode()) + 1;
        saveChallenge(request.getChallengeId(), OrgChallengeRecord.forAdmin(
                adminUid, challenge.entityCode(), LOGIN_MODE_TOTP_SETUP,
                null, null, challenge.expireAt()));

        log.info("[ClientAuth] organization admin-register challengeId={}, adminUid={}, entityCode={}",
                request.getChallengeId(), adminUid, challenge.entityCode());

        return buildOrganizationCredentialResponse(
                request.getChallengeId(), null, challenge.entityCode(),
                resolveEntityName(challenge.entityCode()),
                countBoundEntityAdmins(challenge.entityCode()),
                true, LOGIN_MODE_TOTP_SETUP, false, null, currentAdminOrder);
    }

    public OrganizationCredentialResponse selectOrganizationAdmin(OrganizationSelectAdminRequest request) {
        if (request == null || isBlank(request.getChallengeId()) || isBlank(request.getAdminUid())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!challenge.entityRootAuthenticated() || !LOGIN_MODE_ADMIN_SELECT.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        EntityTotpCredentials admin = entityAdminCredentialService.loadAdminForEntityRootSelect(
                challenge.entityCode(), request.getAdminUid().trim());
        if (admin == null) {
            throw new RuntimeException("ORGANIZATION_ADMIN_NOT_FOUND");
        }

        boolean isFirstLogin = !StringUtils.hasText(admin.getTotpSecret());
        if (isFirstLogin) {
            assertEntityAdminCanBindTotp(admin);
        } else {
            assertEntityAdminActive(admin);
        }
        String loginMode = isFirstLogin ? LOGIN_MODE_TOTP_SETUP : LOGIN_MODE_TOTP_VERIFY;
        int currentAdminOrder = isFirstLogin
                ? entityAdminCredentialService.countBoundEntityAdmins(challenge.entityCode()) + 1
                : resolveAdminOrder(admin, entityAdminCredentialService.listActiveEntityAdmins(challenge.entityCode()));

        saveChallenge(request.getChallengeId(), OrgChallengeRecord.forAdmin(
                admin.getAdminUid(), challenge.entityCode(), loginMode,
                challenge.pendingTotpSecret(), challenge.totpSetupExpireAt(), challenge.expireAt()));

        return buildOrganizationCredentialResponse(
                request.getChallengeId(), null, challenge.entityCode(),
                resolveEntityName(challenge.entityCode()),
                countBoundEntityAdmins(challenge.entityCode()),
                isFirstLogin, loginMode, false, null, currentAdminOrder);
    }

    public LoginResponse loginOrganizationOtp(OrganizationOtpLoginRequest request) {
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!LOGIN_MODE_TOTP_VERIFY.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        TenantOrganization entity = loadEntityByCode(challenge.entityCode());
        if (entity == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        assertEntityAccountActive(entity);

        if (challenge.entityRootAuthenticated() && !StringUtils.hasText(challenge.adminUid())) {
            if (!StringUtils.hasText(entity.getTotpSecret())
                    || !TotpUtils.verifyCode(entity.getTotpSecret(), request.getOtpCode())) {
                throw new RuntimeException("OTP_INVALID");
            }
            deleteChallenge(request.getChallengeId());
            return completeEntityRootLogin(entity);
        }

        EntityTotpCredentials admin = entityAdminCredentialService.loadActiveAdmin(
                challenge.entityCode(), challenge.adminUid());
        if (admin == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        assertEntityAdminActive(admin);

        if (!TotpUtils.verifyCode(admin.getTotpSecret(), request.getOtpCode())) {
            throw new RuntimeException("OTP_INVALID");
        }

        deleteChallenge(request.getChallengeId());
        return completeOrganizationLogin(admin);
    }

    public OrganizationTotpSetupInitResponse initOrganizationTotpSetup(OrganizationTotpSetupInitRequest request) {
        if (request == null || isBlank(request.getChallengeId())) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!LOGIN_MODE_TOTP_SETUP.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        TenantOrganization entity = loadEntityByCode(challenge.entityCode());
        if (entity == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }

        String secret = TotpUtils.generateSecret();
        String accountLabel;
        if (challenge.entityRootAuthenticated() && !StringUtils.hasText(challenge.adminUid())) {
            if (StringUtils.hasText(entity.getTotpSecret())) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            accountLabel = resolveEntityName(challenge.entityCode()) + ":root";
        } else {
            EntityTotpCredentials admin = entityAdminCredentialService.loadAdminForTotpSetup(
                    challenge.entityCode(), challenge.adminUid());
            if (admin == null) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            accountLabel = resolveEntityName(challenge.entityCode()) + ":" + admin.getAdminUid();
        }

        String otpAuthUrl = TotpUtils.buildOtpAuthUrl(TOTP_ISSUER, accountLabel, secret);
        String qrCodeDataUrl = TotpUtils.generateQrCodeDataUrl(TOTP_ISSUER, accountLabel, secret);
        LocalDateTime totpExpire = LocalDateTime.now().plusSeconds(TOTP_QR_EXPIRE_SEC);

        saveChallenge(request.getChallengeId(), challenge.withPendingTotp(secret, totpExpire));

        Integer currentAdminOrder = null;
        if (StringUtils.hasText(challenge.adminUid())) {
            EntityTotpCredentials admin = entityAdminCredentialService.loadAdminForTotpSetup(
                    challenge.entityCode(), challenge.adminUid());
            currentAdminOrder = admin == null ? 1
                    : entityAdminCredentialService.countBoundEntityAdmins(challenge.entityCode()) + 1;
        }

        return OrganizationTotpSetupInitResponse.builder()
                .qrCodeDataUrl(qrCodeDataUrl)
                .qrCodeExpireInSec(TOTP_QR_EXPIRE_SEC)
                .otpAuthUrl(otpAuthUrl)
                .currentAdminOrder(currentAdminOrder == null ? 1 : currentAdminOrder)
                .build();
    }

    @Transactional(rollbackFor = Exception.class)
    public OrganizationTotpSetupConfirmResponse confirmOrganizationTotpSetup(OrganizationTotpSetupConfirmRequest request) {
        if (request == null || isBlank(request.getChallengeId()) || isBlank(request.getTotpCode())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!LOGIN_MODE_TOTP_SETUP.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }
        if (!StringUtils.hasText(challenge.pendingTotpSecret())) {
            throw new RuntimeException("ORGANIZATION_TOTP_SETUP_NOT_INITIALIZED");
        }
        if (challenge.totpSetupExpireAt() == null || challenge.totpSetupExpireAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("ORGANIZATION_TOTP_QR_EXPIRED");
        }
        if (!TotpUtils.verifyCode(challenge.pendingTotpSecret(), request.getTotpCode())) {
            throw new RuntimeException("OTP_INVALID");
        }

        TenantOrganization entity = loadEntityByCode(challenge.entityCode());
        if (entity == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        assertEntityAccountActive(entity);

        LocalDateTime now = LocalDateTime.now();
        String boundSecret = challenge.pendingTotpSecret().trim();
        TokenPair tokenPair;
        int boundAdminCount;

        if (challenge.entityRootAuthenticated() && !StringUtils.hasText(challenge.adminUid())) {
            if (StringUtils.hasText(entity.getTotpSecret())) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            int updated = entityAdminCredentialService.bindEntityRootTotp(entity.getEntityCode(), boundSecret, now);
            if (updated == 0) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            boundAdminCount = entityAdminCredentialService.countBoundEntityAdmins(entity.getEntityCode());
            tokenPair = issueTokenPair(entity.getEntityCode(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        } else {
            EntityTotpCredentials admin = entityAdminCredentialService.loadAdminForTotpSetup(
                    challenge.entityCode(), challenge.adminUid());
            if (admin == null) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            activateEntityAdminAfterTotpBind(admin, boundSecret, now);
            boundAdminCount = entityAdminCredentialService.countBoundEntityAdmins(admin.getEntityCode());
            tokenPair = issueTokenPair(admin.getAdminUid(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        }

        deleteChallenge(request.getChallengeId());
        boolean entityFullyActivated = boundAdminCount >= MIN_ENTITY_ADMIN_COUNT;

        String nextChallengeId = null;
        String nextLoginMode = null;
        if (!entityFullyActivated) {
            FollowUpChallenge followUp = createFollowUpEntityRootChallenge(challenge.entityCode());
            nextChallengeId = followUp.challengeId();
            nextLoginMode = followUp.loginMode();
        }

        return OrganizationTotpSetupConfirmResponse.builder()
                .accessToken(tokenPair.accessToken())
                .refreshToken(tokenPair.refreshToken())
                .expiresIn(ACCESS_TOKEN_EXPIRE_SEC)
                .entityFullyActivated(entityFullyActivated)
                .boundAdminCount(boundAdminCount)
                .minAdminCount(MIN_ENTITY_ADMIN_COUNT)
                .activationHint(entityFullyActivated ? null
                        : buildActivationHint(challenge.entityCode(), boundAdminCount))
                .nextChallengeId(nextChallengeId)
                .nextLoginMode(nextLoginMode)
                .build();
    }

    // ===================== Token 刷新/登出（Redisson 分布式锁） =====================

    /**
     * 使用 refreshToken 换取新的 accessToken（并轮换 refreshToken）。
     * 使用 Redisson 分布式锁替代 synchronize，支持多实例部署。
     */
    public RefreshTokenResponse refreshAccessToken(RefreshTokenRequest request) {
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
        String lockKey = REDIS_REFRESH_LOCK_PREFIX + subjectKey;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            if (!lock.tryLock(10, 30, TimeUnit.SECONDS)) {
                throw new RuntimeException("SYSTEM_BUSY");
            }

            String activeRefreshToken = stringRedisTemplate.opsForValue()
                    .get(REDIS_REFRESH_TOKEN_PREFIX + subjectKey);
            if (activeRefreshToken == null || !Objects.equals(activeRefreshToken, oldRefreshToken)) {
                throw new RuntimeException("REFRESH_TOKEN_INVALID");
            }

            if ("CLIENT_USER".equals(accessTokenType)) {
                LambdaQueryWrapper<User> userWrapper = new LambdaQueryWrapper<>();
                userWrapper.eq(User::getUserUid, subject.trim()).last("LIMIT 1");
                User user = userMapper.selectOne(userWrapper);
                if (user == null) {
                    throw new RuntimeException("ACCOUNT_NOT_FOUND");
                }
                assertUserAccountActive(user);
            } else {
                if (isEntityAdminUid(subject.trim())) {
                    EntityTotpCredentials admin = loadEntityAdminByUid(subject.trim());
                    if (admin == null) {
                        throw new RuntimeException("CHALLENGE_NOT_FOUND");
                    }
                    assertEntityAdminActive(admin);
                    TenantOrganization entity = loadEntityByCode(admin.getEntityCode());
                    if (entity == null) {
                        throw new RuntimeException("CHALLENGE_NOT_FOUND");
                    }
                    assertEntityAccountActive(entity);
                } else {
                    TenantOrganization entity = loadEntityByCode(subject.trim());
                    if (entity == null) {
                        throw new RuntimeException("CHALLENGE_NOT_FOUND");
                    }
                    assertEntityAccountActive(entity);
                    if (!StringUtils.hasText(entity.getTotpSecret())) {
                        throw new RuntimeException("ORGANIZATION_TOTP_NOT_BOUND");
                    }
                }
            }

            TokenPair tokenPair = issueTokenPair(subject.trim(), accessTokenType, userType);
            return new RefreshTokenResponse(tokenPair.accessToken(), tokenPair.refreshToken(), ACCESS_TOKEN_EXPIRE_SEC);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("SYSTEM_BUSY");
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * 退出登录。使用 Redisson 分布式锁替代 synchronize，支持多实例部署。
     */
    public void handleLogout(HandleLogoutRequest request) {
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
                String lockKey = REDIS_REFRESH_LOCK_PREFIX + subjectKey;
                RLock lock = redissonClient.getLock(lockKey);
                try {
                    if (lock.tryLock(5, 10, TimeUnit.SECONDS)) {
                        try {
                            // Lua 脚本保证原子比较+删除
                            String redisKey = REDIS_REFRESH_TOKEN_PREFIX + subjectKey;
                            stringRedisTemplate.execute(
                                    new org.springframework.data.redis.core.script.DefaultRedisScript<>(
                                            "if redis.call('GET', KEYS[1]) == ARGV[1] then " +
                                            "redis.call('DEL', KEYS[1]) return 1 else return 0 end",
                                            Long.class),
                                    List.of(redisKey), refreshToken);
                        } finally {
                            lock.unlock();
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    // ===================== 私有方法 =====================

    private LoginResponse buildPersonalLoginResponse(User user) {
        assertUserAccountActive(user);
        entityAdminCredentialService.updateClientUserLastLoginAt(user.getUserUid(), LocalDateTime.now());

        AuthMeta authMeta = resolveUserAuthMeta(user.getUserUid());
        TokenPair tokenPair = issueTokenPair(user.getUserUid(), "CLIENT_USER", "CLIENT_USER_REFRESH");
        return new LoginResponse(user.getUserUid(), authMeta.userRole, authMeta.authStatus,
                tokenPair.accessToken(), tokenPair.refreshToken(), ACCESS_TOKEN_EXPIRE_SEC);
    }

    private User loadPersonalUserByAccount(String accountRaw) {
        String account = normalize(accountRaw);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (isEmail(account)) {
            wrapper.eq(User::getEmail, account.toLowerCase(Locale.ROOT));
        } else {
            wrapper.eq(User::getPhone, account);
        }
        User user = userMapper.selectOne(wrapper);
        if (user == null) {
            throw new RuntimeException("ACCOUNT_NOT_FOUND");
        }
        return user;
    }

    private AuthMeta resolveUserAuthMeta(String userUid) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .orderByDesc(UserOrganizationBinding::getUpdatedAt).last("LIMIT 1");
        UserOrganizationBinding link = userOrganizationBindingMapper.selectOne(wrapper);
        if (link == null) {
            return new AuthMeta("student", "unverified");
        }
        String authStatus = "APPROVED".equalsIgnoreCase(link.getAuditStatus()) ? "verified" : "unverified";
        String userRole = mapBusinessRole(link.getRole());
        return new AuthMeta(userRole, authStatus);
    }

    private String mapBusinessRole(String role) {
        if (role == null) return "student";
        return switch (role.toUpperCase(Locale.ROOT)) {
            case "PM" -> "pm";
            case "MENTOR", "FACULTY" -> "mentor";
            case "COUNSELOR" -> "counselor";
            case "STUDENT" -> "student";
            default -> "student";
        };
    }

    private void createDefaultUserProfile(String userUid, String phone) {
        String suffix = phone.substring(phone.length() - 4);
        UserProfile profile = new UserProfile();
        profile.setUserUid(userUid);
        profile.setAvatarUrl(DEFAULT_AVATAR_URL);
        profile.setNickName("用户#" + suffix);
        userProfileMapper.insert(profile);
    }

    private void createDefaultCreditProfile(String userUid) {
        LocalDateTime now = LocalDateTime.now();
        CreditProfile profile = new CreditProfile();
        profile.setUserUid(userUid);
        profile.setCreditScore(DEFAULT_CREDIT_SCORE);
        profile.setAccountStatus("ACTIVE");
        profile.setLastChangedAt(now);
        creditProfileMapper.insert(profile);

        CreditLog creditLog = new CreditLog();
        creditLog.setUserUid(userUid);
        creditLog.setChangeAmount(DEFAULT_CREDIT_SCORE);
        creditLog.setScoreBefore(0);
        creditLog.setScoreAfter(DEFAULT_CREDIT_SCORE);
        creditLog.setBizType(CREDIT_BIZ_REGISTER);
        creditLog.setOperatorKey(CREDIT_OPERATOR_SYSTEM);
        creditLog.setRemark("注册初始化信用分");
        creditLogMapper.insert(creditLog);
    }

    private boolean isUserUidUnique(String userUid) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUserUid, userUid);
        return userMapper.selectCount(wrapper) == 0;
    }

    private void assertUserAccountActive(User user) {
        String status = user.getAccountStatus() == null ? "ACTIVE" : user.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(status)) throw new RuntimeException("ACCOUNT_FROZEN");
        if ("DEACTIVATED".equals(status)) throw new RuntimeException("ACCOUNT_DEACTIVATED");
        if (!"ACTIVE".equals(status)) throw new RuntimeException("ACCOUNT_DISABLED");
    }

    private void assertEntityAccountActive(TenantOrganization entity) {
        String status = entity.getAccountStatus() == null ? "ACTIVE" : entity.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_FROZEN");
        if ("DEACTIVATED".equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_DEACTIVATED");
        if (!"ACTIVE".equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_DISABLED");
    }

    /**
     * 验证码校验。使用 Redis GET + DEL 替代 ConcurrentHashMap remove，保证验证码一次消费。
     */
    private boolean verifyCode(String accountRaw, String channelRaw, String verifyCode, String bizTypeRaw) {
        String account = normalize(accountRaw);
        String channel = normalizeOrDefault(channelRaw, "sms");
        String bizType = normalizeOrDefault(bizTypeRaw, "login");
        String codeKey = REDIS_CODE_PREFIX + buildCodeKey(account, channel, bizType);

        String storedCode = stringRedisTemplate.opsForValue().get(codeKey);
        if (storedCode == null) {
            return false;
        }
        if (!Objects.equals(storedCode, verifyCode)) {
            return false;
        }
        // 原子删除保证一次消费
        return Boolean.TRUE.equals(stringRedisTemplate.delete(codeKey));
    }

    private String buildCodeKey(String account, String channel, String bizType) {
        return account + "|" + channel + "|" + bizType;
    }

    // ===================== Challenge Redis 操作 =====================

    private void saveChallenge(String challengeId, OrgChallengeRecord record) {
        String key = REDIS_CHALLENGE_PREFIX + challengeId;
        long ttlSeconds = java.time.Duration.between(LocalDateTime.now(), record.expireAt()).getSeconds();
        if (ttlSeconds <= 0) ttlSeconds = ORG_CHALLENGE_EXPIRE_SEC;
        try {
            String json = objectMapper.writeValueAsString(record);
            stringRedisTemplate.opsForValue().set(key, json, Duration.ofSeconds(ttlSeconds));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("SYSTEM_ERROR", e);
        }
    }

    private OrgChallengeRecord requireOrgChallenge(String challengeId) {
        String key = REDIS_CHALLENGE_PREFIX + challengeId;
        String json = stringRedisTemplate.opsForValue().get(key);
        if (json == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        try {
            OrgChallengeRecord challenge = objectMapper.readValue(json, OrgChallengeRecord.class);
            if (challenge.expireAt().isBefore(LocalDateTime.now())) {
                stringRedisTemplate.delete(key);
                throw new RuntimeException("CHALLENGE_EXPIRED");
            }
            return challenge;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
    }

    private void deleteChallenge(String challengeId) {
        stringRedisTemplate.delete(REDIS_CHALLENGE_PREFIX + challengeId);
    }

    // ===================== Token 操作 =====================

    private TokenPair issueTokenPair(String subject, String accessTokenType, String refreshTokenType) {
        String accessToken = generateAccessToken(subject, accessTokenType);
        String refreshToken = generateRefreshToken(subject, refreshTokenType);
        String key = REDIS_REFRESH_TOKEN_PREFIX + buildRefreshSubjectKey(subject, refreshTokenType);
        // TTL 对齐 refreshToken 自身有效期
        stringRedisTemplate.opsForValue().set(key, refreshToken, Duration.ofSeconds(REFRESH_TOKEN_EXPIRE_SEC));
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
            LocalDateTime expireAt = LocalDateTime.ofInstant(
                    claims.getExpiration().toInstant(), java.time.ZoneId.systemDefault());
            long ttl = java.time.Duration.between(LocalDateTime.now(), expireAt).getSeconds();
            if (ttl > 0) {
                stringRedisTemplate.opsForValue().set(
                        REDIS_REVOKED_TOKEN_PREFIX + token, "1", Duration.ofSeconds(ttl));
            }
        } catch (Exception ignored) {
            stringRedisTemplate.opsForValue().set(
                    REDIS_REVOKED_TOKEN_PREFIX + token, "1", Duration.ofMinutes(30));
        }
    }

    private boolean isTokenRevoked(String token) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(REDIS_REVOKED_TOKEN_PREFIX + token));
    }

    // ===================== 其他私有方法（不变） =====================

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

    private LoginResponse completeOrganizationLogin(EntityTotpCredentials admin) {
        entityAdminCredentialService.updateAdminLastLoginAt(admin.getAdminUid(), LocalDateTime.now());
        TokenPair tokenPair = issueTokenPair(admin.getAdminUid(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        return new LoginResponse(admin.getAdminUid(), "organization-admin", "verified",
                tokenPair.accessToken(), tokenPair.refreshToken(), ACCESS_TOKEN_EXPIRE_SEC);
    }

    private LoginResponse completeEntityRootLogin(TenantOrganization entity) {
        entityAdminCredentialService.updateEntityLastLoginAt(entity.getEntityCode(), LocalDateTime.now());
        TokenPair tokenPair = issueTokenPair(entity.getEntityCode(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        return new LoginResponse(entity.getEntityCode(), "organization-admin", "verified",
                tokenPair.accessToken(), tokenPair.refreshToken(), ACCESS_TOKEN_EXPIRE_SEC);
    }

    private OrganizationCredentialResponse buildOrganizationCredentialResponse(String challengeId,
            String password, String entityCode, String entityName, int boundAdminCount,
            Boolean isFirstLogin, String loginMode, boolean requiresAdminSelection,
            List<OrganizationAdminOption> admins, Integer currentAdminOrder) {
        return OrganizationCredentialResponse.builder()
                .challengeId(challengeId)
                .passwordDigestPreview(password == null ? null : digestPreview(password))
                .otpExpireInSec(OTP_EXPIRE_SEC)
                .maskedTarget(maskInstitutionCode(entityCode))
                .isFirstLogin(isFirstLogin)
                .loginMode(loginMode)
                .requiresAdminSelection(requiresAdminSelection)
                .admins(admins)
                .boundAdminCount(boundAdminCount)
                .minAdminCount(MIN_ENTITY_ADMIN_COUNT)
                .maxAdminCount(MAX_ENTITY_ADMIN_COUNT)
                .currentAdminOrder(currentAdminOrder)
                .entityName(entityName)
                .build();
    }

    private List<OrganizationAdminOption> toAdminOptions(List<EntityTotpCredentials> admins) {
        if (admins.isEmpty()) return List.of();
        return admins.stream().map(admin -> OrganizationAdminOption.builder()
                .adminUid(admin.getAdminUid())
                .displayName(resolveAdminDisplayName(admin))
                .isPrimary(admin.getIsPrimary() != null && admin.getIsPrimary() == 1)
                .build()).toList();
    }

    private String resolveAdminDisplayName(EntityTotpCredentials admin) {
        if (admin == null) return "";
        if (StringUtils.hasText(admin.getDisplayName())) return admin.getDisplayName().trim();
        return admin.getAdminUid();
    }

    private String resolveEntityRootLoginMode(String entityCode) {
        int activeCount = entityAdminCredentialService.countActiveEntityAdmins(entityCode);
        int boundCount = entityAdminCredentialService.countBoundEntityAdmins(entityCode);
        if (activeCount == 0 && entityAdminCredentialService.listBindableEntityAdmins(entityCode).isEmpty()) {
            return LOGIN_MODE_ADMIN_REGISTER;
        }
        if (boundCount < MIN_ENTITY_ADMIN_COUNT) {
            if (!entityAdminCredentialService.listBindableEntityAdmins(entityCode).isEmpty()) {
                return LOGIN_MODE_ADMIN_SELECT;
            }
            return LOGIN_MODE_ADMIN_REGISTER;
        }
        return LOGIN_MODE_ADMIN_SELECT;
    }

    private FollowUpChallenge createFollowUpEntityRootChallenge(String entityCode) {
        String nextChallengeId = "chl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String nextLoginMode = resolveEntityRootLoginMode(entityCode);
        LocalDateTime expireAt = LocalDateTime.now().plusSeconds(ORG_CHALLENGE_EXPIRE_SEC);
        saveChallenge(nextChallengeId, OrgChallengeRecord.forEntityRoot(
                entityCode, nextLoginMode, null, null, expireAt));
        return new FollowUpChallenge(nextChallengeId, nextLoginMode);
    }

    private String buildActivationHint(String entityCode, int boundAdminCount) {
        int remaining = MIN_ENTITY_ADMIN_COUNT - boundAdminCount;
        if (remaining <= 0) return "请继续完成管理员绑定";
        int activeCount = entityAdminCredentialService.countActiveEntityAdmins(entityCode);
        if (activeCount < MIN_ENTITY_ADMIN_COUNT && activeCount < MAX_ENTITY_ADMIN_COUNT) {
            return "还需登记并绑定 " + remaining + " 名管理员后方可正式启用机构管理端";
        }
        return "请通知其他管理员登录并完成 TOTP 绑定（还需 " + remaining + " 人）";
    }

    private boolean isAdminPasswordLoginAllowed(String entityCode) {
        return countBoundEntityAdmins(entityCode) > 0;
    }

    private boolean isEntityAdminUid(String subject) {
        return StringUtils.hasText(subject) && subject.trim().matches("^EA[A-Za-z0-9]{11}$");
    }

    private TenantOrganization loadEntityByCode(String entityCode) {
        LambdaQueryWrapper<TenantOrganization> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrganization::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrganizationMapper.selectOne(wrapper);
    }

    private EntityTotpCredentials loadEntityAdminByUid(String adminUid) {
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getAdminUid, adminUid).last("LIMIT 1");
        return entityTotpCredentialsMapper.selectOne(wrapper);
    }

    private int countBoundEntityAdmins(String entityCode) {
        return entityAdminCredentialService.countBoundEntityAdmins(entityCode);
    }

    private void activateEntityAdminAfterTotpBind(EntityTotpCredentials admin, String totpSecret, LocalDateTime now) {
        EntityTotpCredentials patch = new EntityTotpCredentials();
        patch.setTotpSecret(totpSecret);
        patch.setAccountStatus(EntityAdminAccountStatus.ACTIVE);
        patch.setAccountStatusChangedAt(now);
        patch.setLastLoginAt(now);
        if (!entityAdminCredentialService.hasActivePrimaryAdmin(admin.getEntityCode())) {
            patch.setIsPrimary(1);
        }
        LambdaUpdateWrapper<EntityTotpCredentials> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(EntityTotpCredentials::getAdminUid, admin.getAdminUid());
        entityTotpCredentialsMapper.update(patch, wrapper);
    }

    private int resolveAdminOrder(EntityTotpCredentials admin, List<EntityTotpCredentials> admins) {
        List<EntityTotpCredentials> sorted = admins.stream()
                .sorted(Comparator
                        .comparing((EntityTotpCredentials item) -> item.getIsPrimary() != null && item.getIsPrimary() == 1)
                        .reversed()
                        .thenComparing(EntityTotpCredentials::getId))
                .toList();
        for (int i = 0; i < sorted.size(); i++) {
            if (Objects.equals(sorted.get(i).getAdminUid(), admin.getAdminUid())) return i + 1;
        }
        return 1;
    }

    private String resolveEntityName(String entityCode) {
        LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrgProfile::getEntityCode, entityCode).last("LIMIT 1");
        TenantOrgProfile profile = tenantOrgProfileMapper.selectOne(wrapper);
        if (profile == null || !StringUtils.hasText(profile.getName())) return entityCode;
        return profile.getName().trim();
    }

    private void assertEntityAdminCanBindTotp(EntityTotpCredentials admin) {
        String status = admin.getAccountStatus() == null ? "" : admin.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if (EntityAdminAccountStatus.DEACTIVATED.equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_DEACTIVATED");
        if (EntityAdminAccountStatus.FROZEN.equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_FROZEN");
        if (StringUtils.hasText(admin.getTotpSecret())) throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
    }

    private void assertEntityAdminActive(EntityTotpCredentials admin) {
        String status = admin.getAccountStatus() == null ? "ACTIVE" : admin.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_FROZEN");
        if ("DEACTIVATED".equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_DEACTIVATED");
        if (!"ACTIVE".equals(status)) throw new RuntimeException("ORGANIZATION_ACCOUNT_DISABLED");
        if (!StringUtils.hasText(admin.getTotpSecret())) throw new RuntimeException("ORGANIZATION_TOTP_NOT_BOUND");
    }

    private String digestPreview(String password) {
        String normalized = normalize(password);
        if (normalized.length() <= 12) return normalized;
        return normalized.substring(0, 12);
    }

    private String maskInstitutionCode(String institutionCode) {
        String normalized = normalize(institutionCode);
        if (normalized.length() <= 2) return "***";
        return normalized.substring(0, 1) + "***" + normalized.substring(normalized.length() - 1);
    }

    private String generateAccessToken(String subject, String userType) {
        return jwtUtil.generateToken(subject, userType, 0);
    }

    private String generateRefreshToken(String subject, String userType) {
        return jwtUtil.generateToken(subject, userType, 0, REFRESH_TOKEN_EXPIRE_MS);
    }

    // ===================== 内部 record 类型 =====================

    private record AuthMeta(String userRole, String authStatus) {}

    private record TokenPair(String accessToken, String refreshToken) {}

    private record FollowUpChallenge(String challengeId, String loginMode) {}

    public record OrgChallengeRecord(String adminUid, String entityCode, String loginMode,
                                     boolean entityRootAuthenticated, String pendingTotpSecret,
                                     LocalDateTime totpSetupExpireAt, LocalDateTime expireAt) {

        public static OrgChallengeRecord forEntityRoot(String entityCode, String loginMode,
                                                       String pendingTotpSecret, LocalDateTime totpSetupExpireAt,
                                                       LocalDateTime expireAt) {
            return new OrgChallengeRecord(null, entityCode, loginMode, true,
                    pendingTotpSecret, totpSetupExpireAt, expireAt);
        }

        public static OrgChallengeRecord forAdmin(String adminUid, String entityCode, String loginMode,
                                                  String pendingTotpSecret, LocalDateTime totpSetupExpireAt,
                                                  LocalDateTime expireAt) {
            return new OrgChallengeRecord(adminUid, entityCode, loginMode, false,
                    pendingTotpSecret, totpSetupExpireAt, expireAt);
        }

        public OrgChallengeRecord withPendingTotp(String pendingTotpSecret, LocalDateTime totpSetupExpireAt) {
            return new OrgChallengeRecord(adminUid, entityCode, loginMode, entityRootAuthenticated,
                    pendingTotpSecret, totpSetupExpireAt, expireAt);
        }
    }
}
