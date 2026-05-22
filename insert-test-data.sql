-- =========================================================================
-- 测试数据：db.sql 业务表 + note，每表 3 条
-- 前置：已执行 init-db.ps1 或 db.sql 建表；system_admin 种子数据已存在
-- 密码哈希均为 SHA256("123456")
-- =========================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE project_commercial_secret;
TRUNCATE TABLE project;
TRUNCATE TABLE team_member;
TRUNCATE TABLE team;
TRUNCATE TABLE user_auth_link;
TRUNCATE TABLE note;
TRUNCATE TABLE user_profile;
TRUNCATE TABLE `user`;
TRUNCATE TABLE entity_profile;
TRUNCATE TABLE entity;

SET FOREIGN_KEY_CHECKS = 1;

-- 通用测试密码哈希（123456 的 SHA256）
SET @pwd_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

-- =========================================================================
-- 03）entity × 3
-- =========================================================================
INSERT INTO entity (id, entity_code, password_hash, balance, audit_status, audit_admin_id, audited_at, last_login_at) VALUES
(1, '4144010598', @pwd_hash, 50000.00,  'APPROVED', 'admin_master',  '2026-01-10 09:00:00', '2026-05-01 08:30:00'),
(2, '4111010001', @pwd_hash, 120000.00, 'APPROVED', 'admin_manager', '2026-01-12 10:00:00', '2026-05-02 09:15:00'),
(3, '91440300708461136T', @pwd_hash, 500000.00, 'APPROVED', 'admin_auditor', '2026-01-15 14:00:00', '2026-05-03 11:00:00');

-- =========================================================================
-- 04）entity_profile × 3
-- =========================================================================
INSERT INTO entity_profile (id, entity_id, name, type, logo_url, banner_url, intro, announcement) VALUES
(1, 1, '深圳大学', 'UNIVERSITY', 'https://cdn.example.com/logo/szu.png', 'https://cdn.example.com/banner/szu.jpg', '特区综合性大学，产学研协同创新', '2026 春季产学研合作季正式启动'),
(2, 2, '清华大学', 'UNIVERSITY', 'https://cdn.example.com/logo/thu.png', 'https://cdn.example.com/banner/thu.jpg', '国内顶尖研究型大学', '欢迎企业发布联合科研课题'),
(3, 3, '深圳市腾讯计算机系统有限公司', 'ENTERPRISE', 'https://cdn.example.com/logo/tencent.png', 'https://cdn.example.com/banner/tencent.jpg', '互联网与数字产业领军企业', '开放多个校企联合研发岗位');

-- =========================================================================
-- 05）user × 3
-- =========================================================================
INSERT INTO `user` (id, phone, email, password_hash, last_login_at) VALUES
(1, '13800001001', 'zhangming@test.com',  @pwd_hash, '2026-05-20 18:00:00'),
(2, '13800001002', 'limentor@test.com',   @pwd_hash, '2026-05-20 19:30:00'),
(3, '13800001003', 'wangpm@tencent.com',  @pwd_hash, '2026-05-21 09:00:00');

-- =========================================================================
-- 06）user_profile × 3
-- =========================================================================
INSERT INTO user_profile (id, user_id, nick_name, real_name, avatar_url, current_entity_name, level, bio_data, career_data, intro, announcement) VALUES
(1, 1, '用户#1001', '张明', 'https://api.dicebear.com/9.x/initials/svg?seed=ZM', '深圳大学', 'SR',
 JSON_ARRAY('Java', 'Spring Boot', 'MySQL'),
 JSON_OBJECT('school', '深圳大学', 'major', '软件工程', 'grade', '2022级'),
 '全栈方向在读学生', '正在寻找暑期实习项目'),
(2, 2, '用户#1002', '李导师', 'https://api.dicebear.com/9.x/initials/svg?seed=LM', '深圳大学', 'UR',
 JSON_ARRAY('人工智能', '机器学习', 'Python'),
 JSON_OBJECT('title', '副教授', 'department', '计算机学院'),
 'AI 实验室负责人', '实验室开放 2 个本科科研名额'),
(3, 3, '用户#1003', '王经理', 'https://api.dicebear.com/9.x/initials/svg?seed=WM', '腾讯科技', 'SSR',
 JSON_ARRAY('项目管理', '产品设计', '敏捷开发'),
 JSON_OBJECT('title', '高级项目经理', 'department', 'CSIG'),
 '负责校企合作项目对接', '欢迎高校团队投递方案');

-- =========================================================================
-- 07）user_auth_link × 3
-- =========================================================================
INSERT INTO user_auth_link (id, user_id, entity_id, role, auth_serial_no, proof_artifact_url, audit_status, is_active, remark) VALUES
(1, 1, 1, 'STUDENT', '2022001001', 'https://cdn.example.com/proof/student-zhang.jpg', 'PENDING', 1, NULL),
(2, 2, 1, 'MENTOR',  'T2020008',   'https://cdn.example.com/proof/mentor-li.jpg',    'APPROVED', 1, NULL),
(3, 3, 3, 'PM',      'E10086',     'https://cdn.example.com/proof/pm-wang.jpg',      'APPROVED', 1, NULL);

