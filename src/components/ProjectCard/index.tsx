import type { ProjectItem } from '../../types/project'
import LevelBadge from '../common/LevelBadge'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import {
  resolveProjectCardMetaText,
  resolveProjectCardTypeBadge,
  resolveProjectDetailHref,
  resolveProjectLogoFallbackText,
  resolveProjectLogoSvgUrl,
} from './projectCardUtils'
import './ProjectCard.css'

// 01）项目卡片组件参数类型（ProjectCardProps）
interface ProjectCardProps {
  project: ProjectItem
}

// 02）项目卡片组件（ProjectCard）
/**
 * 函数名：ProjectCard
 * 功能：按 design.md 规范渲染三段式任务卡片（Logo / 主信息 / 交互区）。
 * 实现方法：
 * - 左侧渲染 entity logo 或占位缩写
 * - 中部展示类型标签、标题、预览、# 技术标签与元信息行
 * - 右侧展示 LevelBadge 与「看看细节」主按钮
 * 输入：
 * - project：单条项目完整数据
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function ProjectCard({ project }: ProjectCardProps) {
  const projectDetailPath = resolveProjectDetailHref(project)
  const typeBadgeLabel = resolveProjectCardTypeBadge(project)
  const metaText = resolveProjectCardMetaText(project)
  const logoSvgUrl = resolveProjectLogoSvgUrl(project)
  const logoFallbackText = resolveProjectLogoFallbackText(project.ownerOrganization)

  return (
    <Link className="project-card project-card--link" to={projectDetailPath} target="_blank" rel="noopener noreferrer">
      <div className="project-card__inner">
        <div className="project-card__logo" aria-hidden="true">
          {logoSvgUrl ? (
            <img className="project-card__logo-image" src={logoSvgUrl} alt="" loading="lazy" decoding="async" />
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
                <span key={`${project.title}-${tag.label}`} className="project-card__tag">
                  #{tag.label}
                </span>
              ))}
            </div>
          ) : null}

          {metaText ? <p className="project-card__meta">{metaText}</p> : null}
        </div>

        <div className="project-card__aside">
          <LevelBadge level={project.level} variant="pill" className="project-card__level" />
          <span className="project-card__cta" aria-hidden="true">
            看看细节
          </span>
        </div>
      </div>
    </Link>
  )
}

export default memo(ProjectCard)
