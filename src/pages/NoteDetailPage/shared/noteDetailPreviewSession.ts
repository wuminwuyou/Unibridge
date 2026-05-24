import type { NoteDetailPayload } from './noteDetailPayload'
import { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from './noteDetailPayload'

// 01）笔记详情预览存储键（NOTE_DETAIL_PREVIEW_KEY）
const NOTE_DETAIL_PREVIEW_KEY = 'unibridge.note-detail.preview'

// 02）保存笔记详情预览（saveNoteDetailPreview）
/**
 * 函数名：saveNoteDetailPreview
 * 功能：将图文/视频笔记详情预览数据写入 sessionStorage。
 * 输入：
 * - payload：笔记详情载荷
 * 输出：
 * - 副作用：写入 sessionStorage
 */
export function saveNoteDetailPreview(payload: NoteDetailPayload): void {
  try {
    sessionStorage.setItem(NOTE_DETAIL_PREVIEW_KEY, JSON.stringify(payload))
  } catch {
    // 静默降级
  }
}

// 03）读取笔记详情预览（loadNoteDetailPreview）
/**
 * 函数名：loadNoteDetailPreview
 * 功能：从 sessionStorage 读取最近一次笔记详情预览（图文或视频）。
 * 输出：
 * - 返回值：NoteDetailPayload 或 null
 */
export function loadNoteDetailPreview(): NoteDetailPayload | null {
  try {
    const raw = sessionStorage.getItem(NOTE_DETAIL_PREVIEW_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as NoteDetailPayload
    if (isNoteArticleDetailPayload(parsed) || isNoteVideoDetailPayload(parsed)) {
      return parsed
    }

    return null
  } catch {
    return null
  }
}

// 04）清除笔记详情预览（clearNoteDetailPreview）
/**
 * 函数名：clearNoteDetailPreview
 * 功能：清除 sessionStorage 中的笔记详情预览缓存，避免保存/发布后仍展示旧预览数据。
 * 输出：
 * - 副作用：移除 sessionStorage 键
 */
export function clearNoteDetailPreview(): void {
  try {
    sessionStorage.removeItem(NOTE_DETAIL_PREVIEW_KEY)
  } catch {
    // 静默降级
  }
}
