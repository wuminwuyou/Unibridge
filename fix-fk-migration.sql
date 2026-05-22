-- 一次性修复：将历史外键从 userProfile/userprofile 对齐到 user(id)
-- 用法：mysql -u root -p project_cooperation_platform < fix-fk-migration.sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS userProfile;
DROP TABLE IF EXISTS userprofile;

-- team.owner_id（部分旧库从未创建 fk_team_owner，仅 ADD）
ALTER TABLE team ADD CONSTRAINT fk_team_owner FOREIGN KEY (owner_id) REFERENCES `user`(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- team_member.user_id
ALTER TABLE team_member DROP FOREIGN KEY fk_member_user_id;
ALTER TABLE team_member ADD CONSTRAINT fk_member_user_id FOREIGN KEY (user_id) REFERENCES `user`(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- project.owner_id
ALTER TABLE project DROP FOREIGN KEY fk_project_owner;
ALTER TABLE project ADD CONSTRAINT fk_project_owner FOREIGN KEY (owner_id) REFERENCES `user`(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- user_auth_link：旧约束名 fk_ual_to_user_root -> fk_user_auth_link_user（已指向 user 时仅重命名）
ALTER TABLE user_auth_link DROP FOREIGN KEY fk_ual_to_user_root;
ALTER TABLE user_auth_link ADD CONSTRAINT fk_user_auth_link_user FOREIGN KEY (user_id) REFERENCES `user`(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
