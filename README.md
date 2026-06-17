# UnibridgeBackend

UniBridge（产学研合作平台）后端服务。基于 **Spring Boot 3.5.x + Java 21 + MyBatis Plus + MySQL 8.x**，提供管理端与用户/主体端的 RESTful API。

> 接口契约：[`API.md`](./API.md)（主文档）、[`API-1.md`](./API-1.md)（增量变更）。

---

## 架构迁移说明（重要）

### 已完成一次 Client 域重构

原 `com.example.demo.client` 采用**横向分层**（`controller / service / dto / entity / mapper` 平铺），随着 Feed、笔记、项目、个人空间等模块增多，耦合度上升、跨模块依赖难以管控。

**2026-05 已完成迁移**：业务代码按**领域驱动纵向切片（Vertical Slice / DDD-lite）** 重组至：

```text
src/main/java/com/unibridge/backend/
```

| 项 | 说明 |
| --- | --- |
| **新入口** | `com.unibridge.backend.UnibridgeBackendApplication` |
| **旧入口** | `com.example.demo.DemoApplication`（已废弃，不再参与编译与启动） |
| **API 路径** | **不变**，前端无需因包名迁移而改 URL |
| **编译范围** | Maven 仅编译 `com/unibridge/**/*.java`（见 `pom.xml`） |

### 为何保留旧 `client` 目录

路径：`src/main/java/com/example/demo/client/`

- **不参与编译、不参与 Spring 扫描**，仅作迁移对照与**应急回滚参考**。
- 若新架构线上/联调发现问题，可对照旧实现快速定位差异。
- 验证稳定后，可**手动删除**整个 `com/example/demo/client` 目录。

### 2026-06 安全与合规升级（PII 迁移）

**`real_name` 与 `id_card_no` 已从 `user_profile` 迁移至独立加密表 `t_user_identity`**，遵循：

| 标准 | 要求 |
|------|------|
| PIPL（《个人信息保护法》） | §51 加密存储、§47 数据删除权 |
| GB/T 35273 | §8.5 不可否认性、§8.2 最小必要 |
| MLPS 2.0（等保 2.0 三级） | 商用密码应用安全性评估（密评）兼容 |
| 《密码法》 | 合规密码技术（AES-256-GCM / SM4-GCM） |

**关键实体变更**：

| 字段 | 旧位置 | 新位置 | 存储方式 |
|------|--------|--------|----------|
| `real_name` | `user_profile.real_name` | `t_user_identity.encrypted_real_name` | 信封加密（B64） |
| `real_name`（展示） | 同列 | `t_user_identity.real_name_mask`（按 role 脱敏） | 明文掩码 |
| `id_card_no` | 无 | `t_user_identity.id_card_no`（加密）+ `id_card_hash`（SHA-256） | 加密 + 不可逆哈希 |
| `current_entity_name` | `user_profile` | 已移除，改用 `user_auth_link.entity_code` → `entity_profile.name` | — |

**API 层对应映射**：

| DTO | 原字段 | 现字段 |
|-----|--------|--------|
| `EntityMemberItem` | `realName` | `displayName` |
| `UserSearchItem` | `realName` | `displayName` |
| `CodeStudentItem` | `realName` | `realNameMask` |
| `UserVerifiedPreviewResponse` | `realName` | `realNameMask` |

### 旧 Client 包已实现的业务能力（快照清单）

以下为迁移前 `client` 包覆盖的**用户端（/api/v1/client）** 功能，均已迁移至 `com.unibridge.backend` 对应 domain：

