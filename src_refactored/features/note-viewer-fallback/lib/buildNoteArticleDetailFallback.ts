import { demoArticleMarkdown } from './noteDetailDemoContent'
import type { NoteArticleDetailPayload } from '../../../entities/note/model/noteDetailViewModel'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'

// 01）构建图文笔记详情兜底数据（buildNoteArticleDetailFallback）
/**
 * 函数名：buildNoteArticleDetailFallback
 * 功能：根据标题参数生成图文笔记详情演示数据（无后端 / 卡片跳转时使用）。
 * 输入：
 * - title：笔记标题
 * - uid：可选笔记 uid
 * 输出：
 * - 返回值：NoteArticleDetailPayload
 */
export function buildNoteArticleDetailFallback(title: string, uid?: NoteResourceUid): NoteArticleDetailPayload {
  const normalizedTitle = title.trim() || '未命名笔记'

  return {
    uid,
    contentType: '图文',
    title: normalizedTitle,
    summary: '来自经验分享频道的图文笔记，正文为演示数据，后续可对接 note 表与 API。',
    body: demoArticleMarkdown,
    tags: ['经验分享', '图文笔记', 'UniBridge'],
    coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    author: {
      uid: undefined,
      name: '社区创作者',
      organization: 'UniBridge 社区',
      avatarUrl: null,
    },
    publishTime: '2026-05-18 19:36',
    updateTime: '2026-05-19',
    views: 532,
    comments: 36,
    favorites: 28,
    publishStatus: 'PUBLISHED',
    parentNote: null,
  }
}
