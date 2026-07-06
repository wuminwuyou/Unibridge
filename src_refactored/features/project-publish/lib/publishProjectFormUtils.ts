// 01）发布项目表单工具
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import type { PublishProjectFormDraft } from '../model/types'

// 02）判断发布项目是否有用户填写（hasPublishProjectUserInput）
export function hasPublishProjectUserInput(
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
): boolean {
  if (draft.title.trim().length > 0) return true
  if (draft.summary.trim().length > 0) return true
  if (descriptionContent.longtext.trim().length > 0) return true
  if (draft.amountMin.trim().length > 0) return true
  if (draft.skillTags.length > 0) return true
  if (draft.duration.trim().length > 0) return true
  if (draft.deadline.trim().length > 0) return true
  return false
}
