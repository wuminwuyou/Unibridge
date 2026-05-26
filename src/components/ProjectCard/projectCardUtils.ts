import { isProjectResourceUid } from '../../api/resourceUid'
import type { ProjectItem, ProjectRecruitmentType, ProjectStatus } from '../../types/project'

// 01）Simple Icons CDN 前缀（SIMPLE_ICONS_CDN_BASE）
const SIMPLE_ICONS_CDN_BASE = 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons'

// 02）主体名称 → Logo 图标映射（organizationLogoIconMap）
const organizationLogoIconMap: Record<string, string> = {
  腾讯: 'tencentqq',
  Tencent: 'tencentqq',
  阿里云: 'alibabacloud',
  Alibaba: 'alibabacloud',
  英伟达: 'nvidia',
  NVIDIA: 'nvidia',
  华为: 'huawei',
  Huawei: 'huawei',
  字节跳动: 'bytedance',
  ByteDance: 'bytedance',
  微软: 'microsoft',
  Microsoft: 'microsoft',
}

// 03）招募子类型展示文案（projectRecruitmentTypeLabelMap）
const projectRecruitmentTypeLabelMap: Record<ProjectRecruitmentType, string> = {
  LAB_RECRUIT: '实验室招募',
  TEAM_RECRUIT: '团队招募',
  CAMPUS_PRACTICE: '校园实践',
  PERSONAL_RECRUIT: '个人招募',
}

// 04）解析项目卡片类型标签（resolveProjectCardTypeBadge）
/**
 * 函数名：resolveProjectCardTypeBadge
 * 功能：根据 project.category 与 recruitment_type 生成卡片类型标签。
 * 输入：
 * - project：含 category、recruitmentType 的项目卡片数据
 * 输出：
 * - 返回值：类型标签字符串
 */
export function resolveProjectCardTypeBadge(
  project: Pick<ProjectItem, 'category' | 'recruitmentType'>,
): string {
  if (project.category === 'COMMERCIAL') {
    return '企业实战'
  }

  if (project.recruitmentType) {
    return projectRecruitmentTypeLabelMap[project.recruitmentType] ?? '招募项目'
  }

  return '招募项目'
}

// 05）解析项目详情跳转路径（resolveProjectDetailHref）
/**
 * 函数名：resolveProjectDetailHref
 * 功能：优先使用 project uid 跳转详情，否则回退 title 查询参数。
 * 输入：
 * - project：含 uid、title 的项目卡片数据
 * 输出：
 * - 返回值：详情页路径
 * - 副作用：无
 */
export function resolveProjectDetailHref(project: Pick<ProjectItem, 'uid' | 'title'>): string {
  if (isProjectResourceUid(project.uid)) {
    return `/project-detail?uid=${encodeURIComponent(project.uid)}`
  }

  return `/project-detail?title=${encodeURIComponent(project.title)}`
}

// 06）解析主体 Logo SVG 地址（resolveProjectLogoSvgUrl）
/**
 * 函数名：resolveProjectLogoSvgUrl
 * 功能：优先使用 logoSvgUrl，否则按主体名称匹配 design.md 样例图标。
 * 输入：
 * - project：含 logoSvgUrl、ownerOrganization 的项目数据
 * 输出：
 * - 返回值：SVG URL 或 null（无匹配时由组件展示占位）
 */
export function resolveProjectLogoSvgUrl(
  project: Pick<ProjectItem, 'logoSvgUrl' | 'ownerOrganization'>,
): string | null {
  const explicitUrl = project.logoSvgUrl?.trim()
  if (explicitUrl) {
    return explicitUrl
  }

  const organization = project.ownerOrganization.trim()
  if (!organization) {
    return null
  }

  for (const [keyword, iconSlug] of Object.entries(organizationLogoIconMap)) {
    if (organization.includes(keyword)) {
      return `${SIMPLE_ICONS_CDN_BASE}/${iconSlug}.svg`
    }
  }

  return null
}

// 07）解析主体 Logo 占位缩写（resolveProjectLogoFallbackText）
/**
 * 函数名：resolveProjectLogoFallbackText
 * 功能：无 SVG 时取主体名称前两字作为 Logo 占位文本。
 */
export function resolveProjectLogoFallbackText(ownerOrganization: string): string {
  const trimmed = ownerOrganization.trim()
  if (!trimmed) {
    return '项'
  }

  return trimmed.slice(0, 2)
}

// 08）解析卡片底部元信息文案（resolveProjectCardMetaText）
/**
 * 函数名：resolveProjectCardMetaText
 * 功能：合并主体名称、团队人数、预计周期为一行灰色元信息。
 * 输入：
 * - project：含 ownerOrganization、teamSize、duration
 * 输出：
 * - 返回值：以「 · 」连接的展示文案
 */
export function resolveProjectCardMetaText(
  project: Pick<ProjectItem, 'ownerOrganization' | 'teamSize' | 'duration'>,
): string {
  return [project.ownerOrganization?.trim(), project.teamSize?.trim(), project.duration?.trim()]
    .filter(Boolean)
    .join(' · ')
}

// 09）解析项目状态展示文案（resolveProjectStatusLabel）
/**
 * 函数名：resolveProjectStatusLabel
 * 功能：将 project.status 转为 ProfileSpace 卡片角标中文文案。
 * 输入：
 * - status：ProjectStatus
 * 输出：
 * - 返回值：中文状态标签
 * - 副作用：无
 */
export function resolveProjectStatusLabel(status: ProjectStatus): string {
  const statusLabelMap: Record<ProjectStatus, string> = {
    DRAFT: '草稿',
    OPEN: '招募中',
    ONGOING: '进行中',
    CLOSED: '已结项',
  }

  return statusLabelMap[status]
}

// 10）解析项目状态角标样式修饰符（resolveProjectStatusBadgeModifier）
/**
 * 函数名：resolveProjectStatusBadgeModifier
 * 功能：为项目状态角标生成 BEM 修饰 class 名。
 * 输入：
 * - status：ProjectStatus
 * 输出：
 * - 返回值：CSS 修饰 class
 * - 副作用：无
 */
export function resolveProjectStatusBadgeModifier(status: ProjectStatus): string {
  return `project-card__status-badge--${status.toLowerCase()}`
}