| 模块 | 能力 | 主要路径 |
| --- | --- | --- |
| **认证 auth** | 个人注册；密码/SMS/邮箱登录；验证码下发；机构两步登录（凭证 + OTP）；Refresh Token；登出 | `/api/v1/client/auth/**` |
| **身份验证 verification** | 人脸核身（阶段一）；机构认证（阶段二）；认证码生成/激活/停用/延期；机构检索 | `/api/v1/client/verification/**` |
| **笔记 note** | 笔记草稿/发布/更新；图文与视频分栏；详情与草稿读取；XSS 清洗；发布清 Feed 缓存 | `/api/v1/client/notes/**` |
| **项目 project** | 项目草稿/发布/更新；商业/招募分栏；商业敏感字段隔离；详情与草稿读取 | `/api/v1/client/projects/**` |
| **个人空间 space** | 个人菜单、空间主页、Home Tab 预览、分页项目/笔记列表；三级认证状态（unverified/identity_only/verified） | `/api/v1/client/user-profile/**` |
| **团队空间 space** | TeamView 页壳、主页预览、成员/项目/笔记/成果 Tab（游客只读） | `/api/v1/client/team-profile/**` |
| **机构空间** | 机构页壳、home、实验室/人员/分页 | `/api/v1/client/entity-profile/**` |
| **Feed 推荐 feed** | 首页个性化推送；专区推送（项目/笔记分栏）；换一换（机制 A 分页缓存 / 机制 B `seed` 洗牌）；相似笔记；行为埋点加权 | `/api/v1/client/feed/**` |
| **互动 interaction** | 点赞/收藏 toggle；播放/阅读计数同步；Feed 缓存失效 | `/api/v1/client/interactions/**` |
| **公共能力** | 双 UID 解析；JWT 可选/必选解析；卡片组装（作者/发布主体） | 各 Service 内部 / `application/shared` |
| **基础设施** | IP 属地（ip2region）；请求日志；本地文件上传；上传安全；Spring Cache | `/uploads/**`、`/api/v1/client/uploads/**` |

同步迁移至新架构、但**不在旧 client 包内**的模块：

| 模块 | 路径 | 说明 |
| --- | --- | --- |
| **管理端 admin** | `/api/v1/admin/**` | 主体/用户 CRUD、管理员登录 |
| **身份验证 verification** | `/api/v1/client/verification/**` | 人脸核身 + 机构认证双阶段流程 |
| **安全 / 媒体 / 配置** | `infrastructure.*` | XSS、上传安全、Cache、CORS、静态资源映射 |

---

## 快速开始

### 前置条件

- **JDK 21+**
- **MySQL 8.x**（库名默认 `project_cooperation_platform`）
- 端口 **8081** 未被占用

### 初始化数据库（Windows PowerShell）

```powershell
powershell -ExecutionPolicy Bypass -File .\init-db.ps1
```

密码非默认 `111111` 时：

```powershell
powershell -ExecutionPolicy Bypass -File .\init-db.ps1 -MySqlPassword "<你的密码>"
```

导入测试数据（可选，推荐脚本）：

```powershell
powershell -ExecutionPolicy Bypass -File .\insert-test-data.ps1
```

或手动导入：

```powershell
mysql -uroot -p111111 project_cooperation_platform < insert-test-data.sql
```

测试账号（密码均为 SHA256(`123456`)）：

| 用户 | 手机号 | 说明 |
| --- | --- | --- |
| US00000000001 | 13800001001 | 学生 |
| US00000000002 | 13800001002 | 导师 |
| US00000000003 | 13800001003 | 企业 PM |

团队 UID 示例：`LB00000000001`（深大 AI 实验室）、`ST00000000001`（极客创新队）。

### 启动后端

**推荐：一键脚本（dev 环境）**

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

**Maven 直接启动**

```powershell
.\mvnw.cmd spring-boot:run
```

