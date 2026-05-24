import type { ContentLongtext } from '../../components/Reader'
import type { PublishProjectFormDraft } from './publishProjectPageData'

// 01）判断发布项目是否有用户填写（hasPublishProjectUserInput）
/**
 * 函数名：hasPublishProjectUserInput
 * 功能：判断表单是否含有用户输入，用于离开发布页提示。
 */
export function hasPublishProjectUserInput(
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
): boolean {
  if (draft.title.trim().length > 0) {
    return true
  }
  if (draft.summary.trim().length > 0) {
    return true
  }
  if (descriptionContent.longtext.trim().length > 0) {
    return true
  }
  if (draft.amount.trim().length > 0) {
    return true
  }
  if (draft.skillTags.length > 0) {
    return true
  }
  if (draft.duration.trim().length > 0) {
    return true
  }
  if (draft.teamSize.trim().length > 0) {
    return true
  }
  if (draft.deadline.trim().length > 0) {
    return true
  }
  return false
}
