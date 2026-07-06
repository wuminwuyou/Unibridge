// 01）项目详情内容区组件（ProjectDetailContent）
// 职责：Hero + 侧栏（发布者 + 合作信息）+ 正文区域，不含 TopNavbar / banner / 状态卡片
// 由 pages 层传入 viewModel 数据

import { useLayoutEffect, useRef, useState } from 'react'
import {
  ProjectDetailHero,
  ProjectCooperationCard,
  ProjectPublisherCard,
  ProjectDetailContentSection,
} from '@entities/project'
import { ContentReader } from '@shared/ui/MarkdownReader'
import type { ProjectDetailPayload } from '@entities/project'
import styles from './ProjectDetailWidget.module.css'

// 02）ProjectDetailContent Props
export interface ProjectDetailContentProps {
  project: ProjectDetailPayload
}

// 03）ProjectDetailContent
function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroHeight, setHeroHeight] = useState(0)

  useLayoutEffect(() => {
    if (heroRef.current) {
      setHeroHeight(heroRef.current.offsetHeight)
    }
  }, [project])

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div style={{ height: heroHeight > 0 ? heroHeight + 56 : undefined }} />
        <div className={styles.sidebarSticky}>
          {project.owner && <ProjectPublisherCard owner={project.owner} />}
          <ProjectCooperationCard
            amountMin={project.amountMin}
            amountMax={project.amountMax}
            duration={project.duration}
          />
        </div>
      </aside>
      <div className={styles.rightColumn}>
        <div ref={heroRef}>
          <ProjectDetailHero project={project} />
        </div>
        <main className={styles.main}>
          <ProjectDetailContentSection editorType={project.descriptionEditorType}>
            <ContentReader
              contentLongtext={{
                editorType: project.descriptionEditorType,
                longtext: project.description,
              }}
              className={styles.content}
            />
          </ProjectDetailContentSection>
        </main>
      </div>
    </div>
  )
}

export default ProjectDetailContent
