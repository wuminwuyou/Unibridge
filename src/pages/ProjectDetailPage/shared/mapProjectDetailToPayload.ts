import type { ProjectDetailDto } from '../../../api/projects/types'
import { resolveProjectChannelLabel } from '../../PublishProject/publishProjectPageData'
import type { LevelCode } from '../../../types/level'
import type { ProjectDetailPayload } from '../types'

// 01）映射项目发布状态（mapProjectDetailPublishStatus）
function mapProjectDetailPublishStatus(status: ProjectDetailDto['status']): ProjectDetailPayload['publishStatus'] {
  return status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
}

// 02）归一化项目等级（normalizeProjectLevel）
function normalizeProjectLevel(level: string): LevelCode {
  const normalizedLevel = level.trim().toUpperCase()
  const levelWhitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return levelWhitelist.includes(normalizedLevel as LevelCode) ? (normalizedLevel as LevelCode) : 'N'
}

// 03）将项目详情 DTO 转为页面载荷（mapProjectDetailToPayload）
/**
 * 函数名：mapProjectDetailToPayload
 * 功能：将 GET /projects/{projectId} 响应映射为 ProjectDetailPayload。
 */
export function mapProjectDetailToPayload(dto: ProjectDetailDto): ProjectDetailPayload {
  return {
    title: dto.title,
    summary: dto.summary,
    channel: dto.channel,
    channelLabel: resolveProjectChannelLabel(dto.channel, dto.campusRecruitType),
    campusRecruitType: dto.campusRecruitType,
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
