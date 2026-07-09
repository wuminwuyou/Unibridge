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

// 02）格式化预算区间（formatBudgetRange）
/**
 * 函数名：formatBudgetRange
 * 功能：将 min/max 数字字符串格式化为短区间文本。
 * 格式化规则：
 * - >= 1,000,000 → "xM"（如 1,200,000 → "1.2M"）
 * - >= 1,000 → "xk"（如 5,000 → "5k"）
 * - 否则保留原数字
 * - 两端都缺少时返回 '—'
 * 输入：
 * - amountMin / amountMax：可选数字字符串
 * 输出：
 * - 返回值：格式化后的短字符串（如 "5k–1.2M"）
 * - 副作用：无
 */
export function formatBudgetRange(amountMin?: string | null, amountMax?: string | null): string {
  const fmt = (value: string | null | undefined): string => {
    if (!value) return ''
    const n = parseInt(value, 10)
    if (Number.isNaN(n)) return ''
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
    return String(n)
  }
  const min = fmt(amountMin)
  const max = fmt(amountMax)
  if (!min && !max) return '—'
  if (min && max) return `${min} – ${max}`
  return min || max
}

// 03）拼接卡片 meta 信息（resolveProjectCardMetaText）
/**
 * 函数名：resolveProjectCardMetaText
 * 功能：将发布主体名称 + 发布人 + 项目周期拼接为底部 meta 字符串。
 * 输入：
 * - p：Partial ProjectItem（只需 ownerOrganization / publisherName / duration）
 * 输出：
 * - 返回值：供 ProjectCard 展示的字符串（如 "字节跳动 · 张三 · 30 天" 或 "阿里云 · 60 天"）
 * - 副作用：无
 */
export function resolveProjectCardMetaText(
  p: Pick<ProjectItem, 'ownerOrganization' | 'duration'> & { publisherName?: string | null },
): string {
  const parts: string[] = []
  if (p.publisherName?.trim()) parts.push(p.publisherName.trim())
  if (p.ownerOrganization?.trim()) parts.push(p.ownerOrganization.trim())
  if (p.duration?.trim()) parts.push(p.duration.trim())
  return parts.join(' · ')
}

export function resolveProjectStatusLabel(status: ProjectStatus): string {
  const m: Record<ProjectStatus, string> = { DRAFT: '草稿', OPEN: '招募中', ONGOING: '进行中', CLOSED: '已结项' }; return m[status]
}
export function resolveProjectStatusBadgeModifier(status: ProjectStatus): string { return `project-card__status-badge--${status.toLowerCase()}` }
