# UnibridgeBackend

## 快速运行脚本（Windows PowerShell）

先初始化数据库（建库 + 导入 `db.sql` + 校验）：

```powershell
powershell -ExecutionPolicy Bypass -File .\init-db.ps1
```

如果本机 MySQL 密码不是 `111111`：

```powershell
powershell -ExecutionPolicy Bypass -File .\init-db.ps1 -MySqlPassword "<你的密码>"
```

一键启动后端（默认 `dev` 环境）：

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

使用 `prod` 环境启动：

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1 -Profile prod
```

UnibridgeBackend 是 UniBridge（产学研合作平台）的后端服务，基于 **Spring Boot 3.5.x** 构建，使用 **MyBatis Plus** 操作 **MySQL** 数据，使用 **JWT** 进行多角色鉴权，统一以 RESTful 接口对接 `apps/web-admin` 管理端与用户/主体端。

接口规范详见仓库根目录的 [`API.md`](./API.md)。

---

## 1. 技术栈

| 类型 | 选型 | 版本 |
| --- | --- | --- |
| 语言 | Java | 21 |
| 框架 | Spring Boot | 3.5.13 |
| Web | spring-boot-starter-web | 跟随 Boot |
| ORM | MyBatis Plus (Boot3 Starter) | 3.5.15 |
| 数据库 | MySQL | 8.x（驱动 `mysql-connector-j`） |
| 鉴权 | JJWT (`io.jsonwebtoken`) | 0.11.5 |
| 代码增强 | Lombok | 跟随 Boot |
| 构建 | Maven (含 `mvnw` Wrapper) | - |
| 测试 | spring-boot-starter-test / JUnit Jupiter / WebFlux (`WebTestClient`) | 跟随 Boot |

> JDK 要求：**Java 21+**。

---

## 2. 项目结构

```
UnibridgeBackend/
├── pom.xml                          # Maven 构建配置
├── mvnw / mvnw.cmd                  # Maven Wrapper
├── API.md                           # 管理端接口文档（统一约定、分页、鉴权规则、业务接口）
├── README.md
└── src/
    └── main/
        ├── java/com/example/demo/
        │   ├── DemoApplication.java          # Spring Boot 启动入口
        │   ├── admin/                        # admin 领域（已隔离）
        │   │   ├── controller/
        │   │   │   ├── AdminAuthController.java  # /api/v1/admin/login
        │   │   │   └── AdminController.java      # /api/v1/admin 业务接口
        │   │   ├── service/
        │   │   │   └── AdminAuthService.java
        │   │   ├── dto/
        │   │   │   └── AdminLoginRequest.java
        │   │   ├── entity/
        │   │   │   └── SystemAdmin.java
        │   │   └── mapper/
        │   │       └── SystemAdminMapper.java
        │   ├── client/                       # client 领域（登录/注册接口）
        │   │   ├── controller/
        │   │   │   └── ClientAuthController.java
        │   │   ├── service/
        │   │   │   └── ClientAuthService.java
        │   │   ├── dto/
        │   │   │   ├── PersonalRegisterRequest.java
        │   │   │   ├── PersonalPasswordLoginRequest.java
        │   │   │   ├── PersonalSmsLoginRequest.java
        │   │   │   ├── PersonalEmailLoginRequest.java
        │   │   │   ├── SendCodeRequest.java
        │   │   │   ├── OrganizationCredentialLoginRequest.java
        │   │   │   ├── OrganizationOtpLoginRequest.java
        │   │   │   ├── RegisterResponse.java
        │   │   │   ├── LoginResponse.java
        │   │   │   ├── SendCodeResponse.java
        │   │   │   └── OrganizationCredentialResponse.java
        │   │   ├── entity/
        │   │   │   ├── ClientUser.java
        │   │   │   ├── ClientEntity.java
        │   │   │   └── UserAuthLink.java
        │   │   └── mapper/
        │   │       ├── ClientUserMapper.java
        │   │       ├── ClientEntityMapper.java
        │   │       └── UserAuthLinkMapper.java
        │   ├── common/
        │   │   └── Result.java               # 统一响应结构 {code, message, data}
        │   ├── config/
        │   │   └── WebConfig.java            # 全局 CORS 配置
        │   ├── controller/
        │   │   └── AuthController.java       # /api/v1 用户/主体登录、登出
        │   ├── service/
        │   │   └── AuthService.java          # 用户/主体登录、登出逻辑
        │   ├── entity/                       # 数据库实体（MyBatis Plus）
        │   │   ├── User.java                 # user（个人账号）
        │   │   └── Entity.java               # entity（主体：高校/企业）
        │   ├── mapper/                       # MyBatis Plus Mapper
        │   │   ├── UserProfileMapper.java
        │   │   └── EntityMapper.java
        │   ├── dto/                          # 请求 / 响应 DTO
        │   │   ├── UserLoginRequest.java
        │   │   ├── EntityLoginRequest.java
        │   │   ├── UserRegisterRequest.java
        │   │   ├── EntityCreateRequest.java
        │   │   └── LoginResponse.java
        │   ├── util/
        │   │   └── JwtUtil.java              # JWT 生成 / 解析 / 校验
        │   └── exception/
        │       └── GlobalExceptionHandler.java  # 全局异常 → 401 / 403 / 500
        └── resources/
            ├── application.properties        # 基础配置（端口、profile、MyBatis Plus）
            ├── application-dev.properties    # 开发环境数据源
            └── application-prod.properties   # 生产环境数据源