-- =========================================================================
-- 08）team × 3
-- =========================================================================
INSERT INTO team (id, type, owner_id, owner_name, entity_id, team_name, tag, intro, status) VALUES
(1, 'LAB',          2, '李导师', 1, '深大 AI 实验室',
 JSON_ARRAY('人工智能', '深度学习', 'NLP'), '聚焦 NLP 与知识图谱方向', 'ACTIVE'),
(2, 'STUDENT_TEAM', 1, '张明',   NULL, '极客创新队',
 JSON_ARRAY('全栈', 'React', 'Java'), '校内自发项目团队，承接课程与竞赛项目', 'ACTIVE'),
(3, 'LAB',          2, '李导师', 2, '清华软工联合实验室',
 JSON_ARRAY('软件工程', '云原生', 'DevOps'), '跨校联合软件工程实践平台', 'ACTIVE');

-- =========================================================================
-- 09）team_member × 3
-- =========================================================================
INSERT INTO team_member (id, team_id, user_id, role, lab_user_id) VALUES
(1, 1, 2, 'MENTOR', NULL),
(2, 1, 1, 'MEMBER', 1),
(3, 2, 1, 'LEADER', NULL);

-- =========================================================================
-- 10）project × 3（均为 COMMERCIAL，便于填充敏感扩展表）
-- =========================================================================
INSERT INTO project (id, category, recruitment_type, owner_id, team_id, title, preview, tags, level, status, published_at) VALUES
(1, 'COMMERCIAL', NULL, 3, NULL, '智能客服系统研发',
 '面向客服场景的多轮对话与工单联动系统', JSON_ARRAY('NLP', '客服', 'SaaS'), 'SR', 'OPEN',
 '2026-04-01 10:00:00'),
(2, 'COMMERCIAL', NULL, 3, 1, '实验室数据管理平台',
 '为高校实验室提供项目、成员与成果一体化管理', JSON_ARRAY('数据平台', 'B端', '高校'), 'SSR', 'ONGOING',
 '2026-04-15 14:00:00'),
(3, 'COMMERCIAL', NULL, 3, 2, '校园社交 App 外包',
 '面向校园场景的轻量社交与活动发布应用', JSON_ARRAY('移动端', '社交', '外包'), 'R', 'OPEN',
 '2026-05-01 09:30:00');

-- =========================================================================
-- 11）project_commercial_secret × 3
-- =========================================================================
INSERT INTO project_commercial_secret (project_id, total_budget, commercial_status) VALUES
(1, 500000.00, 'PENDING_START'),
(2, 800000.00, 'PROCESSING'),
(3, 300000.00, 'SUBMIT_REVIEW');

-- =========================================================================
-- 15）note × 3
-- =========================================================================
INSERT INTO note (
  id, user_id, content_type, title, summary, content, cover_url,
  images, video_url, video_duration, tags,
  view_count, like_count, collect_count, comment_count, status, created_at
) VALUES
(1, 1, 'IMAGETEXT', 'Spring Boot 产学研项目实战笔记',
 '记录在平台后端开发中使用 Spring Boot + MyBatis-Plus 的实践经验与踩坑总结。',
 '## 项目结构\n\n采用 controller / service / mapper 分层，统一使用 BusinessException 处理业务错误。\n\n## 鉴权\n\n客户端 JWT 类型为 CLIENT_USER，Profile 接口从 token 解析 userId。',
 'https://cdn.example.com/note/cover/springboot.jpg',
 JSON_ARRAY('https://cdn.example.com/note/img/springboot-1.jpg', 'https://cdn.example.com/note/img/springboot-2.jpg'),
 NULL, 0,
 JSON_ARRAY('Spring Boot', '后端', '产学研'),
 128, 24, 9, 3, 'PUBLISHED', '2026-05-10 14:20:00'),
(2, 2, 'IMAGETEXT', 'AI 实验室科研方向分享：NLP 与知识图谱',
 '介绍深大 AI 实验室在 NLP 与知识图谱方向的近期研究进展与本科生参与路径。',
 '实验室当前重点包括：信息抽取、知识图谱构建、RAG 应用落地等方向。欢迎对 AI 有兴趣的同学加入。',
 'https://cdn.example.com/note/cover/nlp-lab.jpg',
 JSON_ARRAY('https://cdn.example.com/note/img/nlp-lab-1.jpg'),
 NULL, 0,
 JSON_ARRAY('人工智能', 'NLP', '知识图谱'),
 356, 58, 21, 7, 'PUBLISHED', '2026-05-12 09:00:00'),
(3, 3, 'VIDEO', '校企合作项目复盘：从需求到交付',
 '以智能客服系统研发为例，分享企业 PM 视角下的需求拆解、里程碑管理与验收要点。',
 '本期视频梳理了 COMMERCIAL 类项目从 OPEN 到 ONGOING 的关键节点，以及与学生团队的协作经验。',
 'https://cdn.example.com/note/cover/pm-review.jpg',
 NULL,
 'https://cdn.example.com/note/video/pm-review.mp4', 612,
 JSON_ARRAY('项目管理', '校企合作', '复盘'),
 892, 103, 45, 12, 'PUBLISHED', '2026-05-18 16:45:00');
