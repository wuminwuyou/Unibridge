import type { ContentLongtext } from '../../../components/Reader'
import type { PublishNoteFormDraft } from '../../PublishNote/publishNotePageData'
import type { NoteDetailPublishStatus } from '../shared/noteDetailCommon'
import type { NoteArticleDetailPayload } from './types'

// 01）由发布笔记表单构建图文详情（buildNoteDetailFromPublishNote）
/**
 * 函数名：buildNoteDetailFromPublishNote
 * 功能：将发布笔记表单草稿与正文 longtext 绑定存储转为详情页载荷。
 * 输入：
 * - draft：表单草稿
 * - bodyContent：保存时的模式 + longtext
 * - coverUrl：封面上传后的 URL，可为 null
 * - publishStatus：发布状态
 * 输出：
 * - 返回值：NoteArticleDetailPayload
 */
export function buildNoteDetailFromPublishNote(
  draft: PublishNoteFormDraft,
  bodyContent: ContentLongtext,
  coverUrl: string | null,
  publishStatus: NoteDetailPublishStatus,
): NoteArticleDetailPayload {
  return {
    contentType: '图文',
    title: draft.title.trim() || '未命名笔记',
    summary: draft.summary.trim() || '暂无摘要',
    body: bodyContent.longtext,
    editorType: bodyContent.editorType,
    tags: draft.tags,
    coverUrl,
    author: {
      name: '我',
      handle: 'me',
      avatarUrl: null,
    },
    publishTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 10),
    views: 0,
    comments: 0,
    favorites: 0,
    publishStatus,
  }
}