```

---

## 3. 模块说明

### 3.1 启动入口

`com.example.demo.DemoApplication` 使用 `@SpringBootApplication` 启动，默认监听端口 **8081**（见 `application.properties`）。

### 3.2 统一响应：`common/Result`

所有接口返回统一结构：

```json
{ "code": 200, "message": "success", "data": {} }
```

提供工厂方法：`success`、`error`、`unauthorized`（401）、`forbidden`（403），与 `API.md` 中的「通用约定」一一对应。

### 3.3 鉴权：`util/JwtUtil`

- HS256 签名，密钥内置（建议生产环境通过外部配置注入），有效期 **7 天**。
- Token 中携带 `userId`、`userType`（`ADMIN` / `USER` / `ENTITY`）、`authLevel`。
- 提供 `generateToken / parseToken / validateToken / getUserId / getUserType / getAuthLevel`。

### 3.4 控制器

- `AuthController`（`/api/v1`）
  - `POST /admin/login`：管理员登录
  - `POST /user/login`：用户登录
  - `POST /entity/login`：主体（高校/企业）登录
  - `POST /logout`：登出，按 `userType` 清理 `last_login_at`

- `AdminController`（`/api/v1/admin`）
  - 主体：`GET /entities/list`、`GET /entities/{id}`、`POST /entities`、`PUT /entities/{id}`、`DELETE /entities/{id}`
  - 用户：`GET /users/list`、`GET /users/{id}`、`POST /users`、`PUT /users/{id}`、`DELETE /users/{id}`
  - 所有接口均先做 `validateToken` → `checkAuth(requiredLevel)`：
    - 列表 / 详情：`auth_level >= 1`
    - 新增 / 修改 / 删除：`auth_level >= 2`

### 3.5 服务层：`AuthService`

- `adminLogin`：按 `system_admin.id + password_hash` 校验，更新 `last_login_at`，签发携带 `authLevel` 的 JWT。
- `userLogin`：按 `userProfile.phone + password_hash` 校验，签发 `USER` 类型 JWT。
- `entityLogin`：按 `entity.name` 校验，要求 `audit_status = APPROVED`，签发 `ENTITY` 类型 JWT。
- `logout`：按 `userType` 分支重置 `last_login_at`。

### 3.6 数据层

实体均通过 MyBatis Plus 注解映射，`map-underscore-to-camel-case=true` 自动完成 `snake_case ↔ camelCase` 映射：

| 实体 | 表名 | 主键策略 |
| --- | --- | --- |
| `SystemAdmin` | `system_admin` | `IdType.INPUT`（管理员账号字符串） |
| `UserProfile` | `userProfile` | `IdType.AUTO` |
| `Entity` | `entity` | `IdType.AUTO` |

Mapper 均继承 `BaseMapper<T>`，无需手写 SQL 即可获得 CRUD + 分页（`Page<T>` + `LambdaQueryWrapper<T>`）。

### 3.7 异常处理

`GlobalExceptionHandler` 拦截 `RuntimeException`：

- 异常信息包含「未授权」或「token错误」→ HTTP 业务码 **401**
- 异常信息包含「权限不足」→ HTTP 业务码 **403**
- 其他 → 业务码 **500**

### 3.8 跨域

`WebConfig` 开放以下前端来源（典型 React 开发端口）：

```
http://localhost:3000
http://localhost:5173
http://localhost:5174
```

允许方法：`GET / POST / PUT / DELETE / OPTIONS`；允许 Header：`Content-Type`、`Authorization`；`allowCredentials = true`。

---

## 4. 环境配置

### 4.1 基础配置（`src/main/resources/application.properties`）

```properties
spring.application.name=demo
server.port=8081
spring.profiles.active=dev

