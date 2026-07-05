# UniBridge Web Client

UniBridge（校园共创与商业项目平台）Web 前端应用，基于 React 19 + TypeScript + Vite 8 + Tailwind CSS 4 构建。当前处于 FSD（Feature-Sliced Design）架构重构阶段，源码位于 `src_refactored/`，可通过 `vite.config.ts` 中的 `USE_REFACTORED` 开关在旧架构与新架构之间切换。

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
| Markdown 编辑器 | Milkdown 7.21（含 commonmark / GFM / tooltip / listener / nord 主题） |
| Markdown 编辑器备选 | md-editor-rt 6.5 |
| 视频播放器 | ArtPlayer 5.4 |
| 代码高亮 | highlight.js 11.11 |
| 加密工具 | crypto-js 4.2 |
| Lint | ESLint 9（flat config）+ typescript-eslint + react-hooks + react-refresh |
| 包管理 | pnpm（monorepo workspace） |

---

## 环境要求

- **Node.js** >= 18（推荐 20 LTS）
- **pnpm** >= 8（monorepo 包管理器）
- 后端 API 服务需在 `localhost:8081` 运行

---

## 快速开始

### 1. 安装依赖

在仓库根目录（`D:/Unibridge`）执行：

```bash
pnpm install
```

### 2. 配置环境变量

项目根目录已有 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8081/api/v1/client
```

### 3. 启动开发服务器

```bash
pnpm --filter web-client dev
```

开发服务器默认运行在 **http://localhost:5173**，端口固定（`strictPort: true`）。

### 4. 构建生产版本

```bash
pnpm --filter web-client build
```

构建产物输出到 `dist/` 目录。

### 5. 预览生产构建

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

`vite.config.ts` 中的 `USE_REFACTORED` 变量控制使用哪个源码目录：

```typescript
const USE_REFACTORED = true   // true → 使用 src_refactored/（FSD 架构）
                               // false → 使用 src/（旧技术分层架构）
