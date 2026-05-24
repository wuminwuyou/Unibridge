import {
  migrateLegacyContentLongtext,
  type ContentLongtext,
} from '../../components/Reader'
import type { MarkdownContentChangeMeta } from '../../components/OnlineEditor'
import type { PublishNoteMediaPersist } from './publishNoteSubmit'
import {
  createDefaultPublishNoteDraft,
  type PublishNoteFormDraft,
} from './publishNotePageData'

// 01）发布笔记会话存储键（PUBLISH_NOTE_SESSION_KEY）
const PUBLISH_NOTE_SESSION_KEY = 'unibridge.publish-note.session'

// 02）发布笔记会话数据（PublishNoteSession）
export interface PublishNoteSession {
  draft: PublishNoteFormDraft
  bodyMeta: MarkdownContentChangeMeta | null
  bodyContent: ContentLongtext
  noteId?: number | null
  mediaPersist?: PublishNoteMediaPersist | null
  videoDescription?: string
  /** 为 true 时离开发布页不自动清除 session（预览/保存后返回编辑） */
  keepForRestore?: boolean
}

// 03）在线编辑器往返时恢复的表单快照（PublishNoteFormRestore）
export interface PublishNoteFormRestore {
  draft: PublishNoteFormDraft
  bodyMeta: MarkdownContentChangeMeta | null
  bodyContent: ContentLongtext
  noteId: number | null
  mediaPersist: PublishNoteMediaPersist | null
  videoDescription?: string
}

// 04）解析会话中的正文存储（resolvePublishNoteBodyContent）
function resolvePublishNoteBodyContent(
  parsed: Partial<PublishNoteSession> & { bodyEditorType?: ContentLongtext['editorType'] },
  draft: PublishNoteFormDraft,
): ContentLongtext {
  if (
    parsed.bodyContent &&
    (parsed.bodyContent.editorType === 'MARKDOWN' || parsed.bodyContent.editorType === 'RICHTEXT') &&
    typeof parsed.bodyContent.longtext === 'string'
  ) {
    return parsed.bodyContent
  }

  return migrateLegacyContentLongtext(draft.body, parsed.bodyEditorType ?? 'MARKDOWN')
}

// 05）读取发布笔记会话（loadPublishNoteSession）
/**
 * 函数名：loadPublishNoteSession
 * 功能：从 sessionStorage 恢复发布笔记表单（预览返回、编辑器返回等场景）。
 */
export function loadPublishNoteSession(): PublishNoteSession | null {
  try {
    const raw = sessionStorage.getItem(PUBLISH_NOTE_SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<PublishNoteSession> & { bodyEditorType?: ContentLongtext['editorType'] }
    if (!parsed?.draft || typeof parsed.draft !== 'object') {
      return null
    }

    const draft = { ...createDefaultPublishNoteDraft(), ...parsed.draft }
    const bodyContent = resolvePublishNoteBodyContent(parsed, draft)

    return {
      draft: { ...draft, body: bodyContent.longtext },
      bodyMeta: parsed.bodyMeta ?? null,
      bodyContent,
      noteId: parsed.noteId ?? null,
      mediaPersist: parsed.mediaPersist ?? null,
      videoDescription: parsed.videoDescription ?? '',
      keepForRestore: parsed.keepForRestore === true,
    }
  } catch {
    return null
  }
}

// 06）保存发布笔记会话（savePublishNoteSession）
/**
 * 函数名：savePublishNoteSession
 * 功能：将发布笔记表单写入 sessionStorage，供预览返回后恢复。
 */
export function savePublishNoteSession(session: PublishNoteSession): void {
  try {
    const payload: PublishNoteSession = {
      draft: { ...session.draft, body: session.bodyContent.longtext },
      bodyMeta: session.bodyMeta,
      bodyContent: session.bodyContent,
      noteId: session.noteId ?? null,
      mediaPersist: session.mediaPersist ?? null,
      videoDescription: session.videoDescription ?? '',
      keepForRestore: session.keepForRestore === true,
    }
    sessionStorage.setItem(PUBLISH_NOTE_SESSION_KEY, JSON.stringify(payload))
  } catch {
    // 存储不可用时静默降级
  }
}

// 07）清除发布笔记本地缓存（clearPublishNoteSession）
export function clearPublishNoteSession(): void {
  try {
    sessionStorage.removeItem(PUBLISH_NOTE_SESSION_KEY)
  } catch {
    // 存储不可用时静默降级
  }
}
