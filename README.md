# UnibridgeBackend

UniBridge（产学研合作平台）后端服务。基于 **Spring Boot 3.5.x + Java 21 + MyBatis Plus + MySQL**，提供管理端与用户/主体端的 RESTful API。

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
- 验证稳定后，可**手动删除**整个 `com/example/demo/client` 目录（仓库内已附 [`client/README.md`](./src/main/java/com/example/demo/client/README.md) 说明）。

### 旧 Client 包已实现的业务能力（快照清单）

以下为迁移前 `client` 包覆盖的**用户端（/api/v1/client）** 功能，均已迁移至 `com.unibridge.backend` 对应 domain：

| 模块 | 能力 | 主要路径 |
| --- | --- | --- |
| **认证 auth** | 个人注册；密码/SMS/邮箱登录；验证码下发；机构两步登录（凭证 + OTP）；Refresh Token；登出 | `/api/v1/client/auth/**` |
| **笔记 note** | 笔记草稿/发布/更新；图文与视频分栏；详情与草稿读取；XSS 清洗；发布清 Feed 缓存 | `/api/v1/client/notes/**` |
| **项目 project** | 项目草稿/发布/更新；商业/招募分栏；商业敏感字段隔离；详情与草稿读取 | `/api/v1/client/projects/**` |
| **个人空间 space** | 个人菜单、空间主页、Home Tab 预览、分页项目/笔记列表 | `/api/v1/client/user-profile/**` |
| **团队空间 space** | TeamView 页壳、主页预览、成员/项目/笔记/成果 Tab（游客只读） | `/api/v1/client/team-profile/**` |
| **Feed 推荐 feed** | 首页个性化推送；专区推送（项目/笔记分栏）；换一换（机制 A 分页缓存 / 机制 B `seed` 洗牌）；相似笔记；行为埋点加权 | `/api/v1/client/feed/**` |
| **互动 interaction** | 点赞/收藏 toggle；播放/阅读计数同步；Feed 缓存失效 | `/api/v1/client/interactions/**` |
| **公共能力** | 双 UID 解析（笔记 `content_type_code` / 项目 `project_uid`）；JWT 可选/必选解析；卡片组装（作者/发布主体） | 各 Service 内部 |
| **基础设施** | IP 属地（ip2region）；请求日志；本地文件上传（封面/视频）；上传安全（MIME/魔数/SVG 清洗）；Spring Cache 本地缓存 | `/uploads/**`、`/api/v1/client/uploads/**` |

同步迁移至新架构、但**不在旧 client 包内**的模块：

| 模块 | 路径 | 说明 |
| --- | --- | --- |
| **管理端 admin** | `/api/v1/admin/**` | 主体/用户 CRUD、管理员登录 |
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
# 或
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1 -Profile prod
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

### API 文档（OpenAPI / Swagger UI）

项目已集成 **springdoc-openapi**（Spring Boot 3 使用 `springdoc-openapi-starter-webmvc-ui`）：

| 地址 | 说明 |
| --- | --- |
| http://localhost:8081/swagger-ui.html | Swagger UI 交互文档 |
| http://localhost:8081/v3/api-docs | OpenAPI 3 JSON |

在 Swagger UI 右上角 **Authorize** 填入 `Bearer {access_token}` 可测试需登录接口。配置见 `OpenApiConfig.java`。

### 常见启动问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Port 8081 was already in use` | 旧 Java 进程未退出 | `netstat -ano \| findstr :8081` → `Stop-Process -Id <PID> -Force` |
| Maven `exit code: 1` 但日志曾出现 `Tomcat started` | 重复启动或终端中断子进程 | 确认是否已有实例在跑，避免同端口启动两次 |
| 数据库连接失败 | MySQL 未启动或密码/库名不符 | 检查 `application-dev.properties` |

---

## 技术栈

| 类型 | 选型 | 版本 |
| --- | --- | --- |
| 语言 | Java | 21 |
| 框架 | Spring Boot | 3.5.13 |
| Web | spring-boot-starter-web | 跟随 Boot |
| 缓存 | spring-boot-starter-cache（ConcurrentMap，可平滑换 Redis） | 跟随 Boot |
| ORM | MyBatis Plus (Boot3 Starter) | 3.5.15 |
| 数据库 | MySQL | 8.x（`mysql-connector-j`） |
| 鉴权 | JJWT | 0.11.5 |
| HTML 安全 | Jsoup（XSS 清洗） | 1.22.2 |
| ID 生成 | jnanoid（笔记 UID 后缀） | 2.0.0 |
| IP 属地 | ip2region（离线 xdb） | 3.3.7 |
| API 文档 | springdoc-openapi-starter-webmvc-ui | 2.8.6 |
| 构建 | Maven + Wrapper（`mvnw`） | — |
| 增强 | Lombok | 跟随 Boot |