```

所有路径别名（`@app`、`@pages`、`@widgets`、`@features`、`@entities`、`@shared`）会跟随切换。

---

## 项目文件结构（FSD 架构 — `src_refactored/`）

```
web-client/
├── index.html
├── package.json
├── vite.config.ts              # Vite 配置 + 新旧架构切换开关
├── tsconfig.json               # TypeScript 项目引用
├── tsconfig.app.json           # 源码路径与别名配置
├── tsconfig.node.json          # Vite 配置文件 TS 配置
├── eslint.config.js            # ESLint 9 flat 配置
├── .gitignore
├── public/                     # 静态资源
└── src_refactored/             # FSD 六层架构源码
    │
    ├── app/                    # ── 01）应用入口层 ──
    │   ├── main.tsx            # React 挂载入口（QueryClient + Providers）
    │   ├── App.tsx             # 路由表定义（createBrowserRouter + lazy）
    │   ├── index.css           # 全局样式（Tailwind 指令 + CSS 变量）
    │   ├── providers/          # 全局 Provider
    │   │   ├── AuthProvider.tsx      # 认证状态（user / token / login / logout）
    │   │   ├── ThemeProvider.tsx     # 明暗主题切换
    │   │   └── ProfileMenuProvider.tsx # 用户菜单数据
    │   └── routes/             # 路由守卫 + 旧路径重定向
    │       ├── ProtectedRoute.tsx
    │       ├── legacyProjectRedirects.tsx
    │       └── legacyNoteRedirects.tsx
    │
    ├── pages/                  # ── 02）极薄页面入口层（≤ 50 行）──
    │   ├── home/index.tsx            # 首页（/）
    │   ├── project/
    │   │   ├── detail/index.tsx      # 项目详情（/projects/:id）
    │   │   ├── publish/index.tsx     # 发布项目（/projects/create）
    │   │   ├── commercial/index.tsx  # 商业项目（/projects）
    │   │   └── co-create/index.tsx   # 校园共创（/projects/campus）
    │   ├── note/
    │   │   ├── share/index.tsx       # 笔记分享（/notes）
    │   │   ├── publish/index.tsx     # 发布笔记（/notes/create）
    │   │   └── reader/index.tsx      # 笔记详情（/notes/:id）
    │   ├── profile-space/
    │   │   ├── personal/index.tsx    # 个人空间（/profile）
    │   │   ├── team/index.tsx        # 团队空间（/team）
    │   │   └── organization/index.tsx # 机构空间（/org）
    │   ├── auth/
    │   │   ├── login/index.tsx       # 登录页（/login）
    │   │   └── verify/index.tsx      # 机构认证（/verify）
    │   ├── im/index.tsx              # 即时通讯（/messages）
    │   └── not-found/index.tsx       # 404
    │
    ├── widgets/                # ── 03）业务区块组装层 ──
    │   ├── home-feed/                # 首页 Feed（虚拟滚动项目卡 + 笔记侧栏）
    │   ├── top-navbar/               # 全局顶部导航栏（品牌/菜单/用户/主题）
    │   ├── project-detail/           # 项目详情主体（Hero、侧栏、正文阅读器）
    │   ├── project-publish/          # 项目发布表单（多步骤/草稿自动保存）
    │   ├── project-channel/          # 项目频道浏览
    │   ├── note-feed/                # 笔记列表
    │   ├── note-detail/              # 笔记详情阅读器
    │   ├── profile-space/            # 个人/团队/机构空间页壳
    │   ├── auth-modal/               # 认证弹窗（登录/注册/OTP）
    │   ├── online-editor/            # 在线 Markdown 编辑器
    │   └── im-layout/                # 即时通讯布局
    │
    ├── features/               # ── 04）用户交互层（动词）──
    │   ├── project-publish/          # 项目发布逻辑（表单字段/校验/提交/草稿）
    │   ├── note-publish/             # 笔记发布逻辑
    │   ├── feed-filter/              # Feed 筛选交互（Tab/技术方向/排序）
    │   ├── auth-process/             # 认证流程（个人注册登录/机构凭证/OTP/TOTP）
    │   ├── profile-space/            # 空间路由解析与 Tab 导航
    │   ├── team-management/          # 团队/实验室管理（成员/实验室增删改）
    │   └── project-detail-editorial/ # 项目详情编辑预览横幅
    │
    ├── entities/               # ── 05）业务实体层（名词，纯展示）──
    │   ├── project/                  # 项目实体
    │   │   ├── api/                  # projectFeedApi + projectApi
    │   │   ├── model/                # 类型定义 + useHomeFeed + useProjectDetail
    │   │   ├── ui/                   # ProjectCard / ProjectDetailHero / PublisherCard / CooperationCard
    │   │   └── lib/                  # 工具函数（映射/校验/URL 解析）
    │   ├── note/                     # 笔记实体
    │   │   ├── api/                  # noteApi
    │   │   ├── model/                # 类型定义
    │   │   ├── ui/                   # GridNoteCard / RowNoteCard（图文/视频双变体）
    │   │   └── lib/                  # 卡片工具（格式化/文案）
    │   ├── user/                     # 用户实体
    │   ├── team/                     # 团队实体
    │   ├── organization/             # 机构实体
    │   ├── member/                   # 成员实体
    │   ├── editor/                   # 编辑器实体（ContentEditorType / Markdown 阅读核心）
    │   └── message/                  # 消息实体
    │
    └── shared/                 # ── 06）基础设施层（与业务解耦）──
        ├── api/
        │   ├── http.ts              # Axios 客户端（Token 注入/401 刷新队列/错误拦截）
        │   ├── resourceUid.ts       # 带类型的 UID 解析与校验
        │   └── recordFieldUtils.ts  # 字段读取工具
        ├── lib/
        │   ├── projectRoutes.ts     # 项目路由常量和路径构建
        │   ├── noteRoutes.ts        # 笔记路由常量和路径构建
        │   ├── tokenStorage.ts      # JWT localStorage 管理
        │   ├── authEvents.ts        # 认证事件总线
        │   ├── publishEntryNavigation.ts
        │   ├── publishSummary.ts    # Markdown 摘要提取
        │   ├── organizationSession.ts
        │   ├── crypto.ts            # 加密工具
        │   ├── fileMd5.ts           # 文件 MD5
        │   └── readVideoDuration.ts # 视频时长读取
        ├── hooks/
        │   ├── useAuth.ts           # 认证状态
        │   ├── useTheme.ts          # 主题切换
        │   ├── useActionCooldown.ts # 操作冷却/防连点
        │   ├── usePublishLeaveGuard.ts
        │   ├── usePublishEntryFreshFormKey.ts
        │   ├── useUserAvatarData.ts
        │   └── useDocumentTheme.ts
        ├── types/
        │   ├── project.ts           # 项目类型
        │   ├── level.ts             # 等级类型
        │   ├── api.ts               # API 工具类型
        │   └── loadState.ts         # 加载状态类型
        ├── constants/index.ts       # 全局常量
        ├── styles/                  # 共享页面样式
        └── ui/                      # 通用 UI 组件
            ├── MarkdownEditor/      # Markdown 编辑器
            ├── MarkdownReader/      # Markdown 内容阅读器
            ├── FormInput/等          # 表单输入组件
            ├── Chip/                # 标签芯片
            ├── Checklist/           # 清单组件
            ├── LevelBadge/          # 等级徽章
            ├── UserAvatar/          # 用户头像
            ├── IdentityBadge/       # 身份徽章
            ├── ProfileTabSection/   # 空间 Tab 外壳
            ├── FormSectionCard/     # 表单分段卡片
            ├── PublishFormSection/  # 发布表单区块
            ├── LoadingSpinner/      # 加载指示器
            ├── InfoPromptModal/     # 信息提示弹窗
            ├── VerifiedOrgModal/    # 认证机构标签
            └── CloseIconButton/     # 关闭按钮
