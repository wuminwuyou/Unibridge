import { ArrowLeft, Calendar, CircleDollarSign, Clock3, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import LevelBadge from '../../components/common/LevelBadge'
import { ProjectContentReader } from '../../components/Reader'
import type { ProjectDetailPayload } from './types'
import './ProjectDetailPage.css'

// 01）项目详情视图 Props（ProjectDetailViewProps）
interface ProjectDetailViewProps {
  project: ProjectDetailPayload
  isEditorialFlow?: boolean
}

// 02）发布状态文案（publishStatusLabelMap）
const publishStatusLabelMap: Record<ProjectDetailPayload['publishStatus'], string> = {
  DRAFT: '草稿',
  PREVIEW: '预览',
  PUBLISHED: '已发布',
}

// 03）解析发布流程提示文案（resolveProjectEditorialBannerText）
function resolveProjectEditorialBannerText(status: ProjectDetailPayload['publishStatus']): string {
  if (status === 'PREVIEW') {
    return '当前为项目预览，请提前保存草稿'
  }
  if (status === 'DRAFT') {
    return '当前为项目草稿，可返回继续编辑'
  }
  return '项目已保存，可返回继续修改'
}

// 04）项目详情视图（ProjectDetailView）
/**
 * 函数名：ProjectDetailView
 * 功能：展示项目标题、合作信息、技能标签与 Markdown/富文本需求详情。
 * 输入：
 * - project：ProjectDetailPayload
 * - isEditorialFlow：来自发布页跳转时为 true
 * 输出：
 * - 返回值：React 节点
 */
export function ProjectDetailView({ project, isEditorialFlow = false }: ProjectDetailViewProps) {
  const statusLabel = publishStatusLabelMap[project.publishStatus]

  return (
    <div className={`project-detail-page ${isEditorialFlow ? 'project-detail-page--editorial' : ''}`.trim()}>
      <div className="project-detail-page__shell">
        {isEditorialFlow ? (
          <div className="detail-preview-banner" role="status">
            <p className="detail-preview-banner__text">{resolveProjectEditorialBannerText(project.publishStatus)}</p>
            <Link to="/publish/project" className="detail-preview-banner__action">
              <ArrowLeft className="h-4 w-4" />
              返回编辑
            </Link>
          </div>
        ) : null}

        <header className="project-detail-hero">
          {!isEditorialFlow ? (
            <Link to="/publish/project" className="project-detail-hero__back">
              <ArrowLeft className="h-4 w-4" />
              返回编辑
            </Link>
          ) : null}
          <div className="project-detail-hero__meta">
            <span className="project-detail-hero__channel">{project.channelLabel}</span>
            <span className={`project-detail-hero__status project-detail-hero__status--${project.publishStatus.toLowerCase()}`}>
              {statusLabel}
            </span>
            <LevelBadge level={project.level} variant="pill" />
          </div>
          <h1 className="project-detail-hero__title">{project.title}</h1>
          <p className="project-detail-hero__summary">{project.summary}</p>
          <div className="project-detail-hero__tags">
            {project.skillTags.length > 0 ? (
              project.skillTags.map((tag) => (
                <span key={tag} className="project-detail-hero__tag">
                  {tag}
                </span>
              ))
            ) : (
              <span className="project-detail-hero__tag project-detail-hero__tag--muted">暂无技能标签</span>
            )}
          </div>
        </header>

        <div className="project-detail-layout">
          <aside className="project-detail-sidebar">
            <section className="project-detail-card">
              <h2 className="project-detail-card__title">合作信息</h2>
              <ul className="project-detail-facts">
                <li>
                  <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
                  <span>预算</span>
                  <strong>{project.amount}</strong>
                </li>
                <li>
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  <span>周期</span>
                  <strong>{project.duration}</strong>
                </li>
                <li>
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span>团队</span>
                  <strong>{project.teamSize}</strong>
                </li>
                <li>
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>截止</span>
                  <strong>{project.deadline}</strong>
                </li>
              </ul>
            </section>
          </aside>

          <main className="project-detail-main">
            <section className="project-detail-card project-detail-card--content">
              <div className="project-detail-card__head">
                <h2 className="project-detail-card__title">需求详情</h2>
                <span className="project-detail-card__mode">
                  {project.descriptionEditorType === 'RICHTEXT' ? '所见即所得' : 'Markdown'}
                </span>
              </div>
              <ProjectContentReader
                contentLongtext={{
                  editorType: project.descriptionEditorType,
                  longtext: project.description,
                }}
                className="project-detail-content"
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
