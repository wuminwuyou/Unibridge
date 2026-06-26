-- =========================================================================
-- UnibridgeBackend 数据库初始化脚本
-- 该文件用于数据库初始化
-- db.sql文件仅支持开发环境下使用。
-- =========================================================================

-- =========================================================================
-- 第 1 章：会话初始化
-- =========================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- =========================================================================
-- 第 2 章：清理旧表（可重复执行）
-- =========================================================================
DROP TABLE IF EXISTS file_records;
DROP TABLE IF EXISTS t_file_record;
DROP TABLE IF EXISTS user_content_interaction;
DROP TABLE IF EXISTS t_user_interaction;
DROP TABLE IF EXISTS user_tag_interests;
DROP TABLE IF EXISTS p_user_interest_tag;
DROP TABLE IF EXISTS achievement_archive;
DROP TABLE IF EXISTS t_project_achievement;
DROP TABLE IF EXISTS note;
DROP TABLE IF EXISTS t_user_note;
DROP TABLE IF EXISTS task_card;
DROP TABLE IF EXISTS t_project_task_card;
DROP TABLE IF EXISTS milestone;
DROP TABLE IF EXISTS t_project_milestone;
DROP TABLE IF EXISTS project_commercial_secret;
DROP TABLE IF EXISTS t_project_secret;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS t_project;
DROP TABLE IF EXISTS team_member;
DROP TABLE IF EXISTS t_team_member;
DROP TABLE IF EXISTS team;
DROP TABLE IF EXISTS t_team;
DROP TABLE IF EXISTS laboratory;
DROP TABLE IF EXISTS t_user_identity;
DROP TABLE IF EXISTS t_user_identity;
DROP TABLE IF EXISTS sys_data_encryption_keys;
DROP TABLE IF EXISTS sys_policy_config;
DROP TABLE IF EXISTS user_real_name;
DROP TABLE IF EXISTS sys_personal_info_consent;
DROP TABLE IF EXISTS user_auth_link;
DROP TABLE IF EXISTS t_user_organization_binding;
DROP TABLE IF EXISTS user_profile;
DROP TABLE IF EXISTS p_user_profile;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS t_user;
DROP TABLE IF EXISTS entity_profile;
DROP TABLE IF EXISTS p_tenant_org_profile;
DROP TABLE IF EXISTS sys_entity_totp_credentials;
DROP TABLE IF EXISTS entity;
DROP TABLE IF EXISTS t_tenant_organization;
DROP TABLE IF EXISTS sys_credit_logs;
DROP TABLE IF EXISTS sys_credit_profiles;
DROP TABLE IF EXISTS sys_approval_flows;
DROP TABLE IF EXISTS sys_verification_codes;
DROP TABLE IF EXISTS system_admin;
DROP TABLE IF EXISTS sys_admin;


-- =========================================================================
-- 第 3 章：鉴权与账号 (Auth)
-- =========================================================================

