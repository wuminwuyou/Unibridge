// 01）笔记编辑表单 Session（noteEditorFormSession）
import { isNoteResourceUid } from '@shared/api/resourceUid'
import type { NoteResourceUid } from '@shared/api/resourceUid'
import type { NoteEditorContentType, NoteEditorFormDraft } from '../services/noteEditorService'

// 02）编辑页路由类型（NoteEditorRouteType）
export type NoteEditorRouteType = 'article' | 'video'

// 03）Session 存储键（NOTE_EDITOR_SESSION_KEY）
const NOTE_EDITOR_SESSION_KEY = 'unibridge.note-editor.session'

// 04）笔记编辑 Session 数据（NoteEditorSession）
export interface NoteEditorSession {
  draft: NoteEditorFormDraft
  noteUid?: NoteResourceUid | null
  routeType?: NoteEditorRouteType
  /** 为 true 时离开发布页不自动清除 session（预览/保存后返回编辑） */
  keepForRestore?: boolean
  /** 封面来源：auto | upload，用于预览返回后恢复封面状态 */
  coverSource?: 'auto' | 'upload' | null
}

// 05）规范化内容类型（normalizeNoteEditorContentType）
/**
 * 函数名：normalizeNoteEditorContentType
 * 功能：将 session / 外部输入归一为 API 一致的 contentType。
 * 实现方法：
 * - 视频保持不变
 * - 兼容旧 session 中的「文章」→「图文」
 * 输入：
 * - value：待规范化字符串
 * 输出：
 * - 返回值：NoteEditorContentType
 */
export function normalizeNoteEditorContentType(value: unknown): NoteEditorContentType {
  if (value === '视频') {
    return '视频'
  }
  return '图文'
}

// 06）创建默认编辑草稿（createDefaultNoteEditorDraft）
/**
 * 函数名：createDefaultNoteEditorDraft
 * 功能：生成笔记编辑表单的初始空草稿。
 * 输入：
 * - contentType：内容类型，默认「图文」
 * 输出：
 * - 返回值：NoteEditorFormDraft
 * - 副作用：无
 */
export function createDefaultNoteEditorDraft(
  contentType: NoteEditorContentType = '图文',
): NoteEditorFormDraft {
  return {
    title: '',
    summary: '',
    contentType,
    bodyMarkdown: '',
    videoDescription: '',
    tags: [],
    coverUrl: '',
  }
}

// 07）路由 type 转内容类型（resolveNoteEditorContentType）
/**
 * 函数名：resolveNoteEditorContentType
 * 功能：将编辑页 query `type` 映射为 NoteEditorFormDraft.contentType。
 * 输入：
 * - routeType：article | video
 * 输出：
 * - 返回值：NoteEditorContentType（图文 | 视频）
 */
export function resolveNoteEditorContentType(routeType: NoteEditorRouteType): NoteEditorContentType {
  return routeType === 'video' ? '视频' : '图文'
}

// 08）读取笔记编辑 Session（loadNoteEditorFormSession）
/**
 * 函数名：loadNoteEditorFormSession
 * 功能：从 sessionStorage 恢复笔记编辑表单（刷新、预览返回等场景）。
 * 输入：无
 * 输出：
 * - 返回值：NoteEditorSession 或 null
 * - 副作用：无
 */
export function loadNoteEditorFormSession(): NoteEditorSession | null {
  try {
    const raw = sessionStorage.getItem(NOTE_EDITOR_SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<NoteEditorSession>
    if (!parsed?.draft || typeof parsed.draft !== 'object') {
      return null
    }

    const contentType = normalizeNoteEditorContentType(parsed.draft.contentType)

    const draft: NoteEditorFormDraft = {
      ...createDefaultNoteEditorDraft(contentType),
      ...parsed.draft,
      contentType,
      tags: Array.isArray(parsed.draft.tags)
        ? parsed.draft.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
        : [],
    }

    const noteUid = isNoteResourceUid(parsed.noteUid) ? parsed.noteUid : null
    const routeType =
      parsed.routeType === 'article' || parsed.routeType === 'video' ? parsed.routeType : undefined

    return {
      draft,
      noteUid,
      routeType,
      keepForRestore: parsed.keepForRestore === true,
      coverSource:
        parsed.coverSource === 'auto' || parsed.coverSource === 'upload'
          ? parsed.coverSource
          : null,
    }
  } catch {
    return null
  }
}

// 08）保存笔记编辑 Session（saveNoteEditorFormSession）
/**
 * 函数名：saveNoteEditorFormSession
 * 功能：将笔记编辑表单写入 sessionStorage，供刷新或预览返回后恢复。
 * 输入：
 * - session：NoteEditorSession
 * 输出：
 * - 副作用：写入 sessionStorage
 */
export function saveNoteEditorFormSession(session: NoteEditorSession): void {
  try {
    const payload: NoteEditorSession = {
      draft: { ...session.draft, tags: [...session.draft.tags] },
      noteUid: session.noteUid ?? null,
      routeType: session.routeType,
      keepForRestore: session.keepForRestore === true,
      coverSource: session.coverSource ?? null,
    }
    sessionStorage.setItem(NOTE_EDITOR_SESSION_KEY, JSON.stringify(payload))
  } catch {
    // 存储不可用时静默降级
  }
}

// 09）清除笔记编辑 Session（clearNoteEditorFormSession）
/**
 * 函数名：clearNoteEditorFormSession
 * 功能：清除 sessionStorage 中的笔记编辑表单缓存。
 * 输出：
 * - 副作用：移除 sessionStorage 键
 */
export function clearNoteEditorFormSession(): void {
  try {
    sessionStorage.removeItem(NOTE_EDITOR_SESSION_KEY)
  } catch {
    // 存储不可用时静默降级
  }
}
