-- =========================
-- 01）会话初始化
-- =========================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- 02）清理旧表（可重复执行）
-- =========================
-- DROP TABLE IF EXISTS achievement_archive;
-- DROP TABLE IF EXISTS task_card;
-- DROP TABLE IF EXISTS milestone;
-- DROP TABLE IF EXISTS recruitment_project;
-- DROP TABLE IF EXISTS commercial_project;
-- DROP TABLE IF EXISTS team_member;
-- DROP TABLE IF EXISTS team;
-- DROP TABLE IF EXISTS laboratory;
-- DROP TABLE IF EXISTS user_auth_link;
-- DROP TABLE IF EXISTS user_profile;
-- DROP TABLE IF EXISTS userProfile;
-- DROP TABLE IF EXISTS entity;
-- DROP TABLE IF EXISTS system_admin;

-- =========================
-- 03）主体（entity）
-- =========================
CREATE TABLE IF NOT EXISTS entity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT '主体全称',
  type VARCHAR(32) NOT NULL COMMENT 'ENTERPRISE | UNIVERSITY',
  balance DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '数字钱包余额',
  intro VARCHAR(50) NULL COMMENT '主体职能简介（最多50字）',
  last_login_at DATETIME NULL COMMENT '账号上次登录时间',
  audit_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT '管理员审核状态：PENDING | APPROVED | REJECTED',
  audit_admin_id VARCHAR(32) NULL COMMENT '审核管理员ID（编号+实名）',
  audited_at DATETIME NULL COMMENT '审核时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_entity_type (type),
  KEY idx_entity_last_login_at (last_login_at),
  KEY idx_entity_audit_status (audit_status),
  KEY idx_entity_audit_admin_id (audit_admin_id),
  KEY idx_entity_audited_at (audited_at),
  CONSTRAINT chk_entity_audit_status CHECK (audit_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  CONSTRAINT chk_entity_type CHECK (type IN ('ENTERPRISE', 'UNIVERSITY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 04）用户（userProfile）
-- =========================
CREATE TABLE IF NOT EXISTS userProfile (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone VARCHAR(32) NOT NULL COMMENT '登录凭证',
  password_hash VARCHAR(255) NOT NULL,
  last_login_at DATETIME NULL COMMENT '账号上次登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_last_login_at (last_login_at),
  UNIQUE KEY uk_user_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 05）用户档案（user_profile，与 userProfile 1:1）
-- =========================
CREATE TABLE IF NOT EXISTS user_profile (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  real_name VARCHAR(128) NULL COMMENT '实名信息',
  current_entity_name VARCHAR(255) NULL COMMENT '当前所属主体名',
  bio_data JSON NULL COMMENT '技术栈/兴趣标签',
  career_data JSON NULL COMMENT '职业/学籍背景',
  intro VARCHAR(50) NULL COMMENT '用户简介（最多50字）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_profile_user_id (user_id),
  CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES userProfile(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 06）实验室（laboratory，entity 1:N laboratory）
-- =========================
CREATE TABLE laboratory (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_id BIGINT UNSIGNED NOT NULL,
  mentor_id BIGINT UNSIGNED NULL COMMENT '负责导师 (USER_ID)',
  lab_name VARCHAR(255) NOT NULL,
  tag JSON NULL COMMENT '实验室技能标签列表',
  intro VARCHAR(200) NULL COMMENT '实验室职能简介（最多200字）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_laboratory_entity_id (entity_id),
  KEY idx_laboratory_mentor_id (mentor_id),
  CONSTRAINT fk_laboratory_entity FOREIGN KEY (entity_id) REFERENCES entity(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_laboratory_mentor FOREIGN KEY (mentor_id) REFERENCES userProfile(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 07）用户认证关联（user_auth_link：userProfile <-> entity，可选 lab）
-- =========================
CREATE TABLE user_auth_link (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  lab_id BIGINT UNSIGNED NULL COMMENT '学校侧必填 (1:N)',
  business_role VARCHAR(32) NOT NULL COMMENT 'PM | MENTOR | FACULTY | STUDENT',
  audit_status VARCHAR(32) NOT NULL COMMENT '认证状态',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_auth_link_user_id (user_id),
  KEY idx_user_auth_link_entity_id (entity_id),
  KEY idx_user_auth_link_lab_id (lab_id),
  UNIQUE KEY uk_user_auth_link_unique (user_id, entity_id, lab_id, business_role),
  CONSTRAINT fk_user_auth_link_user FOREIGN KEY (user_id) REFERENCES userProfile(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_auth_link_entity FOREIGN KEY (entity_id) REFERENCES entity(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_user_auth_link_lab FOREIGN KEY (lab_id) REFERENCES laboratory(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_user_auth_link_business_role CHECK (business_role IN ('PM','MENTOR','FACULTY','STUDENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 08）团队（team）
-- =========================
CREATE TABLE team (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  leader_id BIGINT UNSIGNED NULL COMMENT '队长 (USER_ID)',
  team_name VARCHAR(255) NOT NULL,
  tag JSON NULL COMMENT '团队技能标签列表',
  intro VARCHAR(200) NULL COMMENT '团队职能简介（最多200字）',
  status VARCHAR(32) NOT NULL COMMENT 'ACTIVE | DISBANDED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team_leader_id (leader_id),
  KEY idx_team_status (status),
  CONSTRAINT fk_team_leader FOREIGN KEY (leader_id) REFERENCES userProfile(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_team_status CHECK (status IN ('ACTIVE', 'DISBANDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 09）团队成员（team_member：team 1:N 成员，userProfile 唯一归属）
-- =========================
CREATE TABLE team_member (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '唯一索引：限制一人一队',
  role VARCHAR(32) NOT NULL COMMENT 'LEADER | MEMBER',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team_member_team_id (team_id),
  KEY idx_team_member_user_id (user_id),
  UNIQUE KEY uk_team_member_user_id (user_id),
  UNIQUE KEY uk_team_member_team_user (team_id, user_id),
  CONSTRAINT fk_team_member_team FOREIGN KEY (team_id) REFERENCES team(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_team_member_user FOREIGN KEY (user_id) REFERENCES userProfile(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_team_member_role CHECK (role IN ('LEADER','MEMBER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 10）正式商业项目（commercial_project）
-- =========================
CREATE TABLE commercial_project (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_pm_id BIGINT UNSIGNED NOT NULL COMMENT '发布者(企业PM)',
  executor_lab_id BIGINT UNSIGNED NULL COMMENT '承接实验室(可选)',
  executor_team_id BIGINT UNSIGNED NULL COMMENT '承接团队(可选)',
  title VARCHAR(255) NOT NULL,
  preview TEXT NOT NULL COMMENT '项目简略描述',
  tags JSON NULL COMMENT '推荐算法标签',
  level VARCHAR(16) NOT NULL COMMENT 'N | R | SR | SSR | UR',
  total_budget DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '托管总额',
  status VARCHAR(64) NOT NULL COMMENT '状态机',
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_commercial_project_pm (project_pm_id),
  KEY idx_commercial_project_executor_lab (executor_lab_id),
  KEY idx_commercial_project_executor_team (executor_team_id),
  KEY idx_commercial_project_published_at (published_at),
  KEY idx_commercial_project_status (status),
  CONSTRAINT fk_commercial_project_pm FOREIGN KEY (project_pm_id) REFERENCES userProfile(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_commercial_project_executor_lab FOREIGN KEY (executor_lab_id) REFERENCES laboratory(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_commercial_project_executor_team FOREIGN KEY (executor_team_id) REFERENCES team(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_commercial_project_level CHECK (level IN ('N','R','SR','SSR','UR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 11）招募与实践项目（recruitment_project）
-- =========================
CREATE TABLE recruitment_project (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  creator_id BIGINT UNSIGNED NOT NULL COMMENT '发起人 (USER_ID)',
  source_lab_id BIGINT UNSIGNED NULL COMMENT '关联实验室',
  source_team_id BIGINT UNSIGNED NULL COMMENT '关联团队',
  type VARCHAR(32) NOT NULL COMMENT 'LAB_RECRUIT | TEAM_RECRUIT | CAMPUS_PRACTICE',
  title VARCHAR(255) NOT NULL,
  tags JSON NULL COMMENT '算法标签',
  preview TEXT NOT NULL COMMENT '项目简略描述',
  status VARCHAR(16) NOT NULL COMMENT 'OPEN | CLOSED',
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recruitment_project_creator (creator_id),
  KEY idx_recruitment_project_source_lab (source_lab_id),
  KEY idx_recruitment_project_source_team (source_team_id),
  KEY idx_recruitment_project_published_at (published_at),
  KEY idx_recruitment_project_status (status),
  CONSTRAINT fk_recruitment_project_creator FOREIGN KEY (creator_id) REFERENCES userProfile(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_recruitment_project_source_lab FOREIGN KEY (source_lab_id) REFERENCES laboratory(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_recruitment_project_source_team FOREIGN KEY (source_team_id) REFERENCES team(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_recruitment_project_type CHECK (type IN ('LAB_RECRUIT','TEAM_RECRUIT','CAMPUS_PRACTICE')),
  CONSTRAINT chk_recruitment_project_status CHECK (status IN ('OPEN','CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 12）里程碑（milestone：commercial_project 1:N milestones）
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
  CONSTRAINT fk_milestone_project FOREIGN KEY (project_id) REFERENCES commercial_project(id)
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
  CONSTRAINT fk_task_card_assignee FOREIGN KEY (assignee_id) REFERENCES userProfile(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_task_card_status CHECK (status IN ('DONE','TODO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 14）成就归档（achievement_archive：userProfile 1:N achievements）
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
  CONSTRAINT fk_achievement_archive_user FOREIGN KEY (user_id) REFERENCES userProfile(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- 15）系统管理员表：完全独立于业务用户体系
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
-- 16）补充外键：主体审核管理员（entity.audit_admin_id -> system_admin.id）
-- =========================
-- ALTER TABLE entity
--   ADD CONSTRAINT fk_entity_audit_admin FOREIGN KEY (audit_admin_id) REFERENCES system_admin(id)
--     ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================
-- 17）收尾
-- =========================
SET FOREIGN_KEY_CHECKS = 1;