# SciBlock 项目 Docker Compose 方案设计

## 项目架构概览

SciBlock 是一个全栈科研笔记管理平台，采用微服务架构，包含以下组件：

1. **前端 (web)** – React + TypeScript + Vite，运行在端口 22333（开发模式）
2. **Express API 服务 (api-server)** – Node.js + Express，运行在端口 8080，负责用户管理、团队、消息等业务逻辑，并反向代理部分请求到 Go API
3. **Go API 服务 (go-api)** – Go + Chi，运行在端口 8082，负责 SciNote、实验记录等核心科研数据的 CRUD
4. **数据库 (PostgreSQL)** – 共享数据库，两个后端服务连接同一个 PostgreSQL 实例
5. **缓存 (Redis，可选)** – 目前仅在 Go API 代码中预留，用于未来会话失效等功能

### 服务间通信

- 前端通过相对路径 `/api/*` 调用 Express API
- Express 根据配置的 `GO_API_PREFIXES` 将 `/api/scinotes/**`、`/api/experiments/**`、`/api/auth/**` 等路径反向代理到 Go API（通过 `http-proxy-middleware`）
- Go API 直接访问数据库，Express 也直接访问数据库（部分表如 users、students、messages 等）

### 数据迁移

- **Drizzle 迁移** – 管理 Express 相关的表（users、students、papers、weekly_reports、report_comments、messages），位于 `lib/db/migrations/`
- **Goose 迁移** – 管理 Go 后端表（scinotes、experiment_records 等），位于 `artifacts/go-api/internal/db/migrations/`

迁移脚本 `scripts/migrate.sh` 可同时运行两者。

## Docker Compose 设计目标

将所有服务容器化，实现一键启动开发环境，同时保持与现有脚本的兼容性。

### 服务清单

| 服务名 | 镜像 | 端口暴露 | 说明 |
|--------|------|----------|------|
| postgres | postgres:16 | 5432 | 主数据库 |
| redis | redis:7-alpine | 6379 | 缓存（可选） |
| go-api | 自定义 Dockerfile | 8082 | Go API 服务 |
| api-server | 自定义 Dockerfile | 8080 | Express API 服务 |
| web | 自定义 Dockerfile | 22333 | 前端开发服务器（或生产静态文件） |
| nginx | nginx:alpine | 80 | 反向代理（可选，简化路由） |

### 网络拓扑

```mermaid
graph TB
    Browser[浏览器]
    subgraph Docker Compose 网络
        Nginx[Nginx:80]
        Web[Web 容器:22333]
        Express[Express 容器:8080]
        Go[Go 容器:8082]
        Postgres[(PostgreSQL)]
        Redis[(Redis)]
    end

    Browser -->|访问 localhost:80| Nginx
    Nginx -->|/| Web
    Nginx -->|/api/| Express
    Express -->|代理 /api/scinotes 等| Go
    Express --> Postgres
    Go --> Postgres
    Go -.->|可选| Redis
```

### 环境变量配置

每个服务需要以下环境变量（示例值）：

**共享变量**
- `DATABASE_URL=postgresql://sciblock:password@postgres:5432/sciblock`
- `JWT_SECRET=change-me-use-openssl-rand-hex-32`
- `CORS_ORIGINS=http://localhost:80`（或前端开发服务器地址）

**Go API 专用**
- `PORT=8082`
- `ENV=development`
- `AUTO_MIGRATE=true`（开发环境自动迁移）
- `JWT_EXPIRY_HOURS=168`
- `BCRYPT_COST=12`

**Express API 专用**
- `PORT=8080`
- `NODE_ENV=development`
- `ADMIN_SECRET=sciblock-admin-dev`
- `GO_API_URL=http://go-api:8082`
- `AI_PROVIDER=qianwen`（可选）

**前端专用**
- `PORT=22333`
- `BASE_PATH=/`
- `VITE_API_BASE_URL=`（留空，使用相对路径）

### 数据卷

- `postgres_data` – PostgreSQL 数据持久化
- `redis_data` – Redis 数据持久化（可选）
- 源代码挂载为只读卷，用于开发热重载（或构建时复制）

## Dockerfile 设计要点

### Go API Dockerfile
- 基于 `golang:1.25-alpine`，多阶段构建
- 复制 `go.mod`、`go.sum`，下载依赖
- 复制源代码，构建二进制
- 运行 `go run cmd/server/main.go`（开发）或直接运行二进制（生产）

### Express API Dockerfile
- 基于 `node:20-alpine`
- 复制 `package.json`、`pnpm-lock.yaml`，使用 pnpm 安装依赖
- 复制源代码
- 启动命令 `pnpm run dev`（开发）或 `node dist/index.cjs`（生产）

### Web Dockerfile
- 基于 `node:20-alpine`
- 安装依赖，构建静态文件
- 使用 `serve` 或 `nginx` 提供静态文件服务（生产）
- 开发模式：挂载源代码，运行 `pnpm run dev` 并暴露端口 22333

## 迁移执行策略

**方案A：** 利用 `AUTO_MIGRATE=true` 让 Go API 在启动时自动执行 goose 迁移；Express 服务启动前通过独立迁移容器运行 Drizzle 迁移。

**方案B：** 统一使用一个 `migration` 容器，在数据库就绪后执行 `scripts/migrate.sh all`，之后启动所有服务。

推荐方案A，因为更符合现有配置。

## 待解决的问题

1. **前端路由** – 生产环境需要 Nginx 配置 `try_files` 支持 SPA 路由；开发环境可直接使用 Vite 开发服务器。
2. **服务发现** – 容器间通过服务名（如 `postgres`、`go-api`）通信。
3. **环境变量管理** – 使用 `.env` 文件统一注入，避免硬编码。
4. **热重载** – 开发环境下将源代码挂载为卷，使 Node.js/Go 服务支持代码变更自动重启。

## 下一步行动

1. 创建 `docker-compose.yml` 文件
2. 为每个服务编写 Dockerfile
3. 编写环境变量示例文件 `.env.docker.example`
4. 编写本地启动指南
5. 测试并优化

此方案将提供一个完整的、可移植的 SciBlock 开发环境，适合新成员快速上手和本地调试。