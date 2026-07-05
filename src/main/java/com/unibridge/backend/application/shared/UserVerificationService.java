package com.unibridge.backend.application.shared;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 用户认证状态查询服务（共享模块）。
 * <p>
 * 统一三级认证状态判定，供 menu、笔记作者栏、Feed 卡片等各处复用：
 * </p>
 * <ul>
 *     <li>{@link #resolveVerifyStatus(String)} — 三级状态码</li>
 *     <li>{@link #resolveVerifiedOrganization(String)} — 已认证时返回机构名，否则空串</li>
 * </ul>
 */
@Component
public class UserVerificationService {

    public static final String STATUS_VERIFIED = "verified";
    public static final String STATUS_IDENTITY_ONLY = "identity_only";
    public static final String STATUS_UNVERIFIED = "unverified";

    private static final String AUDIT_STATUS_APPROVED = "APPROVED";

    private final UserIdentityMapper userIdentityMapper;
    private final UserOrganizationBindingMapper userOrganizationBindingMapper;
    private final TenantOrgProfileMapper tenantOrgProfileMapper;

    public UserVerificationService(UserIdentityMapper userIdentityMapper,
                                   UserOrganizationBindingMapper userOrganizationBindingMapper,
                                   TenantOrgProfileMapper tenantOrgProfileMapper) {
        this.userIdentityMapper = userIdentityMapper;
        this.userOrganizationBindingMapper = userOrganizationBindingMapper;
        this.tenantOrgProfileMapper = tenantOrgProfileMapper;
    }

    /**
     * 三级认证状态码。
     * <ul>
     *   <li>{@code "verified"} — 实名认证 + 组织绑定审核均通过</li>
     *   <li>{@code "identity_only"} — 仅实名认证通过，组织未绑定或未审核</li>
     *   <li>{@code "unverified"} — 未实名认证</li>
     * </ul>
     */
    public String resolveVerifyStatus(String userUid) {
        if (userUid == null || userUid.isBlank()) {
            return STATUS_UNVERIFIED;
        }

        boolean identityVerified = isIdentityVerified(userUid);
        boolean orgApproved = isOrgBindingApproved(userUid);

        if (identityVerified && orgApproved) return STATUS_VERIFIED;
        if (identityVerified) return STATUS_IDENTITY_ONLY;
        return STATUS_UNVERIFIED;
    }

    /** 实名身份认证是否已完成（{@code user_identity.verified_at IS NOT NULL}）。 */
    public boolean isIdentityVerified(String userUid) {
        UserIdentity identity = loadUserIdentity(userUid);
        return identity != null && identity.getVerifiedAt() != null;
    }

    /** 组织绑定是否已审核通过（{@code audit_status = 'APPROVED' AND is_active = 1}）。 */
    public boolean isOrgBindingApproved(String userUid) {
        return loadApprovedBinding(userUid) != null;
    }

    /** 已审核通过的组织绑定角色；无则返回 {@code null}。 */
    public String resolveApprovedRole(String userUid) {
        UserOrganizationBinding binding = loadApprovedBinding(userUid);
        if (binding == null || !StringUtils.hasText(binding.getRole())) {
            return null;
        }
        return binding.getRole().trim();
    }

    /**
     * 个人空间 Sidebar 展示文案：{@code 已实名} / {@code 学校已认证} / {@code 企业已认证} / 空串。
     */
    public String resolveVerifyStatusDisplayLabel(String userUid) {
        String status = resolveVerifyStatus(userUid);
        if (STATUS_VERIFIED.equals(status)) {
            UserOrganizationBinding binding = loadApprovedBinding(userUid);
            if (binding != null && StringUtils.hasText(binding.getRole())
                    && "PM".equalsIgnoreCase(binding.getRole().trim())) {
                return "企业已认证";
            }
            return "学校已认证";
        }
        if (STATUS_IDENTITY_ONLY.equals(status)) {
            return "已实名";
        }
        return "";
    }

    /** 未完成实名认证时抛出 {@code USER_NOT_VERIFIED}（403）。 */
    public void requireIdentityVerified(String userUid) {
        if (!isIdentityVerified(userUid)) {
            throw BusinessException.forbidden("USER_NOT_VERIFIED");
        }
    }

    /** 组织绑定未审核通过时抛出 {@code USER_NOT_VERIFIED}（403）。 */
    public void requireOrgBindingApproved(String userUid) {
        if (!isOrgBindingApproved(userUid)) {
            throw BusinessException.forbidden("USER_NOT_VERIFIED");
        }
    }

    /** 正式发布项目前：须已完成实名且机构绑定审核通过。 */
    public void requireVerifiedForProjectPublish(String userUid) {
        requireIdentityVerified(userUid);
        requireOrgBindingApproved(userUid);
    }

    /**
     * 获取已认证的机构名称。
     * <p>仅当 {@link #resolveVerifyStatus(String)} 为 {@code "verified"} 时返回机构名，否则返回空字符串。</p>
     */
    public String resolveVerifiedOrganization(String userUid) {
        if (!STATUS_VERIFIED.equals(resolveVerifyStatus(userUid))) {
            return "";
        }
        UserOrganizationBinding link = loadApprovedBinding(userUid);
        if (link == null || !StringUtils.hasText(link.getEntityCode())) {
            return "";
        }
        TenantOrgProfile entityProfile = loadEntityProfile(link.getEntityCode());
        if (entityProfile != null && StringUtils.hasText(entityProfile.getName())) {
            return entityProfile.getName();
        }
        return link.getEntityCode();
    }

    // ======================== DB lookups ========================

    private UserIdentity loadUserIdentity(String userUid) {
        LambdaQueryWrapper<UserIdentity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserIdentity::getUserUid, userUid).last("LIMIT 1");
        return userIdentityMapper.selectOne(wrapper);
    }

    private UserOrganizationBinding loadApprovedBinding(String userUid) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getAuditStatus, AUDIT_STATUS_APPROVED)
                .eq(UserOrganizationBinding::getIsActive, 1)
                .last("LIMIT 1");
        return userOrganizationBindingMapper.selectOne(wrapper);
    }

    private TenantOrgProfile loadEntityProfile(String entityCode) {
        LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrgProfile::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrgProfileMapper.selectOne(wrapper);
    }
}
