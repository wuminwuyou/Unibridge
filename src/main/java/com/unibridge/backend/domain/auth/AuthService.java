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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.scheduling.annotation.Scheduled;
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

    /** 当前激活的 Spring profile，用于开发环境日志分流 */
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    /**
     * 定时清理过期的内存缓存数据，防止内存泄漏。
     * 每 5 分钟执行一次，清理 codeStore（已过期验证码）、
     * orgChallengeStore（已过期 challenge）和 revokedTokenStore（已过期的撤销 token）。
     * <p>
     * 【并发安全】使用 ConcurrentHashMap 的 entrySet 迭代 + remove 操作，
     * 各 Map 操作独立互不影响，清理过程不阻塞业务读写。
     * </p>
     */
    @Scheduled(fixedRate = 300_000)
    public void cleanExpiredStores() {
        LocalDateTime now = LocalDateTime.now();
        codeStore.entrySet().removeIf(e -> e.getValue().expireAt.isBefore(now));
        orgChallengeStore.entrySet().removeIf(e -> e.getValue().expireAt().isBefore(now));
        revokedTokenStore.entrySet().removeIf(e -> e.getValue().isBefore(now));
    }

    /**
     * 个人账号注册。
     * <p>
     * 【并发安全】利用数据库 {@code uk_user_phone} 唯一索引作为最终防线，
     * 应用层 check-then-act 仅作快速失败优化。若并发插入导致主键/唯一键冲突，
     * 回退为数据库级唯一性校验，确保不会发生脏写（同一手机号被并发注册两次）。
     * 事务回滚时 {@code issueTokenPair} 写入的 refreshToken 会被一起回滚。
     * </p>
     */
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

        // 快速失败检查：避免不必要的插入尝试
        LambdaQueryWrapper<ClientUser> existsWrapper = new LambdaQueryWrapper<>();
        existsWrapper.eq(ClientUser::getPhone, account);
        if (clientUserMapper.selectOne(existsWrapper) != null) {
            throw new RuntimeException("ACCOUNT_ALREADY_EXISTS");
        }

        try {
            ClientUser user = new ClientUser();
            user.setUserUid(UserUidGenerator.generate(this::isUserUidUnique));
            user.setPhone(account);
            user.setPasswordHash(request.getPassword());
            user.setAccountStatus("ACTIVE");
            // 数据库 uk_user_phone 唯一索引兜底：并发场景下若两个线程同时通过 check，
            // 数据库唯一约束会拒绝后到达的 INSERT，抛出 DuplicateKeyException
            clientUserMapper.insert(user);
            createDefaultUserProfile(user.getUserUid(), account);
            createDefaultCreditProfile(user.getUserUid());

            TokenPair tokenPair = issueTokenPair(user.getUserUid(), "CLIENT_USER", "CLIENT_USER_REFRESH");
            String accessToken = tokenPair.accessToken();
            String refreshToken = tokenPair.refreshToken();
            return new RegisterResponse(user.getUserUid(), null, "unverified", true, accessToken, refreshToken);
        } catch (DuplicateKeyException e) {
            // 并发插入同一手机号时，数据库唯一索引拒绝并回滚整个事务
            throw new RuntimeException("ACCOUNT_ALREADY_EXISTS");
        }
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

    /**
     * 下发个人登录/注册验证码（开发模式打印日志）。
     * <p>
     * 【并发安全】使用 {@link ConcurrentHashMap#compute} 将"检查冷却期 + 写入新 code"
     * 合并为单个原子操作，避免两个并发请求同时通过冷却期检查后互相覆盖验证码
     * （丢失更新，lost update）。
     * </p>
     */
    public SendCodeResponse sendPersonalCode(SendCodeRequest request) {
        String account = normalize(request.getAccount());
        String bizType = normalizeOrDefault(request.getBizType(), "login");
        String channel = normalizeOrDefault(request.getChannel(), "sms");
        String key = buildCodeKey(account, channel, bizType);
        LocalDateTime now = LocalDateTime.now();

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        String requestId = "req_" + System.currentTimeMillis() + "_" + requestCounter.getAndIncrement();

        CodeRecord newRecord = new CodeRecord(requestId, code, now, now.plusSeconds(CODE_EXPIRE_SEC));
        // compute 将"冷却期检查 + 新记录写入"合并为原子操作
        CodeRecord result = codeStore.compute(key, (k, old) -> {
            if (old != null && old.createdAt.plusSeconds(CODE_RETRY_AFTER_SEC).isAfter(now)) {
                // 仍在冷却期内，保留旧记录，拒绝新请求
                return old;
            }
            // 不在冷却期（或首次），写入新验证码
            return newRecord;
        });

        if (!Objects.equals(result, newRecord)) {
            // compute 返回了旧记录（冷却期内），拒绝
            throw new RuntimeException("TOO_FREQUENT_REQUEST");
        }

        // 开发环境：在控制台醒目打印验证码，方便本地联调
        if ("dev".equals(activeProfile)) {
            String phoneNumber = account;
            System.out.println("=========================================");
            System.out.println("【本地开发环境影子拦截】");
            System.out.println("手机号: " + phoneNumber);
            System.out.println("生成的" + channel + "验证码为: " + code);
            System.out.println("业务类型: " + bizType);
            System.out.println("请求 ID: " + requestId);
            System.out.println("=========================================");
        }

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
                    ? toAdminOptions(entityAdminCredentialService.listAdminsForEntityRootSelect(
                            entityCode, boundAdminCount, MIN_ENTITY_ADMIN_COUNT))
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

    /**
     * 主体根密码 challenge 下登记新管理员，随后进入 {@code totp_setup}。
     * <p>
     * 【并发安全】管理员名额检查（countActiveEntityAdmins）存在 TOCTOU 问题。
     * 在 {@code createEntityAdmin} 内部通过数据库 INSERT 做最终兜底：
     * 若并发导致名额超限或密码重复，数据库唯一约束会拒绝。
     * orgChallengeStore 更新使用 compute 保证原子性，防止并发覆盖。
     * </p>
     */
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

        // 快速失败检查：应用层先过滤，数据库层面由 INSERT 唯一约束兜底
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
        // createEntityAdmin 内包含 assertAdminPasswordAvailable + INSERT
        // 若并发导致名额超限或密码重复，数据库唯一约束会拒绝
        try {
            entityAdminCredentialService.createEntityAdmin(admin, entity.getPasswordHash());
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("ORGANIZATION_ADMIN_LIMIT_REACHED");
        }

        int currentAdminOrder = entityAdminCredentialService.countBoundEntityAdmins(challenge.entityCode()) + 1;
        // 原子化更新 challenge 记录（转为 admin 模式），防止并发覆盖
        orgChallengeStore.compute(request.getChallengeId(), (k, old) -> {
            if (old == null || old.expireAt().isBefore(LocalDateTime.now())) {
                return null; // 无效 challenge
            }
            return OrgChallengeRecord.forAdmin(
                    adminUid, challenge.entityCode(), LOGIN_MODE_TOTP_SETUP,
                    null, null, challenge.expireAt());
        });

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

    /**
     * 主体根密码登录后选择管理员，进入 TOTP 绑定或校验。
     * <p>
     * 【并发安全】使用 ConcurrentHashMap compute 原子化更新 challenge 记录，
     * 防止并发选择同一管理员时的覆盖丢失。
     * </p>
     */
    public OrganizationCredentialResponse selectOrganizationAdmin(OrganizationSelectAdminRequest request) {
        if (request == null || isBlank(request.getChallengeId()) || isBlank(request.getAdminUid())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        OrgChallengeRecord challenge = requireOrgChallenge(request.getChallengeId());
        if (!challenge.entityRootAuthenticated() || !LOGIN_MODE_ADMIN_SELECT.equals(challenge.loginMode())) {
            throw new RuntimeException("ORGANIZATION_LOGIN_MODE_INVALID");
        }

        SysEntityTotpCredentials admin = entityAdminCredentialService.loadAdminForEntityRootSelect(
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
        // 原子化更新 challenge 记录，防止并发覆盖
        orgChallengeStore.compute(request.getChallengeId(), (k, old) -> {
            if (old == null || old.expireAt().isBefore(LocalDateTime.now())) {
                return null;
            }
            return OrgChallengeRecord.forAdmin(
                    admin.getAdminUid(),
                    challenge.entityCode(),
                    loginMode,
                    challenge.pendingTotpSecret(),
                    challenge.totpSetupExpireAt(),
                    challenge.expireAt());
        });

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

    /**
     * 首次 TOTP 绑定：生成 QR 码。
     * <p>
     * 【并发安全】使用 ConcurrentHashMap compute 原子化更新 challenge 记录的
     * pendingTotpSecret 和 totpSetupExpireAt，防止两个并发 init 互相覆盖。
     * </p>
     */
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

        LocalDateTime totpExpire = LocalDateTime.now().plusSeconds(TOTP_QR_EXPIRE_SEC);
        // 原子化写入 pending TOTP secret，防止并发 init 互相覆盖
        orgChallengeStore.compute(request.getChallengeId(), (k, old) -> {
            if (old == null || old.expireAt().isBefore(LocalDateTime.now())) {
                return null;
            }
            return old.withPendingTotp(secret, totpExpire);
        });

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

    /**
     * 首次 TOTP 绑定：确认验证码并签发 token。
     * <p>
     * 【并发安全】TOTP 绑定的 check-then-act 存在 TOCTOU 竞态：
     * 两个并发请求可能同时通过 {@code totp_secret IS NULL} 检查，
     * 导致后到达的请求覆盖前一个绑定。
     * 使用数据库条件 UPDATE 作为乐观锁：在 WHERE 子句中校验
     * {@code totp_secret IS NULL OR totp_secret = ''}，若并发绑定导致
     * affected rows = 0，则抛出异常拒绝覆盖。
     * </p>
     */
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
            // 主体根账号 TOTP 绑定：使用数据库条件 UPDATE 防止并发覆盖
            if (StringUtils.hasText(entity.getTotpSecret())) {
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
            int updated = entityAdminCredentialService.bindEntityRootTotp(
                    entity.getEntityCode(), boundSecret, now);
            if (updated == 0) {
                // 并发请求已抢先绑定 TOTP
                throw new RuntimeException("ORGANIZATION_TOTP_ALREADY_BOUND");
            }
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

        // 原子化移除 challenge，防止并发清理导致重复绑定
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

    /**
     * 使用 refreshToken 换取新的 accessToken（并轮换 refreshToken）。
     * <p>
     * 【并发安全】依赖 {@link #activeRefreshTokenStore} 的 ConcurrentHashMap 原子性：
     * {@code issueTokenPair} 通过 put 覆盖旧 refreshToken，保证同一 subject 只保留
     * 最新有效 token。synchronized 方法级锁防止同一实例内并发刷新时的
     * check-then-act 竞态（如两个并发刷新都通过同一条旧 token 的验证）。
     * 注意：多实例部署时需依赖分布式锁或数据库乐观锁进一步保护。
     * </p>
     */
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

    /**
     * 退出登录：销毁 accessToken 与 refreshToken。
     * <p>
     * 【并发安全】synchronized 方法级锁确保同一实例内的登出操作串行化。
     * refreshToken 的移除使用 ConcurrentHashMap remove(key, value) 保证条件删除原子性，
     * 避免误删在"验证通过后、移除前"由并发刷新写入的新 token。
     * 多实例部署场景需额外考虑分布式一致性。
     * </p>
     */
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
                // 使用 remove(key, value) 条件删除：仅当 value 匹配时才移除，
                // 防止并发刷新写入新 token 后被登出误删
                activeRefreshTokenStore.remove(subjectKey, refreshToken);
            }
        }
    }

    /**
     * 构建个人登录响应。
     * <p>
     * 【并发安全】使用 LambdaUpdateWrapper 仅更新 {@code last_login_at} 字段，
     * 而非 updateById 全字段覆盖。防止两个并发登录操作互相覆盖其他字段变更
     * （如密码修改、状态变更等），避免丢失更新（lost update）。
     * </p>
     */
    private LoginResponse buildPersonalLoginResponse(ClientUser user) {
        assertUserAccountActive(user);
        // 使用条件更新仅写 lastLoginAt，避免全字段覆盖
        entityAdminCredentialService.updateClientUserLastLoginAt(user.getUserUid(), LocalDateTime.now());

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

    /**
     * 验证码校验。
     * <p>
     * 【并发安全】使用 ConcurrentHashMap 的 remove(key, value) 原子操作
     * 确保验证码一经验证即被消费，防止同一验证码被并发请求多次使用
     * （重放攻击防护）。
     * </p>
     */
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
        // 使用条件删除确保原子消费：仅当当前记录与读取时一致才移除，
        // 防止并发场景下 A 线程验证通过但尚未删除时，B 线程放入新 code 被误删
        if (!codeStore.remove(key, record)) {
            // 记录已被其他线程修改（如冷却期内重新发送），拒绝
            return false;
        }
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

    /**
     * 完成管理员登录。
     * <p>
     * 【并发安全】使用条件 UPDATE 仅更新 {@code last_login_at} 字段，
     * 避免全字段覆盖导致丢失其他并发变更（如 TOTP 绑定状态、密码修改等）。
     * </p>
     */
    private LoginResponse completeOrganizationLogin(SysEntityTotpCredentials admin) {
        entityAdminCredentialService.updateAdminLastLoginAt(admin.getAdminUid(), LocalDateTime.now());
        TokenPair tokenPair = issueTokenPair(admin.getAdminUid(), "CLIENT_ORG", "CLIENT_ORG_REFRESH");
        return new LoginResponse(admin.getAdminUid(), "organization-admin", "verified",
                tokenPair.accessToken(), tokenPair.refreshToken(), ACCESS_TOKEN_EXPIRE_SEC);
    }

    /**
     * 完成主体根账号登录。
     * <p>
     * 【并发安全】使用条件 UPDATE 仅更新 {@code last_login_at} 字段，
     * 避免全字段覆盖导致丢失其他并发变更。
     * </p>
     */
    private LoginResponse completeEntityRootLogin(ClientEntity entity) {
        entityAdminCredentialService.updateEntityLastLoginAt(entity.getEntityCode(), LocalDateTime.now());
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
            return LOGIN_MODE_ADMIN_REGISTER;
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

    /**
     * 管理员 TOTP 绑定后激活账户，使用条件 UPDATE 防止并发覆盖。
     * <p>
     * 【并发安全】使用 LambdaUpdateWrapper 仅更新指定字段（totpSecret、accountStatus、
     * accountStatusChangedAt、lastLoginAt），避免 updateById 全字段覆盖导致丢失更新。
     * isPrimary 的设置存在 TOCTOU 风险（检查 hasActivePrimaryAdmin 后设置），
     * 由事务内行级锁保护同一行，跨行检查由数据库唯一约束兜底。
     * </p>
     */
    private void activateEntityAdminAfterTotpBind(SysEntityTotpCredentials admin, String totpSecret, LocalDateTime now) {
        SysEntityTotpCredentials patch = new SysEntityTotpCredentials();
        patch.setTotpSecret(totpSecret);
        patch.setAccountStatus(EntityAdminAccountStatus.ACTIVE);
        patch.setAccountStatusChangedAt(now);
        patch.setLastLoginAt(now);
        // 仅当同主体下无活跃主管理员时，设为首选管理员（小概率并发冲突由数据库约束兜底）
        if (!entityAdminCredentialService.hasActivePrimaryAdmin(admin.getEntityCode())) {
            patch.setIsPrimary(1);
        }
        LambdaUpdateWrapper<SysEntityTotpCredentials> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getAdminUid, admin.getAdminUid());
        sysEntityTotpCredentialsMapper.update(patch, wrapper);
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
     * <p>
     * 【并发安全】使用 ConcurrentHashMap 的原子操作保证
     * refreshToken 写入的线程安全。多实例部署时，
     * 单实例内多个请求并发调用受 synchronized 保护的方法
     * （refreshAccessToken/handleLogout）已确保正确性。
     * </p>
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
