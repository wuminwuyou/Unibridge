# UniBridge Web Client

UniBridge（校园共创与商业项目平台）Web 前端应用，基于 React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 构建。提供项目/笔记的发布、浏览、管理、用户空间、机构管理、身份认证与认证码管理等完整业务功能。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19.2 |
| 类型系统 | TypeScript 6.0 |
| 构建工具 | Vite 8.0 |
| 样式方案 | Tailwind CSS 4.3 + `@tailwindcss/typography` |
| 路由 | React Router 7.15 |
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
- 后端 API 服务需在 `localhost:8081` 运行（参见下文 `.env` 配置）

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

如需修改后端地址，直接编辑该文件。**注意**：`VITE_` 前缀的变量才会暴露给客户端代码。

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
| `pnpm dev` | 启动 Vite 开发服务器（HMR） |
| `pnpm build` | TypeScript 类型检查 + Vite 生产构建 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm preview` | 本地预览生产构建 |

---

## 项目文件结构

```
web-client/
├── index.html                  # HTML 入口（含首屏主题预加载脚本）
├── package.json                # 项目依赖与脚本
├── vite.config.ts              # Vite 构建配置
├── tsconfig.json               # TypeScript 项目引用根配置
├── tsconfig.app.json           # 应用源码 TS 配置
├── tsconfig.node.json          # Vite 配置文件 TS 配置
├── eslint.config.js            # ESLint flat 配置
├── .env                        # 环境变量（API 地址）
├── .gitignore                  # Git 忽略规则
├── API.md                      # 全量 API 契约文档
├── API-request.md              # 前端待办 API 增量需求
├── TODO                        # 项目待办与开发计划
├── public/                     # 静态资源（favicon.svg）
├── scripts/                    # 辅助脚本
└── src/
    ├── main.tsx                # 应用入口（Provider 挂载）
    ├── App.tsx                 # 根组件（路由表定义）
    ├── index.css               # 全局样式（Tailwind 指令）
    │
    ├── api/                    # API 客户端层（按业务域组织）
    │   ├── http.ts             # Axios 实例与拦截器
    │   ├── index.ts            # 统一导出
    │   ├── Auth/               # 认证 API（注册/登录/登出/OTP）
    │   ├── common/             # 通用 API 类型
    │   ├── entityProfile/      # 机构资料 API
    │   ├── feed/               # 信息流/推荐 API（含自定义 hooks）
    │   ├── notes/              # 笔记 CRUD API
    │   ├── projects/           # 项目 CRUD API
    │   ├── teamProfile/        # 团队资料 API
    │   ├── userProfile/        # 用户资料 API
    │   ├── users/              # 用户管理 API
    │   └── verification/       # 认证码管理 API
    │
    ├── components/             # 共享 UI 组件
    │   ├── AuthModal/          # 登录/注册模态框（含多表单）
    │   ├── common/             # 通用组件（LoadingSpinner / InfoPromptModal 等）
    │   ├── MilkdownWrapper/    # Milkdown Markdown 编辑器封装
    │   ├── NoteCard/           # 笔记卡片（Grid/Row 布局）
    │   ├── NoteCommentsSection/ # 笔记评论区
    │   ├── NoteVideoPlayer/    # ArtPlayer 视频播放器封装
    │   ├── OnlineEditor/       # 在线编辑器（Markdown / 富文本双模式）
    │   ├── ProjectCard/        # 项目展示卡片
    │   ├── ProjectChannelLayout/ # 项目频道页布局（公告/推荐/侧栏）
    │   ├── PublishFormSection/ # 发布表单通用区块
    │   ├── Reader/             # 内容阅读器（Markdown 预览/目录/笔记阅读/项目阅读）
    │   └── routes/             # ProtectedRoute 鉴权守卫
    │
    ├── layout/                 # 布局组件
    │   └── TopNavbar/          # 顶部导航栏
    │       ├── TopNavbar.tsx   # 导航栏主体
    │       ├── navRoutes.ts    # 导航路由配置
    │       └── components/    # 子组件
    │           ├── BrandGroup/           # Logo 与品牌区
    │           ├── HeaderActions/        # 发布入口/认证码管理/子码生成
    │           ├── NavMenu/              # 主导航菜单
    │           └── UserProfileMenu/      # 用户头像下拉菜单
    │
    ├── pages/                  # 页面组件（14 个主页面）
    │   ├── HomePage/           # 首页（/）
    │   ├── CommercialProjects/ # 商业项目专区（/project）
    │   ├── CampusCoCreation/   # 校园共创（/co-create）
    │   ├── NoteShare/          # 笔记分享（/note）
    │   ├── LoginPage.tsx       # 登录页（/login）
    │   ├── ProfileSpace/       # 个人/团队/机构空间（/profile, /team/:uid, /org/:code）
    │   ├── ProjectDetailPage/  # 项目详情（/project-detail）
    │   ├── NoteReader/         # 笔记阅读器（/note-detail）— 图文/视频双模式
    │   ├── VerificationPage/   # 实名/机构认证页（/verify）
    │   ├── InstantMessagePage/ # 即时通讯页（/messages）
    │   ├── PublishProject/     # 发布项目（/publish/project）
    │   ├── PublishNote/        # 发布笔记（/publish/note）
    │   └── OnlineTextEditor/   # 在线 Markdown 编辑器（/publish/markdown-editor）
    │
    ├── contexts/               # React Context
    │   ├── AuthContext.tsx      # 认证状态（用户/Token/登录登出）
    │   ├── ProfileMenuContext.tsx # 个人菜单状态
    │   └── ThemeContext.tsx     # 暗色/亮色主题管理
    │
    ├── auth/                   # 认证工具
    │   ├── authEvents.ts       # 认证事件总线
    │   ├── organizationSession.ts # 机构会话管理
    │   └── tokenStorage.ts     # Token 持久化（localStorage）
    │
    ├── hooks/                  # 自定义 React Hooks
    │   ├── useActionCooldown.ts         # 操作冷却/防抖
    │   ├── usePublishEntryFreshFormKey.ts # 发布入口表单刷新 key
    │   └── usePublishLeaveGuard.ts      # 发布页未保存离开提示
    │
    ├── utils/                  # 通用工具
    │   ├── crypto.ts           # 加解密（AES/MD5）
    │   ├── fileMd5.ts          # 文件 MD5 计算
    │   ├── publishSummary.ts   # 发布摘要格式化
    │   └── readVideoDuration.ts # 视频时长读取
    │
    ├── types/                  # 共享 TypeScript 类型
    │   ├── project.ts          # 项目相关类型
    │   └── level.ts            # 等级/角色类型
    │
    ├── data/                   # 数据层
    │   └── currentUserData.ts  # 当前用户数据
    │
    └── styles/                 # 全局样式
        ├── DetailPage.css
        ├── InstantMessagePage.css
        └── OrganizationVerificationPage.css
