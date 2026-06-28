// 01）发布项目 Feature — Hooks 与 Services
// 核心发布逻辑封装，调用 entities/project/api 和 shared 工具

import { resolvePublishSummary } from '../../../shared/lib/publishSummary'
import type { ProjectPublishAction, UpsertProjectRequest } from '../../../entities/project/model/types'
import { createProject, updateProject } from '../../../entities/project/api/projectApi'
import type { ProjectResourceUid } from '../../../shared/api/resourceUid'

// 02）发布项目表单草稿类型（PublishProjectFormDraft）
export interface PublishProjectFormDraft {
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
  descriptionEditorType: string
}

// 03）从草稿构建请求体（buildUpsertProjectRequest）
export function buildUpsertProjectRequest(draft: PublishProjectFormDraft, description: string, publishAction: ProjectPublishAction): UpsertProjectRequest {
  return {
    publishAction, title: draft.title.trim(),
    summary: resolvePublishSummary(draft.summary, description),
    channel: draft.channel,
    campusRecruitType: draft.channel === 'campus' ? draft.campusRecruitType : null,
    description, amount: draft.amount.trim(), level: draft.level,
    duration: draft.duration.trim(), teamSize: draft.teamSize.trim(),
    skillTags: draft.skillTags, deadline: draft.deadline.trim(),
  }
}

// 04）提交项目（创建或更新）
export async function submitProject(draft: PublishProjectFormDraft, description: string, publishAction: ProjectPublishAction, existingUid?: ProjectResourceUid) {
  const request = buildUpsertProjectRequest(draft, description, publishAction)
  if (existingUid) return updateProject(existingUid, request)
  return createProject(request)
}

// 05）发布项目表单工具
export function isPublishProjectFormEmpty(draft: PublishProjectFormDraft): boolean {
  return !draft.title.trim() && !draft.summary.trim() && !draft.amount.trim() && !draft.duration.trim() && !draft.teamSize.trim()
}
