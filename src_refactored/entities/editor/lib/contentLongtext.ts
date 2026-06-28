import type { ContentEditorType } from '../../model/types'

// 01）正文 longtext 存储结构（ContentLongtext）
export interface ContentLongtext { editorType: ContentEditorType; longtext: string }

// 02）创建正文 longtext（createContentLongtext）
export function createContentLongtext(editorType: ContentEditorType, longtext: string): ContentLongtext {
  return { editorType, longtext }
}

// 03）默认空正文（createDefaultContentLongtext）
export function createDefaultContentLongtext(): ContentLongtext {
  return createContentLongtext('MARKDOWN', '')
}

// 04）迁移旧会话字段（migrateLegacyContentLongtext）
export function migrateLegacyContentLongtext(longtext: string, editorType: ContentEditorType = 'MARKDOWN'): ContentLongtext {
  return createContentLongtext(editorType, longtext)
}
