import type { ContentEditorType } from './types'

// 01）正文 longtext 存储结构（ContentLongtext）
/** 保存时使用的 UI 模式及其 Markdown longtext 正文（全站统一 Markdown 存储） */
export interface ContentLongtext {
  editorType: ContentEditorType
  longtext: string
}

// 02）创建正文 longtext（createContentLongtext）
/**
 * 函数名：createContentLongtext
 * 功能：将编辑器模式与当前模式下的 longtext 正文绑定为不可拆分的存储单元。
 * 输入：
 * - editorType：MARKDOWN 或 RICHTEXT
 * - longtext：Markdown 原文（源码模式与 Milkdown 模式共享）
 * 输出：
 * - 返回值：ContentLongtext
 * - 副作用：无
 */
export function createContentLongtext(editorType: ContentEditorType, longtext: string): ContentLongtext {
  return { editorType, longtext }
}

// 03）默认空正文（createDefaultContentLongtext）
/**
 * 函数名：createDefaultContentLongtext
 * 功能：生成空的 Markdown 正文存储单元。
 * 输入：无
 * 输出：
 * - 返回值：ContentLongtext
 * - 副作用：无
 */
export function createDefaultContentLongtext(): ContentLongtext {
  return createContentLongtext('MARKDOWN', '')
}

// 04）由在线编辑器保存结果构建（createContentLongtextFromEditorSave）
/**
 * 函数名：createContentLongtextFromEditorSave
 * 功能：将全屏在线编辑器保存时的模式与正文转为 Reader 可消费的存储结构。
 * 输入：
 * - editorType：保存时使用的模式
 * - content：保存时当前模式下的 longtext
 * 输出：
 * - 返回值：ContentLongtext
 * - 副作用：无
 */
export function createContentLongtextFromEditorSave(
  editorType: ContentEditorType,
  content: string,
): ContentLongtext {
  return createContentLongtext(editorType, content)
}

// 05）迁移旧会话字段（migrateLegacyContentLongtext）
/**
 * 函数名：migrateLegacyContentLongtext
 * 功能：兼容仅有 editorType + longtext 分字段存储的旧 session 数据。
 * 输入：
 * - longtext：正文字符串
 * - editorType：可选的历史 editorType
 * 输出：
 * - 返回值：ContentLongtext
 * - 副作用：无
 */
export function migrateLegacyContentLongtext(
  longtext: string,
  editorType: ContentEditorType = 'MARKDOWN',
): ContentLongtext {
  return createContentLongtext(editorType, longtext)
}
