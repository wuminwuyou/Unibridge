// 01）发布项目预览（ProjectPublishPreview）
// 组合 entities ProjectPreviewCard + shared/ui/Checklist
import { ProjectPreviewCard } from '@entities/project/ui/ProjectPreviewCard'
import { ChecklistItem } from '@shared/ui/Checklist'
import styles from './project-publish-preview.module.css'

export interface ProjectPublishPreviewProps {
  badge: string
  title: string
  summary: string
  amount: string
  level: string
  tags: string[]
  checklistItems: string[]
}

export function ProjectPublishPreview({
  badge,
  title,
  summary,
  amount,
  level,
  tags,
  checklistItems,
}: ProjectPublishPreviewProps) {
  return (
    <aside className={styles.aside}>
      <ProjectPreviewCard
        badge={badge}
        title={title}
        summary={summary}
        amount={amount}
        level={level}
        tags={tags}
      />

      <section className={styles.checkCard}>
        <h3 className={styles.checkTitle}>发布前检查</h3>
        <ul className={styles.checkList}>
          {checklistItems.map((item) => (
            <ChecklistItem key={item} text={item} />
          ))}
        </ul>
      </section>
    </aside>
  )
}