mybatis-plus.configuration.map-underscore-to-camel-case=true
mybatis-plus.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl
mybatis-plus.global-config.db-config.id-type=auto
```

### 4.2 开发环境（`application-dev.properties`）

- 数据源：`jdbc:mysql://localhost:3306/project_cooperation_platform`
- 用户名 / 密码：`root` / `111111`

### 4.3 生产环境（`application-prod.properties`）

- 数据源：`jdbc:mysql://60.205.143.96:3306/project_cooperation_platform`
- 用户名 / 密码：`project_cooperation_platform` / `111111`

> 切换环境：修改 `spring.profiles.active=dev|prod`，或在启动时使用 `--spring.profiles.active=prod` 覆盖。

### 4.4 数据库

请提前在目标 MySQL 中创建数据库（默认名）：

```sql
CREATE DATABASE IF NOT EXISTS project_cooperation_platform
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

并建立 `system_admin`、`userProfile`、`entity` 等表（字段参见 `API.md` 与 `entity/` 下实体定义）。

---

## 5. 快速开始

### 5.1 前置条件

- JDK 21+
- MySQL 8.x（已创建上述数据库）
- 端口 `8081` 未被占用

### 5.2 拉取依赖与编译

Windows（PowerShell）：

```powershell
.\mvnw.cmd clean package -DskipTests
```

Linux / macOS：

```bash
./mvnw clean package -DskipTests
```

### 5.3 启动项目

开发模式（默认 `dev` profile）：

```powershell
.\mvnw.cmd spring-boot:run
```

或直接运行打包产物：

```powershell
java -jar target\demo-0.0.1-SNAPSHOT.jar
```

切换到生产环境：

```powershell
java -jar target\demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

启动成功后，服务监听：

```
http://localhost:8081
```

接口基础路径：`/api/v1`（管理端业务为 `/api/v1/admin`）。

### 5.4 冒烟测试：管理员登录

```bash
curl -X POST http://localhost:8081/api/v1/admin/login ^
     -H "Content-Type: application/json" ^
     -d "{\"adminId\":\"admin_master\",\"passwordHash\":\"<前端 SHA256 哈希>\"}"
```

成功响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "<jwt>",
    "authLevel": 3,
    "userId": "admin_master",
    "userType": "ADMIN"
  }
}
```

后续请求带上：

```
Authorization: Bearer <jwt>
```

---

## 6. 鉴权与权限速查

| 等级 `auth_level` | 含义 | 主要可调用接口 |
| --- | --- | --- |
| 1 | 普通审计 | 列表 / 详情类 GET |
| 2 | 高级管理 | 主体 / 用户的新增（POST） |
| 3 | 超级管理员 | 管理员相关管理接口（参见 `API.md`） |

错误码：

- `401`：未携带 token / token 失效 / token 错误
- `403`：权限不足
- `500`：服务端运行时异常（统一由 `GlobalExceptionHandler` 兜底）

---

## 7. 开发约定

1. **数据库字段命名** 使用 `snake_case`，Java 字段使用 `camelCase`，依赖 MyBatis Plus 自动映射，禁止手动重命名表字段以匹配 Java 习惯。
2. **统一返回** 必须通过 `Result.success / Result.error` 等工厂方法，不直接返回裸数据。
3. **鉴权位置** 业务接口在进入业务逻辑前调用 `validateToken` + `checkAuth`，禁止漏校验。
4. **密码** 一律存储为前端 SHA256 哈希结果（`password_hash`），后端不参与明文处理；接口响应**严禁返回 `password_hash`**。
5. **时间字段** `created_at` / `updated_at` / `audited_at` 等由后端用服务器时间填充，前端不传。
6. **新增接口** 请同步更新 `API.md`，保持前后端契约一致。

---

## 8. 常用命令

```powershell
.\mvnw.cmd clean                  # 清理 target
.\mvnw.cmd compile                # 仅编译
.\mvnw.cmd test                   # 运行单测
.\mvnw.cmd package -DskipTests    # 打 jar（跳过测试）
.\mvnw.cmd spring-boot:run        # 本地运行（dev profile）
```

---

## 9. TODO / 待补充

- [ ] 接入更安全的 JWT 密钥来源（环境变量 / Vault），移除硬编码
- [ ] 完善 `API.md` 中除登录、主体、用户之外模块（实验室、团队、项目、里程碑、任务卡、成就归档、管理员）对应的 Controller / Service / Mapper 实现
- [ ] 增加单元测试与接口集成测试（已引入 `spring-boot-starter-test` 与 `WebTestClient`）
- [ ] 引入统一日志、请求链路追踪与全局参数校验（`spring-boot-starter-validation`）
