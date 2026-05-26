package com.unibridge.backend.domain.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.infrastructure.entities.SysEntityTotpCredentials;
import com.unibridge.backend.infrastructure.persistence.mapper.SysEntityTotpCredentialsMapper;
import com.unibridge.backend.infrastructure.util.EntityAdminUidGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * 主体管理员密码匹配与唯一性校验。
 * <p>
 * {@link EntityAdminAccountStatus#ACTIVE}：已绑定 TOTP、占用名额、可登录；<br>
 * {@link EntityAdminAccountStatus#PENDING}：仅登记待绑定，不占用名额、不可登录。
 */
@Service
public class EntityAdminCredentialService {

    @Autowired
    private SysEntityTotpCredentialsMapper sysEntityTotpCredentialsMapper;

    /**
     * 在指定主体下，按密码匹配唯一已激活管理员（不含 PENDING）。
     */
    public SysEntityTotpCredentials matchActiveAdminByPassword(String entityCode, String passwordHash) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(passwordHash)) {
            return null;
        }
        List<SysEntityTotpCredentials> matched = listActiveEntityAdmins(entityCode).stream()
                .filter(admin -> Objects.equals(admin.getPasswordHash(), passwordHash))
                .toList();
        if (matched.isEmpty()) {
            return null;
        }
        if (matched.size() > 1) {
            throw new RuntimeException("ORGANIZATION_ADMIN_PASSWORD_AMBIGUOUS");
        }
        return matched.getFirst();
    }

    public void assertAdminPasswordAvailable(
            String entityCode,
            String passwordHash,
            String entityRootPasswordHash,
            String excludeAdminUid) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(passwordHash)) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        if (Objects.equals(passwordHash, entityRootPasswordHash)) {
            throw new RuntimeException("ORGANIZATION_ADMIN_PASSWORD_DUPLICATE");
        }
        boolean duplicate = listNonDeactivatedEntityAdmins(entityCode).stream()
                .filter(admin -> excludeAdminUid == null
                        || !Objects.equals(admin.getAdminUid(), excludeAdminUid.trim()))
                .anyMatch(admin -> Objects.equals(admin.getPasswordHash(), passwordHash));
        if (duplicate) {
            throw new RuntimeException("ORGANIZATION_ADMIN_PASSWORD_DUPLICATE");
        }
    }

    /** 已激活管理员数量（占用名额上限 3）。 */
    public int countActiveEntityAdmins(String entityCode) {
        return listActiveEntityAdmins(entityCode).size();
    }

    /** 已完成 TOTP 绑定的已激活管理员数。 */
    public int countBoundEntityAdmins(String entityCode) {
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getEntityCode, entityCode)
                .eq(SysEntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .isNotNull(SysEntityTotpCredentials::getTotpSecret)
                .ne(SysEntityTotpCredentials::getTotpSecret, "");
        Long count = sysEntityTotpCredentialsMapper.selectCount(wrapper);
        return count == null ? 0 : Math.toIntExact(count);
    }

    public boolean hasActivePrimaryAdmin(String entityCode) {
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getEntityCode, entityCode)
                .eq(SysEntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .eq(SysEntityTotpCredentials::getIsPrimary, 1)
                .last("LIMIT 1");
        return sysEntityTotpCredentialsMapper.selectOne(wrapper) != null;
    }

    public boolean adminUidExists(String adminUid) {
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getAdminUid, adminUid).last("LIMIT 1");
        return sysEntityTotpCredentialsMapper.selectOne(wrapper) != null;
    }

    public String generateAdminUid() {
        return EntityAdminUidGenerator.generate(uid -> !adminUidExists(uid));
    }

    /** 已激活（ACTIVE）管理员。 */
    public List<SysEntityTotpCredentials> listActiveEntityAdmins(String entityCode) {
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getEntityCode, entityCode)
                .eq(SysEntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .orderByDesc(SysEntityTotpCredentials::getIsPrimary)
                .orderByAsc(SysEntityTotpCredentials::getId);
        return sysEntityTotpCredentialsMapper.selectList(wrapper);
    }

    /**
     * 待绑定 TOTP 的管理员：PENDING，或历史种子数据中 ACTIVE 但未绑定 TOTP。
     */
    public List<SysEntityTotpCredentials> listBindableEntityAdmins(String entityCode) {
        return listNonDeactivatedEntityAdmins(entityCode).stream()
                .filter(this::isBindableAdmin)
                .toList();
    }

    public List<SysEntityTotpCredentials> listNonDeactivatedEntityAdmins(String entityCode) {
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getEntityCode, entityCode)
                .ne(SysEntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.DEACTIVATED)
                .orderByDesc(SysEntityTotpCredentials::getIsPrimary)
                .orderByAsc(SysEntityTotpCredentials::getId);
        return sysEntityTotpCredentialsMapper.selectList(wrapper);
    }

    public SysEntityTotpCredentials loadActiveAdmin(String entityCode, String adminUid) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(adminUid)) {
            return null;
        }
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getEntityCode, entityCode)
                .eq(SysEntityTotpCredentials::getAdminUid, adminUid.trim())
                .eq(SysEntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .last("LIMIT 1");
        return sysEntityTotpCredentialsMapper.selectOne(wrapper);
    }

    /** 绑定 TOTP 流程中加载管理员（含 PENDING）。 */
    public SysEntityTotpCredentials loadAdminForTotpSetup(String entityCode, String adminUid) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(adminUid)) {
            return null;
        }
        SysEntityTotpCredentials admin = loadEntityAdminByUid(adminUid.trim());
        if (admin == null || !Objects.equals(admin.getEntityCode(), entityCode)) {
            return null;
        }
        if (EntityAdminAccountStatus.DEACTIVATED.equalsIgnoreCase(admin.getAccountStatus())) {
            return null;
        }
        if (!isBindableAdmin(admin)) {
            return null;
        }
        return admin;
    }

    public SysEntityTotpCredentials loadEntityAdminByUid(String adminUid) {
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getAdminUid, adminUid.trim()).last("LIMIT 1");
        return sysEntityTotpCredentialsMapper.selectOne(wrapper);
    }

    /**
     * 注销同主体下未完成的 PENDING 登记，避免失败重试占满密码或残留脏数据。
     */
    public void deactivateStalePendingAdmins(String entityCode, String exceptAdminUid) {
        LambdaUpdateWrapper<SysEntityTotpCredentials> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getEntityCode, entityCode)
                .eq(SysEntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.PENDING);
        if (StringUtils.hasText(exceptAdminUid)) {
            wrapper.ne(SysEntityTotpCredentials::getAdminUid, exceptAdminUid.trim());
        }
        SysEntityTotpCredentials patch = new SysEntityTotpCredentials();
        patch.setAccountStatus(EntityAdminAccountStatus.DEACTIVATED);
        patch.setAccountStatusChangedAt(LocalDateTime.now());
        patch.setIsPrimary(0);
        sysEntityTotpCredentialsMapper.update(patch, wrapper);
    }

    public void createEntityAdmin(SysEntityTotpCredentials admin, String entityRootPasswordHash) {
        if (admin == null || !StringUtils.hasText(admin.getEntityCode()) || !StringUtils.hasText(admin.getPasswordHash())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        assertAdminPasswordAvailable(
                admin.getEntityCode(), admin.getPasswordHash(), entityRootPasswordHash, null);
        sysEntityTotpCredentialsMapper.insert(admin);
    }

    public void updateEntityAdminPassword(
            String entityCode,
            String adminUid,
            String newPasswordHash,
            String entityRootPasswordHash) {
        assertAdminPasswordAvailable(entityCode, newPasswordHash, entityRootPasswordHash, adminUid);
        SysEntityTotpCredentials patch = new SysEntityTotpCredentials();
        patch.setPasswordHash(newPasswordHash);
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getEntityCode, entityCode)
                .eq(SysEntityTotpCredentials::getAdminUid, adminUid.trim());
        sysEntityTotpCredentialsMapper.update(patch, wrapper);
    }

    private boolean isBindableAdmin(SysEntityTotpCredentials admin) {
        if (admin == null) {
            return false;
        }
        String status = admin.getAccountStatus() == null ? "" : admin.getAccountStatus().trim().toUpperCase();
        if (EntityAdminAccountStatus.PENDING.equals(status)) {
            return !StringUtils.hasText(admin.getTotpSecret());
        }
        if (EntityAdminAccountStatus.ACTIVE.equals(status)) {
            return !StringUtils.hasText(admin.getTotpSecret());
        }
        return false;
    }
}