---

## 新项目结构（领域纵向切片）

```text
src/main/java/com/unibridge/backend/
│
├── UnibridgeBackendApplication.java          # 启动入口；scanBasePackages = com.unibridge.backend
│                                               # MapperScan：persistence + media + admin.mapper
│
├── application/                                # 【应用层】跨领域编排 / 共享能力（禁止 domain 间循环依赖）
│   ├── package-info.java                       # 层职责说明
│   └── shared/
│       └── ContentUidResolver.java             # 对外 UID ↔ 内部自增 ID；笔记/项目/互动/Feed 共用
│
├── domain/                                     # 【领域层】按业务垂直切片，高内聚
│   │
│   ├── auth/                                   # 用户端认证
│   │   ├── AuthController.java                 # /api/v1/client/auth
│   │   ├── AuthService.java                    # 注册、多方式登录、OTP、Token 刷新（@Transactional）
│   │   ├── AccessService.java                  # JWT Bearer 解析（必选 / 可选登录）
│   │   └── dto/                                # LoginResponse、RegisterRequest 等
│   │
│   ├── note/                                   # 笔记生命周期
│   │   ├── NoteController.java                 # /api/v1/client/notes
│   │   ├── NoteService.java                    # 草稿/发布/详情；CacheEvict
│   │   ├── NoteCardAssembler.java              # Feed / 空间卡片 VO
│   │   ├── NoteAuthorResolver.java             # 作者昵称、机构、头像
│   │   ├── NoteViewTracker.java                # 阅读去重（内存窗口）
│   │   └── dto/
│   │
│   ├── project/                                # 项目生命周期
│   │   ├── ProjectController.java              # /api/v1/client/projects
│   │   ├── ProjectService.java                 # 草稿/发布/详情；商业保密表写入
│   │   ├── ProjectCardAssembler.java           # 项目卡片（cover/logo 取自主体 profile）
│   │   ├── ProjectPublisherEntityResolver.java
│   │   └── dto/
│   │
│   ├── space/                                  # 个人空间 + 团队空间
│   │   ├── SpaceController.java                # /api/v1/client/user-profile
│   │   ├── SpaceService.java                   # menu / space / home / 分页 projects & notes
│   │   ├── TeamSpaceController.java            # /api/v1/client/team-profile
│   │   ├── TeamSpaceService.java               # TeamView 页壳 / home / 各 Tab 分页
│   │   └── dto/                                # Profile* / TeamProfile* 响应体
│   │
│   ├── feed/                                   # 推荐与换一换
│   │   ├── FeedController.java                 # /api/v1/client/feed
│   │   ├── FeedRecommendationService.java      # 打分、shuffle、相似笔记；@Cacheable
│   │   ├── FeedShuffleCacheService.java        # 机制 A 分页缓存（独立 Bean + @Lazy 破环）
│   │   ├── FeedBehaviorService.java            # 行为埋点 → user_tag_interests
│   │   └── dto/                                # ContentVO、FeedShuffleResponse（含 seed/shuffleMode）
│   │
│   ├── interaction/                            # 点赞 / 收藏 / 播放
│   │   ├── InteractionController.java          # /api/v1/client/interactions
│   │   ├── InteractionService.java
│   │   └── dto/
│   │
│   ├── admin/                                    # 管理端（Web Admin）
│   │   ├── controller/                           # AdminAuthController、AdminController
│   │   ├── service/AdminAuthService.java
│   │   ├── entity/SystemAdmin.java
│   │   ├── dto/                                  # AdminLoginRequest、LoginResponse、EntityCreateRequest 等
│   │   └── mapper/SystemAdminMapper.java         # 由 MapperScan 扫描
│   │
│   └── (已移除 legacy 演示登录 `/api/v1/user/login` 等旧接口)
│
└── infrastructure/                               # 【基础设施层】全局共享、与业务解耦
    │
    ├── entities/                                 # ORM 实体（统一存放，避免 domain 映射锁死）
    │   ├── ClientUser.java / ClientNote.java / ClientProject.java
    │   ├── UserTagInterest.java / UserContentInteraction.java
    │   └── Entity.java / UserProfile.java        # 管理端 CRUD 用表
    │
    ├── persistence/mapper/                         # MyBatis Plus Mapper（主持久化）
    │   ├── ClientNoteMapper.java
    │   ├── ClientProjectMapper.java
    │   └── UserAuthLinkMapper.java 等
    │
    ├── media/                                    # 本地文件上传（无 OSS 阶段）
    │   ├── MediaUploadController.java            # /api/v1/client/uploads
    │   ├── service/MediaUploadService.java
    │   ├── mapper/FileRecordMapper.java
    │   └── dto/
    │
    ├── config/                                   # 全局配置
    │   ├── WebConfig.java                        # CORS
    │   ├── OpenApiConfig.java                    # OpenAPI 3 + JWT Bearer 方案
    │   ├── CacheConfig.java                      # home_feed / note_feed / project_feed / similar_notes
    │   ├── UploadConfig.java                     # /uploads/** 静态映射
    │   ├── IpRegionConfig.java                   # ip2region xdb 加载
    │   ├── ApiRequestLoggingFilter.java          # 请求耗时 + IP 日志
    │   └── IpLocationInterceptor.java
    │
    ├── common/                                   # 横切响应与异常
    │   ├── Result.java                           # { code, message, data }
    │   ├── BusinessException.java                # 可控业务错误码
    │   └── GlobalExceptionHandler.java           # 内外隔离：日志详细 / 响应脱敏
    │
    ├── security/                                 # 安全专项
    │   ├── xss/                                  # Jsoup 清洗、JSON 反序列化器
    │   └── upload/                               # MIME/魔数/SVG/图片重编码/审计
    │
    ├── util/                                     # JwtUtil、IpUtil、Uid 生成器等
    └── web/
        └── IpLocationDemoController.java         # /api/v1/client/ip-location/demo
```

