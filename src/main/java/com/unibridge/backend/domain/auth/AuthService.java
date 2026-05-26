package com.unibridge.backend.domain.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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
import com.unibridge.backend.domain.auth.dto.OrganizationOtpLoginRequest;
import com.unibridge.backend.infrastructure.entities.ClientEntityProfile;
import com.unibridge.backend.infrastructure.entities.SysEntityTotpCredentials;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.SysEntityTotpCredentialsMapper;
import com.unibridge.backend.infrastructure.util.TotpUtils;
import com.unibridge.backend.infrastructure.util.UserUidGenerator;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
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

    private final Map<String, CodeRecord> codeStore = new ConcurrentHashMap<>();
    private final Map<String, OrgChallengeRecord> orgChallengeStore = new ConcurrentHashMap<>();
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
    private ClientEntityProfileMapper clientEntityProfileMapper;

    @Autowired
    private SysEntityTotpCredentialsMapper sysEntityTotpCredentialsMapper;

    @Autowired
    private EntityAdminCredentialService entityAdminCredentialService;

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

    /** 主体登录第一步：机构代码 + 密码（主体根密码或管理员密码）。 */
    public OrganizationCredentialResponse loginOrganizationCredentials(OrganizationCredentialLoginRequest request) {
        if (isBlank(request.getInstitutionCode()) || isBlank(request.getPassword())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }

        String entityCode = normalize(request.getInstitutionCode());
        String passwordHash = request.getPassword();
        ClientEntity entity = loadEntityByCode(entityCode);
        if (entity == null) {
            throw new RuntimeException("ORGANIZATION_CREDENTIAL_INVALID");
        }
        if (!"APPROVED".equalsIgnoreCase(entity.getAuditStatus())) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DISABLED");
        }
        assertEntityAccountActive(entity);

        boolean entityPasswordMatch = Objects.equals(entity.getPasswordHash(), passwordHash);
        // 先按 institutionCode 定位主体，再在该主体活跃管理员列表中比对密码（非全表 password_hash 查询）
        SysEntityTotpCredentials adminByPassword =
                entityAdminCredentialService.matchActiveAdminByPassword(entityCode, passwordHash);
        boolean adminPasswordMatch = adminByPassword != null;

        if (!entityPasswordMatch && !adminPasswordMatch) {
            throw new RuntimeException("ORGANIZATION_CREDENTIAL_INVALID");
        }

        boolean adminPasswordAllowed = isAdminPasswordLoginAllowed(entityCode);
        // 测试/初始化场景下主体根密码与管理员密码可能相同；主体密码匹配时走主体分支，勿误判为管理员密码登录
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
                    ? toAdminOptions(entityAdminCredentialService.listBindableEntityAdmins(entityCode))
                    : null;
            orgChallengeStore.put(challengeId, OrgChallengeRecord.forEntityRoot(
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
        orgChallengeStore.put(challengeId, OrgChallengeRecord.forAdmin(
                adminByPassword.getAdminUid(), entityCode, loginMode, null, null, expireAt));
        log.info("[ClientAuth] organization admin-password challengeId={}, adminUid={}, loginMode={}",
                challengeId, adminByPassword.getAdminUid(), loginMode);
        return buildOrganizationCredentialResponse(
                challengeId, passwordHash, entityCode, entityName, boundAdminCount,
                isFirstLogin, loginMode, false, null, currentAdminOrder);
    }

    /** 主体根密码 challenge 下登记新管理员，随后进入 {@code totp_setup}。 */
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

        ClientEntity entity = loadEntityByCode(challenge.entityCode());
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

        SysEntityTotpCredentials admin = new SysEntityTotpCredentials();
        admin.setAdminUid(adminUid);
        admin.setEntityCode(challenge.entityCode());
        admin.setPasswordHash(passwordHash);
        admin.setDisplayName(request.getDisplayName().trim());
        admin.setIsPrimary(0);
        admin.setAccountStatus(EntityAdminAccountStatus.PENDING);
        entityAdminCredentialService.createEntityAdmin(admin, entity.getPasswordHash());

        int currentAdminOrder = entityAdminCredentialService.countBoundEntityAdmins(challenge.entityCode()) + 1;
        orgChallengeStore.put(request.getChallengeId(), OrgChallengeRecord.forAdmin(
                adminUid, challenge.entityCode(), LOGIN_MODE_TOTP_SETUP, null, null, challenge.expireAt()));

        log.info("[ClientAuth] organization admin-register challengeId={}, adminUid={}, entityCode={}",
                request.getChallengeId(), adminUid, challenge.entityCode());

        return buildOrganizationCredentialResponse(
                request.getChallengeId(),
                null,
                challenge.entityCode(),
                resolveEntityName(challenge.entityCode()),
                countBoundEntityAdmins(challenge.entityCode()),
                true,
                LOGIN_MODE_TOTP_SETUP,
                false,
                null,
                currentAdminOrder);
    }

    /** 主体根密码登录后选择管理员，进入 TOTP 绑定或校验。 */
    public OrganizationCredentialResponse selectOrganizationAdmin(OrganizationSelectAdminRequest request) {
        if (request == null || isBlank(request.getChallengeId()) || isBlank(request.getAdminUid())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!challenge.entityRootAuthenticated() || !LOGIN_MODE_ADMIN_SELECT.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        SysEntityTotpCredentials admin = entityAdminCredentialService.loadAdminForTotpSetup(
                challenge.entityCode(), request.getAdminUid().trim());
        if (admin == null) {
            throw new RuntimeException("ORGANIZATION_ADMIN_NOT_FOUND");
        }
        assertEntityAdminCanBindTotp(admin);

        boolean isFirstLogin = !StringUtils.hasText(admin.getTotpSecret());
        String loginMode = isFirstLogin ? LOGIN_MODE_TOTP_SETUP : LOGIN_MODE_TOTP_VERIFY;
        int currentAdminOrder = isFirstLogin
                ? entityAdminCredentialService.countBoundEntityAdmins(challenge.entityCode()) + 1
                : resolveAdminOrder(admin, entityAdminCredentialService.listActiveEntityAdmins(challenge.entityCode()));
        orgChallengeStore.put(request.getChallengeId(), OrgChallengeRecord.forAdmin(
                admin.getAdminUid(),
                challenge.entityCode(),
                loginMode,
                challenge.pendingTotpSecret(),
                challenge.totpSetupExpireAt(),
                challenge.expireAt()));

        return buildOrganizationCredentialResponse(
                request.getChallengeId(),
                null,
                challenge.entityCode(),
                resolveEntityName(challenge.entityCode()),
                countBoundEntityAdmins(challenge.entityCode()),
                isFirstLogin,
                loginMode,
                false,
                null,
                currentAdminOrder);
    }

    /** 主体登录第二步：challenge + TOTP 验证码（已绑定）。 */
    public LoginResponse loginOrganizationOtp(OrganizationOtpLoginRequest request) {
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!LOGIN_MODE_TOTP_VERIFY.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        ClientEntity entity = loadEntityByCode(challenge.entityCode());
        if (entity == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        assertEntityAccountActive(entity);

        if (challenge.entityRootAuthenticated() && !StringUtils.hasText(challenge.adminUid())) {
            if (!StringUtils.hasText(entity.getTotpSecret())
                    || !TotpUtils.verifyCode(entity.getTotpSecret(), request.getOtpCode())) {
                throw new RuntimeException("OTP_INVALID");
            }
            orgChallengeStore.remove(request.getChallengeId());
            return completeEntityRootLogin(entity);
        }

        SysEntityTotpCredentials admin = entityAdminCredentialService.loadActiveAdmin(
                challenge.entityCode(), challenge.adminUid());
        if (admin == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        assertEntityAdminActive(admin);

        if (!TotpUtils.verifyCode(admin.getTotpSecret(), request.getOtpCode())) {
            throw new RuntimeException("OTP_INVALID");
        }

        orgChallengeStore.remove(request.getChallengeId());
        return completeOrganizationLogin(admin);
    }

    /** 首次 TOTP 绑定：生成 QR 码。 */
    public OrganizationTotpSetupInitResponse initOrganizationTotpSetup(OrganizationTotpSetupInitRequest request) {
        if (request == null || isBlank(request.getChallengeId())) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!LOGIN_MODE_TOTP_SETUP.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        ClientEntity entity = loadEntityByCode(challenge.entityCode());
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
            SysEntityTotpCredentials admin = entityAdminCredentialService.loadAdminForTotpSetup(
                    challenge.entityCode(), challenge.adminUid());
            if (admin == null) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            accountLabel = resolveEntityName(challenge.entityCode()) + ":" + admin.getAdminUid();
        }

        String otpAuthUrl = TotpUtils.buildOtpAuthUrl(TOTP_ISSUER, accountLabel, secret);
        String qrCodeDataUrl = TotpUtils.generateQrCodeDataUrl(TOTP_ISSUER, accountLabel, secret);

        orgChallengeStore.put(request.getChallengeId(), challenge.withPendingTotp(
                secret, LocalDateTime.now().plusSeconds(TOTP_QR_EXPIRE_SEC)));

        Integer currentAdminOrder = null;
        if (StringUtils.hasText(challenge.adminUid())) {
            SysEntityTotpCredentials admin = entityAdminCredentialService.loadAdminForTotpSetup(
                    challenge.entityCode(), challenge.adminUid());
            currentAdminOrder = admin == null
                    ? 1
                    : entityAdminCredentialService.countBoundEntityAdmins(challenge.entityCode()) + 1;
        }

        return OrganizationTotpSetupInitResponse.builder()
                .qrCodeDataUrl(qrCodeDataUrl)
                .qrCodeExpireInSec(TOTP_QR_EXPIRE_SEC)
                .otpAuthUrl(otpAuthUrl)
                .currentAdminOrder(currentAdminOrder == null ? 1 : currentAdminOrder)
                .build();
    }

    /** 首次 TOTP 绑定：确认验证码并签发 token。 */
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

        ClientEntity entity = loadEntityByCode(challenge.entityCode());
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
            entity.setTotpSecret(boundSecret);
            entity.setLastLoginAt(now);
            clientEntityMapper.updateById(entity);
            boundAdminCount = entityAdminCredentialService.countBoundEntityAdmins(entity.getEntityCode());
            tokenPair = issueTokenPair(entity.getEntityCode(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        } else {
            SysEntityTotpCredentials admin = entityAdminCredentialService.loadAdminForTotpSetup(
                    challenge.entityCode(), challenge.adminUid());
            if (admin == null) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            activateEntityAdminAfterTotpBind(admin, boundSecret, now);
            boundAdminCount = entityAdminCredentialService.countBoundEntityAdmins(admin.getEntityCode());
            tokenPair = issueTokenPair(admin.getAdminUid(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        }

        orgChallengeStore.remove(request.getChallengeId());
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
                .activationHint(entityFullyActivated
                        ? null
                        : buildActivationHint(challenge.entityCode(), boundAdminCount))
                .nextChallengeId(nextChallengeId)
                .nextLoginMode(nextLoginMode)
                .build();
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
            if (isEntityAdminUid(subject.trim())) {
                SysEntityTotpCredentials admin = loadEntityAdminByUid(subject.trim());
                if (admin == null) {
                    throw new RuntimeException("CHALLENGE_NOT_FOUND");
                }
                assertEntityAdminActive(admin);
                ClientEntity entity = loadEntityByCode(admin.getEntityCode());
                if (entity == null) {
                    throw new RuntimeException("CHALLENGE_NOT_FOUND");
                }
                assertEntityAccountActive(entity);
            } else {
                ClientEntity entity = loadEntityByCode(subject.trim());
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

    private LoginResponse completeOrganizationLogin(SysEntityTotpCredentials admin) {
        LocalDateTime now = LocalDateTime.now();
        admin.setLastLoginAt(now);
        sysEntityTotpCredentialsMapper.updateById(admin);
        TokenPair tokenPair = issueTokenPair(admin.getAdminUid(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        return new LoginResponse(admin.getAdminUid(), "organization-admin", "verified",
                tokenPair.accessToken(), tokenPair.refreshToken(), ACCESS_TOKEN_EXPIRE_SEC);
    }

    private LoginResponse completeEntityRootLogin(ClientEntity entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setLastLoginAt(now);
        clientEntityMapper.updateById(entity);
        TokenPair tokenPair = issueTokenPair(entity.getEntityCode(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        return new LoginResponse(entity.getEntityCode(), "organization-admin", "verified",
                tokenPair.accessToken(), tokenPair.refreshToken(), ACCESS_TOKEN_EXPIRE_SEC);
    }

    private OrganizationCredentialResponse buildOrganizationCredentialResponse(String challengeId,
                                                                               String password,
                                                                               String entityCode,
                                                                               String entityName,
                                                                               int boundAdminCount,
                                                                               Boolean isFirstLogin,
                                                                               String loginMode,
                                                                               boolean requiresAdminSelection,
                                                                               List<OrganizationAdminOption> admins,
                                                                               Integer currentAdminOrder) {
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

    private List<OrganizationAdminOption> toAdminOptions(List<SysEntityTotpCredentials> admins) {
        if (admins.isEmpty()) {
            return List.of();
        }
        return admins.stream()
                .map(admin -> OrganizationAdminOption.builder()
                        .adminUid(admin.getAdminUid())
                        .displayName(resolveAdminDisplayName(admin))
                        .isPrimary(admin.getIsPrimary() != null && admin.getIsPrimary() == 1)
                        .build())
                .toList();
    }

    private String resolveAdminDisplayName(SysEntityTotpCredentials admin) {
        if (admin == null) {
            return "";
        }
        if (StringUtils.hasText(admin.getDisplayName())) {
            return admin.getDisplayName().trim();
        }
        return admin.getAdminUid();
    }

    private boolean hasActiveEntityAdmins(String entityCode) {
        return entityAdminCredentialService.countActiveEntityAdmins(entityCode) > 0;
    }

    /**
     * 主体根密码登录后的下一步模式：登记新管理员、选择已有管理员绑定/登录。
     */
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
            if (activeCount < MAX_ENTITY_ADMIN_COUNT) {
                return LOGIN_MODE_ADMIN_REGISTER;
            }
            return LOGIN_MODE_ADMIN_SELECT;
        }

        return LOGIN_MODE_ADMIN_SELECT;
    }

    private FollowUpChallenge createFollowUpEntityRootChallenge(String entityCode) {
        String nextChallengeId = "chl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String nextLoginMode = resolveEntityRootLoginMode(entityCode);
        LocalDateTime expireAt = LocalDateTime.now().plusSeconds(ORG_CHALLENGE_EXPIRE_SEC);
        orgChallengeStore.put(nextChallengeId, OrgChallengeRecord.forEntityRoot(
                entityCode, nextLoginMode, null, null, expireAt));
        return new FollowUpChallenge(nextChallengeId, nextLoginMode);
    }

    private String buildActivationHint(String entityCode, int boundAdminCount) {
        int remaining = MIN_ENTITY_ADMIN_COUNT - boundAdminCount;
        if (remaining <= 0) {
            return "请继续完成管理员绑定";
        }
        int activeCount = entityAdminCredentialService.countActiveEntityAdmins(entityCode);
        if (activeCount < MIN_ENTITY_ADMIN_COUNT && activeCount < MAX_ENTITY_ADMIN_COUNT) {
            return "还需登记并绑定 " + remaining + " 名管理员后方可正式启用机构管理端";
        }
        return "请通知其他管理员登录并完成 TOTP 绑定（还需 " + remaining + " 人）";
    }

    /** 至少一名管理员已完成 TOTP 绑定后，才允许使用管理员独立密码登录。 */
    private boolean isAdminPasswordLoginAllowed(String entityCode) {
        return countBoundEntityAdmins(entityCode) > 0;
    }

    private boolean isEntityAdminUid(String subject) {
        return StringUtils.hasText(subject) && subject.trim().matches("^EA[A-Za-z0-9]{11}$");
    }

    private OrgChallengeRecord requireOrgChallenge(String challengeId) {
        OrgChallengeRecord challenge = orgChallengeStore.get(challengeId);
        if (challenge == null) {
            throw new RuntimeException("CHALLENGE_NOT_FOUND");
        }
        if (challenge.expireAt().isBefore(LocalDateTime.now())) {
            orgChallengeStore.remove(challengeId);
            throw new RuntimeException("CHALLENGE_EXPIRED");
        }
        return challenge;
    }

    private ClientEntity loadEntityByCode(String entityCode) {
        LambdaQueryWrapper<ClientEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntity::getEntityCode, entityCode).last("LIMIT 1");
        return clientEntityMapper.selectOne(wrapper);
    }

    private SysEntityTotpCredentials loadEntityAdminByUid(String adminUid) {
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getAdminUid, adminUid).last("LIMIT 1");
        return sysEntityTotpCredentialsMapper.selectOne(wrapper);
    }

    private int countBoundEntityAdmins(String entityCode) {
        return entityAdminCredentialService.countBoundEntityAdmins(entityCode);
    }

    private void activateEntityAdminAfterTotpBind(SysEntityTotpCredentials admin, String totpSecret, LocalDateTime now) {
        admin.setTotpSecret(totpSecret);
        admin.setAccountStatus(EntityAdminAccountStatus.ACTIVE);
        admin.setAccountStatusChangedAt(now);
        if (!entityAdminCredentialService.hasActivePrimaryAdmin(admin.getEntityCode())) {
            admin.setIsPrimary(1);
        }
        admin.setLastLoginAt(now);
        sysEntityTotpCredentialsMapper.updateById(admin);
    }

    private int resolveAdminOrder(SysEntityTotpCredentials admin, List<SysEntityTotpCredentials> admins) {
        List<SysEntityTotpCredentials> sorted = admins.stream()
                .sorted(Comparator
                        .comparing((SysEntityTotpCredentials item) -> item.getIsPrimary() != null && item.getIsPrimary() == 1)
                        .reversed()
                        .thenComparing(SysEntityTotpCredentials::getId))
                .toList();
        for (int i = 0; i < sorted.size(); i++) {
            if (Objects.equals(sorted.get(i).getAdminUid(), admin.getAdminUid())) {
                return i + 1;
            }
        }
        return 1;
    }

    private String resolveEntityName(String entityCode) {
        LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntityProfile::getEntityCode, entityCode).last("LIMIT 1");
        ClientEntityProfile profile = clientEntityProfileMapper.selectOne(wrapper);
        if (profile == null || !StringUtils.hasText(profile.getName())) {
            return entityCode;
        }
        return profile.getName().trim();
    }

    /** 允许进入 TOTP 绑定流程（PENDING 或 ACTIVE 未绑定）。 */
    private void assertEntityAdminCanBindTotp(SysEntityTotpCredentials admin) {
        String status = admin.getAccountStatus() == null ? "" : admin.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if (EntityAdminAccountStatus.DEACTIVATED.equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DEACTIVATED");
        }
        if (EntityAdminAccountStatus.FROZEN.equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_FROZEN");
        }
        if (StringUtils.hasText(admin.getTotpSecret())) {
            throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
        }
    }

    private void assertEntityAdminActive(SysEntityTotpCredentials admin) {
        String status = admin.getAccountStatus() == null ? "ACTIVE" : admin.getAccountStatus().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_FROZEN");
        }
        if ("DEACTIVATED".equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DEACTIVATED");
        }
        if (!"ACTIVE".equals(status)) {
            throw new RuntimeException("ORGANIZATION_ACCOUNT_DISABLED");
        }
        if (!StringUtils.hasText(admin.getTotpSecret())) {
            throw new RuntimeException("ORGANIZATION_TOTP_NOT_BOUND");
        }
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

    private record OrgChallengeRecord(String adminUid,
                                      String entityCode,
                                      String loginMode,
                                      boolean entityRootAuthenticated,
                                      String pendingTotpSecret,
                                      LocalDateTime totpSetupExpireAt,
                                      LocalDateTime expireAt) {

        static OrgChallengeRecord forEntityRoot(String entityCode,
                                              String loginMode,
                                              String pendingTotpSecret,
                                              LocalDateTime totpSetupExpireAt,
                                              LocalDateTime expireAt) {
            return new OrgChallengeRecord(null, entityCode, loginMode, true,
                    pendingTotpSecret, totpSetupExpireAt, expireAt);
        }

        static OrgChallengeRecord forAdmin(String adminUid,
                                           String entityCode,
                                           String loginMode,
                                           String pendingTotpSecret,
                                           LocalDateTime totpSetupExpireAt,
                                           LocalDateTime expireAt) {
            return new OrgChallengeRecord(adminUid, entityCode, loginMode, false,
                    pendingTotpSecret, totpSetupExpireAt, expireAt);
        }

        OrgChallengeRecord withPendingTotp(String pendingTotpSecret, LocalDateTime totpSetupExpireAt) {
            return new OrgChallengeRecord(adminUid, entityCode, loginMode, entityRootAuthenticated,
                    pendingTotpSecret, totpSetupExpireAt, expireAt);
        }
    }

    private record TokenPair(String accessToken, String refreshToken) {
    }

    private record FollowUpChallenge(String challengeId, String loginMode) {
    }
}
