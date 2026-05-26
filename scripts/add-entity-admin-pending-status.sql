-- 已有库升级：允许 sys_entity_totp_credentials.account_status = PENDING
-- MySQL 8.0.16+：若约束名不同请先 SHOW CREATE TABLE sys_entity_totp_credentials;

ALTER TABLE sys_entity_totp_credentials
  DROP CHECK chk_entity_totp_account_status;

ALTER TABLE sys_entity_totp_credentials
  ADD CONSTRAINT chk_entity_totp_account_status
  CHECK (account_status IN ('ACTIVE', 'PENDING', 'FROZEN', 'DEACTIVATED'));
