import type { ContentEditorType } from '../../../Reader/types'

// 01）在线编辑器模式偏好存储键（ONLINE_EDITOR_MODE_STORAGE_KEY）
const ONLINE_EDITOR_MODE_STORAGE_KEY = 'unibridge.online-editor.last-mode'

// 02）在线正文编辑模式（OnlineTextEditorMode）
export type OnlineEditorModePreference = 'markdown' | 'richtext'

// 03）读取上次使用的编辑模式（loadOnlineEditorModePreference）
/**
 * 函数名：loadOnlineEditorModePreference
 * 功能：从 localStorage 读取用户上次在全屏在线编辑器中使用的 UI 模式。
 * 输入：无
 * 输出：
 * - 返回值：OnlineEditorModePreference
 * - 副作用：读取 localStorage
 */
export function loadOnlineEditorModePreference(): OnlineEditorModePreference {
  if (typeof localStorage === 'undefined') {
    return 'markdown'
  }

  const stored = localStorage.getItem(ONLINE_EDITOR_MODE_STORAGE_KEY)
  if (stored === 'markdown' || stored === 'richtext') {
    return stored
  }

  return 'markdown'
}

// 04）保存编辑模式偏好（saveOnlineEditorModePreference）
/**
 * 函数名：saveOnlineEditorModePreference
 * 功能：持久化用户最近一次选择的 UI 编辑模式。
 * 输入：
 * - mode：markdown 或 richtext
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
export function saveOnlineEditorModePreference(mode: OnlineEditorModePreference): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(ONLINE_EDITOR_MODE_STORAGE_KEY, mode)
  } catch {
    // 存储不可用时静默降级
  }
}

// 05）解析在线编辑器初始 Markdown（resolveOnlineEditorInitialMarkdown）
/**
 * 函数名：resolveOnlineEditorInitialMarkdown
 * 功能：双模已统一为 Markdown 存储后，直接将 initialValue 视为 Markdown longtext。
 * 实现方法：
 * - 不再执行 HTML ↔ Markdown 转码
 * - 兼容旧 RICHTEXT 标记：正文仍原样传入，由 MdPreview / Milkdown 消费
 * 输入：
 * - initialValue：表单传入正文
 * - _initialEditorType：历史 UI 模式，仅保留参数兼容
 * 输出：
 * - 返回值：Markdown 字符串
 * - 副作用：无
 */
export function resolveOnlineEditorInitialMarkdown(
  initialValue: string,
  _initialEditorType?: ContentEditorType,
): string {
  return initialValue
}