**指定环境**

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"
```

**打包后运行**

```powershell
.\mvnw.cmd clean package -DskipTests
java -jar target\demo-0.0.1-SNAPSHOT.jar
```

启动成功后：

```text
http://localhost:8081
```

**主类**：`com.unibridge.backend.UnibridgeBackendApplication`

---

## 环境配置速查

### 身份验证手动开关

人脸核身通过 `spring.profiles.active` 控制模式：

| Profile | 行为 | 适用场景 |
|---------|------|----------|
| `dev`（默认） | **mock 模式**：跳过腾讯云核身，直接返回 `passed=true` | 本地开发 / 联调 |
| `prod` | **真实核身**：调用腾讯云人脸核身 API | 生产部署（需先配置 SDK） |

配置文件位置：

| 文件 | 对应 Profile |
|------|-------------|
| `src/main/resources/application-dev.properties` | `dev` |
| `src/main/resources/application-prod.properties` | `prod` |

### API 文档（OpenAPI / Swagger UI）

| 地址 | 说明 |
| --- | --- |
| http://localhost:8081/swagger-ui.html | Swagger UI 交互文档 |
| http://localhost:8081/v3/api-docs | OpenAPI 3 JSON |

在 Swagger UI 右上角 **Authorize** 填入 `Bearer {access_token}` 可测试需登录接口。

### 常见启动问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Port 8081 was already in use` | 旧 Java 进程未退出 | `netstat -ano \| findstr :8081` → `Stop-Process -Id <PID> -Force` |
| Maven `exit code: 1` | 重复启动或编译错误 | 检查编译日志，确认 `.\mvnw.cmd compile` 通过后再 `spring-boot:run` |
| 数据库连接失败 | MySQL 未启动或密码/库名不符 | 检查 `application-dev.properties` |
| `Unknown column 'xxx'` | 数据库 Schema 版本与代码不匹配 | 运行 `.\init-db.ps1` 重新初始化 |

---

## 技术栈

| 类型 | 选型 | 版本 |
| --- | --- | --- |
| 语言 | Java | 21 |
| 框架 | Spring Boot | 3.5.13 |
| Web | spring-boot-starter-web | 跟随 Boot |
| 缓存 | spring-boot-starter-cache（ConcurrentMap） | 跟随 Boot |
| ORM | MyBatis Plus (Boot3 Starter) | 3.5.15 |
| 数据库 | MySQL | 8.x（`mysql-connector-j`） |
| 鉴权 | JJWT | 0.11.5 |
| HTML 安全 | Jsoup（XSS 清洗） | 1.22.2 |
| ID 生成 | jnanoid | 2.0.0 |
| IP 属地 | ip2region（离线 xdb） | 3.3.7 |
| API 文档 | springdoc-openapi-starter-webmvc-ui | 2.8.6 |
| 构建 | Maven + Wrapper（`mvnw`） | — |
| 增强 | Lombok | 跟随 Boot |

---

## 项目结构（领域纵向切片）

