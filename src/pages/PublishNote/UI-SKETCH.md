# 发布笔记页 UI 草图

> 路径：`/publish/note` · React 实现见 `PublishNoteView.tsx`

## 页面结构

与发布项目页共用 `PublishForm/publishFormShared.css`，支持全局浅色/深色主题切换。

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
├── style.css          → @import 共享主题样式
└── UI-SKETCH.md
```
