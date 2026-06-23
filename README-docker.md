# UnibridgeBackend Docker 启动说明

## 识别到的项目结构与依赖

项目技术栈：

- Spring Boot 3.5.13
- Java 21
- Maven
- MyBatis Plus 3.5.15
- MySQL 8.x
- Redis 7.x / Redisson 3.40.2

服务端口：

- 后端应用：`8081`
- MySQL：`3306`
- Redis：`6379`

关键配置：

- 默认 profile：`dev`
- Docker profile：`docker`
- Docker 专用配置文件：`src/main/resources/application-docker.properties`
- Docker Compose 中应用通过服务名连接依赖：`mysql:3306`、`redis:6379`

## 文件说明

- `Dockerfile`：生产可用的多阶段构建镜像，最终运行阶段使用 `eclipse-temurin:21-jre-alpine`。
- `docker-compose.yml`：编排 MySQL、Redis、后端应用。
- `.env.example`：环境变量模板，复制为 `.env` 后按需修改。
- `.dockerignore`：排除本地构建产物、日志、Git、IDE 文件等。
- `src/main/resources/application-docker.properties`：Docker 环境专用 Spring profile。

## Windows / Linux 通用启动

### 1. 准备环境变量

Windows PowerShell：

```powershell
copy .env.example .env
```

Linux / macOS：

```bash
cp .env.example .env
```

### 2. 启动全部服务

```bash
docker compose --profile full up -d --build
```

首次启动会自动完成：

1. 拉取 MySQL 和 Redis 镜像。
2. 使用 `db.sql` 初始化数据库。
3. 构建后端应用镜像。
4. 等待 MySQL / Redis 健康检查通过。
5. 使用 `docker` profile 启动后端应用。

访问：

```text
http://localhost:8081
```

Swagger UI：

```text
http://localhost:8081/swagger-ui.html
```

## 开发模式

如果你希望在 IDE 中运行后端，只用 Docker 启动依赖服务：

```bash
docker compose up -d
```

然后在本机运行：

Windows PowerShell：

```powershell
.\mvnw.cmd spring-boot:run
```

Linux / macOS：

```bash
./mvnw spring-boot:run
```

此模式使用 `dev` profile，连接宿主机端口：

- `localhost:3306`
- `localhost:6379`

## 导入测试数据

容器环境中的数据库已通过 `db.sql` 完成建表，但默认**不包含测试业务数据**。

### 方式一：通过 docker compose cp + exec 导入（推荐，跨平台通用）

```bash
# 1. 将 SQL 文件复制到容器内
docker compose cp insert-test-data.sql mysql:/tmp/insert-test-data.sql

# 2. 在容器内执行导入（避免宿主编码差异导致的中文乱码）
docker compose exec mysql bash -c "mysql -uroot -p111111 --default-character-set=utf8mb4 project_cooperation_platform < /tmp/insert-test-data.sql"

# 3. 清理容器内的临时文件
docker compose exec mysql rm /tmp/insert-test-data.sql
```

> **说明：** PowerShell 的 `Get-Content | docker compose exec` 管道在中文字符场景下会导致编码错误（如 `'????' for key 'uk_xxx_name'`）。上述方式将文件直接复制到容器内执行，完全绕过宿主编码问题，Windows / Linux / macOS 通用。

导入完成后会写入以下测试数据：

| 表 | 行数 | 说明 |
|---|---|---|
| `t_tenant_organization` | 3 | 机构 |
| `t_user` | 3 | 用户 |
| `t_team` | 3 | 团队 |
| `t_project` | 3 | 项目 |
| `t_user_note` | 10 | 笔记（支撑 Feed 换一换联调） |

测试账号（密码均为 `123456` 的 SHA256）：

| 用户 | 手机号 | 邮箱 | 角色 |
|---|---|---|---|
| US00000000001 | 13800001001 | zhangming@test.com | 学生 |
| US00000000002 | 13800001002 | limentor@test.com | 导师 |
| US00000000003 | 13800001003 | wangpm@tencent.com | 企业 PM |

### 方式二：宿主机有 mysql 客户端

容器 MySQL 的 3306 端口已映射到宿主机，可直接用本地 mysql 客户端连接：

```bash
mysql -h127.0.0.1 -P3306 -uroot -p111111 project_cooperation_platform < insert-test-data.sql
```

### 验证导入

```bash
docker compose exec mysql mysql -uroot -p111111 -e "SELECT COUNT(*) AS note_count FROM project_cooperation_platform.t_user_note;"
```

预期输出 `note_count: 10`。

## 常用命令

查看服务状态：

```bash
docker compose ps
```

查看应用日志：

```bash
docker compose logs -f app
```

停止全部服务：

```bash
docker compose --profile full down
```

停止并清理数据卷（会删除数据库和 Redis 数据）：

```bash
docker compose --profile full down -v
```

重新构建应用镜像：

```bash
docker compose --profile full build --no-cache app
```

## 环境变量

可在 `.env` 中修改：

```properties
MYSQL_ROOT_PASSWORD=111111
REDIS_PASSWORD=f31ae273df314d
MYSQL_PORT=3306
REDIS_PORT=6379
APP_PORT=8081
APP_IMAGE_TAG=latest
FILE_PUBLIC_BASE_URL=http://localhost:8081
JAVA_OPTS=-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC
```

端口被占用时，修改宿主机映射端口即可。例如：

```properties
MYSQL_PORT=13306
REDIS_PORT=16379
APP_PORT=18081
FILE_PUBLIC_BASE_URL=http://localhost:18081
```

## 生产部署建议

- 修改 `.env` 中的默认密码。
- 不要提交 `.env` 到 Git。
- 根据服务器内存调整 `JAVA_OPTS`。
- 使用外部持久化存储或定期备份 Docker volume。
- 如部署在公网，建议通过 Nginx / HTTPS 反向代理暴露 `8081`。

