// 01）DTO → ViewModel 映射（mapProjectDetailToPayload）
import type { ProjectDetailDto } from '../model/types'
import type { LevelCode } from '@shared/types/level'
import type { CampusRecruitType } from '@shared/types/project'
import type { ProjectDetailPayload, ProjectDetailPublishStatus } from '../model/projectDetailViewModel'
import { resolveProjectChannelLabel } from './resolveProjectChannelLabel'

// 02）映射项目发布状态（mapProjectDetailPublishStatus）
function mapProjectDetailPublishStatus(status: ProjectDetailDto['status']): ProjectDetailPublishStatus {
  return status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
}

// 03）归一化项目等级（normalizeProjectLevel）
function normalizeProjectLevel(level: string): LevelCode {
  const normalizedLevel = level.trim().toUpperCase()
  const levelWhitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return levelWhitelist.includes(normalizedLevel as LevelCode) ? (normalizedLevel as LevelCode) : 'N'
}

// 04）将项目详情 DTO 转为页面载荷（mapProjectDetailToPayload）
/**
 * 函数名：mapProjectDetailToPayload
 * 功能：将 GET /projects/{uid} 响应映射为 ProjectDetailPayload。
 * 输入：
 * - dto：ProjectDetailDto（API 响应）
 * 输出：
 * - 返回值：ProjectDetailPayload
 */
export function mapProjectDetailToPayload(dto: ProjectDetailDto): ProjectDetailPayload {
  return {
    title: dto.title,
    summary: dto.summary,
    channel: dto.channel,
    channelLabel: resolveProjectChannelLabel(dto.channel, dto.campusRecruitType),
    campusRecruitType: (dto.campusRecruitType ?? undefined) as CampusRecruitType | null | undefined,
    description: dto.description ?? '',
    descriptionEditorType: dto.descriptionEditorType === 'RICHTEXT' ? 'RICHTEXT' : 'MARKDOWN',
    amount: dto.amount ?? '—',
    level: normalizeProjectLevel(dto.level),
    duration: dto.duration ?? '未填写',
    teamSize: dto.teamSize ?? '未填写',
    skillTags: dto.skillTags ?? [],
    deadline: dto.deadline ?? '未填写',
    publishStatus: mapProjectDetailPublishStatus(dto.status),
    updatedAt: dto.updatedAt,
  }
}
