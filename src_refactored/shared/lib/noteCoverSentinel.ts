// 01）图文笔记无封面占位 URL（NOTE_ARTICLE_EMPTY_COVER_URL）
/** 图文笔记未配置封面时提交给 API 的占位 URL（不可加载，卡片侧不展示封面区） */
export const NOTE_ARTICLE_EMPTY_COVER_URL = 'https://unibridge.invalid/note-cover/empty'

// 02）判断是否为无封面占位 URL（isNoteCoverEmptySentinel）
/**
 * 函数名：isNoteCoverEmptySentinel
 * 功能：判断封面 URL 是否为空或图文无封面占位标识。
 * 实现方法：
 * - 空字符串视为无封面
 * - 匹配 NOTE_ARTICLE_EMPTY_COVER_URL 或路径含 /note-cover/empty
 * 输入：
 * - coverUrl：封面 URL，可选
 * 输出：
 * - 返回值：是否为无封面占位
 * - 副作用：无
 */
export function isNoteCoverEmptySentinel(coverUrl: string | null | undefined): boolean {
  if (!coverUrl?.trim()) {
    return true
  }

  const normalized = coverUrl.trim()
  return normalized === NOTE_ARTICLE_EMPTY_COVER_URL || normalized.includes('/note-cover/empty')
}

// 03）判断封面是否可在卡片中展示（isNoteCoverDisplayable）
/**
 * 函数名：isNoteCoverDisplayable
 * 功能：判断封面 URL 是否应尝试在笔记卡片中加载展示。
 * 输入：
 * - coverUrl：封面 URL，可选
 * 输出：
 * - 返回值：是否可展示
 * - 副作用：无
 */
export function isNoteCoverDisplayable(coverUrl: string | null | undefined): boolean {
  return !isNoteCoverEmptySentinel(coverUrl)
}

// 04）编辑态封面输入状态（NoteEditorCoverInputState）
export interface NoteEditorCoverInputState {
  activePreviewUrl: string | null
  selectedFile: File | null
  persistedCoverUrl?: string | null
}

// 05）判断编辑态是否已配置封面（hasNoteEditorCoverInput）
/**
 * 函数名：hasNoteEditorCoverInput
 * 功能：判断笔记编辑表单是否已有可用封面（本地预览、待上传文件或有效远程 URL）。
 * 输入：
 * - cover：封面 picker / 上传状态
 * 输出：
 * - 返回值：是否已有封面输入
 * - 副作用：无
 */
export function hasNoteEditorCoverInput(cover: NoteEditorCoverInputState): boolean {
  if (cover.selectedFile) {
    return true
  }

  if (cover.activePreviewUrl?.trim()) {
    return true
  }

  return isNoteCoverDisplayable(cover.persistedCoverUrl)
}

// 06）规范化编辑表单封面 URL（normalizeNoteEditorCoverUrl）
/**
 * 函数名：normalizeNoteEditorCoverUrl
 * 功能：将 API 返回的占位封面 URL 转为编辑表单中的空字符串。
 * 输入：
 * - coverUrl：API 或草稿中的 coverUrl
 * 输出：
 * - 返回值：编辑表单可用的 coverUrl
 * - 副作用：无
 */
export function normalizeNoteEditorCoverUrl(coverUrl: string | null | undefined): string {
  if (isNoteCoverEmptySentinel(coverUrl)) {
    return ''
  }

  return coverUrl?.trim() ?? ''
}
