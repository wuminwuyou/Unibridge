-- =========================================================================
-- 测试数据：db.sql 业务表 + note（10 条，便于 Feed 换一换联调）
-- 前置：已执行 init-db.ps1 或 db.sql 建表；sys_admin 种子数据已存在
-- 不包含主体账号管理员(sys_entity_totp_credentials)和认证码(sys_verification_codes)数据
-- 主体根密码：SHA256("123456")
-- 
-- 2026-06-26 更新：
--   - t_user_note 移除 editor_type / content / view_count / like_count / collect_count / comment_count
--   - 新增 t_user_note_detail（content + parent_content_type_code）和 t_user_note_counter（计数）数据
--   - t_user_note 新增 visibility 字段
-- =========================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE t_project_achievement;
TRUNCATE TABLE t_user_identity;
TRUNCATE TABLE t_project_secret;
TRUNCATE TABLE t_project;
TRUNCATE TABLE t_team_member;
TRUNCATE TABLE t_team;
TRUNCATE TABLE t_user_organization_binding;
TRUNCATE TABLE t_user_note_counter;
TRUNCATE TABLE t_user_note_detail;
TRUNCATE TABLE t_user_note;
TRUNCATE TABLE sys_credit_logs;
TRUNCATE TABLE sys_credit_profiles;
TRUNCATE TABLE p_user_profile;
TRUNCATE TABLE t_user;
TRUNCATE TABLE p_tenant_org_profile;
TRUNCATE TABLE t_tenant_organization;

SET FOREIGN_KEY_CHECKS = 1;

SET @pwd_entity = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

INSERT INTO t_tenant_organization (id, entity_code, password_hash, balance, audit_status, audit_admin_id, audited_at, account_status, last_login_at) VALUES
(1, '10598', @pwd_entity, 50000.00,  'APPROVED', 'admin_master',  '2026-01-10 09:00:00', 'ACTIVE', '2026-05-01 08:30:00'),
(2, '10003', @pwd_entity, 120000.00, 'APPROVED', 'admin_manager', '2026-01-12 10:00:00', 'ACTIVE', '2026-05-02 09:15:00'),
(3, '91440300708461136T', @pwd_entity, 500000.00, 'APPROVED', 'admin_auditor', '2026-01-15 14:00:00', 'ACTIVE', '2026-05-03 11:00:00');

INSERT INTO p_tenant_org_profile (id, entity_code, name, location, type, logo_url, banner_url, intro, announcement) VALUES
(1, '10598', '深圳大学', '广东·深圳', 'UNIVERSITY', 'https://cdn.example.com/logo/szu.png', 'https://cdn.example.com/banner/szu.jpg', '特区综合性大学，产学研协同创新', '2026 春季产学研合作季正式启动'),
(2, '10003', '清华大学', '北京·海淀', 'UNIVERSITY', 'https://cdn.example.com/logo/thu.png', 'https://cdn.example.com/banner/thu.jpg', '国内顶尖研究型大学', '欢迎企业发布联合科研课题'),
(3, '91440300708461136T', '深圳市腾讯计算机系统有限公司', '广东·深圳', 'ENTERPRISE', 'https://cdn.example.com/logo/tencent.png', 'https://cdn.example.com/banner/tencent.jpg', '互联网与数字产业领军企业', '开放多个校企联合研发岗位');

INSERT INTO t_user (id, user_uid, phone, email, password_hash, account_status, last_login_at) VALUES
(1, 'US00000000001', '13800001001', 'zhangming@test.com',  @pwd_entity, 'ACTIVE', '2026-05-20 18:00:00'),
(2, 'US00000000002', '13800001002', 'limentor@test.com',   @pwd_entity, 'ACTIVE', '2026-05-20 19:30:00'),
(3, 'US00000000003', '13800001003', 'wangpm@tencent.com',  @pwd_entity, 'ACTIVE', '2026-05-21 09:00:00');