### 架构约束（迁移时遵循）

1. **纵向切片**：每个 domain 自带 Controller + Service + dto；Mapper/Entity 下沉 `infrastructure`，避免领域间「横向穿透」。
2. **禁止循环依赖**：例如 `FeedRecommendationService` ⇄ `FeedShuffleCacheService` 通过 `@Lazy` 注入打破；跨域 UID 解析集中在 `application/shared`。
3. **事务边界**：写操作在 Service 方法上使用 `@Transactional(rollbackFor = Exception.class)`（auth 注册、note/project 发布、互动双写等）。
4. **缓存一致性**：note/project 发布、`@CacheEvict` 清理 Feed 相关 cache；互动 toggle 同步失效。
5. **安全响应**：DB/SQL/NPE 等底层异常对外统一模糊话术，详见 `GlobalExceptionHandler`。

### 旧代码对照（迁移映射）

| 旧 `com.example.demo.client` | 新 `com.unibridge.backend` |
| --- | --- |
| `ClientAuthController` / `ClientAuthService` | `domain/auth/AuthController` / `AuthService` |
| `ClientAccessService` | `domain/auth/AccessService` |
| `ClientNoteController` / `ClientNoteService` | `domain/note/NoteController` / `NoteService` |
| `ClientProjectController` / `ClientProjectService` | `domain/project/ProjectController` / `ProjectService` |
| `ClientProfileController` / `ClientProfileService` | `domain/space/SpaceController` / `SpaceService` |
| `FeedRecommendationController` + Services | `domain/feed/FeedController` + Services |
| `ContentInteractionController` / `Service` | `domain/interaction/*` |
| `ContentUidResolver` | `application/shared/ContentUidResolver` |
| `entity/*` + `mapper/*` | `infrastructure/entities/*` + `infrastructure/persistence/mapper/*` |
| `com.example.demo.common.*` | `infrastructure/common/*` |
| `com.example.demo.config.*` | `infrastructure/config/*` |
| `com.example.demo.security.*` | `infrastructure/security/*` |
| `com.example.demo.media.*` | `infrastructure/media/*` |

---

## 配置说明

### 基础（`src/main/resources/application.properties`）

```properties
spring.application.name=demo
server.port=8081
spring.profiles.active=dev

mybatis-plus.configuration.map-underscore-to-camel-case=true
mybatis-plus.global-config.db-config.id-type=auto

# OpenAPI / Swagger UI
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
  upload-folder: ${user.home}/unibridge/uploads   # 本地落盘目录
  access-path: /uploads/**                        # 静态访问前缀
  public-base-url: http://localhost:8081
```

---

## 统一响应与鉴权

### 响应体 `Result<T>`

```json
{ "code": 200, "message": "success", "data": {} }
```

失败时 `code` 与 HTTP 状态对齐（400/401/403/404/500），业务可读错误走 `BusinessException`；底层异常对外脱敏。

### JWT

- 用户端 Token 类型：`CLIENT_USER`（`AccessService` 解析）
- 管理端：`ADMIN` + `authLevel`（1/2/3）
- 请求头：`Authorization: Bearer <token>`

