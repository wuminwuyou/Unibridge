package com.unibridge.backend.domain.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.infrastructure.entities.auth.TenantOrganization;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.entities.auth.EntityTotpCredentials;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.TenantOrganizationMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.EntityTotpCredentialsMapper;
import com.unibridge.backend.infrastructure.util.EntityAdminUidGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * 主体管理员密码匹配与唯一性校验。
 * <p>
 * {@link EntityAdminAccountStatus#ACTIVE}：已绑定 TOTP、占用名额、可登录；<br>
 * {@link EntityAdminAccountStatus#PENDING}：仅登记待绑定，不占用名额、不可登录。
 * <p>
 * 【并发安全】本类中所有密码重复校验（matchActiveAdminByPassword / assertAdminPasswordAvailable）
 * 均为"先查后写"模式，存在 TOCTOU 竞态。由于 {@code sys_entity_totp_credentials} 表
 * 未设置 {@code (entity_code, password_hash)} 唯一约束，并发插入时可能产生重复密码。
 * 调用方（{@link AuthService}）已使用 {@code DuplicateKeyException} 兜底，
 * 并在 {@code createEntityAdmin} 中通过事务隔离提供额外保护。
 * 建议后续在数据库层面添加联合唯一索引以彻底消除此竞态。
 * </p>
 */
@Service
public class EntityAdminCredentialService {

    @Autowired
    private EntityTotpCredentialsMapper entityTotpCredentialsMapper;

    @Autowired
    private TenantOrganizationMapper tenantOrganizationMapper;

    @Autowired
    private UserMapper userMapper;

    /**
     * 在指定主体下，按密码匹配唯一已激活管理员（不含 PENDING）。
     */
    public EntityTotpCredentials matchActiveAdminByPassword(String entityCode, String passwordHash) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(passwordHash)) {
            return null;
        }
        List<EntityTotpCredentials> matched = listActiveEntityAdmins(entityCode).stream()
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
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getEntityCode, entityCode)
                .eq(EntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .isNotNull(EntityTotpCredentials::getTotpSecret)
                .ne(EntityTotpCredentials::getTotpSecret, "");
        Long count = entityTotpCredentialsMapper.selectCount(wrapper);
        return count == null ? 0 : Math.toIntExact(count);
    }

    public boolean hasActivePrimaryAdmin(String entityCode) {
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getEntityCode, entityCode)
                .eq(EntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .eq(EntityTotpCredentials::getIsPrimary, 1)
                .last("LIMIT 1");
        return entityTotpCredentialsMapper.selectOne(wrapper) != null;
    }

    public boolean adminUidExists(String adminUid) {
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getAdminUid, adminUid).last("LIMIT 1");
        return entityTotpCredentialsMapper.selectOne(wrapper) != null;
    }

    public String generateAdminUid() {
        return EntityAdminUidGenerator.generate(uid -> !adminUidExists(uid));
    }

    /** 已激活（ACTIVE）管理员。 */
    public List<EntityTotpCredentials> listActiveEntityAdmins(String entityCode) {
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getEntityCode, entityCode)
                .eq(EntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .orderByDesc(EntityTotpCredentials::getIsPrimary)
                .orderByAsc(EntityTotpCredentials::getId);
        return entityTotpCredentialsMapper.selectList(wrapper);
    }

    /**
     * 待绑定 TOTP 的管理员：PENDING，或历史种子数据中 ACTIVE 但未绑定 TOTP。
     */
    public List<EntityTotpCredentials> listBindableEntityAdmins(String entityCode) {
        return listNonDeactivatedEntityAdmins(entityCode).stream()
                .filter(this::isBindableAdmin)
                .toList();
    }

    /**
     * 主体根密码 {@code admin_select} 列表：未达标时返回待绑定；已达标时返回已绑定 TOTP 的 ACTIVE 管理员（供登录选择）。
     */
    public List<EntityTotpCredentials> listAdminsForEntityRootSelect(
            String entityCode, int boundAdminCount, int minBoundCount) {
        if (boundAdminCount < minBoundCount) {
            return listBindableEntityAdmins(entityCode);
        }
        return listActiveEntityAdmins(entityCode).stream()
                .filter(admin -> StringUtils.hasText(admin.getTotpSecret()))
                .toList();
    }

    public List<EntityTotpCredentials> listNonDeactivatedEntityAdmins(String entityCode) {
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getEntityCode, entityCode)
                .ne(EntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.DEACTIVATED)
                .orderByDesc(EntityTotpCredentials::getIsPrimary)
                .orderByAsc(EntityTotpCredentials::getId);
        return entityTotpCredentialsMapper.selectList(wrapper);
    }

    public EntityTotpCredentials loadActiveAdmin(String entityCode, String adminUid) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(adminUid)) {
            return null;
        }
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getEntityCode, entityCode)
                .eq(EntityTotpCredentials::getAdminUid, adminUid.trim())
                .eq(EntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.ACTIVE)
                .last("LIMIT 1");
        return entityTotpCredentialsMapper.selectOne(wrapper);
    }

    /** 绑定 TOTP 流程中加载管理员（含 PENDING）。 */
    public EntityTotpCredentials loadAdminForTotpSetup(String entityCode, String adminUid) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(adminUid)) {
            return null;
        }
        EntityTotpCredentials admin = loadEntityAdminByUid(adminUid.trim());
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

    public EntityTotpCredentials loadEntityAdminByUid(String adminUid) {
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getAdminUid, adminUid.trim()).last("LIMIT 1");
        return entityTotpCredentialsMapper.selectOne(wrapper);
    }

    /** 主体根 {@code admin_select} 后加载所选管理员（含待绑定 PENDING 与已绑定 ACTIVE）。 */
    public EntityTotpCredentials loadAdminForEntityRootSelect(String entityCode, String adminUid) {
        if (!StringUtils.hasText(entityCode) || !StringUtils.hasText(adminUid)) {
            return null;
        }
        EntityTotpCredentials admin = loadEntityAdminByUid(adminUid.trim());
        if (admin == null || !Objects.equals(admin.getEntityCode(), entityCode)) {
            return null;
        }
        if (EntityAdminAccountStatus.DEACTIVATED.equalsIgnoreCase(admin.getAccountStatus())) {
            return null;
        }
        if (StringUtils.hasText(admin.getTotpSecret())) {
            return EntityAdminAccountStatus.ACTIVE.equalsIgnoreCase(admin.getAccountStatus()) ? admin : null;
        }
        return isBindableAdmin(admin) ? admin : null;
    }

    /**
     * 注销同主体下未完成的 PENDING 登记，避免失败重试占满密码或残留脏数据。
     */
    public void deactivateStalePendingAdmins(String entityCode, String exceptAdminUid) {
        LambdaUpdateWrapper<EntityTotpCredentials> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(EntityTotpCredentials::getEntityCode, entityCode)
                .eq(EntityTotpCredentials::getAccountStatus, EntityAdminAccountStatus.PENDING);
        if (StringUtils.hasText(exceptAdminUid)) {
            wrapper.ne(EntityTotpCredentials::getAdminUid, exceptAdminUid.trim());
        }
        EntityTotpCredentials patch = new EntityTotpCredentials();
        patch.setAccountStatus(EntityAdminAccountStatus.DEACTIVATED);
        patch.setAccountStatusChangedAt(LocalDateTime.now());
        patch.setIsPrimary(0);
        entityTotpCredentialsMapper.update(patch, wrapper);
    }

    /**
     * 创建管理员记录。
     * <p>
     * 【并发安全】由于 {@code (entity_code, password_hash)} 无数据库唯一约束，
     * 存在 TOCTOU 竞态：并发 insert 同一密码+实体时，可能绕过程序级校验产生重复。
     * 调用方（如 {@link AuthService#registerOrganizationAdmin}）已使用
     * {@code DuplicateKeyException} 兜底捕获。
     * 建议后续添加数据库联合唯一索引 {@code uk_entity_password (entity_code, password_hash)}
     * 从根本上消除此竞态。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public void createEntityAdmin(EntityTotpCredentials admin, String entityRootPasswordHash) {
        if (admin == null || !StringUtils.hasText(admin.getEntityCode()) || !StringUtils.hasText(admin.getPasswordHash())) {
            throw new RuntimeException("ORGANIZATION_FIELDS_REQUIRED");
        }
        assertAdminPasswordAvailable(
                admin.getEntityCode(), admin.getPasswordHash(), entityRootPasswordHash, null);
        entityTotpCredentialsMapper.insert(admin);
    }

    /**
     * 更新管理员密码。
     * <p>
     * 【并发安全】先检查密码可用性，再执行 UPDATE。同样存在 TOCTOU 问题，
     * 建议数据库层面添加唯一约束兜底。同一管理员不能有重复密码的约束通过
     * {@code excludeAdminUid} 排除自身。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateEntityAdminPassword(
            String entityCode,
            String adminUid,
            String newPasswordHash,
            String entityRootPasswordHash) {
        assertAdminPasswordAvailable(entityCode, newPasswordHash, entityRootPasswordHash, adminUid);
        EntityTotpCredentials patch = new EntityTotpCredentials();
        patch.setPasswordHash(newPasswordHash);
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getEntityCode, entityCode)
                .eq(EntityTotpCredentials::getAdminUid, adminUid.trim());
        entityTotpCredentialsMapper.update(patch, wrapper);
    }

    private boolean isBindableAdmin(EntityTotpCredentials admin) {
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

    // ===================== 针对字段更新方法（防丢失更新） =====================

    /**
     * 绑定主体根账号 TOTP secret，使用条件 UPDATE 防止并发覆盖。
     * <p>
     * 【并发安全】WHERE 子句增加 {@code totp_secret IS NULL OR totp_secret = ''}
     * 条件，确保只有未绑定状态下才执行更新。返回 affected rows 供调用方判断
     * 是否被并发请求抢先绑定。
     * </p>
     *
     * @return 实际更新的行数（1 = 成功绑定，0 = 已被其他请求绑定）
     */
    public int bindEntityRootTotp(String entityCode, String totpSecret, LocalDateTime now) {
        LambdaUpdateWrapper<TenantOrganization> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(TenantOrganization::getEntityCode, entityCode)
                .and(w -> w.isNull(TenantOrganization::getTotpSecret).or().eq(TenantOrganization::getTotpSecret, ""));
        TenantOrganization patch = new TenantOrganization();
        patch.setTotpSecret(totpSecret);
        patch.setLastLoginAt(now);
        return tenantOrganizationMapper.update(patch, wrapper);
    }

    /**
     * 仅更新管理员的 {@code last_login_at} 字段，避免全字段覆盖。
     * <p>
     * 【并发安全】使用 LambdaUpdateWrapper 仅更新指定字段，
     * 防止与并发 TOTP 绑定、密码修改等操作发生丢失更新。
     * </p>
     */
    public void updateAdminLastLoginAt(String adminUid, LocalDateTime now) {
        LambdaUpdateWrapper<EntityTotpCredentials> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(EntityTotpCredentials::getAdminUid, adminUid);
        EntityTotpCredentials patch = new EntityTotpCredentials();
        patch.setLastLoginAt(now);
        entityTotpCredentialsMapper.update(patch, wrapper);
    }

    /**
     * 仅更新主体的 {@code last_login_at} 字段，避免全字段覆盖。
     * <p>
     * 【并发安全】使用 LambdaUpdateWrapper 仅更新指定字段。
     * </p>
     */
    public void updateEntityLastLoginAt(String entityCode, LocalDateTime now) {
        LambdaUpdateWrapper<TenantOrganization> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(TenantOrganization::getEntityCode, entityCode);
        TenantOrganization patch = new TenantOrganization();
        patch.setLastLoginAt(now);
        tenantOrganizationMapper.update(patch, wrapper);
    }

    /**
     * 仅更新个人用户 {@code last_login_at} 字段，避免全字段覆盖。
     * <p>
     * 【并发安全】使用 LambdaUpdateWrapper 仅更新指定字段。
     * </p>
     */
    public void updateClientUserLastLoginAt(String userUid, LocalDateTime now) {
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(User::getUserUid, userUid);
        User patch = new User();
        patch.setLastLoginAt(now);
        userMapper.update(patch, wrapper);
    }
}
