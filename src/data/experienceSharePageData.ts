import type { ProfileNoteItem } from '../components/profile/types'

// 01）使用方说明
/**
 * 该文件集中维护经验分享页（ExperienceSharePage）的静态展示数据。
 * 使用方：apps/web-client/src/pages/ExperienceSharePage.tsx
 * 数据范围：经验分享大类标签 / 经验分享笔记列表
 */

// 02）经验分享大类标签数据（experienceShareTags）
export const experienceShareTags: string[] = [
  '微电子',
  '计算机',
  '平面设计',
  '人工智能',
  '前端开发',
  '后端开发',
  '产品设计',
  '数字媒体',
]

// 03）经验分享笔记数据（experienceShareNotes）
export const experienceShareNotes: ProfileNoteItem[] = [
  {
    title: 'CMOS 模拟电路版图避坑指南',
    summary: '总结版图绘制中常见问题与参数权衡，帮助微电子方向同学快速提升实战效率。',
    contentType: '图文',
    tags: ['微电子', '版图设计', '模拟电路'],
    publishTime: '2026-05-02 14:20',
    updateTime: '2026-05-02',
    views: 684,
    comments: 46,
    favorites: 75,
    cover: 'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '操作系统课程项目：线程调度可视化',
    summary: '从设计思路到实现细节复盘调度算法实验，附带性能对比与调试经验。',
    contentType: '图文',
    tags: ['计算机', '操作系统', '课程项目'],
    publishTime: '2026-04-26 20:05',
    updateTime: '2026-04-27',
    views: 921,
    comments: 63,
    favorites: 102,
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '品牌海报设计中的网格系统实战',
    summary: '介绍平面设计中常用的排版网格方案，结合案例说明如何提升视觉统一性。',
    contentType: '图文',
    tags: ['平面设计', '海报', '视觉规范'],
    publishTime: '2026-04-21 09:40',
    updateTime: '2026-04-22',
    views: 552,
    comments: 28,
    favorites: 66,
    cover: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '从 0 到 1 搭建可复用前端组件库',
    summary: '覆盖组件抽象、文档规范、发布流程与版本管理，帮助团队建立稳定 UI 基建。',
    contentType: '图文',
    tags: ['计算机', '前端开发', '工程化'],
    publishTime: '2026-04-18 17:18',
    updateTime: '2026-04-19',
    views: 837,
    comments: 51,
    favorites: 97,
    cover: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '产品需求拆解方法：从场景到 PRD',
    summary: '分享一套高效的需求拆解流程，帮助校招同学快速进入产品协作节奏。',
    contentType: '图文',
    tags: ['产品设计', '需求分析', '协作流程'],
    publishTime: '2026-04-12 11:32',
    updateTime: '2026-04-13',
    views: 473,
    comments: 19,
    favorites: 58,
    cover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '短视频封面与标题联动设计策略',
    summary: '通过视觉层级和文案节奏设计，提高内容点击率与平台推荐效率。',
    contentType: '视频',
    tags: ['数字媒体', '视频', '内容增长'],
    publishTime: '2026-04-09 15:55',
    updateTime: '2026-04-09',
    views: 698,
    comments: 34,
    favorites: 72,
    cover: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=600&q=80',
  },
]