```text
src/main/java/com/unibridge/backend/
│
├── UnibridgeBackendApplication.java          # 启动入口；scanBasePackages = com.unibridge.backend
│
├── application/                                # 【应用层】跨领域编排 / 共享能力
│   └── shared/
│       ├── dto/
│       │   ├── ProfileProjectItem.java         # 项目卡片 VO（跨域共用）
│       │   └── ProfileNoteItem.java            # 笔记卡片 VO（跨域共用）
│       └── ContentUidResolver.java             # UID ↔ 自增 ID 互转
│
├── domain/                                     # 【领域层】按业务垂直切片
│   │
│   ├── auth/                                   # 用户端认证（/api/v1/client/auth）
│   │   ├── AuthController.java
│   │   ├── AuthService.java                    # 注册、多方式登录、OTP、Token 刷新
│   │   ├── AccessService.java                  # JWT Bearer 解析
│   │   ├── EntityAdminCredentialService.java   # 机构管理员凭证校验
│   │   └── dto/
│   │
│   ├── verification/                           # 身份认证（/api/v1/client/verification）
│   │   ├── VerificationController.java         # 双阶段认证：人脸核身 + 机构认证
│   │   ├── VerificationService.java            # 人脸核身、认证码管理、教职工/学生认证
│   │   └── dto/                                # FaceInit/Result, StaffApply, CodeGenerate, StudentActivate 等
│   │
│   ├── note/                                   # 笔记生命周期（/api/v1/client/notes）
│   │   ├── NoteController.java
│   │   ├── NoteService.java                    # 草稿/发布/详情
│   │   ├── NoteCardAssembler.java
│   │   ├── NoteAuthorResolver.java
│   │   ├── NoteViewTracker.java
│   │   └── dto/
│   │
│   ├── project/                                # 项目生命周期（/api/v1/client/projects）
│   │   ├── ProjectController.java
│   │   ├── ProjectService.java
│   │   ├── ProjectCardAssembler.java
│   │   ├── ProjectPublisherEntityResolver.java
│   │   └── dto/
│   │
│   ├── user/                                   # 用户个人空间（/api/v1/client/user-profile）
│   │   ├── UserProfileController.java
│   │   ├── UserPublicController.java           # /api/v1/client/users
│   │   ├── UserProfileService.java             # menu / space / home / 分页 / 三级认证状态
│   │   └── dto/
│   │
│   ├── team/                                   # 团队空间（/api/v1/client/team-profile）
│   │   ├── TeamProfileController.java
│   │   ├── TeamProfileService.java             # TeamView 页壳 / 各 Tab 分页 / 成员展示
│   │   ├── TeamManagementService.java
│   │   └── dto/
│   │
│   ├── organization/                           # 机构空间（/api/v1/client/entity-profile）
│   │   ├── OrganizationProfileController.java
│   │   ├── OrganizationProfileService.java     # 机构页壳 / home / 实验室 / 人员 / 搜索
│   │   └── dto/
│   │
│   ├── feed/                                   # 推荐与换一换（/api/v1/client/feed）
│   │   ├── FeedController.java
│   │   ├── FeedRecommendationService.java      # 打分、shuffle、相似笔记
│   │   ├── FeedShuffleCacheService.java
│   │   ├── FeedBehaviorService.java            # 行为埋点
│   │   └── dto/
│   │
│   ├── interaction/                            # 点赞 / 收藏 / 播放（/api/v1/client/interactions）
│   │   ├── InteractionController.java
│   │   ├── InteractionService.java
│   │   └── dto/
│   │
│   └── admin/                                  # 管理端（/api/v1/admin）
│       ├── controller/
│       ├── service/AdminAuthService.java
│       ├── entity/SystemAdmin.java
│       ├── dto/
│       └── mapper/
│
└── infrastructure/                               # 【基础设施层】全局共享
    │
    ├── entities/                                 # ORM 实体（按业务分类子文件夹）
    │   ├── auth/                                 # User, TenantOrganization, EntityTotpCredentials, SysAdmin
    │   ├── profile/                              # UserProfile, TenantOrgProfile, UserIdentity, UserOrganizationBinding
    │   ├── verification/                         # VerificationCode, ApprovalFlow
    │   ├── compliance/                           # PolicyConfig, PersonalInfoConsent
    │   ├── team/                                 # Team, TeamMember
    │   ├── project/                              # Project, ProjectSecret
    │   ├── im/                                   # ProjectMilestone, ProjectTaskCard（依附于 IM 即时通讯系统）
    │   ├── note/                                 # Note
    │   ├── interaction/                          # UserInterestTag, UserInteraction, Achievement
    │   └── infra/                                # DataEncryptionKey, CreditProfile, CreditLog, FileRecord
    │
    ├── persistence/mapper/                       # MyBatis Plus Mapper（与 entities 子文件夹一一对应）
    │   ├── auth/     # UserMapper, TenantOrganizationMapper 等
    │   ├── profile/  # UserProfileMapper, TenantOrgProfileMapper 等
    │   ├── verification/, compliance/, team/, project/, im/, note/, interaction/, infra/
    │   └── ...
    │
    ├── media/                                    # 本地文件上传
    ├── config/                                   # CORS、OpenAPI、Cache、Upload、IP 配置
    ├── common/                                   # Result、BusinessException、GlobalExceptionHandler
    ├── security/                                 # XSS 清洗、上传安全
    └── util/                                     # JwtUtil、IpUtil、Uid 生成器
```

### 架构约束

