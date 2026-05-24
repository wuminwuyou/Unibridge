import type { ContentLongtext } from '../../components/Reader'
import type { PublishNoteFormDraft } from './publishNotePageData'

// 01）判断发布笔记是否有用户填写（hasPublishNoteUserInput）
/**
 * 函数名：hasPublishNoteUserInput
 * 功能：判断表单是否含有用户输入，用于离开发布页提示。
 */
export function hasPublishNoteUserInput(
  draft: PublishNoteFormDraft,
  bodyContent: ContentLongtext,
  videoFile: File | null,
  videoDescription: string,
): boolean {
  if (draft.title.trim().length > 0) {
    return true
  }
  if (draft.summary.trim().length > 0) {
    return true
  }
  if (draft.tags.length > 0) {
    return true
  }
  if (bodyContent.longtext.trim().length > 0) {
    return true
  }
  if (videoFile) {
    return true
  }
  if (videoDescription.trim().length > 0) {
    return true
  }
  return false
}
