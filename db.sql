-- =========================
-- 01）会话初始化
-- =========================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- 02）清理旧表（可重复执行）
-- =========================
DROP TABLE IF EXISTS file_records;
DROP TABLE IF EXISTS user_content_interaction;
DROP TABLE IF EXISTS user_tag_interests;
DROP TABLE IF EXISTS achievement_archive;
DROP TABLE IF EXISTS note;
DROP TABLE IF EXISTS task_card;
DROP TABLE IF EXISTS milestone;
DROP TABLE IF EXISTS project_commercial_secret;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS team_member;
DROP TABLE IF EXISTS team;
DROP TABLE IF EXISTS laboratory;
DROP TABLE IF EXISTS user_auth_link;
DROP TABLE IF EXISTS user_profile;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS entity_profile;
DROP TABLE IF EXISTS entity;
DROP TABLE IF EXISTS sys_credit_logs;
DROP TABLE IF EXISTS sys_credit_profiles;
DROP TABLE IF EXISTS sys_approval_flows;
DROP TABLE IF EXISTS system_admin;


-- =========================================================================
-- 03）主体核心表 (entity) -> 只负责主体（高校/企业）的 Root 账号鉴权与资金控制
-- =========================================================================
CREATE TABLE IF NOT EXISTS entity (
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
  UNIQUE KEY uk_entity_code (entity_code), -- 🔒 确保机构代码全站唯一
  KEY idx_entity_audit_status (audit_status),
  KEY idx_entity_account_status (account_status),
  KEY idx_entity_last_login_at (last_login_at),
  CONSTRAINT chk_entity_audit_status CHECK (audit_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT chk_entity_account_status CHECK (account_status IN ('ACTIVE', 'FROZEN', 'DEACTIVATED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 04）主体档案表 (entity_profile) -> 负责学校/企业的官方主页展示（与 entity 1:1）
-- =========================================================================
CREATE TABLE IF NOT EXISTS entity_profile (
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
  UNIQUE KEY uk_entity_profile_entity_code (entity_code), -- 🔒 强约束 1:1 关系
  UNIQUE KEY uk_entity_profile_name (name), -- 主体名称全网唯一，用于前端展示
  KEY idx_entity_profile_type (type),
  CONSTRAINT fk_entity_profile_entity FOREIGN KEY (entity_code) REFERENCES entity(entity_code) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_entity_profile_type CHECK (type IN ('ENTERPRISE', 'UNIVERSITY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 05）用户核心表 (user) -> 只负责个人账号（手机/邮箱）的登录鉴权
-- =========================================================================
CREATE TABLE IF NOT EXISTS `user` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '对外公开 UID（US+11位 NanoID，见 UserUidGenerator）',
  phone VARCHAR(32) NOT NULL COMMENT '登录手机号',
  email VARCHAR(255) NULL COMMENT '登录邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '个人密码哈希',
  account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE(活跃) | FROZEN(冻结) | DEACTIVATED(注销)',
  account_status_changed_at DATETIME NULL COMMENT '账号状态最近变更时间',
  account_status_remark VARCHAR(255) NULL COMMENT '冻结/注销原因备注',
  last_login_at DATETIME NULL COMMENT '个人账号上次登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_uid (user_uid),
  UNIQUE KEY uk_user_phone (phone), -- 🔒 手机号全站唯一
  UNIQUE KEY uk_user_email (email), -- 🔒 邮箱全站唯一（允许为 NULL，但不允许重复）
  KEY idx_user_account_status (account_status),
  KEY idx_user_last_login_at (last_login_at),
  CONSTRAINT chk_user_uid CHECK (user_uid REGEXP '^US[A-Za-z0-9]{11}$'),
  CONSTRAINT chk_user_account_status CHECK (account_status IN ('ACTIVE', 'FROZEN', 'DEACTIVATED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 06）用户档案表 (user_profile) -> 负责学生/导师的个人主页与技术背景（与 user 1:1）
-- =========================================================================
CREATE TABLE IF NOT EXISTS user_profile (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '关联的用户 UID（无独立 profile uid）',
  nick_name VARCHAR(128) NULL COMMENT '用户昵称',
  real_name VARCHAR(128) NULL COMMENT '用户实名信息',
  avatar_url VARCHAR(255) NULL COMMENT '头像访问 URL',
  current_entity_name VARCHAR(255) NULL COMMENT '当前所属主体名称',
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
  UNIQUE KEY uk_user_profile_user_uid (user_uid), -- 🔒 强约束 1:1 关系
  KEY idx_user_profile_graduation_year (graduation_year),
  CONSTRAINT fk_user_profile_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_user_profile_graduation_year CHECK (
    graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= 2100)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===================================================
-- 07）用户机构认证关联表（user_auth_link）
-- ===================================================
CREATE TABLE user_auth_link (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID',
  entity_code VARCHAR(32) NOT NULL COMMENT '机构主体代码（学校或企业社会统一信用代码）',
  role VARCHAR(32) NOT NULL COMMENT 'PM(企业项目经理/员工) | MENTOR(学校指导老师) | STUDENT(学生)',
  -- 凭证资产留痕（审核必备）
  auth_serial_no VARCHAR(64) NULL COMMENT '学号 或 工号（可选冗余，方便检索）',
  proof_artifact_url VARCHAR(512) NULL COMMENT '认证证明材料URL（如学生证、工作证截图，供后台审核）',
  -- 区分两层状态机：审核状态 vs 物理生效状态
  audit_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING(待审核) | APPROVED(审核通过) | REJECTED(审核拒绝)',
  is_active TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1(当前活跃身份) | 0(历史失效/毕业离职归档)',
  remark VARCHAR(255) NULL COMMENT '审核拒绝原因或备注说明',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_auth_link_user_uid (user_uid),
  KEY idx_user_auth_link_entity_code (entity_code),
  KEY idx_user_auth_link_status (audit_status, is_active),
  -- 联合唯一索引保持不变，依然完美锁死“同机构同角色只能申请一次”
  UNIQUE KEY uk_user_auth_link_unique (user_uid, entity_code, role),
  CONSTRAINT fk_user_auth_link_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_auth_link_entity FOREIGN KEY (entity_code) REFERENCES entity(entity_code)
    ON DELETE RESTRICT ON UPDATE CASCADE, 
  CONSTRAINT chk_user_auth_link_role CHECK (role IN ('PM','MENTOR','STUDENT')),
  CONSTRAINT chk_user_auth_link_audit CHECK (audit_status IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT chk_user_auth_link_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===================================================
-- 08）统一团队与实验室表（team）
-- ===================================================
CREATE TABLE team (
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
  KEY idx_team_account_status (account_status),
  CONSTRAINT fk_team_owner FOREIGN KEY (owner_uid) REFERENCES `user`(user_uid) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_team_entity FOREIGN KEY (entity_code) REFERENCES entity(entity_code) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_team_audit_status CHECK (audit_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT chk_team_account_status CHECK (account_status IN ('ACTIVE', 'FROZEN', 'DISBANDED', 'DEACTIVATED')),
  CONSTRAINT chk_team_type CHECK (type IN ('LAB', 'STUDENT_TEAM')),
  CONSTRAINT chk_team_student_team_auto_approved CHECK (
    type <> 'STUDENT_TEAM' OR audit_status = 'APPROVED'
  ),
  CONSTRAINT chk_team_uid CHECK (
    (type = 'LAB' AND team_uid REGEXP '^LB[A-Za-z0-9]{11}$') OR
    (type = 'STUDENT_TEAM' AND team_uid REGEXP '^ST[A-Za-z0-9]{11}$')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- LAB 团队创建时 entity_code 必填（应用层校验；不可写 CHECK，因 entity_code 参与 FK referential action）

-- ===================================================
-- 09）团队/实验室成员关联表（team_member）
-- ===================================================
CREATE TABLE team_member (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_uid CHAR(13) NOT NULL COMMENT '团队/实验室 UID',
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID（学生或导师）',
  role VARCHAR(32) NOT NULL DEFAULT 'MEMBER' COMMENT 'LEADER(队长/负责人) | MEMBER(普通成员) | MENTOR(指导老师/学术导师)',
  lab_user_uid CHAR(13) NULL COMMENT '用于严格限制学生单实验室的影子字段',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_member_team_uid (team_uid),
  KEY idx_member_user_uid (user_uid),
  CONSTRAINT fk_member_team_uid FOREIGN KEY (team_uid) REFERENCES team(team_uid) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_user_uid FOREIGN KEY (user_uid) REFERENCES `user`(user_uid) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_lab_user_uid FOREIGN KEY (lab_user_uid) REFERENCES `user`(user_uid) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY uk_team_user (team_uid, user_uid),
  UNIQUE KEY uk_single_lab_user (lab_user_uid),
  CONSTRAINT chk_member_role CHECK (role IN ('LEADER', 'MEMBER', 'MENTOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===================================================
-- 10）统一项目主表（project）- 详情读接口见 apps/web-client/API-request.md §06.1
-- ===================================================
CREATE TABLE project (
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
  description LONGTEXT NULL COMMENT '项目详情正文（Markdown，前端 Milkdown 渲染）',
  tags JSON NULL COMMENT '推荐与算法标签列表',
  duration VARCHAR(64) NULL COMMENT '预计周期',
  team_size VARCHAR(64) NULL COMMENT '团队人数',
  deadline DATE NULL COMMENT '报名截止日期',
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
  CONSTRAINT fk_project_owner FOREIGN KEY (owner_uid) REFERENCES `user`(user_uid)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_project_team FOREIGN KEY (team_uid) REFERENCES team(team_uid)
    ON DELETE SET NULL ON UPDATE CASCADE, 
  CONSTRAINT chk_project_category CHECK (category IN ('COMMERCIAL', 'RECRUITMENT')),
  CONSTRAINT chk_project_uid CHECK (project_uid REGEXP '^PR[A-Za-z0-9]{11}$'),
  CONSTRAINT chk_project_recruitment_type CHECK (recruitment_type IN ('LAB_RECRUIT', 'TEAM_RECRUIT', 'CAMPUS_PRACTICE', 'PERSONAL_RECRUIT')),
  CONSTRAINT chk_project_status CHECK (status IN ('DRAFT', 'OPEN', 'ONGOING', 'CLOSED')),
  CONSTRAINT chk_project_level CHECK (level IN ('N','R','SR','SSR','UR')),
  CONSTRAINT chk_project_editor_type CHECK (editor_type IN ('MARKDOWN', 'RICHTEXT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- project.extended_uid：多态代发 Key（不设 FK；值为 entity_code 或 team_uid）
-- 企业/学校代发 → entity_code；实验室/学生团队招募 → team_uid (LB/ST+11)

-- =========================================================================
-- 11）商业项目敏感与隐私扩展表（project_commercial_secret）
-- 🔒 双 ID 安全：本表仅通过 project_uid 关联；API 禁止暴露自增 id
-- =========================================================================
CREATE TABLE project_commercial_secret (
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
  -- 外键强约束：主表删除了项目，敏感表连带自动删除（CASCADE）
  CONSTRAINT fk_secret_project_uid FOREIGN KEY (project_uid) REFERENCES project(project_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,  
  -- 数据库防御死锁：严格限制状态机的输入值，防止后端代码写错
  CONSTRAINT chk_secret_commercial_status CHECK (
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

-- =========================
-- 12）里程碑（milestone：project 1:N milestones）
-- =========================
CREATE TABLE milestone (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_uid CHAR(13) NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '里程碑标题',
  payment_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '拨款占比',
  status VARCHAR(32) NOT NULL COMMENT '协商状态（项目PM与学生PM协商）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_milestone_project_uid (project_uid),
  CONSTRAINT fk_milestone_project FOREIGN KEY (project_uid) REFERENCES project(project_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_milestone_payment_pct CHECK (payment_pct >= 0 AND payment_pct <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 13）任务卡片（task_card：milestone 1:N task cards）
-- =========================
CREATE TABLE task_card (
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
  CONSTRAINT fk_task_card_milestone FOREIGN KEY (milestone_id) REFERENCES milestone(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_card_assignee FOREIGN KEY (assignee_uid) REFERENCES `user`(user_uid)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_task_card_status CHECK (status IN ('DONE','TODO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 14）成就归档（achievement_archive：user 1:N achievements）
-- =========================
CREATE TABLE achievement_archive (
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
  KEY idx_achievement_archive_user_uid (user_uid),
  KEY idx_achievement_archive_completed_at (completed_at),
  CONSTRAINT fk_achievement_archive_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_achievement_archive_project FOREIGN KEY (source_project_uid) REFERENCES project(project_uid)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_achievement_uid CHECK (achievement_uid REGEXP '^AC[A-Za-z0-9]{11}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 15）笔记表（note：user 1:N notes）- 详情读接口见 apps/web-client/API-request.md §06.2
-- =========================================================================
CREATE TABLE IF NOT EXISTS note (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '发布笔记的用户 UID',
  -- 对外公开 UID（双 ID 之外层）：API / Feed 字段名 uid；与 content_type_code 同值
  -- 类型编码：TX/VD + 11 位 [A-Za-z0-9]，后缀由 NanoID 随机生成（见 NoteContentTypeCodeGenerator）
  content_type_code VARCHAR(64) NOT NULL COMMENT '对外 uid + 内容类型编码（视频:VD+11位 | 图文:TX+11位）',
  -- 代发主体/团队 Key：entity_code 或 team_uid，标识联合投稿（替企业/学校/实验室/学生团队发布）
  extended_uid VARCHAR(32) NULL COMMENT '代发归属：entity_code 或 team_uid（联合投稿）',
  title VARCHAR(255) NOT NULL COMMENT '笔记标题',
  summary TEXT NOT NULL COMMENT '笔记外部预览摘要（列表页展示）',
  editor_type VARCHAR(32) NOT NULL DEFAULT 'MARKDOWN' COMMENT '编辑器类型：MARKDOWN | RICHTEXT（暂保留，当前前端统一 Milkdown）',
  content LONGTEXT NULL COMMENT '图文笔记 Markdown 正文；视频笔记不写入',
  
  -- 媒体资源
  cover_url VARCHAR(255) NOT NULL COMMENT '统一封面图片URL（草稿/发布均必填）',
  video_url VARCHAR(255) NULL COMMENT '视频源文件URL（仅视频编码类型有效）',
  video_duration INT UNSIGNED NULL DEFAULT 0 COMMENT '视频时长（秒，仅视频编码类型有效）',
  -- 算法与推荐
  tags JSON NULL COMMENT '推荐与算法标签列表，JSON格式：["人工智能", "开源项目"]',
  -- 核心计数器
  view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览量',
  like_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  collect_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '收藏数',
  comment_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论总数',
  -- 内容状态机
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT(草稿) | PUBLISHED(已发布) | BANNED(违规封禁)',
  published_at DATETIME NULL COMMENT '正式发布时间；草稿为 NULL',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_note_content_type_code (content_type_code),
  KEY idx_note_extended_uid (extended_uid),
  KEY idx_note_user_uid (user_uid),
  KEY idx_note_status (status),
  KEY idx_note_created_at (created_at),
  KEY idx_note_published_at (published_at),
  -- 复合索引：大厅按类型 + 状态刷首屏
  KEY idx_note_type_status (content_type_code, status),
  CONSTRAINT fk_note_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_note_content_type_code CHECK (
    (content_type_code REGEXP '^TX[A-Za-z0-9]{11}$') OR
    (content_type_code REGEXP '^VD[A-Za-z0-9]{11}$')
  ),
  CONSTRAINT chk_note_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'BANNED')),
  CONSTRAINT chk_note_editor_type CHECK (editor_type IN ('MARKDOWN', 'RICHTEXT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- note.extended_uid：联合投稿代发 Key（不设 FK；entity_code 或 team_uid）

-- =========================================================================
-- 16）用户标签兴趣画像（user_tag_interests：推荐系统权重底稿）
-- =========================================================================
CREATE TABLE IF NOT EXISTS user_tag_interests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '用户 UID',
  tag VARCHAR(64) NOT NULL COMMENT '兴趣标签',
  weight DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计兴趣权重分',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_tag (user_uid, tag),
  KEY idx_user_tag_interests_user (user_uid),
  KEY idx_user_tag_interests_weight (weight),
  CONSTRAINT fk_user_tag_interests_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 17）用户内容互动状态（user_content_interaction：点赞/收藏幂等）
-- =========================================================================
CREATE TABLE IF NOT EXISTS user_content_interaction (
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
  CONSTRAINT fk_user_content_interaction_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_interaction_target_type CHECK (target_type IN ('NOTE', 'PROJECT')),
  CONSTRAINT chk_interaction_liked CHECK (liked IN (0, 1)),
  CONSTRAINT chk_interaction_collected CHECK (collected IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 18）文件资产表（file_records：MD5 去重秒传底稿）
-- =========================================================================
CREATE TABLE IF NOT EXISTS file_records (
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

-- =========================
-- 19）系统管理员表：完全独立于业务用户体系
-- =========================
CREATE TABLE IF NOT EXISTS system_admin (
  id VARCHAR(32) NOT NULL COMMENT '登录凭证 (管理员账号)',
  password_hash VARCHAR(255) NOT NULL COMMENT '加密密码',
  auth_level INT NOT NULL DEFAULT 1 COMMENT '权限等级: 1-普通审计, 2-高级管理, 3-超级管理员',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 插入测试管理员账号
INSERT IGNORE INTO system_admin (id, password_hash, auth_level) VALUES 
('admin_master', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 3),
('admin_auditor', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 1),
('admin_manager', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 2);

-- =========================================================================
-- 20）统一审批流表（sys_approval_flows：跨业务审批工单，无 FK 便于分库）
-- =========================================================================
CREATE TABLE IF NOT EXISTS sys_approval_flows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  approval_key VARCHAR(64) NOT NULL COMMENT '对外公开审批单 Key（APP+11位 [A-Za-z0-9]，如 app_aB7x9K2mN4pQ）',
  business_type VARCHAR(32) NOT NULL COMMENT 'PROJECT_FUND | LAB_CREATE | MENTOR_AUTH，可后续拓展：USER_AUTH | ENTITY_AUTH | TEAM_AUTH',
  applicant_key VARCHAR(64) NOT NULL COMMENT '申请人 Key（通常为 user_uid 或 entity_code，分库友好不设 FK）',
  target_entity_key VARCHAR(64) NOT NULL COMMENT '审批主体 Key：entity_code；特殊值 0 表示平台官方审批',
  status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0:待审批 1:已批准 2:已驳回 3:已撤回',
  payload JSON NOT NULL COMMENT '业务差异化数据（各 business_type 自定义 JSON 结构）',
  remark VARCHAR(255) NULL COMMENT '审批意见/驳回理由',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_approval_key (approval_key),
  KEY idx_approval_target_entity (target_entity_key),
  KEY idx_approval_applicant (applicant_key),
  KEY idx_approval_target_status (target_entity_key, status),
  KEY idx_approval_business_type (business_type),
  CONSTRAINT chk_approval_key CHECK (approval_key REGEXP '^APP[A-Za-z0-9]{11}$'),
  CONSTRAINT chk_approval_business_type CHECK (business_type IN ('PROJECT_FUND', 'LAB_CREATE', 'MENTOR_AUTH')),
  CONSTRAINT chk_approval_status CHECK (status IN (0, 1, 2, 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------------------
-- sys_approval_flows 说明
-- | target_entity_key | 含义                                      |
-- |-------------------|-------------------------------------------|
-- | entity_code       | 由对应学校/企业管理员在其空间内审批          |
-- | '0'               | 平台官方审批（system_admin 侧处理）         |
-- | applicant_key     | 通常为 user_uid(US...) 或 entity_code     |
-- | payload           | 按 business_type 存放专属字段，避免宽表膨胀  |
-- 待办列表查询：WHERE target_entity_key = ? AND status = 0
-- 我的申请查询：WHERE applicant_key = ? ORDER BY created_at DESC
-- -------------------------------------------------------------------------

-- =========================================================================
-- 21）用户信用档案（sys_credit_profiles + sys_credit_logs）
-- =========================================================================
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
  CONSTRAINT fk_credit_profile_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_credit_profile_score CHECK (credit_score >= 0 AND credit_score <= 1000),
  CONSTRAINT chk_credit_profile_status CHECK (account_status IN ('ACTIVE', 'FROZEN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sys_credit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL COMMENT '被变更用户 UID',
  change_amount INT NOT NULL COMMENT '变更分值（正数加分，负数扣分）',
  score_before INT NOT NULL COMMENT '变更前信用分',
  score_after INT NOT NULL COMMENT '变更后信用分',
  biz_type VARCHAR(32) NOT NULL COMMENT '业务类型：REGISTER | PROJECT_COMPLETE | PROJECT_VIOLATION | NOTE_VIOLATION | ADMIN_ADJUST | APPEAL_RESTORE',
  biz_ref_key VARCHAR(64) NULL COMMENT '关联业务 Key（project_uid / content_type_code / approval_key 等，可空）',
  operator_key VARCHAR(64) NOT NULL DEFAULT 'SYSTEM' COMMENT '操作方：SYSTEM | user_uid | system_admin.id',
  remark VARCHAR(255) NULL COMMENT '变更说明/审核备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_credit_log_user_uid (user_uid),
  KEY idx_credit_log_user_created (user_uid, created_at),
  KEY idx_credit_log_biz (biz_type, biz_ref_key),
  CONSTRAINT fk_credit_log_user FOREIGN KEY (user_uid) REFERENCES `user`(user_uid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_credit_log_score_before CHECK (score_before >= 0 AND score_before <= 1000),
  CONSTRAINT chk_credit_log_score_after CHECK (score_after >= 0 AND score_after <= 1000),
  CONSTRAINT chk_credit_log_biz_type CHECK (biz_type IN (
    'REGISTER', 'PROJECT_COMPLETE', 'PROJECT_VIOLATION', 'NOTE_VIOLATION',
    'ADMIN_ADJUST', 'APPEAL_RESTORE'
  ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------------------
-- sys_credit_profiles / sys_credit_logs 说明
-- | 表                  | 职责                                                         |
-- |---------------------|--------------------------------------------------------------|
-- | sys_credit_profiles | 用户信用主档：当前分数、信用账户状态（1 用户 1 行；等级仅 user_profile.level） |
-- | sys_credit_logs     | 分数变更流水：只追加不修改；score_before/after 便于审计对账   |
--
-- 典型写入流程（应用层事务）：
--   1. SELECT ... FROM sys_credit_profiles WHERE user_uid=? FOR UPDATE
--   2. 计算 score_after = clamp(score_before + change_amount, 0, 1000)
--   3. UPDATE sys_credit_profiles SET credit_score=?, last_changed_at=NOW()
--   4. INSERT INTO sys_credit_logs (...)
--
-- 流水查询：WHERE user_uid=? ORDER BY created_at DESC, id DESC
-- -------------------------------------------------------------------------

-- =========================================================================
-- 双 ID 设计说明（防 IDOR + 分库分表友好）
-- | 表                        | 内部 id        | 对外 uid / 关联键                    |
-- |---------------------------|----------------|--------------------------------------|
-- | user                      | AUTO_INCREMENT | user_uid (US+11)                     |
-- | user_profile              | AUTO_INCREMENT | 无独立 uid，关联 user_uid            |
-- | entity                    | AUTO_INCREMENT | entity_code（社会统一信用代码）      |
-- | team                      | AUTO_INCREMENT | team_uid (LB/ST+11)                  |
-- | project                   | AUTO_INCREMENT | project_uid (PR+11)                  |
-- | project                   | extended_uid   | entity_code 或 team_uid：代发归属（招募/主体项目，可空） |
-- | note                      | AUTO_INCREMENT | content_type_code (TX/VD+11)         |
-- | note                      | extended_uid   | entity_code 或 team_uid：联合投稿代发（可空） |
-- | achievement_archive       | AUTO_INCREMENT | achievement_uid (AC+11)              |
-- | sys_approval_flows        | AUTO_INCREMENT | approval_key (app_+11)             |
-- | sys_credit_profiles     | AUTO_INCREMENT | user_uid（1:1 主档，无独立对外 uid） |
-- | sys_credit_logs         | AUTO_INCREMENT | 内部 id 流水，不对外暴露             |
-- | project_commercial_secret | project_uid PK | 永不对外暴露                         |
-- | user_content_interaction  | target_uid     | API 传 targetUid，库内直接存 uid     |
-- 跨表关联：用户→user_uid | 主体→entity_code | 团队→team_uid | 项目→project_uid
-- =========================================================================

-- =========================================================================
-- 账号状态机设计说明
-- | 表     | 审核字段 audit_status              | 生命周期 account_status                    |
-- |--------|------------------------------------|--------------------------------------------|
-- | entity | 平台入驻 PENDING→APPROVED/REJECTED | ACTIVE ⇄ FROZEN → DEACTIVATED              |
-- | user   | （无，个人注册即 ACTIVE）            | ACTIVE ⇄ FROZEN → DEACTIVATED              |
-- | team   | LAB: 所属 entity 审核              | ACTIVE ⇄ FROZEN → DISBANDED / DEACTIVATED  |
-- |        | STUDENT_TEAM: 固定 APPROVED        | STUDENT_TEAM 无 entity 审核环节            |
-- 对外可见性（示例）：entity/user 须 account_status=ACTIVE；
-- LAB 团队 additionally 须 audit_status=APPROVED 且 account_status=ACTIVE。
-- =========================================================================

-- =========================
-- 外键设计说明（分库分表：跨表关联一律使用 uid / entity_code，内部 id 仅作本地主键）
-- | 表                  | 关联字段           | 引用                    |
-- |---------------------|--------------------|-------------------------|
-- | user_profile        | user_uid           | user(user_uid)          |
-- | entity_profile      | entity_code        | entity(entity_code)     |
-- | user_auth_link      | user_uid           | user(user_uid)          |
-- | user_auth_link      | entity_code        | entity(entity_code)     |
-- | team                | owner_uid          | user(user_uid)          |
-- | team                | entity_code        | entity(entity_code)     |
-- | team_member         | team_uid           | team(team_uid)          |
-- | team_member         | user_uid           | user(user_uid)          |
-- | project             | owner_uid          | user(user_uid)          |
-- | project             | team_uid           | team(team_uid)          |
-- | project_commercial_secret | project_uid  | project(project_uid)    |
-- | milestone           | project_uid        | project(project_uid)    |
-- | task_card           | assignee_uid       | user(user_uid)          |
-- | achievement_archive | user_uid           | user(user_uid)          |
-- | achievement_archive | source_project_uid | project(project_uid)    |
-- | note                | user_uid           | user(user_uid)          |
-- | user_tag_interests  | user_uid           | user(user_uid)          |
-- | user_content_interaction | user_uid    | user(user_uid)          |
-- | sys_approval_flows       | （无 FK）   | applicant_key / target_entity_key 为多态 Key；target_entity_key='0'→平台 |
-- | sys_credit_profiles      | user_uid    | user(user_uid)                          |
-- | sys_credit_logs          | user_uid    | user(user_uid)                          |
-- =========================
 
-- -------------------------------------------------------------------------
-- 学生学籍与毕业归档说明（user_profile.education_history + user_auth_link）
-- | 字段              | 说明                                                                 |
-- |-------------------|----------------------------------------------------------------------|
-- | graduation_year   | 在读学生（user_auth_link.role=STUDENT 且 is_active=1）应用层 NOT NULL |
-- | education_history | 已毕业院校归档列表；元素格式见下                                      |
--
-- education_history 元素示例（JSON 对象）：
-- {
--   "entity_code": "4144010598",
--   "entity_name": "深圳大学",
--   "graduation_year": 2026,
--   "alumni_label": "深圳大学2026届校友",
--   "graduated_at": "2026-06-30T00:00:00"
-- }
--
-- 毕业归档事务（应用层实现，跨 user_profile + user_auth_link）：
--   1. 锁定 user_auth_link WHERE user_uid=? AND role='STUDENT' AND is_active=1
--   2. 由 entity_code JOIN entity_profile 取 entity_name
--   3. alumni_label = entity_name || graduation_year || '届校友'
--   4. JSON_ARRAY_APPEND(education_history, '$', 上述对象)
--   5. user_auth_link.is_active = 0（清空当前 entity_code 关联，保留历史行）
--   6. user_profile.current_entity_name = NULL
-- -------------------------------------------------------------------------

-- =========================
-- 17）补充外键：主体审核管理员（entity.audit_admin_id -> system_admin.id）
-- =========================
-- ALTER TABLE entity
--   ADD CONSTRAINT fk_entity_audit_admin FOREIGN KEY (audit_admin_id) REFERENCES system_admin(id)
--     ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================
-- 17）收尾
-- =========================
SET FOREIGN_KEY_CHECKS = 1;