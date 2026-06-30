// 01）项目卡片工具函数（projectCardUtils）
import type { ProjectItem, ProjectRecruitmentType, ProjectStatus } from '../../../shared/types/project'
import { resolveProjectDetailHref as resolveProjectDetailPath } from '../../../shared/lib/projectRoutes'

export { resolveProjectDetailPath as resolveProjectDetailHref }

const SIMPLE_ICONS_CDN_BASE = 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons'
const organizationLogoIconMap: Record<string, string> = { 腾讯: 'tencentqq', Tencent: 'tencentqq', 阿里云: 'alibabacloud', Alibaba: 'alibabacloud', 英伟达: 'nvidia', NVIDIA: 'nvidia', 华为: 'huawei', Huawei: 'huawei', 字节跳动: 'bytedance', ByteDance: 'bytedance', 微软: 'microsoft', Microsoft: 'microsoft' }
const projectRecruitmentTypeLabelMap: Record<ProjectRecruitmentType, string> = { LAB_RECRUIT: '实验室招募', TEAM_RECRUIT: '团队招募', CAMPUS_PRACTICE: '校园实践', PERSONAL_RECRUIT: '个人招募' }

export function resolveProjectCardTypeBadge(project: Pick<ProjectItem, 'category' | 'recruitmentType'>): string {
  if (project.category === 'COMMERCIAL') return '企业实战'
  if (project.recruitmentType) return projectRecruitmentTypeLabelMap[project.recruitmentType] ?? '招募项目'
  return '招募项目'
}

export function resolveProjectLogoSvgUrl(project: Pick<ProjectItem, 'logoSvgUrl' | 'ownerOrganization'>): string | null {
  const explicitUrl = project.logoSvgUrl?.trim(); if (explicitUrl) return explicitUrl
  const org = project.ownerOrganization.trim(); if (!org) return null
  for (const [k, slug] of Object.entries(organizationLogoIconMap)) { if (org.includes(k)) return `${SIMPLE_ICONS_CDN_BASE}/${slug}.svg` }
  return null
}

export function resolveProjectLogoFallbackText(ownerOrganization: string): string { const t = ownerOrganization.trim(); return t ? t.slice(0, 2) : '项' }
export function resolveProjectCardMetaText(p: Pick<ProjectItem, 'ownerOrganization' | 'teamSize' | 'duration'>): string { return [p.ownerOrganization?.trim(), p.teamSize?.trim(), p.duration?.trim()].filter(Boolean).join(' · ') }

export function resolveProjectStatusLabel(status: ProjectStatus): string {
  const m: Record<ProjectStatus, string> = { DRAFT: '草稿', OPEN: '招募中', ONGOING: '进行中', CLOSED: '已结项' }; return m[status]
}
export function resolveProjectStatusBadgeModifier(status: ProjectStatus): string { return `project-card__status-badge--${status.toLowerCase()}` }
