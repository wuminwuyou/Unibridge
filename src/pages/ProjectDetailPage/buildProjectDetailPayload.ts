import type { ContentLongtext } from '../../components/Reader'
import { resolveProjectChannelLabel } from '../PublishProject/publishProjectPageData'
import type { PublishProjectFormDraft } from '../PublishProject/publishProjectPageData'
import type { ProjectDetailPayload, ProjectDetailPublishStatus } from './types'

// 01）由发布表单构建项目详情载荷（buildProjectDetailPayload）
/**
 * 函数名：buildProjectDetailPayload
 * 功能：将发布项目表单草稿与需求说明 longtext 绑定存储转换为项目详情页展示数据。
 * 实现方法：
 * - 映射频道、等级、标签等字段
 * - 携带 description 与 descriptionEditorType 供 Reader 严格按模式渲染
 * 输入：
 * - draft：表单草稿
 * - descriptionContent：保存时的模式 + longtext
 * - publishStatus：草稿 / 预览 / 已发布
 * 输出：
 * - 返回值：ProjectDetailPayload
 */
export function buildProjectDetailPayload(
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
  publishStatus: ProjectDetailPublishStatus,
): ProjectDetailPayload {
  return {
    title: draft.title.trim() || '未命名项目',
    summary: draft.summary.trim() || '暂无摘要',
    channel: draft.channel,
    channelLabel: resolveProjectChannelLabel(draft.channel, draft.campusRecruitType),
    campusRecruitType: draft.campusRecruitType,
    description: descriptionContent.longtext,
    descriptionEditorType: descriptionContent.editorType,
    amount: draft.amount.trim() || '预算待填写',
    level: draft.level,
    duration: draft.duration.trim() || '未填写',
    teamSize: draft.teamSize.trim() || '未填写',
    skillTags: draft.skillTags,
    deadline: draft.deadline.trim() || '未填写',
    publishStatus,
    updatedAt: new Date().toISOString(),
  }
}
