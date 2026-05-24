// 01）笔记内容类型（PublishNoteContentType）
export type PublishNoteContentType = '图文' | '视频'

// 02）内容类型选项（publishContentTypeOptions）
export interface PublishContentTypeOption {
  value: PublishNoteContentType
  label: string
  description: string
}

// 03）发布笔记表单草稿（PublishNoteFormDraft）
export interface PublishNoteFormDraft {
  title: string
  summary: string
  contentType: PublishNoteContentType
  body: string
  tags: string[]
}

// 04）顶部导航（publishNoteNavItems）
export { mainNavItemLabels as publishNoteNavItems } from '../../layout/TopNavbar/navRoutes'

// 05）内容类型列表（publishContentTypeOptions）
export const publishContentTypeOptions: PublishContentTypeOption[] = [
  { value: '图文', label: '图文笔记', description: '以文字与配图为主的经验分享' },
  { value: '视频', label: '视频笔记', description: '上传或嵌入视频讲解与演示' },
]

// 06）推荐话题标签（suggestedNoteTags）
export const suggestedNoteTags: string[] = [
  '求职经验',
  '项目复盘',
  '考研保研',
  '实习日记',
  '工具推荐',
  '算法学习',
  '设计作品集',
  '开源贡献',
]

// 07）发布检查清单（publishNoteChecklistItems）
export const publishNoteChecklistItems: string[] = [
  '标题简洁且能概括核心观点',
  '摘要适合在卡片列表中快速浏览',
  '图文需填写正文，视频需上传视频文件',
  '封面可选用系统生成或自行上传',
  '至少添加 1 个话题标签便于检索',
]

// 08）默认草稿（createDefaultPublishNoteDraft）
/**
 * 函数名：createDefaultPublishNoteDraft
 * 功能：生成发布笔记表单的默认草稿值。
 * 实现方法：
 * - 各字段置空，内容类型默认「图文」
 * 输入：无
 * 输出：
 * - 返回值：PublishNoteFormDraft
 * - 副作用：无
 */
export function createDefaultPublishNoteDraft(): PublishNoteFormDraft {
  return {
    title: '',
    summary: '',
    contentType: '图文',
    body: '',
    tags: [],
  }
}