1. **纵向切片**：每个 domain 自带 Controller + Service + dto；Mapper/Entity 下沉 `infrastructure`。
2. **禁止循环依赖**：通过 `@Lazy` 注入或 `application/shared` 公共层打破。
3. **事务边界**：写操作使用 `@Transactional(rollbackFor = Exception.class)`。
4. **缓存一致性**：note/project 发布时 `@CacheEvict` 清理 Feed cache；互动 toggle 同步失效。
5. **安全响应**：底层异常对外统一模糊话术（`GlobalExceptionHandler`）。

---

## 数据库安全与合规架构

### PII 保护体系（PIPL + GB/T 35273 合规）

| 表名 | 用途 | 核心字段 |
|------|------|----------|
| `t_user_identity` | 用户实名身份独立存储 | `encrypted_real_name`、`real_name_mask`、`id_card_no`（加密）、`id_card_hash`（SHA-256 全库唯一） |
| `sys_policy_config` | 协议/政策配置管理 | `policy_type`（IDENTITY_AUTH\|PRIVACY\|TERMS_OF_SERVICE）、`version_code`、`content_hash`、`policy_content`（Markdown） |
| `sys_personal_info_consent` | 个人信息处理授权记录 | `consent_type`、`consent_action`（GRANT\|WITHDRAW）、`policy_content_hash`、`ip_address_hash`（加盐） |
| `sys_data_encryption_keys` | 数据加密密钥管理 | `key_id`（UUID v7）、`algorithm`（AES-256-GCM\|SM4-GCM）、`key_status`、信封加密层次 |
| `sys_data_classification` | 数据分级分类 | 敏感度 C1/C2/C3、类型 PII\|FINANCE\|AUTH\|BUSINESS\|PUBLIC |

### 密钥管理（信封加密）

```
KEK（主密钥，KMS 保管）
  └── DEK（数据加密密钥，sys_data_encryption_keys 表存储）
       └── 敏感字段密文（t_user_identity.encrypted_real_name / id_card_no）
```

- 密钥状态机：`INITIALIZED` → `ACTIVE` → `ROTATED` → `REVOKED`
- 支持国密兼容（SM4-GCM）与国际标准（AES-256-GCM）双算法
- 密钥轮转时旧 DEK 保留 `auto_retire_on` 审计窗口

### 金融安全

| 表名 | 用途 |
|------|------|
| `t_wallet_account` | 用户钱包主档（可用余额 + 冻结金额、乐观锁版本号） |
| `t_wallet_transaction` | 不可变流水（追加日志、每条含幂等键） |
| `t_wallet_freeze` | 资金冻结记录（原因、解冻时间） |

### 审计与日志

| 表名 | 用途 |
|------|------|
| `sys_audit_log` | 通用安全审计日志 |
| `sys_login_log` | 登录行为日志（含异常标记） |
| `sys_pii_access_log` | 敏感 PII 访问审计（合规取证 ≥ 3 年） |

---

## 配置说明

### 基础（`src/main/resources/application.properties`）

```properties
spring.application.name=demo
server.port=8081
spring.profiles.active=dev

mybatis-plus.configuration.map-underscore-to-camel-case=true
mybatis-plus.global-config.db-config.id-type=auto

springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.packages-to-scan=com.unibridge.backend
```