```

---

## 核心路由表

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/` | 首页（HomePage） | 否 |
| `/projects` | 商业项目专区 | 否 |
| `/projects/campus` | 校园共创 | 否 |
| `/projects/:id` | 项目详情 | 是 |
| `/projects/create` | 发布项目 | 是 |
| `/notes` | 笔记分享 | 否 |
| `/notes/:id` | 笔记内容 | 否 |
| `/notes/create` | 发布笔记 | 是 |
| `/login` | 登录页 | 否 |
| `/profile`, `/profile/:profileTab` | 个人空间 | 否 |
| `/team`, `/team/:teamTab`, `/team/:teamTab/:teamSubTab` | 团队空间 | 否 |
| `/org`, `/org/:orgTab` | 机构空间 | 否 |
| `/verify`, `/verify/organization` | 机构认证 | 是 |
| `/messages` | 即时通讯 | 是 |
| `*` | 404 未找到 | 否 |

> 旧路径（如 `/project-detail`、`/note`、`/publish/note`）已通过 Legacy Redirects 转发至新规范路径。

---

## 架构设计要点

### FSD 六层依赖规则

```
app → pages → widgets → features → entities → shared
```

上层可依赖下层，下层禁止导入上层。跨层导入必须通过各 slice 的 `index.ts` 公开接口。

### Provider 层级

```
QueryClientProvider
  └── AuthProvider          → 全局认证状态
      └── ProfileMenuProvider → 用户菜单数据
          └── ThemeProvider    → 明暗主题管理
              └── RouterProvider → React Router 路由
```

### 页面设计（Pages 原则）

- 每个页面文件 **≤ 50 行**
- 仅导入一个 Widget + 外层布局 div → 直接渲染
- **零 API 调用、零业务状态、零业务条件判断**

### Widget 设计（数据编排者）

- 每个 Widget 通过 `hooks/` 中的自定义 Hook 统筹数据获取与分发
- 将数据以 Props 或 Slot（回调函数）形式注入底层 Entity 卡片
- Widget 负责"用例上下文闭环"，组合 entities + features 形成独立功能块

