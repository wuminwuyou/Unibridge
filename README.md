# UniBridge Web Client

UniBridge（校园共创与商业项目平台）Web 前端应用。基于 FSD（Feature-Sliced Design）六层架构重构，源码位于 `src_refactored/`，通过 `vite.config.ts` 中的 `USE_REFACTORED` 开关可在新旧架构间切换。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19.2 |
| 类型系统 | TypeScript 6.0 |
| 构建工具 | Vite 8.0 |
| 样式方案 | Tailwind CSS 4.3 + `@tailwindcss/typography` |
| 路由 | React Router 7.15 |
| 服务端状态 | `@tanstack/react-query` 5.101 |
| 虚拟滚动 | `@tanstack/react-virtual` 3.14 |
| HTTP 客户端 | Axios 1.16 |
| 图标库 | Lucide React 1.16 |
| Markdown 编辑器 | Milkdown 7.21（commonmark / GFM / tooltip / listener / nord 主题） |
| Markdown 编辑器备选 | md-editor-rt 6.5 |
| 视频播放器 | ArtPlayer 5.4 |
| 代码高亮 | highlight.js 11.11 |
| 加密工具 | crypto-js 4.2 |
| Lint | ESLint 9（flat config）+ typescript-eslint + react-hooks + react-refresh |
| 包管理 | pnpm（monorepo workspace） |

---

## 环境要求

- **Node.js** >= 18（推荐 20 LTS）
- **pnpm** >= 8
- 后端 API 服务需在 `localhost:8081` 运行

---

## 快速开始

### 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

### 环境变量

项目根目录 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8081/api/v1/client
```

### 启动开发服务器

```bash
pnpm --filter web-client dev
```

开发服务器运行在 **http://localhost:5173**，端口固定。

### 构建生产版本

```bash
pnpm --filter web-client build
```

构建产物输出到 `dist/`。

### 预览生产构建

```bash
pnpm --filter web-client preview
```

---

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（HMR） |
| `npm run build` | TypeScript 类型检查 + Vite 生产构建 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run preview` | 本地预览生产构建 |

---

## 新旧架构切换

`vite.config.ts` 中的 `USE_REFACTORED` 变量控制源码目录：

```typescript
const USE_REFACTORED = true   // true → src_refactored/（FSD 架构）
                              // false → src/（旧技术分层架构）
```

所有路径别名（`@app`、`@pages`、`@widgets`、`@features`、`@entities`、`@shared`）跟随切换。

---

## 核心路由表

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/` | 首页 | 否 |
| `/projects` | 商业项目专区 | 否 |
| `/projects/campus` | 校园共创 | 否 |
| `/projects/:id` | 项目详情 | 是 |
| `/projects/create` | 发布项目 | 是 |
| `/notes` | 笔记分享 | 否 |
| `/notes/:id` | 笔记详情 | 否 |
| `/notes/editor` | 笔记编辑 | 是 |
| `/login` | 登录页 | 否 |
| `/profile`, `/profile/:profileTab` | 个人空间 | 否 |
| `/team`, `/team/:teamTab`, `/team/:teamTab/:teamSubTab` | 团队空间 | 否 |
| `/org`, `/org/:orgTab` | 机构空间 | 否 |
| `/verify`, `/verify/organization` | 机构认证 | 是 |
| `/messages` | 即时通讯 | 是 |
| `*` | 404 | 否 |

旧路径（`/project-detail`、`/note`、`/publish/note` 等）已通过 Legacy Redirects 转发至新规范路径。

---

## FSD 架构设计要点

### 六层依赖规则

```
app → pages → widgets → features → entities → shared
```

上层可依赖下层，下层禁止导入上层。跨层导入须通过各 slice 的 `index.ts` 公开接口。

### Provider 层级

```
QueryClientProvider
  └── AuthProvider          → 全局认证状态
      └── ThemeProvider     → 明暗主题管理
          └── RouterProvider → React Router 路由
