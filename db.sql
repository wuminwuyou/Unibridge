-- =========================
-- 01）会话初始化
-- =========================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- 02）清理旧表（可重复执行）
-- =========================
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
  audit_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT '管理员审核状态：PENDING | APPROVED | REJECTED',
  audit_admin_id VARCHAR(32) NULL COMMENT '审核管理员ID（编号+实名）',
  audited_at DATETIME NULL COMMENT '审核通过时间',
  last_login_at DATETIME NULL COMMENT '账号上次登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_entity_code (entity_code), -- 🔒 确保机构代码全站唯一
  KEY idx_entity_audit_status (audit_status),
  KEY idx_entity_last_login_at (last_login_at),
  CONSTRAINT chk_entity_audit_status CHECK (audit_status IN ('PENDING', 'APPROVED', 'REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 04）主体档案表 (entity_profile) -> 负责学校/企业的官方主页展示（与 entity 1:1）
-- =========================================================================
CREATE TABLE IF NOT EXISTS entity_profile (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_id BIGINT UNSIGNED NOT NULL COMMENT '关联的主体ID',
  name VARCHAR(255) NOT NULL COMMENT '主体官方全称',
  type VARCHAR(32) NOT NULL COMMENT '主体类型：ENTERPRISE | UNIVERSITY',
  logo_url VARCHAR(255) NULL COMMENT '主体 LOGO 访问 URL',
  banner_url VARCHAR(255) NULL COMMENT '主体主页顶部背景大图 URL',
  intro VARCHAR(50) NULL COMMENT '主体简介（最多50字）',
  announcement VARCHAR(200) NULL COMMENT '机构/学校/企业公告（最多200字）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_entity_profile_entity_id (entity_id), -- 🔒 强约束 1:1 关系
  UNIQUE KEY uk_entity_profile_name (name), -- 主体名称全网唯一，用于前端展示
  KEY idx_entity_profile_type (type),
  CONSTRAINT fk_entity_profile_entity FOREIGN KEY (entity_id) REFERENCES entity(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_entity_profile_type CHECK (type IN ('ENTERPRISE', 'UNIVERSITY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 05）用户核心表 (user) -> 只负责个人账号（手机/邮箱）的登录鉴权
-- =========================================================================
CREATE TABLE IF NOT EXISTS `user` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone VARCHAR(32) NOT NULL COMMENT '登录手机号',
  email VARCHAR(255) NULL COMMENT '登录邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '个人密码哈希',
  last_login_at DATETIME NULL COMMENT '个人账号上次登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_phone (phone), -- 🔒 手机号全站唯一
  UNIQUE KEY uk_user_email (email), -- 🔒 邮箱全站唯一（允许为 NULL，但不允许重复）
  KEY idx_user_last_login_at (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================================
-- 06）用户档案表 (user_profile) -> 负责学生/导师的个人主页与技术背景（与 user 1:1）
-- =========================================================================
CREATE TABLE IF NOT EXISTS user_profile (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '关联的用户ID',
  nick_name VARCHAR(128) NULL COMMENT '用户昵称',
  real_name VARCHAR(128) NULL COMMENT '用户实名信息',
  avatar_url VARCHAR(255) NULL COMMENT '头像访问 URL',
  current_entity_name VARCHAR(255) NULL COMMENT '当前所属主体名称',
  level VARCHAR(16) NULL COMMENT '用户等级：N | R | SR | SSR | UR',
  bio_data JSON NULL COMMENT '技术栈/兴趣标签（JSON 格式：["Java", "React"]）',
  career_data JSON NULL COMMENT '职业/学籍背景数据结构',
  intro VARCHAR(50) NULL COMMENT '个人一句话简介（最多50字）',
  announcement VARCHAR(200) NULL COMMENT '个人公告（最多200字）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_profile_user_id (user_id), -- 🔒 强约束 1:1 关系
  CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES `user`(id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===================================================
-- 07）用户机构认证关联表（user_auth_link）
-- ===================================================
CREATE TABLE user_auth_link (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  entity_id BIGINT UNSIGNED NOT NULL COMMENT '机构主体ID（学校或企业）',
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
  KEY idx_user_auth_link_user_id (user_id),
  KEY idx_user_auth_link_entity_id (entity_id),
  KEY idx_user_auth_link_status (audit_status, is_active),
  -- 联合唯一索引保持不变，依然完美锁死“同机构同角色只能申请一次”
  UNIQUE KEY uk_user_auth_link_unique (user_id, entity_id, role),
  CONSTRAINT fk_user_auth_link_user FOREIGN KEY (user_id) REFERENCES `user`(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_auth_link_entity FOREIGN KEY (entity_id) REFERENCES entity(id)
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
  type VARCHAR(32) NOT NULL COMMENT 'LAB(学校官方实验室) | STUDENT_TEAM(学生自发团队)', 
  owner_id BIGINT UNSIGNED NULL COMMENT '第一负责人/创建者 (USER_ID，实验室为一号导师，学生队为队长)',
  owner_name VARCHAR(255) NULL COMMENT '负责人姓名冗余',
  entity_id BIGINT UNSIGNED NULL COMMENT '所属机构主体ID（仅实验室有效）',
  team_name VARCHAR(255) NOT NULL COMMENT '团队或实验室名称',
  tag JSON NULL COMMENT '技能/方向标签列表',
  intro VARCHAR(200) NULL COMMENT '职能简介（最多200字）',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | DISBANDED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team_type (type),
  KEY idx_team_owner_id (owner_id),
  KEY idx_team_entity_id (entity_id),
  KEY idx_team_status (status),
  CONSTRAINT fk_team_owner FOREIGN KEY (owner_id) REFERENCES `user`(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_team_entity FOREIGN KEY (entity_id) REFERENCES entity(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_team_status CHECK (status IN ('ACTIVE', 'DISBANDED')),
  CONSTRAINT chk_team_type CHECK (type IN ('LAB', 'STUDENT_TEAM'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===================================================
-- 09）团队/实验室成员关联表（team_member）
-- ===================================================
CREATE TABLE team_member (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_id BIGINT UNSIGNED NOT NULL COMMENT '团队/实验室ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID（学生或导师）',
  role VARCHAR(32) NOT NULL DEFAULT 'MEMBER' COMMENT 'LEADER(队长/负责人) | MEMBER(普通成员) | MENTOR(指导老师/学术导师)',
  lab_user_id BIGINT UNSIGNED NULL COMMENT '用于严格限制学生单实验室的影子字段',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_member_team_id (team_id),
  KEY idx_member_user_id (user_id),
  CONSTRAINT fk_member_team_id FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_user_id FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uk_team_user (team_id, user_id),
  UNIQUE KEY uk_single_lab_user (lab_user_id),
  CONSTRAINT chk_member_role CHECK (role IN ('LEADER', 'MEMBER', 'MENTOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===================================================
-- 10）统一项目主表（project）
-- ===================================================
CREATE TABLE project (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  -- 🌟 核心分类：COMMERCIAL(正式商业项目) | RECRUITMENT(招募与实践项目)
  category VARCHAR(32) NOT NULL COMMENT 'COMMERCIAL | RECRUITMENT',
  
  -- 🌟 招募项目的细分子类型，如果是商业项目则为 NULL
  recruitment_type VARCHAR(32) NULL COMMENT 'LAB_RECRUIT | TEAM_RECRUIT | CAMPUS_PRACTICE（仅招募项目有效）',
  
  -- 🌟 发起/所有者关联（统一了项目 PM 和 创作者）
  owner_id BIGINT UNSIGNED NOT NULL COMMENT '项目发起人/发布企业PM (USER_ID)',
  
  -- 🌟 关联的组织空间（无缝对接我们之前合并后的统一 team 表）
  team_id BIGINT UNSIGNED NULL COMMENT '关联/承接的团队或实验室ID (可选)',
  
  title VARCHAR(255) NOT NULL COMMENT '项目名称',
  preview TEXT NOT NULL COMMENT '项目简略描述',
  tags JSON NULL COMMENT '推荐与算法标签列表',
  
  -- 🌟 难度评级：从原商业表上移至主表，全类型通用
  level VARCHAR(16) NOT NULL DEFAULT 'N' COMMENT '难度评级：N | R | SR | SSR | UR',
  
  -- 🌟 基础状态：OPEN(开放中/招募中) | ONGOING(进行中) | CLOSED(已关闭/已结项)
  status VARCHAR(16) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN | ONGOING | CLOSED',
  
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_project_category (category),
  KEY idx_project_owner (owner_id),
  KEY idx_project_team (team_id),
  KEY idx_project_published_at (published_at),
  KEY idx_project_status (status),
  
  CONSTRAINT fk_project_owner FOREIGN KEY (owner_id) REFERENCES `user`(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_project_team FOREIGN KEY (team_id) REFERENCES team(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
    
  CONSTRAINT chk_project_category CHECK (category IN ('COMMERCIAL', 'RECRUITMENT')),
  CONSTRAINT chk_project_recruitment_type CHECK (recruitment_type IN ('LAB_RECRUIT', 'TEAM_RECRUIT', 'CAMPUS_PRACTICE')),
  CONSTRAINT chk_project_status CHECK (status IN ('OPEN', 'ONGOING', 'CLOSED')),
  CONSTRAINT chk_project_level CHECK (level IN ('N','R','SR','SSR','UR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 11）商业项目敏感与隐私扩展表（project_commercial_secret）
-- =========================================================================
CREATE TABLE project_commercial_secret (
  project_id BIGINT UNSIGNED NOT NULL COMMENT '关联的主项目ID（1:1 关联）',
  
  -- 💰 核心敏感数据：托管金额
  total_budget DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '托管总额（企业隐私，严禁泄露）',
  
  -- 🔄 商业专用高级状态机：主表 status='ONGOING' 时激活
  commercial_status VARCHAR(64) NOT NULL DEFAULT 'PENDING_START' 
    COMMENT '商业专用状态机：PENDING_START(待托管开工) | PROCESSING(研发进行中) | SUBMIT_REVIEW(验收审核中) | NEED_IMPROVEMENT(待改进) | APPROVED_SUCCESS(验收通过) | IN_DISPUTE(争议维权中) | ARBITRATED(平台仲裁结项)',
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (project_id),
  KEY idx_secret_commercial_status (commercial_status),
  
  -- 🔗 外键强约束：主表删除了项目，敏感表连带自动删除（CASCADE）
  CONSTRAINT fk_secret_project_id FOREIGN KEY (project_id) REFERENCES project(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    
  -- 🔒 数据库防御死锁：严格限制状态机的输入值，防止后端代码写错
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
  project_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '里程碑标题',
  payment_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '拨款占比',
  status VARCHAR(32) NOT NULL COMMENT '协商状态（项目PM与学生PM协商）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_milestone_project_id (project_id),
  CONSTRAINT fk_milestone_project FOREIGN KEY (project_id) REFERENCES project(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_milestone_payment_pct CHECK (payment_pct >= 0 AND payment_pct <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 13）任务卡片（task_card：milestone 1:N task cards）
-- =========================
CREATE TABLE task_card (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  milestone_id BIGINT UNSIGNED NOT NULL,
  assignee_id BIGINT UNSIGNED NULL COMMENT '执行人(学生)',
  title VARCHAR(255) NOT NULL,
  content TEXT NULL COMMENT '原始需求描述',
  status VARCHAR(16) NOT NULL COMMENT 'DONE | TODO',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_card_milestone_id (milestone_id),
  KEY idx_task_card_assignee_id (assignee_id),
  KEY idx_task_card_status (status),
  CONSTRAINT fk_task_card_milestone FOREIGN KEY (milestone_id) REFERENCES milestone(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_card_assignee FOREIGN KEY (assignee_id) REFERENCES `user`(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_task_card_status CHECK (status IN ('DONE','TODO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 14）成就归档（achievement_archive：user 1:N achievements）
-- =========================
CREATE TABLE achievement_archive (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  source_project_id BIGINT UNSIGNED NULL COMMENT '原项目溯源ID',
  masked_project_name VARCHAR(255) NOT NULL COMMENT '脱敏项目名',
  task_description TEXT NULL COMMENT '脱敏工作总结',
  technical_tags JSON NULL COMMENT '技术标签',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_achievement_archive_user_id (user_id),
  KEY idx_achievement_archive_completed_at (completed_at),
  CONSTRAINT fk_achievement_archive_user FOREIGN KEY (user_id) REFERENCES `user`(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 15）笔记表（note：user 1:N notes）- 完美重构版
-- =========================================================================
CREATE TABLE IF NOT EXISTS note (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '发布笔记的用户ID',
  content_type VARCHAR(32) NOT NULL COMMENT 'IMAGETEXT(图文) | VIDEO(视频)',
  title VARCHAR(255) NOT NULL COMMENT '笔记标题',
  summary TEXT NOT NULL COMMENT '笔记外部预览摘要（列表页展示）',
  content LONGTEXT NULL COMMENT '笔记正文内容（💡 升级为 LONGTEXT，防止长文溢出）',
  cover_url VARCHAR(255) NOT NULL COMMENT '统一封面图片URL（不管是视频还是图文，列表页必须有封面）',
  images JSON NULL COMMENT '图文笔记的图片列表，JSON格式：["url1", "url2"]，支持多图',
  video_url VARCHAR(255) NULL COMMENT '视频源文件URL（仅 VIDEO 类型有效）',
  video_duration INT UNSIGNED NULL DEFAULT 0 COMMENT '视频时长（秒，仅 VIDEO 类型有效）',
  tags JSON NULL COMMENT '推荐与算法标签列表，JSON格式：["人工智能", "开源项目"]',
  view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览量/阅读数',
  like_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  collect_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '收藏数',
  comment_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论总数',
  
  -- 内容状态机
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT(草稿) | PUBLISHED(已发布) | BANNED(违规封禁)',
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  KEY idx_note_user_id (user_id),
  KEY idx_note_status (status),
  KEY idx_note_created_at (created_at),
  
  CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES `user`(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    
  CONSTRAINT chk_note_content_type CHECK (content_type IN ('IMAGETEXT', 'VIDEO')),
  CONSTRAINT chk_note_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'BANNED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 16）系统管理员表：完全独立于业务用户体系
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

-- =========================
-- 16）外键设计说明（涉及 userId 的字段一律引用 user.id，而非 user_profile.id）
-- | 表              | 字段         | 引用        |
-- |-----------------|--------------|-------------|
-- | user_profile    | user_id      | user(id)    |
-- | user_auth_link  | user_id      | user(id)    |
-- | team            | owner_id     | user(id)    |
-- | team_member     | user_id      | user(id)    |
-- | project         | owner_id     | user(id)    |
-- | task_card       | assignee_id  | user(id)    |
-- | achievement_archive | user_id  | user(id)    |
--
-- 若线上库仍报 userprofile 外键错误，说明是旧 schema 残留，请执行 fix-fk-migration.sql 一次性修复。
-- =========================
 
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