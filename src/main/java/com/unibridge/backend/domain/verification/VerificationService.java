package com.unibridge.backend.domain.verification;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.verification.dto.*;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.entities.auth.TenantOrganization;
import com.unibridge.backend.infrastructure.entities.auth.EntityTotpCredentials;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.entities.verification.VerificationCode;
import com.unibridge.backend.infrastructure.entities.verification.ApprovalFlow;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.TenantOrganizationMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.EntityTotpCredentialsMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.verification.VerificationCodeMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.verification.ApprovalFlowMapper;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import com.unibridge.backend.infrastructure.util.PublicUidGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 双阶段认证服务：人脸核身（阶段一）+ 机构认证（阶段二）。
 */
@Service
public class VerificationService {

    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());
    private static final String REDIS_FACE_PREFIX = "verification:face:";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter EXPIRE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Pattern ID_CARD_PATTERN = Pattern.compile("^\\d{17}[\\dXx]$");
    private static final Pattern VERIFICATION_CODE_PATTERN = Pattern.compile("^\\d{1,32}-\\d{4}-\\d{5}$");
    private static final int FACE_TOKEN_EXPIRE_SEC = 300;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /** 当前激活的 Spring profile */
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @Autowired
    private AccessService accessService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private TenantOrgProfileMapper tenantOrgProfileMapper;

    @Autowired
    private TenantOrganizationMapper tenantOrganizationMapper;

    @Autowired
    private UserOrganizationBindingMapper userOrganizationBindingMapper;

    @Autowired
    private ApprovalFlowMapper approvalFlowMapper;

    @Autowired
    private VerificationCodeMapper verificationCodeMapper;

    @Autowired
    private UserIdentityMapper userIdentityMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EntityTotpCredentialsMapper entityTotpCredentialsMapper;

    // ===================== 阶段一：人脸核身 =====================

    /**
     * 初始化人脸核身。
     * <p>
     * 开发环境（spring.profiles.active=dev）：使用 mock 模式，不调用腾讯云核身 API。
     * 生成模拟 token，后续 result 查询直接返回 passed=true。
     * 生产环境：需对接腾讯云人脸核身 SDK，调用 DetectAuth / GetDetectInfo 等接口。
     * </p>
     */
    public FaceInitResponse initFace(String authorization, FaceInitRequest request) {
        String userUid = accessService.requireCurrentUserUid(authorization);

        if (!StringUtils.hasText(request.getRealName())) {
            throw BusinessException.badRequest("REAL_NAME_REQUIRED");
        }
        if (!StringUtils.hasText(request.getIdCard()) || !ID_CARD_PATTERN.matcher(request.getIdCard().trim()).matches()) {
            throw BusinessException.badRequest("ID_CARD_INVALID");
        }

        if ("dev".equals(activeProfile)) {
            // ====== 开发环境：mock 核身 ======
            String token = "face_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            String mockUrl = "about:blank"; // 无实际核身页面
            FaceRecord record = new FaceRecord(userUid, request.getRealName().trim(), request.getIdCard().trim(), LocalDateTime.now());
            redisTemplate.opsForValue().set(REDIS_FACE_PREFIX + token, record, Duration.ofSeconds(FACE_TOKEN_EXPIRE_SEC));
            return FaceInitResponse.builder()
                    .url(mockUrl)
                    .token(token)
                    .expireInSec(FACE_TOKEN_EXPIRE_SEC)
                    .build();
        }

        // ====== 生产环境：对接腾讯云人脸核身 API ======
        // TODO: 接入腾讯云人脸核身 SDK
        throw new UnsupportedOperationException("FACE_API_NOT_CONFIGURED");
    }

    /**
     * 查询人脸核身结果。
     * <p>
     * 开发环境：直接返回 passed=true + 已记录的姓名。
     * 生产环境：调用腾讯云 GetDetectInfo 接口查询真实结果。
     * </p>
     */
    public FaceResultResponse getFaceResult(String authorization, String token) {
        accessService.requireCurrentUserUid(authorization);

        if (!StringUtils.hasText(token)) {
            throw BusinessException.badRequest("TOKEN_REQUIRED");
        }

        if ("dev".equals(activeProfile)) {
            // ====== 开发环境：直接通过 ======
            String key = REDIS_FACE_PREFIX + token;
            FaceRecord record = (FaceRecord) redisTemplate.opsForValue().get(key);
            if (record == null) {
                return FaceResultResponse.builder().passed(false).build();
            }
            redisTemplate.delete(key);
            return FaceResultResponse.builder()
                    .passed(true)
                    .realName(record.realName)
                    .idCardMasked(maskIdCard(record.idCard))
                    .build();
        }

        // ====== 生产环境：查询腾讯云核身结果 ======
        throw new UnsupportedOperationException("FACE_API_NOT_CONFIGURED");
    }

    // ===================== 阶段二-A：机构搜索 =====================

    /**
     * 按关键词模糊搜索机构（entity_profile.name LIKE keyword）。
     */
    public EntitySearchResponse searchEntities(String authorization, String keyword) {
        accessService.requireCurrentUserUid(authorization);

        if (!StringUtils.hasText(keyword) || keyword.trim().length() < 1) {
            return EntitySearchResponse.builder().entities(List.of()).build();
        }

        LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.and(w -> w
                        .like(TenantOrgProfile::getName, keyword.trim())
                        .or()
                        .like(TenantOrgProfile::getEntityCode, keyword.trim()))
                .last("LIMIT 20");
        List<TenantOrgProfile> profiles = tenantOrgProfileMapper.selectList(wrapper);

        // 校验机构是否存在且公开可见
        List<EntitySearchItem> entities = profiles.stream()
                .filter(p -> {
                    TenantOrganization TenantOrganization = loadEntityByCode(p.getEntityCode());
                    return TenantOrganization != null && "ACTIVE".equalsIgnoreCase(TenantOrganization.getAccountStatus())
                            && "APPROVED".equalsIgnoreCase(TenantOrganization.getAuditStatus());
                })
                .map(p -> EntitySearchItem.builder()
                        .entityCode(p.getEntityCode())
                        .name(p.getName())
                        .type(p.getType())
                        .build())
                .collect(Collectors.toList());

        return EntitySearchResponse.builder().entities(entities).build();
    }

    // ===================== 阶段二-B：教职工认证申请 =====================

    /**
     * 教职工认证申请。
     * <p>
     * 生成 user_auth_link 记录（audit_status=PENDING, role=PM|MENTOR），
     * 待机构管理员审核后设为 APPROVED。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public StaffApplyResponse applyStaff(String authorization, StaffApplyRequest request) {
        String userUid = accessService.requireCurrentUserUid(authorization);

        if (!StringUtils.hasText(request.getEntityCode())) {
            throw BusinessException.badRequest("ENTITY_NOT_FOUND");
        }
        if (!StringUtils.hasText(request.getRealName()) || !StringUtils.hasText(request.getStaffNumber())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        TenantOrganization TenantOrganization = loadEntityByCode(request.getEntityCode().trim());
        if (TenantOrganization == null || !"ACTIVE".equalsIgnoreCase(TenantOrganization.getAccountStatus())
                || !"APPROVED".equalsIgnoreCase(TenantOrganization.getAuditStatus())) {
            throw BusinessException.notFound("ENTITY_NOT_FOUND");
        }

        // 检查是否已有同机构同角色的 PENDING/APPROVED 记录
        LambdaQueryWrapper<UserOrganizationBinding> existWrapper = new LambdaQueryWrapper<>();
        existWrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getEntityCode, request.getEntityCode().trim())
                .in(UserOrganizationBinding::getAuditStatus, "PENDING", "APPROVED")
                .last("LIMIT 1");
        if (userOrganizationBindingMapper.selectOne(existWrapper) != null) {
            throw BusinessException.conflict("APPLICATION_ALREADY_EXISTS");
        }

        // 判定角色：企业 → PM，学校 → MENTOR
        String entityType = loadEntityType(request.getEntityCode().trim());
        String role = "UNIVERSITY".equalsIgnoreCase(entityType) ? "MENTOR" : "PM";

        // 生成申请编号：APP-yyyyMMdd-{11位NanoID}
        String datePart = LocalDateTime.now().format(DATE_FORMATTER);
        String applicationId = "APP-" + datePart + "-" + generateApprovalSuffix(uid -> isApplicationIdUnique(uid));

        // 写入 user_auth_link（PENDING 状态）
        UserOrganizationBinding link = new UserOrganizationBinding();
        link.setUserUid(userUid);
        link.setEntityCode(request.getEntityCode().trim());
        link.setRole(role);
        link.setAuthSerialNo(applicationId);
        link.setAuditStatus("PENDING");
        link.setIsActive(0);
        link.setRemark("staffNumber:" + request.getStaffNumber().trim());
        userOrganizationBindingMapper.insert(link);

        // 写入 sys_approval_flows 审批流
        ApprovalFlow flow = new ApprovalFlow();
        flow.setApprovalKey(applicationId);
        flow.setBusinessType("MENTOR_AUTH");
        flow.setApplicantKey(userUid);
        flow.setTargetKey(request.getEntityCode().trim());
        flow.setStatus(0); // 待审批
        flow.setPayload(buildStaffPayload(request));
        approvalFlowMapper.insert(flow);

        // 同步 real_name 到 t_user_identity
        UserProfile profile = loadProfileByUid(userUid);
        if (profile != null) {
            UserIdentity identity = loadIdentityByUid(userUid);
            if (identity == null) {
                identity = new UserIdentity();
                identity.setUserUid(userUid);
                identity.setEncryptedRealName(request.getRealName().trim());
                identity.setRealNameMask(buildRealNameMask(request.getRealName().trim()));
                identity.setCreatedAt(LocalDateTime.now());
                identity.setUpdatedAt(LocalDateTime.now());
                userIdentityMapper.insert(identity);
            } else if (!StringUtils.hasText(identity.getEncryptedRealName())) {
                identity.setEncryptedRealName(request.getRealName().trim());
                identity.setRealNameMask(buildRealNameMask(request.getRealName().trim()));
                identity.setUpdatedAt(LocalDateTime.now());
                userIdentityMapper.updateById(identity);
            }
        }

        return StaffApplyResponse.builder()
                .applicationId(applicationId)
                .status("PENDING")
                .build();
    }

    // ===================== 阶段二-C：学生邀请码激活 =====================

    /**
     * 学生通过邀请码激活认证。支持母码和子码。
     * <p>
     * 【并发安全】使用数据库原子 UPDATE 递增 used_quota，通过 affected rows 判定额度。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public StudentActivateResponse activateStudent(String authorization, StudentActivateRequest request) {
        String userUid = accessService.requireCurrentUserUid(authorization);

        String code = request.getVerificationCode().trim();
        int gradYear = request.getGraduationYear() == null ? 0 : request.getGraduationYear();
        if (gradYear < 1950 || gradYear > 2100) {
            throw BusinessException.badRequest("GRADUATION_YEAR_INVALID");
        }
        if (!StringUtils.hasText(request.getStudentId())) {
            throw BusinessException.badRequest("STUDENT_ID_REQUIRED");
        }
        if (!StringUtils.hasText(request.getRealName())) {
            throw BusinessException.badRequest("REAL_NAME_REQUIRED");
        }

        // 查询认证码（仅子码）
        LambdaQueryWrapper<VerificationCode> codeWrapper = new LambdaQueryWrapper<>();
        codeWrapper.eq(VerificationCode::getCode, code).last("LIMIT 1");
        VerificationCode invCode = verificationCodeMapper.selectOne(codeWrapper);
        if (invCode == null || invCode.getIsActive() == null || invCode.getIsActive() == 0) {
            throw BusinessException.badRequest("VERIFICATION_CODE_INVALID");
        }

        // 检查是否过期
        if (invCode.getExpireTime() != null && invCode.getExpireTime().isBefore(LocalDateTime.now())) {
            throw BusinessException.badRequest("VERIFICATION_CODE_EXPIRED");
        }

        String entityCode = invCode.getEntityCode();

        // 校验机构存在
        TenantOrganization TenantOrganization = loadEntityByCode(entityCode);
        if (TenantOrganization == null || !"ACTIVE".equalsIgnoreCase(TenantOrganization.getAccountStatus())) {
            throw BusinessException.notFound("ENTITY_NOT_FOUND");
        }

        TenantOrgProfile entityProfile = loadEntityProfileByCode(entityCode);
        String entityName = entityProfile != null ? entityProfile.getName() : entityCode;

        // 检查是否已激活
        LambdaQueryWrapper<UserOrganizationBinding> existWrapper = new LambdaQueryWrapper<>();
        existWrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getEntityCode, entityCode)
                .eq(UserOrganizationBinding::getRole, "STUDENT")
                .in(UserOrganizationBinding::getAuditStatus, "PENDING", "APPROVED")
                .last("LIMIT 1");
        if (userOrganizationBindingMapper.selectOne(existWrapper) != null) {
            throw BusinessException.conflict("APPLICATION_ALREADY_EXISTS");
        }

        // 母码不可激活
        if (invCode.getIsMaster() != null && invCode.getIsMaster() == 1) {
            throw BusinessException.badRequest("VERIFICATION_CODE_MASTER_NOT_FOR_ACTIVATE");
        }

        // 毕业年份不一致预警：子码有 graduationYear 且与学生填写不一致 → 生成辅导员核验通知
        Integer codeGradYear = invCode.getGraduationYear();
        if (codeGradYear != null && !codeGradYear.equals(gradYear)) {
            log.warn("[VERIFICATION-CODE-MISMATCH] code={}, counselorUid={}, studentUid={}, studentRealName={}, "
                    + "codeGraduationYear={}, studentGraduationYear={} — 辅导员需核实花名册",
                    code, invCode.getCreatedBy(), userUid, request.getRealName().trim(),
                    codeGradYear, gradYear);

            // 写入审核通知记录（独立申请编号，符合约束格式）
            String datePart = LocalDateTime.now().format(DATE_FORMATTER);
            String alertKey = "APP-" + datePart + "-" + generateApprovalSuffix(uid -> isApplicationIdUnique(uid));
            ApprovalFlow alertFlow = new ApprovalFlow();
            alertFlow.setApprovalKey(alertKey);
            alertFlow.setBusinessType("MENTOR_AUTH");
            alertFlow.setApplicantKey(invCode.getCreatedBy()); // 辅导员 uid
            alertFlow.setTargetKey(entityCode);
            alertFlow.setStatus(0); // 待处理

            Map<String, Object> alertPayload = new LinkedHashMap<>();
            alertPayload.put("type", "verification_code_mismatch");
            alertPayload.put("code", code);
            alertPayload.put("studentUid", userUid);
            alertPayload.put("studentRealName", request.getRealName().trim());
            alertPayload.put("studentId", request.getStudentId().trim());
            alertPayload.put("studentGraduationYear", gradYear);
            alertPayload.put("counselorGraduationYear", codeGradYear);

            try {
                alertFlow.setPayload(OBJECT_MAPPER.writeValueAsString(alertPayload));
            } catch (JsonProcessingException e) {
                alertFlow.setPayload("{}");
            }
            approvalFlowMapper.insert(alertFlow);
        }

        // 原子递增 used_quota
        LambdaUpdateWrapper<VerificationCode> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(VerificationCode::getId, invCode.getId())
                .eq(VerificationCode::getIsActive, 1)
                .lt(VerificationCode::getUsedQuota, invCode.getMaxQuota())
                .setSql("used_quota = used_quota + 1");
        int rows = verificationCodeMapper.update(null, updateWrapper);
        if (rows == 0) {
            throw BusinessException.badRequest("VERIFICATION_CODE_EXHAUSTED");
        }

        // 写入 user_auth_link
        String datePart = LocalDateTime.now().format(DATE_FORMATTER);
        String applicationId = "APP-" + datePart + "-" + generateApprovalSuffix(uid -> isApplicationIdUnique(uid));
        UserOrganizationBinding link = new UserOrganizationBinding();
        link.setUserUid(userUid);
        link.setEntityCode(entityCode);
        link.setRole("STUDENT");
        link.setAuthSerialNo(request.getStudentId().trim());
        link.setAuditStatus("APPROVED");
        link.setIsActive(1);
        link.setRemark("activation via " + code + " grad:" + gradYear);
        userOrganizationBindingMapper.insert(link);

        // 写入毕业年份到 user_profile + 同步 real_name 到 t_user_identity
        UserProfile userProfile = loadProfileByUid(userUid);
        if (userProfile != null) {
            userProfile.setGraduationYear(gradYear);
            userProfileMapper.updateById(userProfile);
        }

        // 写入/更新 real_name 到 t_user_identity
        UserIdentity identity = loadIdentityByUid(userUid);
        if (identity == null) {
            identity = new UserIdentity();
            identity.setUserUid(userUid);
            identity.setEncryptedRealName(request.getRealName().trim());
            identity.setRealNameMask(buildRealNameMask(request.getRealName().trim()));
            identity.setCreatedAt(LocalDateTime.now());
            identity.setUpdatedAt(LocalDateTime.now());
            userIdentityMapper.insert(identity);
        } else {
            identity.setEncryptedRealName(request.getRealName().trim());
            identity.setRealNameMask(buildRealNameMask(request.getRealName().trim()));
            identity.setUpdatedAt(LocalDateTime.now());
            userIdentityMapper.updateById(identity);
        }

        // 写入 sys_approval_flows
        ApprovalFlow flow = new ApprovalFlow();
        flow.setApprovalKey(applicationId);
        flow.setBusinessType("STUDENT_AUTH");
        flow.setApplicantKey(userUid);
        flow.setTargetKey(entityCode);
        flow.setStatus(1);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "verification_code");
        payload.put("code", code);
        payload.put("studentId", request.getStudentId().trim());
        payload.put("realName", request.getRealName().trim());
        payload.put("graduationYear", gradYear);
        try {
            flow.setPayload(OBJECT_MAPPER.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            flow.setPayload("{}");
        }
        approvalFlowMapper.insert(flow);

        return StudentActivateResponse.builder()
                .entityCode(entityCode)
                .entityName(entityName)
                .role("STUDENT")
                .build();
    }

    // ===================== 母码生成（机构管理员） =====================

    /**
     * 机构管理员生成母码。
     * <p>
     * 母码额度默认 1000，可由前端传入自定义值。母码用于辅导员在其下创建子码。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public VerificationCodeGenerateResponse generateMasterCode(
            String authorization, VerificationCodeGenerateRequest request) {

        String entityCode = extractEntityCodeFromToken(authorization);
        if (!StringUtils.hasText(entityCode)) {
            throw BusinessException.unauthorized("认证失败：无法从Token中提取主体代码，请尝试重新登录以获取新的Token");
        }

        TenantOrganization TenantOrganization = loadEntityByCode(entityCode);
        if (TenantOrganization == null || !"ACTIVE".equalsIgnoreCase(TenantOrganization.getAccountStatus())) {
            throw BusinessException.notFound("ENTITY_NOT_FOUND");
        }

        int maxQuota = request.getMaxQuota() == null || request.getMaxQuota() <= 0 ? 1000
                : Math.min(request.getMaxQuota(), 5000);
        // 年份由服务器时间决定
        int year = LocalDateTime.now().getYear();
        String yearPart = String.valueOf(year);
        String serial = String.format("%05d", ThreadLocalRandom.current().nextInt(1, 100000));
        String code = entityCode + "-" + yearPart + "-" + serial;

        // 认证码有效时间：创建日期 + 14 天，当天 23:59:59 失效
        LocalDateTime expireTime = LocalDateTime.of(LocalDate.now().plusDays(14), LocalTime.of(23, 59, 59));
        String expireTimeStr = expireTime.format(DATE_TIME_FORMATTER);

        VerificationCode inv = new VerificationCode();
        inv.setCode(code);
        inv.setEntityCode(entityCode);
        inv.setIsMaster(1);
        inv.setParentId(null);
        inv.setMaxQuota(maxQuota);
        inv.setUsedQuota(0);
        inv.setDescription(StringUtils.hasText(request.getDescription())
                ? request.getDescription().trim() : null);
        inv.setCreatedBy(extractCreatorId(authorization));
        inv.setExpireTime(expireTime);
        inv.setIsActive(1);

        try {
            verificationCodeMapper.insert(inv);
        } catch (DuplicateKeyException e) {
            throw BusinessException.conflict("VERIFICATION_CODE_DUPLICATE");
        }

        return VerificationCodeGenerateResponse.builder()
                .code(code)
                .entityCode(entityCode)
                .graduationYear(year)
                .maxQuota(maxQuota)
                .expireTime(expireTimeStr)
                .build();
    }

    // ===================== 子码生成（辅导员/MENTOR） =====================

    /**
     * 辅导员（COUNSELOR）或导师（MENTOR）在母码下创建子码。
     * <p>
     * 【权限】需 user_auth_link.role = COUNSELOR 或 MENTOR。
     *
     * <p>
     * 【并发安全】使用数据库条件 UPDATE 原子递增母码 used_quota，通过 affected rows 判定额度。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public VerificationCodeGenerateResponse generateSubCode(
            String authorization, VerificationCodeGenerateRequest request) {

        String userUid = accessService.requireCurrentUserUid(authorization);

        // 权限校验：必须是 COUNSELOR（辅导员）
        assertUserHasRole(userUid, "COUNSELOR");

        // 查找母码
        String masterCode = request.getMasterCode();
        if (!StringUtils.hasText(masterCode)) {
            throw BusinessException.badRequest("MASTER_CODE_REQUIRED");
        }
        LambdaQueryWrapper<VerificationCode> masterWrapper = new LambdaQueryWrapper<>();
        masterWrapper.eq(VerificationCode::getCode, masterCode.trim())
                .eq(VerificationCode::getIsMaster, 1)
                .eq(VerificationCode::getIsActive, 1)
                .last("LIMIT 1");
        VerificationCode master = verificationCodeMapper.selectOne(masterWrapper);
        if (master == null) {
            throw BusinessException.notFound("MASTER_CODE_NOT_FOUND");
        }
        if (master.getExpireTime() != null && master.getExpireTime().isBefore(LocalDateTime.now())) {
            throw BusinessException.badRequest("MASTER_CODE_EXPIRED");
        }

        int subMaxQuota = request.getMaxQuota() == null || request.getMaxQuota() <= 0 ? 50
                : Math.min(request.getMaxQuota(), 500);

        // 毕业年份：可选，不填则为 null，不做任何处理
        Integer subGradYear = request.getGraduationYear() != null
                && request.getGraduationYear() >= 1950
                && request.getGraduationYear() <= 2100
                ? request.getGraduationYear() : null;

        // 原子扣减母码额度
        LambdaUpdateWrapper<VerificationCode> masterUpdate = new LambdaUpdateWrapper<>();
        masterUpdate.eq(VerificationCode::getId, master.getId())
                .eq(VerificationCode::getIsActive, 1)
                .le(VerificationCode::getUsedQuota, master.getMaxQuota() - subMaxQuota)
                .setSql("used_quota = used_quota + " + subMaxQuota);
        int rows = verificationCodeMapper.update(null, masterUpdate);
        if (rows == 0) {
            throw BusinessException.badRequest("MASTER_CODE_QUOTA_EXHAUSTED");
        }

        // 生成子码 code
        String subSerial = String.format("%04d", ThreadLocalRandom.current().nextInt(1, 10000));
        String subCode = masterCode + "-" + subSerial;

        // 认证码有效时间：创建日期 + 14 天，当天 23:59:59 失效
        LocalDateTime subExpireTime = LocalDateTime.of(LocalDate.now().plusDays(14), LocalTime.of(23, 59, 59));
        String subExpireTimeStr = subExpireTime.format(DATE_TIME_FORMATTER);

        VerificationCode sub = new VerificationCode();
        sub.setCode(subCode);
        sub.setEntityCode(master.getEntityCode());
        sub.setIsMaster(0);
        sub.setParentId(master.getId());
        sub.setMaxQuota(subMaxQuota);
        sub.setUsedQuota(0);
        sub.setDescription(StringUtils.hasText(request.getDescription())
                ? request.getDescription().trim() : null);
        sub.setGraduationYear(subGradYear);
        sub.setCreatedBy(userUid);
        sub.setExpireTime(subExpireTime);
        sub.setIsActive(1);

        try {
            verificationCodeMapper.insert(sub);
        } catch (DuplicateKeyException e) {
            throw BusinessException.conflict("VERIFICATION_CODE_DUPLICATE");
        }

        return VerificationCodeGenerateResponse.builder()
                .code(subCode)
                .entityCode(master.getEntityCode())
                .graduationYear(subGradYear)
                .maxQuota(subMaxQuota)
                .expireTime(subExpireTimeStr)
                .build();
    }

    // ===================== 认证码管理 API =====================

    /**
     * 获取本机构下的认证码列表（母码+子码）。
     */
    public CodeListResponse listCodes(String authorization) {
        // 尝试提取 entityCode（机构管理员 token）
        String entityCode = extractEntityCodeFromToken(authorization);
        // 若非机构管理员 token，尝试判定当前用户是否为 COUNSELOR
        String userUid = accessService.resolveOptionalCurrentUserUid(authorization);

        boolean isCounselor = StringUtils.hasText(userUid) && userHasRole(userUid, "COUNSELOR");
        if (!StringUtils.hasText(entityCode) && !isCounselor) {
            throw BusinessException.unauthorized("无权限访问认证码列表，请确认登录身份");
        }

        LambdaQueryWrapper<VerificationCode> wrapper = new LambdaQueryWrapper<>();

        if (isCounselor && !StringUtils.hasText(entityCode)) {
            // 辅导员模式：仅返回自己创建的子码
            wrapper.eq(VerificationCode::getCreatedBy, userUid)
                    .eq(VerificationCode::getIsMaster, 0);
        } else {
            // 机构管理员模式：返回本机构所有认证码
            wrapper.eq(VerificationCode::getEntityCode, entityCode);
        }
        wrapper.orderByDesc(VerificationCode::getIsMaster)
                .orderByDesc(VerificationCode::getCreatedAt);

        List<VerificationCode> all = verificationCodeMapper.selectList(wrapper);

        // 批量加载创建者名称（从 t_user_identity 读取 real_name_mask）
        Set<String> creatorUids = all.stream().map(VerificationCode::getCreatedBy)
                .filter(StringUtils::hasText).collect(Collectors.toSet());
        Map<String, String> creatorNameMap = new HashMap<>();
        if (!creatorUids.isEmpty()) {
            List<String> uidList = new ArrayList<>(creatorUids);
            // 批量加载 UserIdentity
            LambdaQueryWrapper<UserIdentity> identityWrapper = new LambdaQueryWrapper<>();
            identityWrapper.in(UserIdentity::getUserUid, uidList);
            List<UserIdentity> identities = userIdentityMapper.selectList(identityWrapper);
            Map<String, UserIdentity> identityMap = new HashMap<>();
            for (UserIdentity id : identities) {
                identityMap.put(id.getUserUid(), id);
            }
            // 批量加载 user_profile（作为 fallback）
            LambdaQueryWrapper<UserProfile> profileWrapper = new LambdaQueryWrapper<>();
            profileWrapper.in(UserProfile::getUserUid, uidList);
            List<UserProfile> profiles = userProfileMapper.selectList(profileWrapper);
            Map<String, UserProfile> profileMap = new HashMap<>();
            for (UserProfile p : profiles) {
                profileMap.put(p.getUserUid(), p);
            }
            for (String uid : uidList) {
                UserIdentity id = identityMap.get(uid);
                String maskedName = null;
                if (id != null && StringUtils.hasText(id.getRealNameMask())) {
                    maskedName = id.getRealNameMask();
                }
                if (StringUtils.hasText(maskedName)) {
                    creatorNameMap.put(uid, maskedName);
                } else {
                    UserProfile p = profileMap.get(uid);
                    creatorNameMap.put(uid,
                            p != null && StringUtils.hasText(p.getNickName()) ? p.getNickName() : "用户");
                }
            }
        }

        List<CodeListItem> items = all.stream().map(c -> {
            boolean active = c.getIsActive() != null && c.getIsActive() == 1
                    && (c.getExpireTime() == null || c.getExpireTime().isAfter(LocalDateTime.now()));
            return CodeListItem.builder()
                    .code(c.getCode())
                    .maxQuota(c.getMaxQuota())
                    .usedQuota(c.getUsedQuota() != null ? c.getUsedQuota() : 0)
                    .description(c.getDescription())
                    .createdBy(c.getCreatedBy())
                    .createdByName(creatorNameMap.getOrDefault(c.getCreatedBy(), "用户"))
                    .isActive(active)
                    .isMaster(c.getIsMaster() != null && c.getIsMaster() == 1)
                    .canRenew(computeCanRenew(c))
                    .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().format(DATE_TIME_FORMATTER) : null)
                    .expireTime(c.getExpireTime() != null ? c.getExpireTime().format(DATE_TIME_FORMATTER) : null)
                    .build();
        }).collect(Collectors.toList());

        return CodeListResponse.builder().codes(items).total(items.size()).build();
    }

    /**
     * 停用认证码（级联停用子码）。
     */
    @Transactional(rollbackFor = Exception.class)
    public void invalidateCode(String authorization, InvalidateCodeRequest request) {
        extractEntityCodeFromToken(authorization); // 权限校验
        if (!StringUtils.hasText(request.getCode())) {
            throw BusinessException.badRequest("CODE_REQUIRED");
        }

        LambdaQueryWrapper<VerificationCode> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VerificationCode::getCode, request.getCode().trim()).last("LIMIT 1");
        VerificationCode code = verificationCodeMapper.selectOne(wrapper);
        if (code == null) {
            throw BusinessException.notFound("CODE_NOT_FOUND");
        }

        // 停用自身
        code.setIsActive(0);
        verificationCodeMapper.updateById(code);

        // 级联停用子码
        if (code.getIsMaster() != null && code.getIsMaster() == 1) {
            LambdaUpdateWrapper<VerificationCode> subUpdate = new LambdaUpdateWrapper<>();
            subUpdate.eq(VerificationCode::getParentId, code.getId())
                    .set(VerificationCode::getIsActive, 0);
            verificationCodeMapper.update(null, subUpdate);
        }
    }

    /**
     * 延期认证码（级联延期子码）。
     */
    @Transactional(rollbackFor = Exception.class)
    public RenewCodeResponse renewCode(String authorization, RenewCodeRequest request) {
        extractEntityCodeFromToken(authorization);
        if (!StringUtils.hasText(request.getCode())) {
            throw BusinessException.badRequest("CODE_REQUIRED");
        }

        LambdaQueryWrapper<VerificationCode> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VerificationCode::getCode, request.getCode().trim()).last("LIMIT 1");
        VerificationCode code = verificationCodeMapper.selectOne(wrapper);
        if (code == null) {
            throw BusinessException.notFound("CODE_NOT_FOUND");
        }
        if (code.getIsActive() == null || code.getIsActive() == 0) {
            throw BusinessException.badRequest("CODE_ALREADY_INACTIVE");
        }

        // 解析目标日期
        LocalDate targetDate;
        try {
            targetDate = LocalDate.parse(request.getNewExpireDate(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            throw BusinessException.badRequest("DATE_FORMAT_INVALID");
        }

        LocalDate today = LocalDate.now();

        // 延期必须向后：目标日期必须晚于当前过期日
        LocalDate minDate = today;
        if (code.getExpireTime() != null) {
            LocalDate currentExpire = code.getExpireTime().toLocalDate();
            // 当前有效期内：最小日期为过期日的下一天；已过期：最小日期为今天
            if (!currentExpire.isBefore(today)) {
                minDate = currentExpire.plusDays(1);
            }
        }
        if (targetDate.isBefore(minDate)) {
            throw BusinessException.badRequest("RENEW_DATE_TOO_EARLY");
        }

        // 目标日期不得超过创建时间 + 28 天（四周）
        LocalDate maxDate = code.getCreatedAt().toLocalDate().plusDays(28);
        if (targetDate.isAfter(maxDate)) {
            throw BusinessException.badRequest("RENEW_DATE_EXCEEDS_MAX");
        }

        // 若已过期超过 7 天，不可延期
        if (code.getExpireTime() != null) {
            LocalDate graceDeadline = code.getExpireTime().toLocalDate().plusDays(7);
            if (today.isAfter(graceDeadline)) {
                throw BusinessException.badRequest("CODE_EXPIRED_TOO_LONG");
            }
        }

        LocalDateTime newExpireTime = LocalDateTime.of(targetDate, LocalTime.of(23, 59, 59));
        String newExpireStr = newExpireTime.format(DATE_TIME_FORMATTER);

        // 延期自身
        code.setExpireTime(newExpireTime);
        code.setIsActive(1);
        verificationCodeMapper.updateById(code);

        // 级联延期子码
        if (code.getIsMaster() != null && code.getIsMaster() == 1) {
            for (VerificationCode sub : loadSubCodes(code.getId())) {
                sub.setExpireTime(newExpireTime);
                sub.setIsActive(1);
                verificationCodeMapper.updateById(sub);
            }
        }

        return RenewCodeResponse.builder().code(code.getCode()).newExpireTime(newExpireStr).build();
    }

    /**
     * 查看认证码的学生列表。
     */
    public CodeStudentResponse listCodeStudents(String authorization, String targetCode) {
        extractEntityCodeFromToken(authorization);
        if (!StringUtils.hasText(targetCode)) {
            throw BusinessException.badRequest("CODE_REQUIRED");
        }

        // 查找认证码
        LambdaQueryWrapper<VerificationCode> codeWrapper = new LambdaQueryWrapper<>();
        codeWrapper.eq(VerificationCode::getCode, targetCode.trim()).last("LIMIT 1");
        VerificationCode code = verificationCodeMapper.selectOne(codeWrapper);
        if (code == null) {
            throw BusinessException.notFound("CODE_NOT_FOUND");
        }

        // 获取子码集合
        List<String> subCodes = new ArrayList<>();
        List<VerificationCode> subList;
        if (code.getIsMaster() != null && code.getIsMaster() == 1) {
            subList = loadSubCodes(code.getId());
        } else {
            subList = List.of(code);
        }
        for (VerificationCode sc : subList) {
            subCodes.add(sc.getCode());
        }

        // 查询通过这些子码激活的学生（在 user_auth_link 的 remark 中包含子码）
        List<CodeStudentItem> students = new ArrayList<>();
        for (String sc : subCodes) {
            LambdaQueryWrapper<UserOrganizationBinding> linkWrapper = new LambdaQueryWrapper<>();
            linkWrapper.eq(UserOrganizationBinding::getRole, "STUDENT")
                    .eq(UserOrganizationBinding::getAuditStatus, "APPROVED")
                    .like(UserOrganizationBinding::getRemark, sc)
                    .last("LIMIT 500");
            List<UserOrganizationBinding> links = userOrganizationBindingMapper.selectList(linkWrapper);
            for (UserOrganizationBinding link : links) {
                UserProfile profile = loadProfileByUid(link.getUserUid());
                UserIdentity identity = loadIdentityByUid(link.getUserUid());
                students.add(CodeStudentItem.builder()
                        .uid(link.getUserUid())
                        .nickname(profile != null && StringUtils.hasText(profile.getNickName()) ? profile.getNickName() : "用户")
                        .realNameMask(identity != null ? identity.getRealNameMask() : null)
                        .studentId(link.getAuthSerialNo())
                        .graduationYear(profile != null ? profile.getGraduationYear() : null)
                        .subCode(sc)
                        .activatedAt(link.getCreatedAt() != null ? link.getCreatedAt().format(DATE_TIME_FORMATTER) : null)
                        .build());
            }
        }

        return CodeStudentResponse.builder().students(students).total(students.size()).build();
    }

    /**
     * 查看母码下的附属子码列表。
     */
    public CodeListResponse listSubCodes(String authorization, String masterCode) {
        extractEntityCodeFromToken(authorization);
        if (!StringUtils.hasText(masterCode)) {
            throw BusinessException.badRequest("MASTER_CODE_REQUIRED");
        }

        LambdaQueryWrapper<VerificationCode> masterWrapper = new LambdaQueryWrapper<>();
        masterWrapper.eq(VerificationCode::getCode, masterCode.trim())
                .eq(VerificationCode::getIsMaster, 1).last("LIMIT 1");
        VerificationCode master = verificationCodeMapper.selectOne(masterWrapper);
        if (master == null) {
            throw BusinessException.notFound("CODE_NOT_FOUND");
        }

        List<VerificationCode> subs = loadSubCodes(master.getId());
        Map<String, String> creatorNameMap = new HashMap<>();
        Set<String> uids = subs.stream().map(VerificationCode::getCreatedBy)
                .filter(StringUtils::hasText).collect(Collectors.toSet());
        if (!uids.isEmpty()) {
            List<String> uidList = new ArrayList<>(uids);
            LambdaQueryWrapper<UserIdentity> identityWrapper = new LambdaQueryWrapper<>();
            identityWrapper.in(UserIdentity::getUserUid, uidList);
            List<UserIdentity> identities = userIdentityMapper.selectList(identityWrapper);
            Map<String, UserIdentity> identityMap = new HashMap<>();
            for (UserIdentity id : identities) {
                identityMap.put(id.getUserUid(), id);
            }
            LambdaQueryWrapper<UserProfile> pw = new LambdaQueryWrapper<>();
            pw.in(UserProfile::getUserUid, uidList);
            Map<String, UserProfile> profileMap = new HashMap<>();
            userProfileMapper.selectList(pw).forEach(p ->
                profileMap.put(p.getUserUid(), p));
            for (String uid : uidList) {
                UserIdentity id = identityMap.get(uid);
                String maskedName = null;
                if (id != null && StringUtils.hasText(id.getRealNameMask())) {
                    maskedName = id.getRealNameMask();
                }
                if (StringUtils.hasText(maskedName)) {
                    creatorNameMap.put(uid, maskedName);
                } else {
                    UserProfile p = profileMap.get(uid);
                    creatorNameMap.put(uid,
                            p != null && StringUtils.hasText(p.getNickName()) ? p.getNickName() : "用户");
                }
            }
        }

        List<CodeListItem> items = subs.stream().map(c -> {
            boolean active = c.getIsActive() != null && c.getIsActive() == 1
                    && (c.getExpireTime() == null || c.getExpireTime().isAfter(LocalDateTime.now()));
            return CodeListItem.builder()
                    .code(c.getCode())
                    .maxQuota(c.getMaxQuota())
                    .usedQuota(c.getUsedQuota() != null ? c.getUsedQuota() : 0)
                    .description(c.getDescription())
                    .createdBy(c.getCreatedBy())
                    .createdByName(creatorNameMap.getOrDefault(c.getCreatedBy(), "用户"))
                    .isActive(active)
                    .isMaster(false)
                    .canRenew(computeCanRenew(c))
                    .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().format(DATE_TIME_FORMATTER) : null)
                    .expireTime(c.getExpireTime() != null ? c.getExpireTime().format(DATE_TIME_FORMATTER) : null)
                    .build();
        }).collect(Collectors.toList());

        return CodeListResponse.builder().codes(items).total(items.size()).build();
    }

    // ===================== 工具方法 =====================

    /**
     * 判断认证码是否可以延期：
     * 人为停用（is_active=0）不可延期；
     * 当前日期超过创建时间+28天不可延期；
     * 7天内自动过期的可延期。
     */
    private boolean computeCanRenew(VerificationCode code) {
        if (code.getIsActive() == null || code.getIsActive() == 0) return false;
        if (code.getExpireTime() == null) return false;
        LocalDate today = LocalDate.now();
        // 超过创建时间 + 28 天，不可延期
        if (code.getCreatedAt() != null && today.isAfter(code.getCreatedAt().toLocalDate().plusDays(28))) return false;
        // 已过期超过 7 天不可延期
        return !code.getExpireTime().toLocalDate().plusDays(7).isBefore(today);
    }

    private List<VerificationCode> loadSubCodes(Long parentId) {
        LambdaQueryWrapper<VerificationCode> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VerificationCode::getParentId, parentId);
        return verificationCodeMapper.selectList(wrapper);
    }

    /**
     * 从 Authorization 头提取 CLIENT_ORG token 对应的 entity_code。
     */
    private String extractEntityCodeFromToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) return null;
        try {
            String userType = jwtUtil.getUserType(token);
            if (!"CLIENT_ORG".equals(userType)) return null;
            String subject = jwtUtil.getUserId(token);
            if (subject == null || subject.isBlank()) return null;
            subject = subject.trim();

            // 主体根账号登录：subject 本身就是 entityCode
            if (!subject.matches("^EA[A-Za-z0-9]{11}$")) {
                return subject;
            }

            // 管理员账号：通过 adminUid 反查 entityCode
            LambdaQueryWrapper<EntityTotpCredentials> w = new LambdaQueryWrapper<>();
            w.eq(EntityTotpCredentials::getAdminUid, subject).last("LIMIT 1");
            EntityTotpCredentials admin = entityTotpCredentialsMapper.selectOne(w);
            if (admin != null && StringUtils.hasText(admin.getEntityCode())) {
                return admin.getEntityCode();
            }

            // 反查失败：监控告警
            log.warn("[AUTH] 管理员 adminUid={} 在 sys_entity_totp_credentials 表中未找到对应记录，"
                    + "token 可能来自已删除的管理员账号，或数据库种子数据缺失。"
                    + "请检查 sys_entity_totp_credentials 表中是否存在 admin_uid='{}' 的记录", subject, subject);
            return null;
        } catch (Exception e) {
            log.warn("[AUTH] Token 解析失败", e);
            return null;
        }
    }

    private String lookupEntityCodeByAdminUid(String adminUid) {
        LambdaQueryWrapper<EntityTotpCredentials> w = new LambdaQueryWrapper<>();
        w.eq(EntityTotpCredentials::getAdminUid, adminUid).last("LIMIT 1");
        EntityTotpCredentials admin = entityTotpCredentialsMapper.selectOne(w);
        return admin != null ? admin.getEntityCode() : null;
    }

    /**
     * 从 Authorization 头提取当前用户的标识（CLIENT_USER → userUid；CLIENT_ORG → entityCode）。
     */
    private String extractCreatorId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return "unknown";
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) return "unknown";
        try {
            String subject = jwtUtil.getUserId(token);
            return (subject != null && !subject.isBlank()) ? subject.trim() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /**
     * 校验用户是否具有指定角色之一（COUNSELOR / MENTOR）。
     */
    private void assertUserHasRole(String userUid, String... allowedRoles) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getAuditStatus, "APPROVED")
                .eq(UserOrganizationBinding::getIsActive, 1)
                .in(UserOrganizationBinding::getRole, (Object[]) allowedRoles)
                .last("LIMIT 1");
        if (userOrganizationBindingMapper.selectOne(wrapper) == null) {
            throw BusinessException.forbidden("ROLE_NOT_ALLOWED");
        }
    }

    /** 返回用户是否具有指定角色之一（非抛出版本）。 */
    private boolean userHasRole(String userUid, String... allowedRoles) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getAuditStatus, "APPROVED")
                .eq(UserOrganizationBinding::getIsActive, 1)
                .in(UserOrganizationBinding::getRole, (Object[]) allowedRoles)
                .last("LIMIT 1");
        return userOrganizationBindingMapper.selectOne(wrapper) != null;
    }

    // ===================== 私有辅助方法 =====================

    private TenantOrganization loadEntityByCode(String entityCode) {
        LambdaQueryWrapper<TenantOrganization> w = new LambdaQueryWrapper<>();
        w.eq(TenantOrganization::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrganizationMapper.selectOne(w);
    }

    private TenantOrgProfile loadEntityProfileByCode(String entityCode) {
        LambdaQueryWrapper<TenantOrgProfile> w = new LambdaQueryWrapper<>();
        w.eq(TenantOrgProfile::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrgProfileMapper.selectOne(w);
    }

    private UserProfile loadProfileByUid(String userUid) {
        LambdaQueryWrapper<UserProfile> w = new LambdaQueryWrapper<>();
        w.eq(UserProfile::getUserUid, userUid).last("LIMIT 1");
        return userProfileMapper.selectOne(w);
    }

    private UserIdentity loadIdentityByUid(String userUid) {
        LambdaQueryWrapper<UserIdentity> w = new LambdaQueryWrapper<>();
        w.eq(UserIdentity::getUserUid, userUid).last("LIMIT 1");
        return userIdentityMapper.selectOne(w);
    }

    /**
     * 基于真实姓名构建脱敏显示名，规则：
     * 中文 2 字 → "张*"；中文 3 字及以上 → "张*李"
     * 英文 → 首字母 + "***" + 尾字母
     * 其他 → 仅显示首字符 + "***"
     */
    private String buildRealNameMask(String realName) {
        if (!StringUtils.hasText(realName)) return null;
        String name = realName.trim();
        int len = name.length();
        // 判断是否以中文字符开头
        boolean isChinese = Character.UnicodeScript.of(name.charAt(0)) == Character.UnicodeScript.HAN;
        if (isChinese) {
            if (len == 1) {
                return name + "*";
            } else if (len == 2) {
                return name.charAt(0) + "*";
            } else {
                return name.charAt(0) + "*" + name.charAt(len - 1);
            }
        }
        // 英文/其他
        if (len == 1) {
            return name + "***";
        } else {
            return name.charAt(0) + "***" + name.charAt(len - 1);
        }
    }

    private String loadEntityType(String entityCode) {
        TenantOrgProfile p = loadEntityProfileByCode(entityCode);
        return p != null ? p.getType() : null;
    }

    private boolean isApplicationIdUnique(String appUid) {
        LambdaQueryWrapper<UserOrganizationBinding> w = new LambdaQueryWrapper<>();
        w.eq(UserOrganizationBinding::getAuthSerialNo, appUid);
        return userOrganizationBindingMapper.selectCount(w) == 0;
    }

    private String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 8) return idCard;
        return idCard.substring(0, 6) + "********" + idCard.substring(idCard.length() - 4);
    }

    /** 本地 mock 核身记录 */
    private record FaceRecord(String userUid, String realName, String idCard, LocalDateTime createdAt) {}

    /**
     * 生成审批单后缀（11 位 NanoID，去重后拼接为完整 approval_key）。
     */
    private String generateApprovalSuffix(java.util.function.Predicate<String> uniquenessChecker) {
        return com.aventrix.jnanoid.jnanoid.NanoIdUtils.randomNanoId(
                new java.security.SecureRandom(),
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray(),
                11);
    }

    /**
     * 构建教职工认证审批单的 payload JSON。
     */
    private String buildStaffPayload(StaffApplyRequest request) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("realName", request.getRealName().trim());
            payload.put("staffNumber", request.getStaffNumber().trim());
            payload.put("entityCode", request.getEntityCode().trim());
            return OBJECT_MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
