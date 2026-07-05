import type { NoteDetailPublishStatus } from '../model/noteDetailCommon'

// 01）发布状态文案（noteDetailPublishStatusLabelMap）
export const noteDetailPublishStatusLabelMap: Record<NoteDetailPublishStatus, string> = {
  DRAFT: '草稿',
  PREVIEW: '预览',
  PUBLISHED: '已发布',
}

// 02）取作者头像占位字母（resolveNoteAuthorInitial）
/**
 * 函数名：resolveNoteAuthorInitial
 * 功能：从作者昵称提取首字母，用于无头像时的占位展示。
 * 输入：
 * - name：作者昵称
 * 输出：
 * - 返回值：单字符大写
 */
export function resolveNoteAuthorInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'U'
}

// 03）解析发布流程提示（resolveNoteEditorialBannerText）
/**
 * 函数名：resolveNoteEditorialBannerText
 * 功能：根据发布状态生成发布页回流横幅文案。
 * 输入：
 * - status：DRAFT / PREVIEW / PUBLISHED
 * 输出：
 * - 返回值：横幅提示文案
 */
export function resolveNoteEditorialBannerText(status: NoteDetailPublishStatus): string {
  if (status === 'PREVIEW') {
    return '当前为笔记预览，请提前保存草稿'
  }
  if (status === 'DRAFT') {
    return '当前为笔记草稿，可返回继续编辑'
  }
  return '笔记已保存发布，可返回继续修改'
}

// 04）格式化笔记详情时间（formatNoteDetailTime）
/**
 * 函数名：formatNoteDetailTime
 * 功能：将 API ISO 时间或已有展示时间统一为「YYYY-MM-DD HH:mm」。
 * 输入：
 * - value：原始时间字符串
 * 输出：
 * - 返回值：展示用时间文案
 */
export function formatNoteDetailTime(value: string): string {
  const normalizedTime = value.replace('T', ' ').trim()
  if (!normalizedTime) {
    return ''
  }
  if (normalizedTime.length <= 10) {
    return `${normalizedTime} 00:00`
  }
  return normalizedTime.slice(0, 16)
}