INSERT INTO p_user_profile (id, user_uid, nick_name, avatar_url, level, bio_data, career_data, graduation_year, education_history, intro, announcement) VALUES
(1, 'US00000000001', '用户#1001', 'https://api.dicebear.com/9.x/initials/svg?seed=ZM', 'SR',
 JSON_ARRAY('Java', 'Spring Boot', 'MySQL'),
 JSON_OBJECT('school', '深圳大学', 'major', '软件工程', 'grade', '2022级'),
 2026, JSON_ARRAY(), '全栈方向在读学生', '正在寻找暑期实习项目'),
(2, 'US00000000002', '用户#1002', 'https://api.dicebear.com/9.x/initials/svg?seed=LM', 'UR',
 JSON_ARRAY('人工智能', '机器学习', 'Python'),
 JSON_OBJECT('title', '副教授', 'department', '计算机学院'),
 NULL, NULL, 'AI 实验室负责人', '实验室开放 2 个本科科研名额'),
(3, 'US00000000003', '用户#1003', 'https://api.dicebear.com/9.x/initials/svg?seed=WM', 'SSR',
 JSON_ARRAY('项目管理', '产品设计', '敏捷开发'),
 JSON_OBJECT('title', '高级项目经理', 'department', 'CSIG'),
 NULL, NULL, '负责校企合作项目对接', '欢迎高校团队投递方案');

INSERT INTO t_user_organization_binding (id, user_uid, entity_code, role, auth_serial_no, proof_artifact_url, audit_status, audit_uid, audited_at, is_active, remark) VALUES
(1, 'US00000000001', '10598', 'STUDENT', '2022001001', 'https://cdn.example.com/proof/student-zhang.jpg', 'PENDING', NULL, NULL, 1, NULL),
(2, 'US00000000002', '10598', 'MENTOR',  'T2020008',   'https://cdn.example.com/proof/mentor-li.jpg',    'PENDING', NULL, NULL, 1, NULL),
(3, 'US00000000003', '91440300708461136T', 'PM', 'E10086', 'https://cdn.example.com/proof/pm-wang.jpg', 'PENDING', NULL, NULL, 1, NULL);

-- real_name 已从 user_profile 迁移至独立的 t_user_identity 表
-- encrypted_real_name = NULL（预留加密位置）；real_name_mask 根据 role 生成
-- id_card_no = ''（空字符串占位，后续人脸核身填补）；id_card_hash 使用 user_uid 生成唯一占位值（防 UK 冲突）
INSERT INTO t_user_identity (user_uid, encrypted_real_name, real_name_mask, id_card_no, id_card_hash, encryption_key_id, verified_at) VALUES
('US00000000001', NULL, '张同学', '', SHA2(CONCAT('placeholder-', 'US00000000001'), 256), NULL, NULL),
('US00000000002', NULL, '李导师', '', SHA2(CONCAT('placeholder-', 'US00000000002'), 256), NULL, NULL),
('US00000000003', NULL, '王经理', '', SHA2(CONCAT('placeholder-', 'US00000000003'), 256), NULL, NULL);

INSERT INTO sys_credit_profiles (id, user_uid, credit_score, account_status, last_changed_at) VALUES
(1, 'US00000000001', 720, 'ACTIVE', '2026-05-20 18:00:00'),
(2, 'US00000000002', 850, 'ACTIVE', '2026-05-20 19:30:00'),
(3, 'US00000000003', 680, 'ACTIVE', '2026-05-21 09:00:00');

INSERT INTO sys_credit_logs (id, user_uid, change_amount, score_before, score_after, biz_type, biz_ref_key, operator_key, remark, created_at) VALUES
(1, 'US00000000001', 600,   0, 600, 'REGISTER',         NULL,            'SYSTEM',       '注册初始化信用分',           '2026-05-01 10:00:00'),
(2, 'US00000000001', 120, 600, 720, 'PROJECT_COMPLETE', 'PRnews1234567', 'SYSTEM',       '参与项目履约完成加分',     '2026-05-20 18:00:00'),
(3, 'US00000000002', 600,   0, 600, 'REGISTER',         NULL,            'SYSTEM',       '注册初始化信用分',           '2026-05-01 10:00:00'),
(4, 'US00000000002', 250, 600, 850, 'ADMIN_ADJUST',     NULL,            'admin_master', '导师认证通过信用奖励',     '2026-05-20 19:30:00'),
(5, 'US00000000003', 600,   0, 600, 'REGISTER',         NULL,            'SYSTEM',       '注册初始化信用分',           '2026-05-01 10:00:00'),
(6, 'US00000000003',  80, 600, 680, 'PROJECT_COMPLETE', 'PR20212345678', 'SYSTEM',       '项目发布履约加分',         '2026-05-21 09:00:00');

