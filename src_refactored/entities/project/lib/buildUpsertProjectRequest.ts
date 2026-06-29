// 01）由表单草稿构建项目请求体（buildUpsertProjectRequest）
/**
 * 函数名：buildUpsertProjectRequest
 * 功能：将发布项目表单草稿转为 POST/PUT /projects 请求体。
 * 实现方法：
 * - 映射 channel / campusRecruitType 字段（campus 频道时才写入子类型）
 * - 调用 resolvePublishSummary 生成最终摘要
 * 输入：
 * - draft：PublishProjectFormDraft 表单草稿
 * - description：longtext 正文（用于填充 summary）
 * - publishAction：DRAFT / PUBLISH
 * 输出：
 * - 返回值：UpsertProjectRequest
 * - 副作用：无
 */
import type { ProjectPublishAction, UpsertProjectRequest } from '@entities/project/model/types'
import { resolvePublishSummary } from '@shared/lib/publishSummary'

export interface PublishProjectFormDraftForRequest {
  title: string
  summary: string
  channel: string
  campusRecruitType: string | null
  amount: string
  level: string
  duration: string
  teamSize: string
  skillTags: string[]
  deadline: string
}

export function buildUpsertProjectRequest(
  draft: PublishProjectFormDraftForRequest,
  description: string,
  publishAction: ProjectPublishAction,
): UpsertProjectRequest {
  return {
    publishAction,
    title: draft.title.trim(),
    summary: resolvePublishSummary(draft.summary, description),
    channel: draft.channel,
    campusRecruitType: draft.channel === 'campus' ? draft.campusRecruitType : null,
    description,
    amount: draft.amount.trim(),
    level: draft.level,
    duration: draft.duration.trim(),
    teamSize: draft.teamSize.trim(),
    skillTags: draft.skillTags,
    deadline: draft.deadline.trim(),
  }
}
