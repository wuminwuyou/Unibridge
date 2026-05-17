你是一名资深前端工程师与 UI 架构师。

请基于以下设计规范，使用：

- React
- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui
- lucide-react

实现一个现代化 Login/Register Modal 组件。

---

# 组件名称

LoginModal.tsx

---

# 整体结构

采用左右 Split Layout：

左侧：
品牌视觉区域（已存在，无需实现）

右侧：
登录信息栏（需要实现）

---

# 右侧区域规格

```css
width: 60%;
padding: 56px 64px;
background: white;
```

要求：

- 极简主义
- Linear + Notion + Stripe 风格
- 圆角
- 柔和阴影
- 高级感
- 干净留白
- 响应式

---

# 顶部 Tabs

包含：

- 个人用户
- 机构/学校

要求：

- 居中，且Tabs宽度占右侧栏的100%
- active 状态蓝色
- 带底部 active line
- hover 有背景过渡

---

# 标题区域

主标题：

欢迎登录 Unibridge



---

# 表单字段

包含：

1. 邮箱/手机号
2. 密码

要求：

- 浮动 label 风格
- 左侧 icon
- 密码可见切换
- focus 蓝色 glow
- 密码填写表单右侧有“忘记密码？”通道

---

# 记住我区域

左侧：

checkbox + 记住我

右侧：

短信验证码登录

---

# Continue Button

要求：

- 深蓝渐变
- hover 浮起
- 阴影增强
- 大圆角

---

# 底部注册区域

内容：

还没有账号？立即注册

其中：

“立即注册” 为蓝色高亮。

---

# 技术要求

- 使用 TypeScript
- 使用 TailwindCSS
- 使用 shadcn/ui Button/Input
- 使用 lucide-react icon
- 保持组件化
- 支持深色模式扩展
- 代码结构清晰
- 可直接生产使用

---

# UI 风格关键词

modern auth modal,
minimal SaaS UI,
glassmorphism,
Linear inspired,
Stripe inspired,
Notion inspired,
premium login page,
clean dashboard UI,
high-end startup product,
dribbble quality