```

---

## 核心路由表

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/` | 首页（HomePage） | 否 |
| `/project` | 商业项目专区 | 否 |
| `/co-create` | 校园共创 | 否 |
| `/note` | 笔记分享 | 否 |
| `/login` | 登录页 | 否 |
| `/profile`, `/profile/:tab` | 个人空间 | 否 |
| `/team/:uid`, `/team/:uid/:tab`, `/team/:uid/:tab/:subTab` | 团队空间 | 否 |
| `/org/:code`, `/org/:code/:tab` | 机构空间 | 否 |
| `/verify` | 实名认证 | 是 |
| `/verify/organization` | 机构员工认证 | 是 |
| `/project-detail` | 项目详情 | 是 |
| `/note-detail` | 笔记详情 | 否 |
| `/messages` | 即时通讯 | 是 |
| `/publish/project` | 发布项目 | 是 |
| `/publish/note` | 发布笔记 | 是 |
| `/publish/markdown-editor` | 在线编辑器 | 是 |

---

## 架构设计要点

### Provider 层级

```
StrictMode
  └── AuthProvider          → 全局认证状态（user / tokens / login / logout）
      └── ProfileMenuProvider  → 用户菜单状态
          └── ThemeProvider     → 主题切换（dark / light）
              └── RouterProvider → React Router 路由
```

### API 层设计

- 所有 API 调用集中在 `src/api/` 按业务域拆分
- HTTP 客户端由 `src/api/http.ts` 统一创建，自动注入鉴权 Token 与错误拦截
- 信息流模块（`api/feed/`）使用自定义 hooks（`useHomeFeedData`、`useNoteFeedData`、`useProjectFeedData`）封装数据获取逻辑

### 认证体系

- 支持个人账号注册/登录（密码、短信验证码、邮箱验证码）
- 支持机构账号凭证 + OTP 双因素登录
- Token 持久化在 `localStorage`，通过 `AuthContext` 注入全局
- 需要登录的页面使用 `<ProtectedRoute>` 组件包裹

### 主题方案

- 内联 `<script>` 在 HTML 中预加载主题，避免 FOUC（Flash of Unstyled Content）
- 通过 `localStorage` 持久化用户主题偏好
- 默认跟随系统 `prefers-color-scheme` 媒体查询

---

## API 文档

- 全量 API 契约：[`API.md`](./API.md)
- 待办 API 增量需求：[`API-request.md`](./API-request.md)

---

## 开发计划与已知问题

详见 [`TODO`](./TODO) 文件，主要包括：

- ProfileSpace 页面中 tabs 与 variants 结构重构
- 在线编辑器组件合并与 UI 重构
- 发布页字数限制与联合发布支持
- 项目/笔记管理功能（编辑、删除、下架等）
- 登录持久化优化

---

## 注意事项

- **双 ID / uid**：客户端仅使用对外 `uid`（项目 `PR`+11 位，笔记 `TX`/`VD`+11 位），禁止使用自增数字 `id` 访问内容
- **字段命名**：所有 API 字段必须使用 `camelCase`，详见 `API-request.md` 中的命名规范
- **Milkdown 预构建**：`vite.config.ts` 中已将 Milkdown 系列包加入 `optimizeDeps.include`，避免开发模式 504 错误