-- 3.1 主体核心表 (t_tenant_organization) -> 只负责主体（高校/企业）的 Root 账号鉴权与资金控制
-- TODO：balance 后续需要实现信息安全处理，需要合规，使用外表进行管理
CREATE TABLE IF NOT EXISTS t_tenant_organization (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_code VARCHAR(32) NOT NULL COMMENT '主体代码（高校代码或社会统一信用代码，唯一）',
  password_hash VARCHAR(255) NOT NULL COMMENT '主体根账号密码哈希',
  totp_secret VARCHAR(255) NULL COMMENT 'TOTP 二次验证密钥（AES对称加密密文）',
  balance DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '数字钱包余额',
  -- 平台入驻审核（一次性）：管理员审批主体能否入驻
  audit_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED',
  audit_admin_id VARCHAR(32) NULL COMMENT '审核管理员ID（编号+实名）',
  audited_at DATETIME NULL COMMENT '平台审核通过时间',
  -- 管理账号生命周期（可反复切换，直至注销）
  account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE(活跃) | FROZEN(冻结) | DEACTIVATED(注销)',
  account_status_changed_at DATETIME NULL COMMENT '账号状态最近变更时间',
  account_status_remark VARCHAR(255) NULL COMMENT '冻结/注销原因备注',
  last_login_at DATETIME NULL COMMENT '账号上次登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_entity_code (entity_code),
  KEY idx_entity_audit_status (audit_status),
  KEY idx_entity_account_status (account_status),
  KEY idx_entity_last_login_at (last_login_at),
  CONSTRAINT chk_torg_audit_status CHECK (audit_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT chk_torg_account_status CHECK (account_status IN ('ACTIVE', 'FROZEN', 'DEACTIVATED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3.2 主体管理员与 TOTP 凭证（sys_entity_totp_credentials）
-- 同一 entity_code 最多 3 名 ACTIVE 管理员；主体启用管理端前至少配置 2 名（应用层校验）
-- admin_uid 格式：EA + 11 位 [A-Za-z0-9]（见 EntityAdminUidGenerator）
CREATE TABLE IF NOT EXISTS sys_entity_totp_credentials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_uid CHAR(13) NOT NULL COMMENT '主体管理员 UID（EA+11位 NanoID）',
  entity_code VARCHAR(32) NOT NULL COMMENT '所属主体代码',
  password_hash VARCHAR(255) NOT NULL COMMENT '管理员登录密码哈希',
  totp_secret VARCHAR(255) NULL COMMENT 'TOTP 二次验证密钥（AES对称加密密文）',
  display_name VARCHAR(128) NULL COMMENT '管理员展示名/备注（便于主体后台识别）',
  is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否主管理员：1=拥有移出/新增管理员、转移主管理员绑定等关键权限',
  account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE(已激活) | PENDING(待绑定TOTP) | FROZEN | DEACTIVATED',
  account_status_changed_at DATETIME NULL COMMENT '账号状态最近变更时间',
  last_login_at DATETIME NULL COMMENT '管理员上次登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_entity_admin_uid (admin_uid),
  UNIQUE KEY uk_entity_admin_password (entity_code, password_hash),
  KEY idx_entity_totp_entity_code (entity_code),
  KEY idx_entity_totp_entity_status (entity_code, account_status),
  KEY idx_entity_totp_entity_primary (entity_code, is_primary),
  CONSTRAINT fk_entity_totp_entity FOREIGN KEY (entity_code) REFERENCES t_tenant_organization(entity_code)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_eac_admin_uid CHECK (admin_uid REGEXP '^EA[A-Za-z0-9]{11}$'),
  CONSTRAINT chk_eac_is_primary CHECK (is_primary IN (0, 1)),
  CONSTRAINT chk_eac_account_status CHECK (account_status IN ('ACTIVE', 'PENDING', 'FROZEN', 'DEACTIVATED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 主体管理员数量规则（应用层事务校验，非 DB CHECK）：
--   · 同一 entity_code 下 account_status=ACTIVE 的管理员 ≤ 3
--   · 主体开通机构管理端前须 ≥ 2 名 ACTIVE 管理员（含 TOTP 绑定完成）
--   · 注销/冻结管理员后若 ACTIVE 数 < 2，应阻断或要求先补员
--   · 同一 entity_code 在 ACTIVE 管理员中须且仅有 1 名 is_primary=1（主管理员）
--   · is_primary=1 方可：移出其他管理员、新增管理员、发起/确认主管理员转移（TOTP 绑定变更）
--   · 同一 entity_code 下 ACTIVE 管理员 password_hash 须两两不同，且不得与 t_tenant_organization.password_hash 相同（登录按密码识别管理员）
--   · admin/register 写入 PENDING；totp/setup/confirm 成功后转 ACTIVE，此前不计入 3 人名额与 is_primary
--   · 转移主管理员：单事务内将原主 is_primary=0、新主 is_primary=1，并更新 totp_secret 归属

-- 3.3 用户核心表 (t_user) -> 只负责个人账号（手机/邮箱）的登录鉴权
CREATE TABLE IF NOT EXISTS t_user (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '对外公开 UID（US+11位 NanoID，见 UserUidGenerator）',
  phone VARCHAR(32) NOT NULL COMMENT '登录手机号',
  email VARCHAR(255) NULL COMMENT '绑定邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '个人密码哈希',
  account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE(活跃) | FROZEN(冻结) | DEACTIVATED(注销)',
  account_status_changed_at DATETIME NULL COMMENT '账号状态最近变更时间',
  account_status_remark VARCHAR(255) NULL COMMENT '冻结/注销原因备注',
  last_login_at DATETIME NULL COMMENT '个人账号上次登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_uid (user_uid),
  UNIQUE KEY uk_user_phone (phone),
  UNIQUE KEY uk_user_email (email),
  KEY idx_user_account_status (account_status),
  KEY idx_user_last_login_at (last_login_at),
  CONSTRAINT chk_tuser_uid CHECK (user_uid REGEXP '^US[A-Za-z0-9]{11}$'),
  CONSTRAINT chk_tuser_account_status CHECK (account_status IN ('ACTIVE', 'FROZEN', 'DEACTIVATED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3.4 平台系统超级管理员表（sys_admin）：完全独立于业务用户体系
CREATE TABLE IF NOT EXISTS sys_admin (
  id VARCHAR(32) NOT NULL COMMENT '登录凭证 (管理员账号)',
  password_hash VARCHAR(255) NOT NULL COMMENT '加密密码',
  auth_level INT NOT NULL DEFAULT 1 COMMENT '权限等级: 1-普通审计, 2-高级管理, 3-超级管理员',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 插入测试管理员账号
INSERT IGNORE INTO sys_admin (id, password_hash, auth_level) VALUES 
('admin_master', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 3),
('admin_auditor', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 1),
('admin_manager', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 2);


-- =========================================================================
-- 第 4 章：档案与实名 (Profile & Identity)
-- =========================================================================

-- 4.1 主体档案表 (p_tenant_org_profile) -> 负责学校/企业的官方主页展示（与 entity 1:1）
CREATE TABLE IF NOT EXISTS p_tenant_org_profile (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_code VARCHAR(32) NOT NULL COMMENT '关联的主体代码（社会统一信用代码/高校代码）',
  name VARCHAR(255) NOT NULL COMMENT '主体官方全称',
  location VARCHAR(255) NOT NULL COMMENT '主体所在地（如 广东·深圳）',
  type VARCHAR(32) NOT NULL COMMENT '主体类型：ENTERPRISE | UNIVERSITY',
  logo_url VARCHAR(255) NULL COMMENT '主体 LOGO 访问 URL',
  banner_url VARCHAR(255) NULL COMMENT '主体主页顶部背景大图 URL',
  intro VARCHAR(50) NULL COMMENT '主体简介（最多50字）',
  announcement VARCHAR(200) NULL COMMENT '机构/学校/企业公告（最多200字）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_p_tenant_org_profile_entity_code (entity_code),
  UNIQUE KEY uk_p_tenant_org_profile_name (name),
  KEY idx_p_tenant_org_profile_type (type),
  CONSTRAINT fk_p_tenant_org_profile_entity FOREIGN KEY (entity_code) REFERENCES t_tenant_organization(entity_code) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_porg_type CHECK (type IN ('ENTERPRISE', 'UNIVERSITY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4.2 用户档案表 (p_user_profile) -> 负责学生/导师的个人主页与技术背景（与 user 1:1）
CREATE TABLE IF NOT EXISTS p_user_profile (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '关联的用户 UID（无独立 profile uid）',
  nick_name VARCHAR(128) NULL COMMENT '用户昵称',
  -- real_name 已迁移至独立安全表 t_user_identity（实名信息独立加密存储，PIPL 合规）
  avatar_url VARCHAR(255) NULL COMMENT '头像访问 URL',
  level VARCHAR(16) NULL COMMENT '用户等级：N | R | SR | SSR | UR',
  bio_data JSON NULL COMMENT '技术栈/兴趣标签（JSON 格式：["Java", "React"]）',
  career_data JSON NULL COMMENT '职业/学籍背景数据结构',
  -- 学生学籍（role=STUDENT 时 graduation_year 必填，由应用层校验；导师/PM 可为 NULL）
  graduation_year SMALLINT UNSIGNED NULL COMMENT '预计或实际毕业年份（四位年，如 2026）；在读学生 NOT NULL',
  education_history JSON NULL COMMENT '学籍/校友履历 JSON 数组；毕业时追加 "{院校名}{year}届校友" 并归档原 entity 关联',
  intro VARCHAR(50) NULL COMMENT '个人一句话简介（最多50字）',
  announcement VARCHAR(200) NULL COMMENT '个人公告（最多200字）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_p_user_profile_user_uid (user_uid),
  KEY idx_p_user_profile_graduation_year (graduation_year),
  CONSTRAINT fk_p_user_profile_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_pup_graduation_year CHECK (
    graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= 2100)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4.3 用户实名身份独立存储表（t_user_identity）
-- real_name 从 p_user_profile 拆出独立存储，使用信封加密（Envelope Encryption）+ 脱敏展示
-- 关联 sys_data_encryption_keys 的 DEK UUID 实现密钥轮转兼容（算法 AES-256-GCM / SM4-GCM）
-- ON DELETE RESTRICT 确保用户注销时实名记录不被级联删除（司法取证保留 ≥ 3 年）
--
-- 脱敏展示规则（API 层实现，根据 t_user_organization_binding.role 生成 real_name_mask）：
--   PM          → *经理（role='PM'，企业项目经理/员工，取姓氏首字+经理）
--   MENTOR      → *导师（role='MENTOR'，学校指导老师）
--   COUNSELOR   → *导员（role='COUNSELOR'，学校辅导员）
--   STUDENT     → *同学（role='STUDENT'，学生）
--   无名/多角色  → *用户（fallback，无有效 role 时兜底）
--
-- 访问控制矩阵（待议，以下为推荐分层方案）：
--   ========================================================================
--   │ 场景                         │ 返回内容                        │ 审计 │
--   │------------------------------│---------------------------------│------│
--   │ 本人查看个人主页/设置页        │ 解密 encrypted_real_name 返回原文│ YES  │
--   │ 同机构管理员（EA+11）审核      │ 解密原文 + 记录 sys_pii_access_log│ YES  │
--   │ 同实验室/团队负责人（LEADER）  │ 解密原文（需 lab 成员关系校验）   │ YES  │
--   │ 同项目 PM 查看成员            │ 解密原文（需 project.owner_uid）  │ YES  │
--   │ 前端列表页/搜索结果           │ real_name_mask 脱敏值            │ NO   │
--   │ Feed 笔记公开作者区           │ real_name_mask 脱敏值            │ NO   │
--   │ 其他机构/陌生用户             │ "***" 三字星号（完全隐藏）       │ NO   │
--   │ 平台超管审核（sys_admin）  │ 解密原文 + 完整审批流水           │ YES  │
--   ========================================================================
--
--   关键原则：
--     · 能够看到原文的：同项目PM、同机构管理员、同团队LEADER/MENTOR、平台超管
--     · 只能看到 mask 的：公开列表、Feed、搜索结果
--     · 完全不可见的：平台其余用户（保持完全模糊）
--     · 所有解密原文请求必须写入 sys_pii_access_log
CREATE TABLE t_user_identity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '关联的用户 UID（US+11位 NanoID）',
  -- 加密存储层
  encrypted_real_name VARCHAR(512) NULL COMMENT '真实姓名密文（Base64，由 sys_data_encryption_keys 对应的 DEK 加密，格式：iv:ciphertext:auth_tag）',
  real_name_mask VARCHAR(32) NULL COMMENT '脱敏展示名（根据 t_user_organization_binding.role 计算：*经理/*导师/*导员/*同学/*用户），API 层写入，前端列表/搜索结果等非鉴权场景使用',
  -- 身份证信息（PIPL C3 级敏感，全库唯一防作弊）
  id_card_no VARCHAR(128) NOT NULL COMMENT '经 AES/SM4 加密的身份证号密文（Base64，iv:ciphertext:auth_tag）。统一由 DEK 加密，与 encrypted_real_name 共享 encryption_key_id',
  id_card_hash CHAR(64) NOT NULL COMMENT '身份证号的 SHA-256 哈希值（十六进制小写），用于全库唯一性防作弊碰撞。不可逆设计，仅做等值匹配，不存储明文',
  encryption_key_id CHAR(36) NULL COMMENT '加密所用的 DEK UUID（关联 sys_data_encryption_keys.key_id）',
  -- 审计
  verified_at DATETIME NULL COMMENT '最近一次人脸核身/实名验证通过时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_identity_uid (user_uid),
  UNIQUE KEY uk_user_identity_id_card_hash (id_card_hash),
  KEY idx_identity_encryption_key (encryption_key_id),
  CONSTRAINT fk_user_identity_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_uid_id_card_hash CHECK (LENGTH(id_card_hash) = 64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='用户实名身份独立存储（PIPL §51 加密 + §47 数据删除权，基于 role 的脱敏展示）';

-- 4.4 用户机构认证关联表（t_user_organization_binding）
CREATE TABLE t_user_organization_binding (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID',
  entity_code VARCHAR(32) NOT NULL COMMENT '机构主体代码（学校或企业社会统一信用代码）',
  role VARCHAR(32) NOT NULL COMMENT 'PM(企业项目经理/员工) | MENTOR(学校指导老师) | COUNSELOR(学校辅导员) | STUDENT(学生)',
  -- 凭证资产留痕（审核必备）
  auth_serial_no VARCHAR(64) NULL COMMENT '学号 或 工号（可选冗余，方便检索）',
  proof_artifact_url VARCHAR(512) NULL COMMENT '认证证明材料URL（如学生证、工作证截图，供后台审核）',
  -- 区分两层状态机：审核状态 vs 物理生效状态
  audit_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING(待审核) | APPROVED(审核通过) | REJECTED(审核拒绝)',
  audit_uid CHAR(13) NULL COMMENT '审核通过的主体管理员 admin_uid（EA+11）',
  audited_at DATETIME NULL COMMENT '主体管理员审核时间',
  is_active TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1(当前活跃身份) | 0(历史失效/毕业离职归档)',
  remark VARCHAR(255) NULL COMMENT '审核拒绝原因或备注说明',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_t_user_organization_binding_user_uid (user_uid),
  KEY idx_t_user_organization_binding_entity_code (entity_code),
  KEY idx_t_user_organization_binding_status (audit_status, is_active),
  KEY idx_t_user_organization_binding_audit_uid (audit_uid),
  UNIQUE KEY uk_t_user_organization_binding_unique (user_uid, entity_code, role),
  CONSTRAINT fk_t_user_organization_binding_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_t_user_organization_binding_entity FOREIGN KEY (entity_code) REFERENCES t_tenant_organization(entity_code)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_t_user_organization_binding_audit_admin FOREIGN KEY (audit_uid) REFERENCES sys_entity_totp_credentials(admin_uid)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_ubind_role CHECK (role IN ('PM','MENTOR','COUNSELOR','STUDENT')),
  CONSTRAINT chk_ubind_audit CHECK (audit_status IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT chk_ubind_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 第 5 章：认证与审批 (Verification & Approval)
-- =========================================================================

-- 5.1 学生认证码表（sys_verification_codes：母子码设计，额度控制+生命周期管理）
CREATE TABLE IF NOT EXISTS sys_verification_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL COMMENT '认证码（母码: {entityCode}-{year}-{5位}；子码: 母码code-{4位}）',
  entity_code VARCHAR(32) NOT NULL COMMENT '所属学校/机构代码',
  is_master TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '1: 母码, 0: 子码',
  parent_id BIGINT UNSIGNED NULL COMMENT '子码关联的母码 id',
  max_quota INT UNSIGNED NOT NULL COMMENT '最大使用次数（母码默认1000，子码默认200）',
  used_quota INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已使用次数（母码: 已分发的子码总额度；子码: 已激活的学生数）',
  description VARCHAR(255) NULL COMMENT '用途描述（如"深圳大学2026届计算机专业学生认证码"）',
  graduation_year SMALLINT UNSIGNED NULL COMMENT '预期毕业年份（子码可选，母码 NULL）',
  created_by VARCHAR(64) NOT NULL COMMENT '创建者 user_uid（母码: 机构管理员；子码: 辅导员）',
  expire_time DATETIME NOT NULL COMMENT '过期时间（创建日期+14天，当天23:59:59）',
  is_active TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1: 启用, 0: 禁用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_invitation_code (code),
  KEY idx_invitation_entity_code (entity_code),
  KEY idx_invitation_parent_id (parent_id),
  KEY idx_invitation_is_master (is_master),
  KEY idx_invitation_expire_time (expire_time),
  KEY idx_invitation_is_active (is_active),
  CONSTRAINT chk_vcode_max_quota CHECK (max_quota > 0 AND max_quota <= 50000),
  CONSTRAINT chk_vcode_is_master CHECK (is_master IN (0, 1)),
  CONSTRAINT chk_vcode_is_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- sys_verification_codes 说明
-- | 字段         | 母码                                     | 子码                              |
-- |--------------|------------------------------------------|-----------------------------------|
-- | code         | {entityCode}-{year}-{5位随机}            | 母码code-{4位随机}                |
-- | max_quota    | 母码总额度（默认 1000）                   | 子码额度（默认 200）               |
-- | used_quota   | 已分配子码总额度（≤ max_quota）            | 已激活学生数（≤ max_quota）         |
-- | is_master    | 1                                        | 0                                 |
-- | parent_id    | NULL                                     | 母码 id                           |
-- | created_by   | 机构管理员 user_uid                       | 辅导员 user_uid                   |
-- | expire_time  | 到期后 is_active 自动失效（应用层判定）     | 同母码                            |
--
-- 并发安全：额度扣减使用数据库原子更新
--   母码：UPDATE SET used_quota = used_quota + 子码额度 WHERE id = ? AND is_active = 1 AND used_quota + 子码额度 ≤ max_quota
--   子码：UPDATE SET used_quota = used_quota + 1 WHERE id = ? AND is_active = 1 AND used_quota < max_quota
--   校验 affected rows = 0 → 返回错误

-- 5.2 统一审批流表（sys_approval_flows：跨业务审批工单，无 FK 便于分库）
CREATE TABLE IF NOT EXISTS sys_approval_flows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  approval_key VARCHAR(64) NOT NULL COMMENT '对外公开审批单 Key（APP-yyyyMMdd-11位 [A-Za-z0-9]，如 APP-20260607-aB7x9K2mN4pQ）',
  business_type VARCHAR(32) NOT NULL COMMENT 'PROJECT_FUND | LAB_CREATE | MENTOR_AUTH，可后续拓展：USER_AUTH | ENTITY_AUTH | TEAM_AUTH',
  applicant_key VARCHAR(64) NOT NULL COMMENT '申请人 Key（通常为 user_uid 或 entity_code，分库友好不设 FK）',
  target_key VARCHAR(64) NOT NULL COMMENT '目标主体 Key：entity_code 或 team_uid；特殊值 0 表示平台官方审批',
  audit_uid CHAR(13) NULL COMMENT '审核通过的平台管理员 admin_uid/ 团队管理员 team_uid（LB/ST+11） / 主体账号管理员 admin_uid（EA+11）',
  status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0:待审批 1:已批准 2:已驳回 3:已撤回',
  payload JSON NOT NULL COMMENT '业务差异化数据（各 business_type 自定义 JSON 结构）',
  remark VARCHAR(255) NULL COMMENT '审批意见/驳回理由',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_approval_key (approval_key),
  KEY idx_approval_target_key (target_key),
  KEY idx_approval_applicant (applicant_key),
  KEY idx_approval_target_status (target_key, status),
  KEY idx_approval_business_type (business_type),
  CONSTRAINT chk_flow_key CHECK (approval_key REGEXP '^APP-[0-9]{8}-[A-Za-z0-9]{11}$'),
  CONSTRAINT chk_flow_biz_type CHECK (business_type IN ('PROJECT_FUND', 'LAB_CREATE', 'MENTOR_AUTH', 'STUDENT_AUTH')),
  CONSTRAINT chk_flow_status CHECK (status IN (0, 1, 2, 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- sys_approval_flows 说明
-- | target_key    | 含义                                              |
-- |---------------|---------------------------------------------------|
-- | entity_code   | 由对应学校/企业管理员在其空间内审批                  |
-- | team_uid      | 由团队侧审批（如 LAB 创建）                          |
-- | '0'           | 平台官方审批（sys_admin 侧处理）                 |
-- | applicant_key | 通常为 user_uid(US...) 或 entity_code             |
-- | audit_uid     | 多态审核人：sys_admin.id / team_uid / EA+11 等  |
-- | payload       | 按 business_type 存放专属字段，避免宽表膨胀          |
-- 待办列表查询：WHERE target_key = ? AND status = 0
-- 我的申请查询：WHERE applicant_key = ? ORDER BY created_at DESC


-- =========================================================================
-- 第 6 章：政策与合规 (Policy & Compliance)
-- =========================================================================

-- 6.1 协议/政策配置管理表（sys_policy_config）
-- 提供实名认证协议与隐私政策的 Markdown 原文后台管理 + 客户端动态拉取能力
--
-- 设计要点：
--   1. policy_content 存储 Markdown 全文，content_hash 为 SHA-256 哈希作为不可否认性锚点
--      sys_personal_info_consent.policy_content_hash 与本表 content_hash 联动，形成完整证据链
--   2. 同一 policy_type 下任意时刻至多 1 条记录 is_active = 1（应用层事务 enforce）
--      客户端拉取时 `SELECT ... WHERE policy_type = ? AND is_active = 1 LIMIT 1` 即可命中
--   3. 版本迭代时管理员 INSERT 新版本 + is_active=1，同时将旧版本 is_active 置 0
--      保留历史版本以支持 AB 对比与合规审计
--   4. policy_content 类型为 LONGTEXT（Markdown 协议原文可达数十 KB，普通 TEXT 65535 字节不够）
CREATE TABLE sys_policy_config (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- 协议元信息
  policy_type VARCHAR(32) NOT NULL COMMENT '协议类型（应用层字典管控）：IDENTITY_AUTH（实名认证协议）| PRIVACY（隐私政策）| TERMS_OF_SERVICE（用户服务协议）',
  version_code VARCHAR(16) NOT NULL COMMENT '语义化版本号（SemVer，如 1.0.0、2.3.1），用于客户端版本比对与升级提示',
  -- 完整性与不可否认性
  content_hash CHAR(64) NOT NULL COMMENT 'policy_content 全文 SHA-256 哈希（十六进制小写）。作为 sys_personal_info_consent.policy_content_hash 的锚定来源',
  policy_content LONGTEXT NOT NULL COMMENT '协议全文（Markdown 格式）。客户端按版本拉取后由前端 Markdown 渲染器展示',
  -- 生效管控
  is_active TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否当前生效版本：1=已发布生效（客户端拉取、用户授权弹窗均取此版本）| 0=历史版本（仅审计可查看）',
  -- 审计元数据
  operator_key VARCHAR(64) NULL COMMENT '发布/编辑操作人标识（sys_admin.id），用于等保审计问责',
  remark VARCHAR(255) NULL COMMENT '版本变更说明（如"新增生物特征授权条款"），便于运营回溯',
  -- 时间戳
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  -- 约束 & 索引
  PRIMARY KEY (id),
  UNIQUE KEY uk_policy_type_version (policy_type, version_code),
  KEY idx_policy_active_lookup (policy_type, is_active),
  KEY idx_policy_content_hash (content_hash),
  CONSTRAINT chk_pcfg_is_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='协议/政策配置管理表（实名认证协议、隐私政策 Markdown 原文管理，客户端动态拉取）';

-- 6.2 个人信息处理授权记录表（sys_personal_info_consent）
-- PIPL 第13/14/47条合规 + GB/T 35273-2020 §8 + 等保2.0 三级审计要求
--
-- 设计原则：
--   1. ON DELETE RESTRICT：即使 user 表注销，授权记录必须物理保留 ≥3 年（司法取证要求）
--      用户注销流程：先"匿名化归档" user 记录，再软删除 p_user_profile，不得 DELETE user 行。
--   2. ip_address 存储加盐哈希（SHA-256），阻断运维/数据库管理员直接窥探用户 IP
--   3. policy_content_hash 实现政策文本的不可否认性：记录用户授权时所见的政策全文哈希，
--      若发生纠纷可回溯验证政策文本是否被篡改（GB/T 35273 §8.5）
--   4. consent_type 不再使用 CHECK 约束硬编码，改为应用层字典管控
--      （避免在线 DDL 对亿级大表加约束锁，同时支持业务灵活扩展）
CREATE TABLE sys_personal_info_consent (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- 操作主体与授权范围
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID（US+11位 NanoID，外键关联 user.user_uid）',
  consent_type VARCHAR(64) NOT NULL COMMENT '授权类型（应用层字典管控）：REAL_NAME | FACE_DATA | EDUCATION | CAREER | PRECISE_LOCATION 等',
  consent_action VARCHAR(16) NOT NULL COMMENT '授权动作：GRANT（授权） | WITHDRAW（撤回）',
  -- 隐私政策版本及防篡改追溯
  consent_version VARCHAR(16) NOT NULL COMMENT '隐私政策版本号（语义化版本，如 v1.0.0、v2.3.1），用于版本间授权比对',
  policy_content_hash VARCHAR(64) NOT NULL COMMENT '授权时前端/服务端展示的政策全文 SHA-256 哈希（不可否认性证明，GB/T 35273 §8.5 合规要求）',
  -- 审计溯源
  consented_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '授权时间（毫秒精度，用于时序排重）',
  source VARCHAR(64) NULL COMMENT '授权来源渠道：REGISTER_PAGE | SETTINGS_PAGE | PRIVACY_CENTER | UPGRADE_BANNER 等',
  ip_address_hash VARCHAR(64) NULL COMMENT '授权时客户端 IPv4/IPv6 经加盐 SHA-256 哈希后的密文。原始 IP 明文不入库（去标识化技术，PIPL 第51条）',
  ip_address_salt CHAR(16) NULL COMMENT 'ip_address_hash 所使用的随机盐值（16字节，Base64编码存储），加盐策略：HMAC-SHA256(salt, raw_ip)',
  -- 约束与索引
  PRIMARY KEY (id),
  KEY idx_consent_user_uid (user_uid),
  KEY idx_consent_user_version (user_uid, consent_version),
  KEY idx_consent_type_action (consent_type, consent_action),
  KEY idx_consent_consented_at (consented_at),
  CONSTRAINT fk_consent_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_cons_action CHECK (consent_action IN ('GRANT', 'WITHDRAW')),
  CONSTRAINT chk_cons_hash CHECK (LENGTH(policy_content_hash) = 64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='个人信息处理授权记录（PIPL 第13/14/47条，不可否认性，授权撤回去标识化审计）';


-- =========================================================================
-- 第 7 章：团队与实验室 (Team)
-- =========================================================================

-- 7.1 统一团队与实验室表（t_team）
CREATE TABLE t_team (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_uid CHAR(13) NOT NULL COMMENT '对外公开 UID（LAB:LB+11 | STUDENT_TEAM:ST+11）',
  type VARCHAR(32) NOT NULL COMMENT 'LAB(学校官方实验室) | STUDENT_TEAM(学生自发团队)', 
  team_logo VARCHAR(255) NULL COMMENT '团队/实验室 LOGO 访问 URL',
  owner_uid CHAR(13) NULL COMMENT '第一负责人/创建者 UID（实验室为一号导师，学生队为队长）',
  owner_name VARCHAR(255) NULL COMMENT '负责人姓名冗余',
  entity_code VARCHAR(32) NULL COMMENT '所属机构主体代码；LAB 必填（应用层校验，见下方说明），STUDENT_TEAM 为 NULL',
  team_name VARCHAR(255) NOT NULL COMMENT '团队或实验室名称',
  tag JSON NULL COMMENT '技能/方向标签列表',
  intro VARCHAR(200) NULL COMMENT '职能简介（最多200字）',
  announcement VARCHAR(200) NULL COMMENT '团队/实验室公告（最多200字）',
  contact_email VARCHAR(128) NULL COMMENT '对外联系邮箱',
  -- 实验室(LAB)：须所属 entity 审核通过后方可对外展示；学生团队(STUDENT_TEAM)创建即 APPROVED
  audit_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED' COMMENT 'LAB: PENDING|APPROVED|REJECTED；STUDENT_TEAM 固定 APPROVED',
  audit_uid CHAR(13) NULL COMMENT '审核通过的主体管理员 admin_uid（仅 LAB，EA+11）',
  audited_at DATETIME NULL COMMENT '所属主体审核通过时间（仅 LAB）',
  audit_remark VARCHAR(255) NULL COMMENT '审核拒绝/备注（仅 LAB）',
  -- 团队账号生命周期：活跃 ⇄ 冻结 → 解散/注销
  account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | FROZEN | DISBANDED | DEACTIVATED',
  account_status_changed_at DATETIME NULL COMMENT '账号状态最近变更时间',
  account_status_remark VARCHAR(255) NULL COMMENT '冻结/解散/注销原因备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_uid (team_uid),
  KEY idx_team_type (type),
  KEY idx_team_owner_uid (owner_uid),
  KEY idx_team_entity_code (entity_code),
  KEY idx_team_audit_status (audit_status),
  KEY idx_team_audit_uid (audit_uid),
  KEY idx_team_account_status (account_status),
  CONSTRAINT fk_team_owner FOREIGN KEY (owner_uid) REFERENCES t_user(user_uid) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_team_entity FOREIGN KEY (entity_code) REFERENCES t_tenant_organization(entity_code) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_team_audit_admin FOREIGN KEY (audit_uid) REFERENCES sys_entity_totp_credentials(admin_uid)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_team_audit_status CHECK (audit_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT chk_team_account_status CHECK (account_status IN ('ACTIVE', 'FROZEN', 'DISBANDED', 'DEACTIVATED')),
  CONSTRAINT chk_team_type CHECK (type IN ('LAB', 'STUDENT_TEAM')),
  CONSTRAINT chk_team_auto_approved CHECK (
    type <> 'STUDENT_TEAM' OR audit_status = 'APPROVED'
  ),
  CONSTRAINT chk_team_uid CHECK (
    (type = 'LAB' AND team_uid REGEXP '^LB[A-Za-z0-9]{11}$') OR
    (type = 'STUDENT_TEAM' AND team_uid REGEXP '^ST[A-Za-z0-9]{11}$')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- LAB 团队创建时 entity_code 必填（应用层校验；不可写 CHECK，因 entity_code 参与 FK referential action）

-- 7.2 团队/实验室成员关联表（t_team_member）
CREATE TABLE t_team_member (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_uid CHAR(13) NOT NULL COMMENT '团队/实验室 UID',
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID（学生或导师）',
  role VARCHAR(32) NOT NULL DEFAULT 'MEMBER' COMMENT 'LEADER(队长/负责人) | MEMBER(普通成员) | MENTOR(指导老师/学术导师)',
  lab_user_uid CHAR(13) NULL COMMENT '用于严格限制学生单实验室的影子字段',
  career VARCHAR(255) NULL COMMENT '团队中职位，比如导师，前端开发，数据分析等',
  is_admin TINYINT(1) NOT NULL DEFAULT 0 COMMENT '团队管理员（与 role 正交；导师/学生均可）',
  invited_by_uid CHAR(13) NULL COMMENT '邀请人或审批通过加入的 user_uid；团队 owner 创建入驻时为 NULL',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_member_team_uid (team_uid),
  KEY idx_member_user_uid (user_uid),
  KEY idx_member_invited_by_uid (invited_by_uid),
  CONSTRAINT fk_member_team_uid FOREIGN KEY (team_uid) REFERENCES t_team(team_uid) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_user_uid FOREIGN KEY (user_uid) REFERENCES t_user(user_uid) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_lab_user_uid FOREIGN KEY (lab_user_uid) REFERENCES t_user(user_uid) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_member_invited_by_uid FOREIGN KEY (invited_by_uid) REFERENCES t_user(user_uid) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY uk_team_user (team_uid, user_uid),
  UNIQUE KEY uk_single_lab_user (lab_user_uid),
  CONSTRAINT chk_tmem_role CHECK (role IN ('LEADER', 'MEMBER', 'MENTOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 第 8 章：项目 (Project)
-- =========================================================================

-- 8.1 统一项目主表（t_project）
-- 详情读接口见 apps/web-client/API-request.md §06.1
CREATE TABLE t_project (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- 对外公开 UID（双 ID 之外层）：API / Feed 仅暴露此字段，防 IDOR 枚举
  project_uid CHAR(13) NOT NULL COMMENT '对外公开 UID（PR+11位 NanoID，见 ProjectUidGenerator）',
  -- 代发主体/团队 Key：entity_code（企业/学校）或 team_uid（实验室/学生团队）；实验室/团队招募时标识发布归属
  extended_uid VARCHAR(32) NULL COMMENT '代发归属：entity_code（owner 所属企业/学校）或 team_uid（实验室/学生团队）',
  -- 核心分类：COMMERCIAL(正式商业项目) | RECRUITMENT(招募与实践项目)
  category VARCHAR(32) NOT NULL COMMENT 'COMMERCIAL | RECRUITMENT',
  -- 招募项目的细分子类型，商业项目为 NULL
  recruitment_type VARCHAR(32) NULL COMMENT 'LAB_RECRUIT | TEAM_RECRUIT | CAMPUS_PRACTICE | PERSONAL_RECRUIT（仅招募项目有效）',
  -- 发起/所有者关联（统一了项目 PM 和 创作者）
  owner_uid CHAR(13) NOT NULL COMMENT '项目发起人/发布企业PM (USER_UID)',
  team_uid CHAR(13) NULL COMMENT '关联/承接的团队或实验室 UID (可选)',
  title VARCHAR(255) NOT NULL COMMENT '项目名称',
  preview TEXT NOT NULL COMMENT '项目简略描述',
  editor_type VARCHAR(32) NOT NULL DEFAULT 'MARKDOWN' COMMENT '编辑器类型：MARKDOWN | RICHTEXT（暂保留，当前前端统一 Milkdown）',
  budget DECIMAL(18,2) NULL COMMENT '项目预算/赏金（公开字段，非敏感）',
  tags JSON NULL COMMENT '推荐与算法标签列表',
  duration VARCHAR(64) NULL COMMENT '预计周期',
  team_size VARCHAR(64) NULL COMMENT '团队人数',
  deadline DATE NULL COMMENT '最大接受截止日期（项目招募最大容忍度，逼近或超过该日期则加急处理）',
  level VARCHAR(16) NOT NULL DEFAULT 'N' COMMENT '难度评级：N | R | SR | SSR | UR',
  -- 基础状态：DRAFT(草稿) | OPEN(开放中/招募中) | ONGOING(进行中) | CLOSED(已关闭/已结项)
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | OPEN | ONGOING | CLOSED',
  published_at DATETIME NULL COMMENT '正式发布时间；草稿为 NULL',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_project_uid (project_uid),
  KEY idx_project_extended_uid (extended_uid),
  KEY idx_project_category (category),
  KEY idx_project_owner_uid (owner_uid),
  KEY idx_project_team_uid (team_uid),
  KEY idx_project_published_at (published_at),
  KEY idx_project_status (status),
  CONSTRAINT fk_project_owner FOREIGN KEY (owner_uid) REFERENCES t_user(user_uid)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_project_team FOREIGN KEY (team_uid) REFERENCES t_team(team_uid)
    ON DELETE SET NULL ON UPDATE CASCADE, 
  CONSTRAINT chk_proj_category CHECK (category IN ('COMMERCIAL', 'RECRUITMENT')),
  CONSTRAINT chk_proj_uid CHECK (project_uid REGEXP '^PR[A-Za-z0-9]{11}$'),
  CONSTRAINT chk_proj_recruit_type CHECK (recruitment_type IN ('LAB_RECRUIT', 'TEAM_RECRUIT', 'CAMPUS_PRACTICE', 'PERSONAL_RECRUIT')),
  CONSTRAINT chk_proj_status CHECK (status IN ('DRAFT', 'OPEN', 'ONGOING', 'CLOSED')),
  CONSTRAINT chk_proj_level CHECK (level IN ('N','R','SR','SSR','UR')),
  CONSTRAINT chk_proj_editor_type CHECK (editor_type IN ('MARKDOWN', 'RICHTEXT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- project.extended_uid：多态代发 Key（不设 FK；值为 entity_code 或 team_uid）
-- 企业/学校代发 → entity_code；实验室/学生团队招募 → team_uid (LB/ST+11)

-- 8.2 商业项目敏感与隐私扩展表（t_project_secret）
-- 🔒 双 ID 安全：本表仅通过 project_uid 关联；API 禁止暴露自增 id
CREATE TABLE t_project_secret (
  project_uid CHAR(13) NOT NULL COMMENT '关联的主项目 UID（1:1 关联）',
  -- 核心敏感数据：托管金额
  total_budget DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '托管总额（企业隐私，严禁泄露）',
  -- 商业专用高级状态机：主表 status='ONGOING' 时激活
  commercial_status VARCHAR(64) NOT NULL DEFAULT 'PENDING_START' 
    COMMENT '商业专用状态机：PENDING_START(待托管开工) | PROCESSING(研发进行中) | SUBMIT_REVIEW(验收审核中) | NEED_IMPROVEMENT(待改进) | APPROVED_SUCCESS(验收通过) | IN_DISPUTE(争议维权中) | ARBITRATED(平台仲裁结项)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_uid),
  KEY idx_secret_commercial_status (commercial_status),
  CONSTRAINT fk_secret_project_uid FOREIGN KEY (project_uid) REFERENCES t_project(project_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,  
  CONSTRAINT chk_psec_comm_status CHECK (
    commercial_status IN (
      'PENDING_START', 
      'PROCESSING', 
      'SUBMIT_REVIEW', 
      'NEED_IMPROVEMENT', 
      'APPROVED_SUCCESS', 
      'IN_DISPUTE', 
      'ARBITRATED'
    )
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8.2.1 项目正文大文本拆分表（t_project_body：垂直拆分，热冷分离）
-- 仅存 description 大文本，避免频繁拉取主表长字段
CREATE TABLE t_project_body (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_uid CHAR(13) NOT NULL COMMENT '关联的主项目 UID（1:1 关联）',
  description LONGTEXT NULL COMMENT '项目详情正文（Markdown，前端 Milkdown 渲染）',
  PRIMARY KEY (id),
  UNIQUE KEY uk_proj_body_uid (project_uid),
  CONSTRAINT fk_proj_body_uid FOREIGN KEY (project_uid) REFERENCES t_project(project_uid)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8.2.2 项目计数统计表（t_project_counter：热写分离，避免频繁更新主表行锁竞争）
-- TODO: 前端 IM 即时通讯私聊功能尚未实现，chat_count 当前仅作快照预留；collect_count 对应前端「感兴趣」按钮
-- 计数写入走 Redis 缓存（feed:proj:cnt:{projectUid}:{field}），MySQL 表为定期快照落库
CREATE TABLE t_project_counter (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_uid CHAR(13) NOT NULL COMMENT '对应 t_project.project_uid（应用层关联）',
  view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览量',
  collect_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '收藏数（前端「感兴趣」按钮）',
  chat_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '私聊人数（快照，精确值见 Redis HyperLogLog；TODO: IM 私聊后端待接入）',
  PRIMARY KEY (id),
  UNIQUE KEY uk_proj_counter_uid (project_uid),
  CONSTRAINT fk_proj_counter_uid FOREIGN KEY (project_uid) REFERENCES t_project(project_uid)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8.3 里程碑（t_project_milestone：project 1:N t_project_milestones）
-- 注：t_project_milestone 依附于 IM 系统（Instant Message），作为项目即时通讯中的里程碑管理功能
CREATE TABLE t_project_milestone (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_uid CHAR(13) NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '里程碑标题',
  payment_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '拨款占比',
  status VARCHAR(32) NOT NULL COMMENT '协商状态（项目PM与学生PM协商）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_t_project_milestone_project_uid (project_uid),
  CONSTRAINT fk_t_project_milestone_project FOREIGN KEY (project_uid) REFERENCES t_project(project_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_pmil_payment_pct CHECK (payment_pct >= 0 AND payment_pct <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8.4 任务卡片（t_project_task_card：t_project_milestone 1:N task cards）
-- 注：t_project_task_card 依附于 IM 系统（Instant Message），作为项目即时通讯中的任务卡片管理功能
CREATE TABLE t_project_task_card (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  milestone_id BIGINT UNSIGNED NOT NULL,
  assignee_uid CHAR(13) NULL COMMENT '执行人(学生) UID',
  title VARCHAR(255) NOT NULL,
  content TEXT NULL COMMENT '原始需求描述',
  status VARCHAR(16) NOT NULL COMMENT 'DONE | TODO',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_card_milestone_id (milestone_id),
  KEY idx_task_card_assignee_uid (assignee_uid),
  KEY idx_task_card_status (status),
  CONSTRAINT fk_task_card_milestone FOREIGN KEY (milestone_id) REFERENCES t_project_milestone(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_card_assignee FOREIGN KEY (assignee_uid) REFERENCES t_user(user_uid)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_ptask_status CHECK (status IN ('DONE','TODO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 第 9 章：笔记与内容 (Note)
-- =========================================================================

-- 9.1 笔记核心表（t_user_note：极热数据，Feed 流展示所需小字段；垂直拆分大文本与计数器）
-- 详情读接口见 apps/web-client/API-request.md §06.2
CREATE TABLE IF NOT EXISTS t_user_note (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '发布笔记的用户 UID',
  -- 对外公开 UID（双 ID 之外层）：API / Feed 字段名 uid；与 content_type_code 同值
  -- 类型编码：TX/VD + 11 位 [A-Za-z0-9]，后缀由 NanoID 随机生成（见 NoteContentTypeCodeGenerator）
  content_type_code VARCHAR(64) NOT NULL COMMENT '对外 uid + 内容类型编码（视频:VD+11位 | 图文:TX+11位）',
  -- 代发主体/团队 Key：entity_code 或 team_uid，标识联合投稿（替企业/学校/实验室/学生团队发布）
  extended_uid VARCHAR(32) NULL COMMENT '代发归属：entity_code 或 team_uid（联合投稿）',
  title VARCHAR(255) NOT NULL COMMENT '笔记标题',
  summary TEXT NOT NULL COMMENT '笔记外部预览摘要（列表页展示）',
  -- 媒体资源（Feed 流展示必需）
  cover_url VARCHAR(255) NOT NULL COMMENT '统一封面图片URL（草稿/发布均必填）',
  video_url VARCHAR(255) NULL COMMENT '视频源文件URL（仅视频编码类型有效）',
  video_duration INT UNSIGNED NULL DEFAULT 0 COMMENT '视频时长（秒，仅视频编码类型有效）',
  -- 算法与推荐
  tags JSON NULL COMMENT '推荐与算法标签列表，JSON格式：["人工智能", "开源项目"]',
  -- 内容状态机
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT(草稿) | REVIEWING(审核中) | PUBLISHED(已发布) | BANNED(违规封禁) | DELETED(已删除)',
  published_at DATETIME NULL COMMENT '正式发布时间；草稿为 NULL',
  -- 可见性控制
  visibility VARCHAR(16) NOT NULL DEFAULT 'PUBLIC' COMMENT '可见性：PUBLIC(公开) | PRIVATE(仅自己可见)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_note_content_type_code (content_type_code),
  KEY idx_note_extended_uid (extended_uid),
  KEY idx_note_user_uid (user_uid),
  KEY idx_note_status (status),
  KEY idx_note_created_at (created_at),
  KEY idx_note_published_at (published_at),
  KEY idx_note_type_status (content_type_code, status),
  CONSTRAINT chk_unote_content_type CHECK (
    (content_type_code REGEXP '^TX[A-Za-z0-9]{11}$') OR
    (content_type_code REGEXP '^VD[A-Za-z0-9]{11}$')
  ),
  CONSTRAINT chk_unote_status CHECK (status IN ('DRAFT', 'REVIEWING', 'PUBLISHED', 'BANNED', 'DELETED')),
  CONSTRAINT chk_unote_visibility CHECK (visibility IN ('PUBLIC', 'PRIVATE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- t_user_note.extended_uid：联合投稿代发 Key（应用层关联，不设 FK；entity_code 或 team_uid）

-- 9.2 笔记正文大文本表（t_user_note_detail：垂直隔离冷数据 LONGTEXT，避免扫描主表时加载大字段）
-- parent_content_type_code：便捷笔记关联父视频笔记（仅图文笔记详情页展示；应用层自引用管理，不设 FK）
CREATE TABLE IF NOT EXISTS t_user_note_detail (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  content_type_code VARCHAR(64) NOT NULL COMMENT '对应 t_user_note.content_type_code（应用层关联）',
  parent_content_type_code VARCHAR(64) NULL COMMENT '父笔记 content_type_code（便捷笔记关联其视频笔记；顶级笔记为 NULL，应用层自引用管理）',
  content LONGTEXT NULL COMMENT '图文笔记 Markdown 正文；视频笔记不写入',
  PRIMARY KEY (id),
  UNIQUE KEY uk_note_detail_code (content_type_code),
  KEY idx_note_detail_parent (parent_content_type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9.3 笔记高频计数表（t_user_note_counter：热写分离，避免频繁更新主表行锁竞争）
CREATE TABLE IF NOT EXISTS t_user_note_counter (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  content_type_code VARCHAR(64) NOT NULL COMMENT '对应 t_user_note.content_type_code（应用层关联）',
  view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览量',
  like_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  collect_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '收藏数',
  comment_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论总数',
  PRIMARY KEY (id),
  UNIQUE KEY uk_note_counter_code (content_type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 第 10 章：互动与成就 (Interaction & Achievement)
-- =========================================================================

-- 10.1 用户标签兴趣画像（p_user_interest_tag：推荐系统权重底稿）
CREATE TABLE IF NOT EXISTS p_user_interest_tag (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID',
  tag VARCHAR(64) NOT NULL COMMENT '兴趣标签',
  weight DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计兴趣权重分',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_tag (user_uid, tag),
  KEY idx_p_user_interest_tag_user (user_uid),
  KEY idx_p_user_interest_tag_weight (weight),
  CONSTRAINT fk_p_user_interest_tag_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10.2 用户内容互动状态（t_user_interaction：点赞/收藏幂等）
CREATE TABLE IF NOT EXISTS t_user_interaction (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID',
  target_type VARCHAR(16) NOT NULL COMMENT 'NOTE | PROJECT',
  target_uid VARCHAR(64) NOT NULL COMMENT '目标内容对外 UID（note.content_type_code 或 project.project_uid）',
  liked TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '1=已点赞 0=未点赞',
  collected TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '1=已收藏 0=未收藏',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_content_target (user_uid, target_type, target_uid),
  KEY idx_interaction_target (target_type, target_uid),
  CONSTRAINT fk_t_user_interaction_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_inter_target CHECK (target_type IN ('NOTE', 'PROJECT')),
  CONSTRAINT chk_inter_liked CHECK (liked IN (0, 1)),
  CONSTRAINT chk_inter_collected CHECK (collected IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10.3 成就归档（t_project_achievement：user 1:N achievements）
CREATE TABLE t_project_achievement (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  achievement_uid CHAR(13) NOT NULL COMMENT '对外公开 UID（AC+11位 NanoID，见 AchievementUidGenerator）',
  user_uid CHAR(13) NOT NULL,
  source_project_uid CHAR(13) NULL COMMENT '原项目溯源 UID',
  masked_project_name VARCHAR(255) NOT NULL COMMENT '脱敏项目名',
  task_description TEXT NULL COMMENT '脱敏工作总结',
  technical_tags JSON NULL COMMENT '技术标签',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_achievement_uid (achievement_uid),
  KEY idx_t_project_achievement_user_uid (user_uid),
  KEY idx_t_project_achievement_completed_at (completed_at),
  CONSTRAINT fk_t_project_achievement_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_t_project_achievement_project FOREIGN KEY (source_project_uid) REFERENCES t_project(project_uid)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_pach_uid CHECK (achievement_uid REGEXP '^AC[A-Za-z0-9]{11}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 第 11 章：基础设施 (System Infrastructure)
-- =========================================================================

-- 11.1 数据加密密钥管理表（sys_data_encryption_keys）
-- 《密码法》第24条 + 商用密码应用安全性评估（密评3级） + GB/T 35273-2020 §7
-- + 等保2.0 三级"数据保密性"要求（GB/T 22239-2019 §8.1.4.3）
--
-- 分层密钥体系（Envelope Encryption）：
--   KMS/HSM → Master Key (Key Encryption Key, KEK)
--          → Data Encryption Key (DEK) ← 本表存储
--          → 业务 PII 字段密文（t_user_identity.encrypted_real_name 等）
--   每次加密：随机生成 DEK 或选取 ACTIVE DEK → 用 MK 包裹 DEK 存 encrypted_key
--   每次解密：根据 PII 行携带的 encryption_key_id → 查出 encrypted_key → 用 MK 解密 DEK → 解密 PII
--
-- 算法兼容性：
--   AES-256-GCM（当前默认，FIPS 140-2 认证）
--   SM4-GCM（国密，《密码法》合规，密评强制要求）。通过 algorithm 字段实现算法共存，
--   后续国密迁移时仅需 INSERT 一行 SM4 ACTIVE 记录即可，无需 ALTER TABLE。
--
-- 密钥生命周期状态机（严格单向不可逆）：
--   INITIALIZED(已生成未激活) → ACTIVE(使用中) → ROTATED(已轮替) ⇢ REVOKED(已吊销)
--                                                    ↓ 全库异步重加密后
--
--   | 状态         | 加密新数据 | 解密历史数据 | 是否可物理删除 |
--   |-------------|-----------|-------------|---------------|
--   | INITIALIZED  | NO        | NO          | YES（未使用）  |
--   | ACTIVE       | YES       | YES         | 绝对禁止       |
--   | ROTATED      | NO        | YES（只读）  | 绝对禁止       |
--   | REVOKED      | NO        | NO          | 审计满3年后可  |
--
--   关键约束（应用层 enforce）：
--     · 同 key_type 同时最多存在 1 个 ACTIVE 和 1 个 INITIALIZED（轮转过渡态）
--     · ROTATED → REVOKED 变更前必须全库确认 0 行 PII 仍引用此 key_id
--     · REVOKED 密钥至少保留 3 年后再物理清理（等保审计要求）
CREATE TABLE sys_data_encryption_keys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- 密钥标识
  key_id CHAR(36) NOT NULL COMMENT 'DEK 全局唯一标识（UUID v7 格式，如 018f3a7e-9b3c-7345-b1d2-e6f4a8c0d1e2）。由应用层生成，内置时间戳保证全局有序+无碰撞',
  key_version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '同 key_id 的密钥版本号（递增正整数，表示当前实例的代数）。轮转时 key_id 不变，key_version += 1',
  key_type VARCHAR(32) NOT NULL COMMENT '密钥用途分类：PII（个人信息）、FINANCE（金融数据）、AUTH_CREDENTIAL（鉴权凭证）',
  -- 算法协商
  algorithm VARCHAR(32) NOT NULL DEFAULT 'AES-256-GCM' COMMENT '数据加密算法：AES-256-GCM（国际标准） | SM4-GCM（国密标准，《密码法》合规）。应用层根据此字段自动选择对应 Cipher 实例',
  -- 信封加密（Envelope Encryption）核心
  encrypted_key VARCHAR(768) NOT NULL COMMENT '经根密钥/主密钥（Master Key / KEK）AES-256-GCM 或 SM4-GCM-Wrap 加密后的 DEK 明文密文。格式：Base64(wrapping_iv:ciphertext:auth_tag)',
  master_key_id VARCHAR(128) NOT NULL COMMENT '用于包裹（wrap）本 DEK 的根密钥/主密钥的唯一标识。格式如 KMS:cn-shenzhen/key-abc123 或 aws:arn:... 或 vault:transit/dek-pii。多根密钥并存时唯一决定解密通路',
  wrapping_algorithm VARCHAR(32) NOT NULL DEFAULT 'AES-256-GCM-WRAP' COMMENT '密钥包裹算法：AES-256-GCM-WRAP | AES-256-KWP | SM4-GCM-WRAP。注意 WRAP 模式与数据加密 GCM 不同',
  -- 密钥状态与时间窗口
  key_status VARCHAR(16) NOT NULL DEFAULT 'INITIALIZED' COMMENT '密钥状态（严格状态机）：INITIALIZED（已生成未激活）| ACTIVE（有效期：允许加解密）| ROTATED（已过期轮替：禁止加密，仅解密只读，永久保留直至全库重密）| REVOKED（全库已无存量密文引用，等待审计期满后物理清除）',
  activated_at DATETIME(3) NULL COMMENT '密钥激活时间（应用层调用正式生效时精确到毫秒）。INITIALIZED 状态时为 NULL',
  rotation_at DATETIME(3) NULL COMMENT '计划轮转时间（通常 = activated_at + 90天）。到期后密钥自动切换为 ACTIVE→ROTATED（定时任务或 KMS 回调触发）',
  revoked_at DATETIME(3) NULL COMMENT '吊销时间（全库异步重密完成后的最后一步）。REVOKED 状态下必填',
  auto_retire_on DATETIME(3) NULL COMMENT 'REVOKED 密钥的审计保留截止日（revoked_at + 3年）。到期后运维方可物理 DELETE 此条记录',
  -- 审计溯源（GB/T 35273 §8.1 安全审计 + 等保2.0 问责要求）
  created_by VARCHAR(64) NOT NULL COMMENT '密钥创建操作人：SYSTEM（自动化密钥管理服务） | sys_admin.id（手动应急创建）。审计必备',
  rotated_by VARCHAR(64) NULL COMMENT '密钥轮转操作人标识。ACTIVE→ROTATED 时回填',
  revoked_by VARCHAR(64) NULL COMMENT '密钥吊销操作人标识。ROTATED→REVOKED 时回填。三权分立：created/rotated/revoked 可能由不同角色执行',
  -- 元数据时间戳
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 约束与索引
  PRIMARY KEY (id),
  UNIQUE KEY uk_key_id_version (key_id, key_version),
  KEY idx_key_type_status (key_type, key_status),
  KEY idx_key_active_alg (key_type, key_status, algorithm),
  KEY idx_key_master (master_key_id),
  KEY idx_key_rotation_at (rotation_at),
  KEY idx_key_algorithm (algorithm),
  KEY idx_key_created_by (created_by),
  CONSTRAINT chk_dek_algorithm CHECK (algorithm IN ('AES-256-GCM', 'SM4-GCM', 'AES-256-CBC', 'SM4-CBC')),
  CONSTRAINT chk_dek_status CHECK (key_status IN ('INITIALIZED', 'ACTIVE', 'ROTATED', 'REVOKED')),
  CONSTRAINT chk_dek_wrap_alg CHECK (wrapping_algorithm IN ('AES-256-GCM-WRAP', 'AES-256-KWP', 'SM4-GCM-WRAP', 'RSA-OAEP-256'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='数据加密密钥管理表（《密码法》+密评3级+分层信封加密+国密兼容+全生命周期审计）';

-- 11.2 用户信用档案（sys_credit_profiles + sys_credit_logs）
CREATE TABLE IF NOT EXISTS sys_credit_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID，与用户 1:1 信用主档',
  credit_score INT NOT NULL DEFAULT 600 COMMENT '当前信用分（0~1000，默认 600）',
  account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | FROZEN（信用冻结，不阻断 user 登录）',
  last_changed_at DATETIME NULL COMMENT '最近一次分数变更时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_credit_profile_user_uid (user_uid),
  KEY idx_credit_profile_score (credit_score),
  KEY idx_credit_profile_status (account_status),
  CONSTRAINT fk_credit_profile_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_cpro_score CHECK (credit_score >= 0 AND credit_score <= 1000),
  CONSTRAINT chk_cpro_status CHECK (account_status IN ('ACTIVE', 'FROZEN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sys_credit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '被变更用户 UID',
  change_amount INT NOT NULL COMMENT '变更分值（正数加分，负数扣分）',
  score_before INT NOT NULL COMMENT '变更前信用分',
  score_after INT NOT NULL COMMENT '变更后信用分',
  biz_type VARCHAR(32) NOT NULL COMMENT '业务类型：REGISTER | PROJECT_COMPLETE | PROJECT_VIOLATION | NOTE_VIOLATION | ADMIN_ADJUST | APPEAL_RESTORE',
  biz_ref_key VARCHAR(64) NULL COMMENT '关联业务 Key（project_uid / content_type_code / approval_key 等，可空）',
  operator_key VARCHAR(64) NOT NULL DEFAULT 'SYSTEM' COMMENT '操作方：SYSTEM | user_uid | sys_admin.id',
  remark VARCHAR(255) NULL COMMENT '变更说明/审核备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_credit_log_user_uid (user_uid),
  KEY idx_credit_log_user_created (user_uid, created_at),
  KEY idx_credit_log_biz (biz_type, biz_ref_key),
  CONSTRAINT fk_credit_log_user FOREIGN KEY (user_uid) REFERENCES t_user(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_clog_score_before CHECK (score_before >= 0 AND score_before <= 1000),
  CONSTRAINT chk_clog_score_after CHECK (score_after >= 0 AND score_after <= 1000),
  CONSTRAINT chk_clog_biz_type CHECK (biz_type IN (
    'REGISTER', 'PROJECT_COMPLETE', 'PROJECT_VIOLATION', 'NOTE_VIOLATION',
    'ADMIN_ADJUST', 'APPEAL_RESTORE'
  ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- sys_credit_profiles / sys_credit_logs 说明
-- | 表                  | 职责                                                         |
-- |---------------------|--------------------------------------------------------------|
-- | sys_credit_profiles | 用户信用主档：当前分数、信用账户状态（1 用户 1 行；等级仅 p_user_profile.level） |
-- | sys_credit_logs     | 分数变更流水：只追加不修改；score_before/after 便于审计对账   |
--
-- 典型写入流程（应用层事务）：
--   1. SELECT ... FROM sys_credit_profiles WHERE user_uid=? FOR UPDATE
--   2. 计算 score_after = clamp(score_before + change_amount, 0, 1000)
--   3. UPDATE sys_credit_profiles SET credit_score=?, last_changed_at=NOW()
--   4. INSERT INTO sys_credit_logs (...)
--
-- 流水查询：WHERE user_uid=? ORDER BY created_at DESC, id DESC

-- 11.3 文件资产表（t_file_record：MD5 去重秒传底稿）
CREATE TABLE IF NOT EXISTS t_file_record (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  file_md5 CHAR(32) NOT NULL COMMENT '文件内容 MD5 十六进制指纹（去重终极防线）',
  file_path VARCHAR(255) NOT NULL COMMENT '静态资源访问网络 URL',
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
  mime_type VARCHAR(50) NULL COMMENT 'MIME 类型，如 image/png、video/mp4',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次入库时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_file_md5 (file_md5),
  KEY idx_file_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 附录 A：双 ID 设计说明（防 IDOR + 分库分表友好）
-- =========================================================================
-- | 表                        | 内部 id        | 对外 uid / 关联键                    |
-- |---------------------------|----------------|--------------------------------------|
-- | t_user                      | AUTO_INCREMENT | user_uid (US+11)                     |
-- | p_user_profile              | AUTO_INCREMENT | 无独立 uid，关联 user_uid            |
-- | t_tenant_organization                    | AUTO_INCREMENT | entity_code（社会统一信用代码）      |
-- | sys_entity_totp_credentials | AUTO_INCREMENT | admin_uid (EA+11)                  |
-- | t_team                      | AUTO_INCREMENT | team_uid (LB/ST+11)                  |
-- | t_project                   | AUTO_INCREMENT | project_uid (PR+11)                  |
-- | t_project                   | extended_uid   | entity_code 或 team_uid：代发归属（招募/主体项目，可空） |
-- | t_user_note                      | AUTO_INCREMENT | content_type_code (TX/VD+11)         |
-- | t_user_note                      | extended_uid   | entity_code 或 team_uid：联合投稿代发（可空） |
-- | t_project_achievement       | AUTO_INCREMENT | achievement_uid (AC+11)              |
-- | sys_approval_flows        | AUTO_INCREMENT | approval_key (APP+11)              |
-- | sys_credit_profiles       | AUTO_INCREMENT | user_uid（1:1 主档，无独立对外 uid） |
-- | sys_credit_logs           | AUTO_INCREMENT | 内部 id 流水，不对外暴露             |
-- | t_project_secret | project_uid PK | 永不对外暴露                         |
-- | t_user_interaction  | target_uid     | API 传 targetUid，库内直接存 uid     |
-- 跨表关联：用户→user_uid | 主体→entity_code | 团队→team_uid | 项目→project_uid

-- =========================================================================
-- 附录 B：账号状态机设计说明
-- =========================================================================
-- | 表     | 审核字段 audit_status              | 生命周期 account_status                    |
-- |--------|------------------------------------|--------------------------------------------|
-- | t_tenant_organization | 平台入驻 PENDING→APPROVED/REJECTED | ACTIVE ⇄ FROZEN → DEACTIVATED              |
-- | t_user   | （无，个人注册即 ACTIVE）            | ACTIVE ⇄ FROZEN → DEACTIVATED              |
-- | t_team   | LAB: 所属 entity 审核              | ACTIVE ⇄ FROZEN → DISBANDED / DEACTIVATED  |
-- |        | STUDENT_TEAM: 固定 APPROVED        | STUDENT_TEAM 无 entity 审核环节            |
-- 对外可见性（示例）：entity/user 须 account_status=ACTIVE；
-- LAB 团队 additionally 须 audit_status=APPROVED 且 account_status=ACTIVE。

-- =========================================================================
-- 附录 C：外键设计说明（分库分表：跨表关联一律使用 uid / entity_code，内部 id 仅作本地主键）
-- =========================================================================
-- | 表                  | 关联字段           | 引用                    |
-- |---------------------|--------------------|-------------------------|
-- | p_user_profile        | user_uid           | t_user(user_uid)          |
-- | p_tenant_org_profile      | entity_code        | t_tenant_organization(entity_code)     |
-- | t_user_organization_binding      | user_uid           | t_user(user_uid)          |
-- | t_user_organization_binding      | entity_code        | t_tenant_organization(entity_code)     |
-- | t_user_organization_binding      | audit_uid          | sys_entity_totp_credentials(admin_uid) |
-- | sys_entity_totp_credentials | entity_code | t_tenant_organization(entity_code)     |
-- | t_team                | owner_uid          | t_user(user_uid)          |
-- | t_team                | entity_code        | t_tenant_organization(entity_code)     |
-- | t_team                | audit_uid          | sys_entity_totp_credentials(admin_uid) |
-- | t_team_member         | team_uid           | t_team(team_uid)          |
-- | t_team_member         | user_uid           | t_user(user_uid)          |
-- | t_team_member         | invited_by_uid     | t_user(user_uid)          |
-- | t_project             | owner_uid          | t_user(user_uid)          |
-- | t_project             | team_uid           | t_team(team_uid)          |
-- | t_project_secret | project_uid  | t_project(project_uid)    |
-- | t_project_milestone           | project_uid        | t_project(project_uid)    |
-- | t_project_task_card           | assignee_uid       | t_user(user_uid)          |
-- | t_project_achievement | user_uid           | t_user(user_uid)          |
-- | t_project_achievement | source_project_uid | t_project(project_uid)    |
-- | t_user_note                | user_uid           | t_user(user_uid)          |
-- | p_user_interest_tag  | user_uid           | t_user(user_uid)          |
-- | t_user_interaction | user_uid    | t_user(user_uid)          |
-- | sys_approval_flows       | （无 FK）   | applicant_key / target_key 为多态 Key；target_key='0'→平台 |
-- | sys_credit_profiles      | user_uid    | t_user(user_uid)                          |
-- | sys_credit_logs          | user_uid    | t_user(user_uid)                          |

-- =========================================================================
-- 附录 D：学生学籍与毕业归档说明（p_user_profile.education_history + t_user_organization_binding）
-- =========================================================================
-- | 字段              | 说明                                                                 |
-- |-------------------|----------------------------------------------------------------------|
-- | graduation_year   | 在读学生（t_user_organization_binding.role=STUDENT 且 is_active=1）应用层 NOT NULL |
-- | education_history | 已毕业院校归档列表；元素格式见下                                      |
--
-- education_history 元素示例（JSON 对象）：
-- {
--   "entity_code": "10598",
--   "entity_name": "深圳大学",
--   "graduation_year": 2026,
--   "alumni_label": "深圳大学2026届校友",
--   "graduated_at": "2026-06-30T00:00:00"
-- }
--
-- 毕业归档事务（应用层实现，跨 p_user_profile + t_user_organization_binding）：
--   1. 锁定 t_user_organization_binding WHERE user_uid=? AND role='STUDENT' AND is_active=1
--   2. 由 entity_code JOIN p_tenant_org_profile 取 entity_name
--   3. alumni_label = entity_name || graduation_year || '届校友'
--   4. JSON_ARRAY_APPEND(education_history, '$', 上述对象)
--   5. t_user_organization_binding.is_active = 0（清空当前 entity_code 关联，保留历史行）
--   6. p_user_profile.current_entity_name = NULL

-- =========================================================================
-- 附录 E：补充外键：平台审核管理员（entity.audit_admin_id -> sys_admin.id）
-- =========================================================================
-- ALTER TABLE t_tenant_organization
--   ADD CONSTRAINT fk_entity_audit_admin FOREIGN KEY (audit_admin_id) REFERENCES sys_admin(id)
--     ON DELETE SET NULL ON UPDATE CASCADE;


-- =========================
-- 收尾
-- =========================
SET FOREIGN_KEY_CHECKS = 1;