INSERT INTO t_team (id, team_uid, type, owner_uid, owner_name, entity_code, team_name, tag, intro, announcement, contact_email, audit_status, audit_uid, audited_at, account_status) VALUES
(1, 'LB00000000001', 'LAB', 'US00000000002', '李导师', '10598', '深大 AI 实验室',
 JSON_ARRAY('人工智能', '深度学习', 'NLP'), '聚焦 NLP 与知识图谱方向',
 '2026 春季招新进行中，欢迎对 NLP 感兴趣的同学加入', 'lab-ai@szu.edu.cn',
 'APPROVED', NULL, NULL, 'ACTIVE'),
(2, 'ST00000000001', 'STUDENT_TEAM', 'US00000000001', '张明', NULL, '极客创新队',
 JSON_ARRAY('全栈', 'React', 'Java'), '校内自发项目团队，承接课程与竞赛项目',
 '本队正在招募前端与后端各 1 名', 'geek-team@example.com',
 'APPROVED', NULL, NULL, 'ACTIVE'),
(3, 'LB00000000002', 'LAB', 'US00000000002', '李导师', '10003', '清华软工联合实验室',
 JSON_ARRAY('软件工程', '云原生', 'DevOps'), '跨校联合软件工程实践平台',
 '联合实验室开放企业合作项目对接', 'lab-se@tsinghua.edu.cn',
 'APPROVED', NULL, NULL, 'ACTIVE');

INSERT INTO t_team_member (id, team_uid, user_uid, role, lab_user_uid, career, is_admin, invited_by_uid) VALUES
(1, 'LB00000000001', 'US00000000002', 'MENTOR', NULL, 'NLP · 知识图谱', 1, NULL),
(2, 'LB00000000001', 'US00000000001', 'MEMBER', 'US00000000001', '前端开发', 0, 'US00000000002'),
(3, 'ST00000000001', 'US00000000001', 'LEADER', NULL, '后端开发', 1, NULL),
(4, 'LB00000000002', 'US00000000002', 'MENTOR', NULL, '软件工程 · 云原生', 1, NULL);

INSERT INTO t_project (id, project_uid, extended_uid, category, recruitment_type, owner_uid, team_uid, title, preview, editor_type, description, tags, duration, team_size, deadline, level, status, published_at) VALUES
(1, 'PR20212345678', '91440300708461136T', 'COMMERCIAL', NULL, 'US00000000003', NULL, '智能客服系统研发',
 '面向客服场景的多轮对话与工单联动系统', 'MARKDOWN',
 '# 项目背景\n\n企业希望建设面向客服场景的多轮对话与工单联动系统。',
 JSON_ARRAY('NLP', '客服', 'SaaS'), '8 周', '3-5 人', '2026-08-31', 'SR', 'OPEN',
 '2026-04-01 10:00:00'),
(2, 'PRnews1234567', 'LB00000000001', 'COMMERCIAL', NULL, 'US00000000003', 'LB00000000001', '实验室数据管理平台',
 '为高校实验室提供项目、成员与成果一体化管理', 'MARKDOWN',
 '# 平台目标\n\n为高校实验室提供一体化管理能力。',
 JSON_ARRAY('数据平台', 'B端', '高校'), '12 周', '5-8 人', '2026-09-15', 'SSR', 'ONGOING',
 '2026-04-15 14:00:00'),
