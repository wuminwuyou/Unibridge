-- =========================================================================
-- UniBridge 数据迁移脚本：user_profile.real_name -> t_user_identity
-- 执行方式：SOURCE migrate-realname-and-idcard.sql;
-- 前置条件：t_user_identity 表已存在
-- =========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Phase 1: 创建 t_user_identity（如尚未存在）
CREATE TABLE IF NOT EXISTS t_user_identity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid CHAR(13) NOT NULL,
  encrypted_real_name VARCHAR(512) NULL,
  real_name_mask VARCHAR(32) NULL,
  id_card_no VARCHAR(128) NOT NULL,
  id_card_hash CHAR(64) NOT NULL,
  encryption_key_id CHAR(36) NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_identity_uid (user_uid),
  UNIQUE KEY uk_user_identity_id_card_hash (id_card_hash),
  KEY idx_identity_encryption_key (encryption_key_id),
  CONSTRAINT fk_user_identity_user FOREIGN KEY (user_uid) REFERENCES user(user_uid)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_user_identity_id_card_hash CHECK (LENGTH(id_card_hash) = 64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Phase 2: 迁移 user_profile.real_name -> t_user_identity
INSERT INTO t_user_identity (user_uid, encrypted_real_name, real_name_mask, id_card_no, id_card_hash, encryption_key_id)
SELECT
  up.user_uid,
  NULL,
  CASE
    WHEN ual.role = 'PM'        THEN CONCAT(LEFT(up.real_name, 1), '经理')
    WHEN ual.role = 'MENTOR'    THEN CONCAT(LEFT(up.real_name, 1), '导师')
    WHEN ual.role = 'COUNSELOR' THEN CONCAT(LEFT(up.real_name, 1), '导员')
    WHEN ual.role = 'STUDENT'   THEN CONCAT(LEFT(up.real_name, 1), '同学')
    ELSE '*用户'
  END,
  '',
  SHA2(CONCAT('placeholder-', up.user_uid), 256),
  NULL
FROM user_profile up
LEFT JOIN user_auth_link ual ON up.user_uid = ual.user_uid AND ual.is_active = 1
WHERE up.real_name IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM t_user_identity ti WHERE ti.user_uid = up.user_uid);

-- Phase 3: 验证
SELECT
  (SELECT COUNT(*) FROM user_profile WHERE real_name IS NOT NULL) AS source_count,
  (SELECT COUNT(*) FROM t_user_identity) AS target_count;

SELECT
  ti.user_uid,
  up.real_name AS original,
  ti.real_name_mask,
  ual.role
FROM t_user_identity ti
JOIN user_profile up ON ti.user_uid = up.user_uid
LEFT JOIN user_auth_link ual ON ti.user_uid = ual.user_uid AND ual.is_active = 1
LIMIT 10;

-- Phase 4: 迁移验证无误后执行
-- UPDATE user_profile SET real_name = NULL WHERE real_name IS NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;