```

### Pages — 极薄路由入口

每个页面文件仅导入一个 Widget，直接渲染。**零 API 调用、零业务状态、零业务条件判断。**

### Widgets — 业务区块组装器

组合多个 entities 和 features 形成完整用例区块。通过 `hooks/` 数据统筹，以 Props 或 Slot 形式注入底层 Entity 卡片。

### Entities — 业务实体纯展示

卡片组件为纯净展示组件，交互通过 Props 回调注入（Slot 模式），卡片自身禁止 import 任何 feature 或 widget。内部结构：`api/`（业务 API）、`model/`（类型 + 数据 Hook）、`ui/`（纯展示组件）、`lib/`（工具函数）。

### Features — 用户交互动作

抽离交互逻辑与交互按钮（表单提交、筛选切换、团队管理等），可被多个 Widget 复用。

### Shared — 基础设施

与业务完全解耦的底层工具：Axios 客户端（Token 刷新队列）、通用 UI 组件、通用 Hooks、类型定义、纯函数工具。

### 路径别名

```typescript
'@app'      → 'src_refactored/app'
'@pages'    → 'src_refactored/pages'
'@widgets'  → 'src_refactored/widgets'
'@features' → 'src_refactored/features'
'@entities' → 'src_refactored/entities'
'@shared'   → 'src_refactored/shared'
'@'         → 'src_refactored'
```

---

## 关键设计要点

### API 层

- **Token 刷新队列**：多个请求同时收到 401 时，仅触发一次 refresh，其余排队重试（`shared/api/http.ts`）
- **发布表单草稿**：切换 tab 时自动保存到 sessionStorage
- **点赞/浏览埋点**：fire-and-forget 模式上报

### 认证体系

- 个人账号注册/登录（密码、短信验证码）
- 机构凭证 + OTP / TOTP 双因素登录
- Token 持久化在 localStorage，通过 AuthProvider 注入全局
- 认证事件通过 `authEvents.ts` 全局广播

### 主题方案

- 内联 `<script>` 在 HTML 中预加载主题，避免 FOUC
- localStorage 持久化用户主题偏好
- 默认跟随系统 `prefers-color-scheme`，支持 View Transition 动画切换

### 合成层渲染优化

- 首页项目卡片引入虚拟滚动（`@tanstack/react-virtual`）
- 所有卡片添加 `contain: layout style paint` + `will-change: transform`
- 虚拟滚动容器添加 `contain: layout style`

---

## API 文档

- 全量 API 契约：[`API.md`](./API.md)
- 待办 API 增量需求：[`API-request.md`](./API-request.md)

---

## 重构完成情况

| 模块 | 状态 |
|------|------|
| `pages/` — 全量页面入口（15 个路由） | ✅ 已完成 |
| `widgets/` — 核心 Widget（10 个） | ✅ 已完成 |
| `features/` — 核心 Feature（7 个） | ✅ 已完成 |
| `entities/` — 核心 Entity（7 个） | ✅ 已完成 |
| `shared/` — 基础设施（http、hooks、ui、lib） | ✅ 已完成 |
| Phase 1 — 虚拟滚动 | ✅ 已完成 |
| Phase 2 — 合成层优化 | ✅ 已完成 |
| Phase 3 — 乐观更新 + 读写分离 | ⏳ 待执行 |
| Phase 4 — React 19 并发特性 | ⏳ 待执行 |
| 旧 `src/` 完全下线 | ⏳ 待完成 |

---

## 注意事项

- **双 ID / uid**：客户端仅使用对外 `uid`（项目 `PR`+11 位，笔记 `TX`/`VD`+11 位），禁止使用自增数字 `id`
- **字段命名**：所有 API 字段使用 `camelCase`
- **Milkdown 预构建**：`vite.config.ts` 中已加入 `optimizeDeps.include`，避免开发模式 504 错误
- **新旧架构切换**：`USE_REFACTORED = true` 使用 FSD 架构，设为 `false` 回退到旧 `src/`