(3, 'PR1T1w2K4x6O8', 'ST00000000001', 'COMMERCIAL', NULL, 'US00000000003', 'ST00000000001', '校园社交 App 外包',
 '面向校园场景的轻量社交与活动发布应用', 'MARKDOWN',
 '# 产品概述\n\n面向校园场景的轻量社交 App。',
 JSON_ARRAY('移动端', '社交', '外包'), '6 周', '2-4 人', '2026-07-01', 'R', 'OPEN',
 '2026-05-01 09:30:00');

INSERT INTO t_project_secret (project_uid, total_budget, commercial_status) VALUES
('PR20212345678', 500000.00, 'PENDING_START'),
('PRnews1234567', 800000.00, 'PROCESSING'),
('PR1T1w2K4x6O8', 300000.00, 'SUBMIT_REVIEW');

-- =========================================================================
-- 笔记核心表：移除 editor_type / content / 计数器字段，新增 visibility
-- =========================================================================
INSERT INTO t_user_note (
  id, user_uid, content_type_code, extended_uid, title, summary, cover_url,
  video_url, video_duration, tags, status, visibility, published_at, created_at
) VALUES
-- 1: 图文笔记（公开）
(1, 'US00000000001', 'TX20212345678', NULL,
 'Spring Boot 产学研项目实战笔记',
 '记录在平台后端开发中使用 Spring Boot + MyBatis-Plus 的实践经验与踩坑总结。',
 'https://cdn.example.com/note/cover/springboot.jpg',
 NULL, 0,
 JSON_ARRAY('Spring Boot', '后端', '产学研'),
 'PUBLISHED', 'PUBLIC', '2026-05-01 10:00:00', '2026-05-01 10:00:00'),
-- 2: 图文笔记（公开，代发归属）
(2, 'US00000000002', 'TXnews1234567', 'LB00000000001',
 'AI 实验室科研方向分享：NLP 与知识图谱',
 '介绍深大 AI 实验室在 NLP 与知识图谱方向的近期研究进展与本科生参与路径。',
 'https://cdn.example.com/note/cover/nlp-lab.jpg',
 NULL, 0,
 JSON_ARRAY('人工智能', 'NLP', '知识图谱'),
 'PUBLISHED', 'PUBLIC', '2026-05-02 11:00:00', '2026-05-02 11:00:00'),
-- 3: 视频笔记（公开）—— 作为便捷笔记的父笔记
(3, 'US00000000003', 'VD1T1w2K4x6O8', NULL,
 '校企合作项目复盘：从需求到交付',
 '以智能客服系统研发为例，分享企业 PM 视角下的需求拆解、里程碑管理与验收要点。',
 'https://cdn.example.com/note/cover/pm-review.jpg',
 'https://cdn.example.com/note/video/pm-review.mp4', 612,
 JSON_ARRAY('项目管理', '校企合作', '复盘'),
 'PUBLISHED', 'PUBLIC', '2026-05-03 12:00:00', '2026-05-03 12:00:00'),
-- 4: 图文笔记（公开）
(4, 'US00000000001', 'TXa1b2c3d4e5f', NULL,
 'MyBatis-Plus 分页与性能优化实践',
 '总结列表接口中分页插件配置、索引设计与 N+1 查询治理经验。',
 'https://cdn.example.com/note/cover/mybatis.jpg',
 NULL, 0,
 JSON_ARRAY('MyBatis', '数据库', '性能优化'),
 'PUBLISHED', 'PUBLIC', '2026-05-04 09:30:00', '2026-05-04 09:30:00'),
-- 5: 图文笔记（公开）
(5, 'US00000000002', 'TXf6g7h8i9j0k', NULL,
 'RAG 检索链路搭建入门',
 '从文档切分、向量入库到重排序，梳理 RAG 系统最小可用链路。',
 'https://cdn.example.com/note/cover/rag.jpg',
 NULL, 0,
 JSON_ARRAY('RAG', '向量检索', '大模型'),
 'PUBLISHED', 'PUBLIC', '2026-05-05 14:15:00', '2026-05-05 14:15:00'),
