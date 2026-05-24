# 发布笔记页 UI 草图

> 路径：`/publish/note` · React 实现见 `PublishNoteView.tsx`

## 页面结构

样式见 `PublishNote/style.css`（引入 `PublishProject/style.css` 共用表单样式），主题变量对齐 `index.css` 全局变量。

| 区块 | 字段 |
|------|------|
| 基本信息 | 标题、摘要、内容类型（图文/视频） |
| 正文内容 | 正文、封面 URL |
| 话题标签 | 自定义 + 推荐标签 |
| 侧栏 | 网格卡片预览、发布前检查 |
| 底栏 | 保存草稿 / 预览 / 发布笔记 |

## 文件

```
PublishNote/
├── index.tsx
├── PublishNoteView.tsx
├── usePublishNoteForm.ts
├── publishNotePageData.ts
├── style.css
└── UI-SKETCH.md

共用组件：`components/PublishFormSection/`（含 `style.css`）
```
