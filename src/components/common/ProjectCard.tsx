import type { ProjectItem } from '../home/types'
import LevelBadge from './LevelBadge'
import { Link } from 'react-router-dom'
import { memo } from 'react'

// 01）项目卡片组件参数类型（ProjectCardProps）
interface ProjectCardProps {
  project: ProjectItem
}

// 02）项目卡片组件（ProjectCard）
/**
 * 函数名：ProjectCard
 * 功能：渲染单个项目信息卡片，展示标题、简介、标签、难度、金额与操作按钮。
 * 实现方法：
 * - 根据 project 对象渲染结构化项目信息
 * - 使用全局 LevelBadge 组件统一渲染难度等级颜色与文案
 * - 循环渲染标签列表并展示底部企业发布信息
 * 输入：
 * - project：单条项目完整数据
 * 输出：
 * - 返回值：JSX.Element，单条项目卡片结构
 * - 副作用：无
 */
function ProjectCard({ project }: ProjectCardProps) {
  const hasAmount: boolean = project.amount.trim().length > 0
  const projectDetailPath = `/project-detail?title=${encodeURIComponent(project.title)}`

  return (
    <Link className="project-card project-card--link" to={projectDetailPath} target="_blank" rel="noopener noreferrer">
      <div className="project-card__head">
        <div className="project-card__meta">
          <h3>{project.title}</h3>
          <p>{project.summary}</p>
        </div>
        <div className="project-card__value">
          <LevelBadge level={project.level} className="project-card__level" />
          {hasAmount ? <strong>{project.amount}</strong> : null}
        </div>
      </div>

      <div className="project-tags">
        {project.tags.map((tag) => (
          <span key={`${project.title}-${tag.label}`} className="project-tag">
            {tag.label}
          </span>
        ))}
      </div>

      <div className="project-card__foot">
        <div className="publisher-info">
          <span>{project.company}</span>
          <span>{project.publisher}</span>
          <span>{project.publishTime}</span>
        </div>
        <span className="interest-button" aria-hidden="true">
          感兴趣
        </span>
      </div>
    </Link>
  )
}

export default memo(ProjectCard)
