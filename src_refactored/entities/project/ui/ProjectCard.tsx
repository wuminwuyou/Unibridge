// 01）项目卡片纯展示组件（ProjectCard）
import type { ProjectItem } from '../../../shared/types/project'
import LevelBadge from '../../../shared/ui/LevelBadge'
import { memo, useState } from 'react'
import {
  resolveProjectCardMetaText,
  resolveProjectCardTypeBadge,
  resolveProjectDetailHref,
  resolveProjectLogoFallbackText,
  resolveProjectLogoSvgUrl,
  resolveProjectStatusBadgeModifier,
  resolveProjectStatusLabel,
} from './projectCardUtils'
import './ProjectCard.css'

// 02）项目卡片组件参数类型（ProjectCardProps）
export interface ProjectCardProps {
  project: ProjectItem
  showStatus?: boolean
  /** 槽位：卡片点击跳转回调，由上层注入；不传则默认渲染 <Link> */
  onClick?: (uid: string, title: string) => void
}

function ProjectCard({ project, showStatus = false, onClick }: ProjectCardProps) {
  const detailPath = resolveProjectDetailHref(project)
  const typeBadgeLabel = resolveProjectCardTypeBadge(project)
  const metaText = resolveProjectCardMetaText(project)
  const logoSvgUrl = resolveProjectLogoSvgUrl(project)
  const logoFallbackText = resolveProjectLogoFallbackText(project.ownerOrganization)
  const [logoLoadFailed, setLogoLoadFailed] = useState(false)
  const showLogoImage = Boolean(logoSvgUrl) && !logoLoadFailed
  const shouldShowStatusBadge = showStatus && project.status != null
  const statusBadgeLabel = project.status ? resolveProjectStatusLabel(project.status) : ''
  const statusBadgeModifier = project.status ? resolveProjectStatusBadgeModifier(project.status) : ''

  const inner = (
    <div className="project-card__inner">
      <div className="project-card__logo">
        {shouldShowStatusBadge ? (
          <span className={`project-card__status-badge ${statusBadgeModifier}`}>{statusBadgeLabel}</span>
        ) : null}
        {showLogoImage ? (
          <img className="project-card__logo-image" src={logoSvgUrl ?? undefined} alt="" loading="lazy" decoding="async" onError={() => setLogoLoadFailed(true)} />
        ) : (
          <span className="project-card__logo-fallback">{logoFallbackText}</span>
        )}
      </div>
      <div className="project-card__main">
        <span className="project-card__type-badge">{typeBadgeLabel}</span>
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__preview">{project.preview}</p>
        {project.tags.length > 0 ? (
          <div className="project-card__tags">
            {project.tags.map((tag) => (
              <span key={`${project.title}-${tag.label}`} className="project-card__tag">#{tag.label}</span>
            ))}
          </div>
        ) : null}
        {metaText ? <p className="project-card__meta">{metaText}</p> : null}
      </div>
      <div className="project-card__aside">
        <LevelBadge level={project.level} variant="pill" className="project-card__level" />
        <span className="project-card__cta" aria-hidden="true">看看细节</span>
      </div>
    </div>
  )

  // 槽位模式：上层注入 onClick 时渲染 div，否则默认 <a>
  if (onClick) {
    return (
      <div className="project-card" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick(project.uid ?? '', project.title) }} onClick={() => onClick(project.uid ?? '', project.title)} style={{ cursor: 'pointer' }}>
        {inner}
      </div>
    )
  }

  return (
    <a className="project-card project-card--link" href={detailPath}>
      {inner}
    </a>
  )
}

export default memo(ProjectCard)
