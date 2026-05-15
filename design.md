# 个人空间页面 Prompt（Web UI / React / Next.js）

你是一名资深 Web UI/UX 设计师 与 前端架构工程师，请基于以下需求设计并实现一个现代化「个人空间（Profile Space）」页面。

整体设计风格参考：
- bilibili 个人空间
- X.com
- Linear
- Notion
- Stripe

要求：
- 极简主义（Minimalism）
- 年轻化
- 清爽高级感
- 现代 SaaS 社区风格
- 大量留白
- 柔和阴影
- 大圆角
- 统一间距系统
- 视觉干净舒适

---

# 全局布局

页面整体：
- 浅色主题（light theme）
- 页面背景为：
  `#f6f8fc`
- 使用 4px Grid System
- 所有卡片采用：
  - 大圆角
  - 浅灰背景
  - subtle shadow

---

# 顶部导航栏

顶部导航栏已经存在并已完成代码与样式。

不要修改：
- 顶部导航栏
- 顶部导航样式
- 顶部导航逻辑

只需要从导航栏下方开始设计。

---

# 顶部空间背景区域（Hero Section）

位于顶部导航栏下方。

要求：
- 宽度 100%
- 使用大尺寸空间背景图
- 类似 bilibili 个人空间顶部视觉
- 参考上传图片的布局与氛围

视觉风格：
- 浅蓝色 / 淡紫色渐变
- 轻科技感
- 半透明几何元素
- 柔和发光
- 高级感

高度建议：

```css
height: 240px;
border-radius: 24px;
overflow: hidden;
position: relative;
```

---

# Hero 内容布局

Hero 内部左右两侧分别距离页面：

```css
padding-left: 10%;
padding-right: 10%;
```

内容采用左右布局。

---

# Hero 左侧内容

从左到右依次为：

## 1. 用户头像

```css
width: 96px;
height: 96px;
border-radius: 50%;
```

带白色描边：

```css
border: 4px solid rgba(255,255,255,0.9);
```

---

## 2. 用户信息区域

位于头像右侧。

---

# 用户昵称行

包含：

- 昵称
- 已实名标识（可选）

---

## 昵称

```css
font-size: 32px;
font-weight: 700;
color: #111827;
```

---

## 已实名标识（可选渲染）

只矢量图标认证icon，不带文字

条件：
- 用户实名认证后显示
- 未实名不渲染

样式：

```css
width: 28px;
height: 28px;
border-radius: 50%;

background: #F4C542;
color: white;
```

内容：
- 已认证 icon

要求：
- 使用现代线性 icon
- 视觉类似 bilibili / X 认证风格

---

## 认证所属主体（可选）

位于昵称与实名标识下方。

例如：

```text
深圳技术大学
```

样式：

```css
height: 28px;
padding: 0 12px;

border-radius: 999px;

background: rgba(59,130,246,0.12);
color: #2563EB;
```

若无认证信息：
- 不渲染，但是要留出位置，留白

---

# 用户简介

位于主体所属认证下方，与昵称、实名标识之间隔一个主体所属认证标识的距离

有简介：
- 显示用户简介

无简介：
显示默认内容：

```text
这个人很神秘，什么都没留下
```

样式：

```css
font-size: 15px;
line-height: 24px;
color: #6B7280;
```

最多50字。
一行18字，最多两行，可展开全部。

---

# 底部信息行

位于简介下方。

并排显示：

- 加入时间
- IP地址

样式：

```css
display: flex;
gap: 20px;
```

每项：

```css
font-size: 14px;
color: #94A3B8;
```

左侧带浅色 icon。

---

# Hero 右下角

显示：

## 编辑资料按钮

按钮样式：

```css
height: 40px;
padding: 0 18px;

border-radius: 999px;

background: white;

box-shadow:
0 4px 16px rgba(0,0,0,0.06);
```

hover：

```css
transform: translateY(-1px);
```

按钮内容：

- 编辑 icon
- “编辑资料”

---

# 主体内容区域

位于 Hero 下方。

要求：

- 左右两侧继续留白 15%
- 双栏布局
- 左右占比：
  6 : 4

推荐：

```css
display: grid;
grid-template-columns: 6fr 4fr;
gap: 24px;
```

---

# 左侧内容区域

顶部为：

# 个人主页导航栏（Tab Navigation）

包含：

- 主页（默认）
- 项目
- 笔记
- 收藏
- 设置

风格参考：
- bilibili
- Linear
- X.com

---

# Tab 样式

高度：

```css
height: 64px;
```

当前选中项：

