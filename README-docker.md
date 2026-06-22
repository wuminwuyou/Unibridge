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

