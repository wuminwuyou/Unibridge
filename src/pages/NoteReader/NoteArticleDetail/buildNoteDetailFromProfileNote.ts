import type { ContentEditorType } from '../../../components/Reader'
import type { ProfileNoteItem } from '../../ProfileSpace/components/types'
import { demoArticleMarkdown } from './noteDetailDemoContent'
import type { NoteArticleDetailPayload } from './types'

// 01）由列表卡片数据构建图文详情（buildNoteDetailFromProfileNote）
/**
 * 函数名：buildNoteDetailFromProfileNote
 * 功能：将 ProfileNoteItem（卡片列表）转为图文笔记详情页载荷。
 * 实现方法：
 * - 映射标题、摘要、标签与统计字段
 * - 正文暂用演示 Markdown（待 API 接入后替换为 note.content）
 * 输入：
 * - note：列表笔记项
 * - editorType：正文格式，默认 MARKDOWN
 * 输出：
 * - 返回值：NoteArticleDetailPayload
 */
export function buildNoteDetailFromProfileNote(
  note: ProfileNoteItem,
  editorType: ContentEditorType = 'MARKDOWN',
): NoteArticleDetailPayload {
  return {
    contentType: '图文',
    title: note.title,
    summary: note.summary,
    body: demoArticleMarkdown,
    editorType,
    tags: note.tags,
    coverUrl: note.cover,
    author: {
      name: '社区创作者',
      handle: 'unibridge-user',
      avatarUrl: null,
    },
    publishTime: note.publishTime,
    updateTime: note.updateTime,
    views: note.views,
    comments: note.comments,
    favorites: note.favorites,
    publishStatus: 'PUBLISHED',
  }
}