```css
color: #2563EB;
```

并带底部 active line：

```css
height: 3px;
border-radius: 999px;
```

hover：

```css
background: rgba(37,99,235,0.06);
```

---

# “主页” Tab 内容

包含：

- 项目
- 笔记

---

# 项目区域

项目组件：
直接复用：

```text
ProjectCard.tsx
```

不要重新设计项目卡片。

仅负责布局。

推荐：

```css
grid-template-columns:
repeat(2, 1fr);
```

---

# 笔记区域（重点）

笔记卡片风格参考上传图片。

布局：

左侧：
- 封面图

右侧：
- 标题
- 简介
- tag
- 底部信息

---

# 笔记卡片尺寸

```css
height: 132px;
border-radius: 20px;
padding: 20px;
```

背景：

```css
background: white;
```

---

# 左侧封面图

```css
width: 88px;
height: 88px;

border-radius: 16px;
object-fit: cover;
```

---

# 标题

```css
font-size: 18px;
font-weight: 600;
color: #111827;
```

---

# 简介

默认取：
- 笔记前部分内容

限制：

```css
-webkit-line-clamp: 2;
```

样式：

```css
font-size: 14px;
line-height: 22px;
color: #6B7280;
```

---

# Tag 标签

位于简介下方。

样式：

```css
height: 24px;
padding: 0 10px;

border-radius: 999px;

background:
rgba(59,130,246,0.08);
```

---

# 右下角信息

同一行显示：

- 发布时间
- 修改时间
- 浏览量
- 收藏量（star）

样式：

```css
font-size: 13px;
color: #94A3B8;
```

使用 icon + text。

---

# 右侧侧边栏

采用卡片流布局。

卡片之间：

```css
gap: 20px;
```

---

# 卡片统一样式

```css
background: white;

border-radius: 24px;

padding: 24px;

box-shadow:
0 4px 20px rgba(15,23,42,0.04);
```

---

# 右侧内容顺序

从上到下：

1. 个人信息
2. 所属团队
3. 个人荣誉
4. 活跃度日历

---

# 个人信息卡片

包含：

## 公告

支持多行文本。

无公告时：

```text
暂无公告
```

---

## 能力等级

等级：

- N
- R
- SR
- SSR
- UR

使用不同颜色渲染：

```js
N: '#3a8edb'
R: '#46b357'
SR: '#d09a2f'
SSR: '#db5a7d'
UR: '#a44ad3'
```

采用 Badge 风格。

---

## 实名状态

已实名：

黄色 badge：

- 认证 icon
- “已实名”

未实名：

灰色 badge：

```css
background: #E5E7EB;
color: #6B7280;
```

---

## 所属主体

文本显示：

例如：

```text
深圳技术大学
```

---

## 职位

可选：

- 导师
- 学生
- 企业PM

---

## 专业技能

使用 tag 标签展示。

例如：

- Vue3
- React
- Python
- AI
- SpringBoot

---

# 所属团队卡片

显示：

- 团队名称
- 团队简介

并提供：

## 跳转按钮

可跳转：

- 实验室页面
- 学生团队页面

按钮风格：

```css
border-radius: 999px;
```

---

# 个人荣誉卡片

当前暂无内容。

但必须：

- 预留固定高度
- 保留标题
- 保持布局完整

推荐：

```css
min-height: 180px;
```

空状态：

```text
暂无荣誉内容
```

---

# 活跃度日历

参考：

- GitHub Contribution Calendar

使用：

- 小方格热力图
- 浅蓝色系

要求：
- 简洁
- 轻量
- 高级感

---

# 全局设计规范

字体：

```css
font-family:
Inter,
PingFang SC,
SF Pro Display,
sans-serif;
```

---

# 圆角规范

```css
--radius-sm: 12px;
--radius-md: 20px;
--radius-lg: 24px;
```

---

# 阴影规范

```css
box-shadow:
0 4px 20px rgba(15,23,42,0.04);
```

---

# 动效规范

transition：

```css
all .2s ease;
```

hover：

```css
transform: translateY(-1px);
```

---

# 最终要求

输出：
- 高保真 Web UI
- 专业 SaaS 风格
- React / Next.js 风格结构
- 可直接用于前端开发
- 保持组件化
- 保持现代 UI/UX 水准

关键词：

modern profile page,
bilibili inspired layout,
minimal SaaS UI,
clean spacing,
glassmorphism,
modern community profile,
student portfolio,
project showcase,
notion style,
linear inspired,
high-end dashboard,
responsive layout,
premium web UI,
behance quality,
dribbble style