### 权限速查（管理端）

| `auth_level` | 能力 |
| --- | --- |
| 1 | 列表 / 详情 GET |
| 2 | 新增 POST |
| 3 | 超级管理员操作 |

---

## 常用 Maven 命令

```powershell
.\mvnw.cmd clean                  # 清理 target
.\mvnw.cmd compile                # 编译（仅 com.unibridge.**）
.\mvnw.cmd test                   # 运行单测
.\mvnw.cmd package -DskipTests    # 打 jar
.\mvnw.cmd spring-boot:run        # 本地 dev 启动
```

指定测试：

```powershell
.\mvnw.cmd test "-Dtest=XssCleanUtilTest,FileNameSanitizerTest,DemoApplicationTests"
```

---

## 冒烟示例

**Swagger UI（推荐）**

浏览器打开 http://localhost:8081/swagger-ui.html ，按 Tag 浏览并在线调试。

**团队空间页壳**

```bash
curl "http://localhost:8081/api/v1/client/team-profile/space?teamUid=LB00000000001"
```

**Feed 笔记列表**

```bash
curl "http://localhost:8081/api/v1/client/feed/notes?noteType=IMAGE_TEXT&limit=10"
```

**换一换（机制 B，每次新 seed）**

```bash
curl "http://localhost:8081/api/v1/client/feed/notes/shuffle?noteType=IMAGE_TEXT&page=1&size=10&seed=1735689600000"
```

响应关注字段：`shuffleMode`（`RANDOM_SEED` / `CACHE_PAGE`）、`seed`、`items`。

**管理员登录**

```bash
curl -X POST http://localhost:8081/api/v1/admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"adminId\":\"admin_master\",\"passwordHash\":\"<SHA256>\"}"
```

---

## 开发约定

1. **库字段** `snake_case`，Java **camelCase**，依赖 MyBatis Plus 映射。
2. **密码**仅存前端 SHA256 哈希；响应禁止返回 `password_hash`。
3. **双 ID**：对外 `uid`（用户 `US+11`、团队 `LB/ST+11`、笔记 `TX/VD+11`、项目 `PR+11`、成果 `AC+11`），对内自增 `id`；`project.extended_uid` / `note.extended_uid` 存代发归属（`entity_code` 或 `team_uid`，非独立 EX UID）。
4. **新增/变更接口** 同步更新 `API.md` / `API-1.md`，Controller 补充 OpenAPI 注解（`@Tag` / `@Operation`）。
5. **新功能** 只写在 `com.unibridge.backend` 对应 domain，**勿再向** `com.example.demo.client` 追加代码。
6. **Feed 换一换**：前端刷新请调 `/shuffle` 并传 **新** `seed`（`Long`，可用 `Date.now()`）；`/feed/notes` 为稳定推荐，带缓存。

---

## 测试

| 测试类 | 说明 |
| --- | --- |
| `DemoApplicationTests` | Spring 上下文加载（`UnibridgeBackendApplication`） |
| `XssCleanUtilTest` | XSS 清洗 |
| `FileNameSanitizerTest` | 上传文件名消毒 |
| `AdminControllerTest` | 管理端集成测试（需本地 MySQL + 种子数据） |

---

## 相关文档与脚本

| 文件 | 说明 |
| --- | --- |
| [`API.md`](./API.md) | 主接口契约 |
| [`API-1.md`](./API-1.md) | 增量 API（团队空间 TeamView、Feed 卡片字段等） |
| [`db.sql`](./db.sql) | 建表脚本（含信用体系 `sys_credit_*`、团队/成果表） |
| [`insert-test-data.sql`](./insert-test-data.sql) | 联调测试数据 |
| [`init-db.ps1`](./init-db.ps1) | 数据库初始化 |
| [`insert-test-data.ps1`](./insert-test-data.ps1) | 导入测试数据并校验行数 |
| [`start-backend.ps1`](./start-backend.ps1) | 一键启动 |

---

## 后续计划

- [ ] 验证新架构稳定后删除 `com/example/demo/client` 快照目录
- [ ] JWT 密钥外部化（环境变量 / Vault）
- [ ] Spring Cache 迁移至 Redis（`CacheConfig` 替换 Manager 即可，domain 零改动）
- [ ] 补充 Feed / Note / Project / TeamProfile 接口集成测试
- [ ] 前端 TeamView 对接 `/team-profile/*`（后端已实现，见 `API-1.md` §03）
- [ ] 可选：将 `SpaceService` 对卡片 Assembler 的依赖上提到 `application` 编排层