### 开发环境（`application-dev.properties`）

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/project_cooperation_platform?...
spring.datasource.username=root
spring.datasource.password=111111
```

### 生产环境（`application-prod.properties`）

按部署环境修改数据源；启动时 `--spring.profiles.active=prod`。

### 上传与静态资源（`application.yml`）

```yaml
file:
  upload-folder: ${user.home}/unibridge/uploads
  access-path: /uploads/**
  public-base-url: http://localhost:8081
```

---

## 统一响应与鉴权

### 响应体 `Result<T>`

```json
{ "code": 200, "message": "success", "data": {} }
```

### JWT

- 用户端 Token 类型：`CLIENT_USER`
- 管理端：`ADMIN` + `authLevel`
- 请求头：`Authorization: Bearer <token>`

### 认证状态

Menu API（`/client/user-profile/menu`）返回三级认证状态：

| 状态 | 含义 |
|------|------|
| `unverified` | `t_user_identity.verified_at` 为空 |
| `identity_only` | `verified_at` 非空但无 APPROVED 机构认证 |
| `verified` | `verified_at` 非空 + `user_auth_link` 已审批且活跃 |

---

## 常用 Maven 命令

```powershell
.\mvnw.cmd clean                  # 清理 target
.\mvnw.cmd compile                # 编译（仅 com.unibridge.**）
.\mvnw.cmd test                   # 运行单测
.\mvnw.cmd package -DskipTests    # 打 jar
.\mvnw.cmd spring-boot:run        # 本地 dev 启动
```

---

## 相关文档与脚本

| 文件 | 说明 |
| --- | --- |
| [`API.md`](./API.md) | 主接口契约 |
| [`API-1.md`](./API-1.md) | 增量 API（TeamView、Feed 字段等） |
| [`db.sql`](./db.sql) | 建表脚本（含安全/合规/金融/审计全表） |
| [`db-security-improvement.sql`](./db-security-improvement.sql) | 安全模块独立 DDL（t_user_identity / sys_policy_config / sys_personal_info_consent / sys_data_encryption_keys） |
| [`migrate-realname-and-idcard.sql`](./migrate-realname-and-idcard.sql) | 数据迁移脚本（user_profile.real_name → t_user_identity） |
| [`insert-test-data.sql`](./insert-test-data.sql) | 联调测试数据 |
| [`init-db.ps1`](./init-db.ps1) | 数据库初始化 |
| [`insert-test-data.ps1`](./insert-test-data.ps1) | 导入测试数据并校验行数 |
| [`start-backend.ps1`](./start-backend.ps1) | 一键启动 |

---

## 并发安全与数据库优化

### 已完成：应用层并发安全修复

| # | 文件 | 风险 | 修复方式 |
|---|------|------|----------|
| 1 | `AuthService.registerPersonal` | TOCTOU：重复注册 | `DuplicateKeyException` + `uk_user_phone` |
| 2-8 | `AuthService` 多方法 | 冷却期竞态 / 验证码重放 / Token 竞态 / 内存无限增长 | `compute()` / `remove(key,value)` / `@Scheduled` 清理 |
| 9 | `NoteService.incrementViewCount` | 丢失更新 | `SET view_count = COALESCE(view_count,0)+1` |
| 10-13 | `InteractionService` 多方法 | 读-改-写丢失 / TOCTOU | 原子 SQL / `DuplicateKeyException` |
| 14 | `FeedBehaviorService` | TOCTOU + 丢失更新 | 原子加法 + `uk_user_tag` |
| 15-17 | Project / Admin / Team | TOCTOU / 全字段覆盖 | 唯一约束兜底 / 单字段更新 |

### 待推进

| # | 优化项 | 优先级 | 说明 |
|---|--------|--------|------|
| ARC-1 | JWT 密钥外部化 | 高 | 迁移至环境变量 / Vault |
| ARC-2 | Spring Cache → Redis | 中 | `CacheConfig` 替换 Manager，domain 零改动 |
| ARC-3 | 内存缓存 → Redis | 中 | 支持多实例部署 |
| ARC-4 | 分布式锁 | 低 | `refreshAccessToken` 的 `synchronized` 仅保单实例 |
| ARC-5 | 幂等 Token | 低 | 防网络重试重复操作 |

---

## 后续计划

- [x] `real_name` / `id_card_no` PII 迁移至 `t_user_identity`（2026-06）
- [x] `current_entity_name` 移除，改用 `user_auth_link` 关联查询（2026-06）
- [ ] 插入 `t_user_identity.verified_at` 测试数据以验证三级认证状态
- [ ] 验证新架构稳定后删除 `com/example/demo/client` 快照目录
- [ ] JWT 密钥外部化（环境变量 / Vault）
- [ ] Spring Cache 迁移至 Redis
- [ ] 补充 Feed / Note / Project / TeamProfile 接口集成测试
- [ ] 前端 TeamView 对接 `/team-profile/*`