-- 6: 图文笔记（公开）
(6, 'US00000000003', 'TXm1n2o3p4q5r', NULL,
 'Vue3 组件化开发规范',
 '分享前端组件目录划分、Props 设计与组合式 API 最佳实践。',
 'https://cdn.example.com/note/cover/vue3.jpg',
 NULL, 0,
 JSON_ARRAY('Vue3', '前端', '组件化'),
 'PUBLISHED', 'PUBLIC', '2026-05-06 16:00:00', '2026-05-06 16:00:00'),
-- 7: 图文笔记（公开）
(7, 'US00000000001', 'TXs6t7u8v9w0x', NULL,
 'Redis 缓存设计与 Feed 推荐',
 '介绍本地缓存、Redis 二级缓存与推荐列表缓存失效策略。',
 'https://cdn.example.com/note/cover/redis.jpg',
 NULL, 0,
 JSON_ARRAY('Redis', '缓存', 'Feed'),
 'PUBLISHED', 'PUBLIC', '2026-05-07 10:45:00', '2026-05-07 10:45:00'),
-- 8: 图文笔记（公开）
(8, 'US00000000002', 'TXy1z2a3b4c5d', NULL,
 'Docker 部署 Spring Boot 指南',
 '从 Dockerfile 编写到 docker-compose 联调 MySQL 的完整流程。',
 'https://cdn.example.com/note/cover/docker.jpg',
 NULL, 0,
 JSON_ARRAY('Docker', 'DevOps', '部署'),
 'PUBLISHED', 'PUBLIC', '2026-05-08 13:20:00', '2026-05-08 13:20:00'),
-- 9: 视频笔记（公开）—— 作为便捷笔记的父笔记
(9, 'US00000000003', 'VDe5f6g7h8i9j', NULL,
 '微服务网关鉴权实战（视频）',
 '5 分钟演示 JWT 网关校验与下游透传用户上下文。',
 'https://cdn.example.com/note/cover/gateway.jpg',
 'https://cdn.example.com/note/video/gateway-auth.mp4', 298,
 JSON_ARRAY('微服务', 'JWT', '网关'),
 'PUBLISHED', 'PUBLIC', '2026-05-09 15:00:00', '2026-05-09 15:00:00'),
-- 10: 视频笔记（公开）—— 作为便捷笔记的父笔记
(10, 'US00000000001', 'VDx0y1z2a3b4c', NULL,
 '产学研项目答辩技巧（视频）',
 '分享 PPT 结构、演示节奏与评委常见问题应对。',
 'https://cdn.example.com/note/cover/defense.jpg',
 'https://cdn.example.com/note/video/defense-tips.mp4', 420,
 JSON_ARRAY('答辩', '产学研', '演讲'),
 'PUBLISHED', 'PUBLIC', '2026-05-10 18:30:00', '2026-05-10 18:30:00'),
-- 11: 便捷笔记（图文，关联父视频 VD1T1w2K4x6O8，PRIVATE 不可见于列表）
(11, 'US00000000001', 'TXp0q1r2s3t4u', NULL,
 '智能客服项目笔记随记',
 '关于智能客服系统研发项目中需求拆解的快速记录与思考。',
 'https://cdn.example.com/note/cover/quick-note.jpg',
 NULL, 0,
 JSON_ARRAY('项目管理', '校企合作', '复盘'),
 'PUBLISHED', 'PRIVATE', '2026-05-12 10:00:00', '2026-05-12 10:00:00'),
-- 12: 便捷笔记（图文，关联父视频 VDx0y1z2a3b4c，PUBLIC）
(12, 'US00000000002', 'TXp5q6r7s8t9u', NULL,
 '答辩准备随记',
 '对接产学研项目答辩的 PPT 结构与演示节奏要点梳理。',
 'https://cdn.example.com/note/cover/quick-note2.jpg',
 NULL, 0,
 JSON_ARRAY('答辩', '产学研', '演讲'),
 'PUBLISHED', 'PUBLIC', '2026-05-13 09:00:00', '2026-05-13 09:00:00');

