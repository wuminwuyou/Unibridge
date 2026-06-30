// 01）项目详情 Hero 纯展示组件（ProjectDetailHero）
// 职责：频道 pill、发布状态 pill、LevelBadge、标题、摘要、技能标签
// 禁止：navigate / API / feature import
import type { ProjectDetailPayload } from '../../model/projectDetailViewModel'
import LevelBadge from '@shared/ui/LevelBadge/LevelBadge'
import styles from './ProjectDetailHero.module.css'

// 02）发布状态文案（publishStatusLabelMap）
const publishStatusLabelMap: Record<ProjectDetailPayload['publishStatus'], string> = {
  DRAFT: '草稿',
  PREVIEW: '预览',
  PUBLISHED: '已发布',
}

// 03）Hero Props（ProjectDetailHeroProps）
export interface ProjectDetailHeroProps {
  project: ProjectDetailPayload
  /** 是否展示返回编辑链接（ProjectDetailView 根据 isEditorialFlow 控制） */
  showBackLink?: boolean
  /** 返回链接插槽，由上层注入 Link / navigate 行为 */
  backLinkSlot?: React.ReactNode
}

// 04）项目详情 Hero（ProjectDetailHero）
/**
 * 函数名：ProjectDetailHero
 * 功能：纯展示项目头部：频道 / 状态 / 等级徽章 + 标题 + 摘要 + 技能标签。
 * 输入：
 * - project：ProjectDetailPayload
 * - showBackLink：是否展示返回链接区
 * - backLinkSlot：返回链接 JSX 插槽
 * 输出：
 * - 返回值：React 节点
 */
export function ProjectDetailHero({ project, showBackLink, backLinkSlot }: ProjectDetailHeroProps) {
  const statusLabel = publishStatusLabelMap[project.publishStatus]

  return (
    <header className={styles.hero}>
      {showBackLink && backLinkSlot ? (
        <div className={styles.back}>
          {backLinkSlot}
        </div>
      ) : null}
      <div className={styles.meta}>
        <span className={styles.channel}>{project.channelLabel}</span>
        <span
          className={`${styles.status} ${
            project.publishStatus === 'DRAFT'
              ? styles.statusDraft
              : project.publishStatus === 'PREVIEW'
                ? styles.statusPreview
                : styles.statusPublished
          }`}
        >
          {statusLabel}
        </span>
        <LevelBadge level={project.level} variant="pill" />
      </div>
      <h1 className={styles.title}>{project.title}</h1>
      <p className={styles.summary}>{project.summary}</p>
      <div className={styles.tags}>
        {project.skillTags.length > 0 ? (
          project.skillTags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))
        ) : (
          <span className={`${styles.tag} ${styles.tagMuted}`}>暂无技能标签</span>
        )}
      </div>
    </header>
  )
}
