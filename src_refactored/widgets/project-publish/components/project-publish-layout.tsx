// 01）发布项目页布局（ProjectPublishLayout）
import type { ReactNode } from 'react'
import styles from '../project-publish-layout.module.css'

export interface ProjectPublishLayoutProps {
  left: ReactNode
  right: ReactNode
  footer: ReactNode
}

export function ProjectPublishLayout({ left, right, footer }: ProjectPublishLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.layout}>
          {left}
          {right}
        </div>
      </div>
      {footer}
    </div>
  )
}