-- =========================================================================
-- 笔记正文大文本表（垂直拆分 content + parent_content_type_code）
-- =========================================================================
INSERT INTO t_user_note_detail (id, content_type_code, parent_content_type_code, content) VALUES
(1,  'TX20212345678', NULL, '## 项目结构\n\n采用 controller / service / mapper 分层。'),
(2,  'TXnews1234567', NULL, '实验室当前重点包括：信息抽取、知识图谱构建、RAG 应用落地等方向。'),
(3,  'VD1T1w2K4x6O8', NULL, NULL),  -- 视频笔记无 content
(4,  'TXa1b2c3d4e5f', NULL, '## 分页\n\n合理使用 Page 对象与 count 优化。'),
(5,  'TXf6g7h8i9j0k', NULL, '## 检索增强\n\nEmbedding + 向量库 + Prompt 模板。'),
(6,  'TXm1n2o3p4q5r', NULL, '## 组件设计\n\n单一职责 + 明确边界。'),
(7,  'TXs6t7u8v9w0x', NULL, '## 缓存键\n\n按 userUid + 场景维度隔离。'),
(8,  'TXy1z2a3b4c5d', NULL, '## 容器化\n\n多阶段构建减小镜像体积。'),
(9,  'VDe5f6g7h8i9j', NULL, NULL),  -- 视频笔记无 content
(10, 'VDx0y1z2a3b4c', NULL, NULL),  -- 视频笔记无 content
(11, 'TXp0q1r2s3t4u', 'VD1T1w2K4x6O8',
 '## 快速记录\n\n接口契约：需提前定义请求/响应格式，避免前后端反复沟通。'),
(12, 'TXp5q6r7s8t9u', 'VDx0y1z2a3b4c',
 '## 答辩随记\n\n亮点先说：先讲成果再讲过程，评委注意力有限。');

-- =========================================================================
-- 笔记高频计数表（热写分离）
-- =========================================================================
INSERT INTO t_user_note_counter (id, content_type_code, view_count, like_count, collect_count, comment_count) VALUES
(1,  'TX20212345678', 128, 24,  9,  3),
(2,  'TXnews1234567', 356, 58, 21,  7),
(3,  'VD1T1w2K4x6O8', 892, 103, 45, 12),
(4,  'TXa1b2c3d4e5f', 210, 31, 14,  5),
(5,  'TXf6g7h8i9j0k', 445, 67, 29, 11),
(6,  'TXm1n2o3p4q5r', 178, 22, 10,  4),
(7,  'TXs6t7u8v9w0x', 302, 41, 18,  8),
(8,  'TXy1z2a3b4c5d', 156, 19,  8,  2),
(9,  'VDe5f6g7h8i9j', 520, 88, 36, 15),
(10, 'VDx0y1z2a3b4c', 388, 52, 24,  9),
(11, 'TXp0q1r2s3t4u',  45,  5,  2,  1),
(12, 'TXp5q6r7s8t9u',  67,  8,  3,  2);

INSERT INTO t_project_achievement (
  id, achievement_uid, user_uid, source_project_uid, masked_project_name, task_description, technical_tags, completed_at
) VALUES
(1, 'AC20212345678', 'US00000000001', 'PR1T1w2K4x6O8', '校园社交 App（脱敏）',
 '负责移动端首页与活动模块开发，完成联调与性能优化。',
 JSON_ARRAY('React Native', 'Java', 'MySQL'), '2026-04-20 16:00:00'),
(2, 'ACnews1234567', 'US00000000002', 'PRnews1234567', '实验室数据管理平台（脱敏）',
 '主导需求分析与核心数据看板模块设计，指导本科生完成迭代交付。',
 JSON_ARRAY('Spring Boot', 'Vue', 'ECharts'), '2026-04-28 11:30:00'),
(3, 'AC1T1w2K4x6O8', 'US00000000001', 'PRnews1234567', '实验室数据管理平台（脱敏）',
 '参与成员管理与权限模块开发，编写接口文档与单元测试。',
 JSON_ARRAY('Spring Boot', 'MyBatis-Plus', 'JUnit'), '2026-05-05 09:00:00');