### Entity 设计（纯展示卡片）

- 卡片组件（`ProjectCard`、`GridNoteCard` 等）为**纯净展示组件**
- 交互通过 Props 回调注入（Slot 模式），卡片自身 **禁止 `import` 任何 feature 或 widget**
- 内部结构：`api/`（API 函数）、`model/`（类型定义 + 数据 Hook）、`ui/`（纯展示组件）、`lib/`（工具函数）

### Feature 设计（用户动作）

- 抽离交互逻辑与交互按钮（表单提交、筛选切换、团队管理等）
- 可被多个 Widget 复用

### Shared 设计（基础设施）

- 与业务完全解耦的底层工具
- 包含 `api/http.ts`（Axios 客户端 + Token 刷新队列）、通用 UI 组件、通用 Hooks、类型定义

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

### API 层设计要点

- **Token 刷新队列**：当多个请求同时收到 401 时，仅触发一次 refresh，其余请求排队等待后重试（`shared/api/http.ts`）
- **发布表单草稿**：Web 端在切换 tab 时自动保存到 sessionStorage，避免丢失未发布内容
- **点赞/浏览埋点**：使用 `fire-and-forget` 模式上报，不做异步等待

### 认证体系

- 支持个人账号注册/登录（密码、短信验证码）
- 支持机构凭证 + OTP / TOTP 双因素登录
- Token 持久化在 `localStorage`，通过 `AuthProvider` 注入全局
- 认证事件通过 `authEvents.ts` 全局广播（如强制登出、Token 更新）
- 需要登录的页面使用 `<ProtectedRoute>` 组件包裹

### 主题方案

- 内联 `<script>` 在 HTML 中预加载主题，避免 FOUC
- `localStorage` 持久化用户主题偏好
- 默认跟随系统 `prefers-color-scheme`

### 合成层渲染优化（Phase 1-2 已落地）

- 首页项目卡片引入虚拟滚动（`@tanstack/react-virtual`），`scrollElement = document.documentElement`
- 所有卡片（ProjectCard、GridNoteCard、RowNoteCard）添加 `contain: layout style paint` + `will-change: transform`
- 虚拟滚动容器添加 `contain: layout style`，限制重排范围
- 后续优化计划见 `rebuil-plan2.md`

---

## API 文档

- 全量 API 契约：[`API.md`](./API.md)
- 待办 API 增量需求：[`API-request.md`](./API-request.md)

---

## 重构状态

| 模块 | 状态 |
|------|------|
| `pages/` — 全量页面入口 | 已完成 |
| `widgets/` — 核心 Widget（home-feed、top-navbar、project-detail、auth-modal 等） | 已完成 |
| `features/` — 核心 Feature（project-publish、auth-process、feed-filter、profile-space 等） | 部分完成 |
| `entities/` — 核心 Entity（project、note、user、team、member） | 已完成 |
| `shared/` — 基础设施（http、hooks、ui、lib） | 已完成 |
| Phase 1 — 虚拟滚动 | 已完成 |
| Phase 2 — 合成层优化 | 已完成 |
| Phase 3 — 乐观更新 + 读写分离 | 待执行（依赖原页面迁移） |
| Phase 4 — React 19 并发特性 | 待执行 |
| 旧 `src/` 完全下线 | 待完成 |

---

## 注意事项

- **双 ID / uid**：客户端仅使用对外 `uid`（项目 `PR`+11 位，笔记 `TX`/`VD`+11 位），禁止使用自增数字 `id` 访问内容
- **字段命名**：所有 API 字段使用 `camelCase`
- **Milkdown 预构建**：`vite.config.ts` 中已将 Milkdown 系列包加入 `optimizeDeps.include`，避免开发模式 504 错误
- **新旧架构切换**：`USE_REFACTORED = true` 使用 FSD 架构，设为 `false` 回退到旧 `src/`
- **路径别名**：新旧架构共享同一套 `@app` / `@widgets` / … 别名，`vite.config.ts` 根据开关自动切换指向
