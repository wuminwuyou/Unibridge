// 01）发布项目页布局（ProjectPublishLayout）
import type { ReactNode } from 'react'
import styles from '../project-publish-layout.module.css'

export interface ProjectPublishLayoutProps {
  form: ReactNode
  preview: ReactNode
  footer: ReactNode
}

export function ProjectPublishLayout({ form, preview, footer }: ProjectPublishLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.layout}>
          {form}
          {preview}
        </div>
      </div>
      {footer}
    </div>
  )
}
