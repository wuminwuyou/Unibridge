import type { ProjectItem } from './types'

// 01）项目卡片组件参数类型（ProjectCardProps）
interface ProjectCardProps {
  project: ProjectItem
  levelColorMap: Record<ProjectItem['level'], string>
}

// 02）项目卡片组件（ProjectCard）
/**
 * 函数名：ProjectCard
 * 功能：渲染单个项目信息卡片，展示标题、简介、标签、难度、金额与操作按钮。
 * 实现方法：
 * - 根据 project 对象渲染结构化项目信息
 * - 使用 levelColorMap 为难度等级映射对应颜色
 * - 循环渲染标签列表并展示底部企业发布信息
 * 输入：
 * - project：单条项目完整数据
 * - levelColorMap：难度等级到颜色值的映射表
 * 输出：
 * - 返回值：JSX.Element，单条项目卡片结构
 * - 副作用：无
 */
function ProjectCard({ project, levelColorMap }: ProjectCardProps) {
  return (
    <article className="project-card">
      <div className="project-card__head">
        <div className="project-card__meta">
          <h3>{project.title}</h3>
          <p>{project.summary}</p>
        </div>
        <div className="project-card__value">
          <span style={{ color: levelColorMap[project.level] }}>{project.level}</span>
          <strong>{project.amount}</strong>
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
        <button type="button" className="interest-button">
          感兴趣
        </button>
      </div>
    </article>
  )
}

export default ProjectCard
