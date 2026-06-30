// 01）项目详情正文区域纯展示组件（ProjectDetailContentSection）
// 职责：标题 + 编辑器模式 badge + children 插槽（Reader 由上层注入）
// 禁止：直接 import Reader / API / feature
import type { ReactNode } from 'react'
import styles from './ProjectDetailContentSection.module.css'

// 02）正文区域 Props（ProjectDetailContentSectionProps）
export interface ProjectDetailContentSectionProps {
  editorType: 'MARKDOWN' | 'RICHTEXT'
  /** Reader 插槽，上层注入 ContentReader */
  children: ReactNode
}

// 03）项目详情正文区域（ProjectDetailContentSection）
/**
 * 函数名：ProjectDetailContentSection
 * 功能：纯展示正文区域的壳：标题 + 模式 badge + 内容插槽。
 * 输入：
 * - editorType：编辑类型，用于显示「所见即所得」或「Markdown」badge
 * - children：正文内容（上层注入 ContentReader）
 * 输出：
 * - 返回值：React 节点
 */
export function ProjectDetailContentSection({
  editorType,
  children,
}: ProjectDetailContentSectionProps) {
  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>需求详情</h2>
        <span className={styles.mode}>
          {editorType === 'RICHTEXT' ? '所见即所得' : 'Markdown'}
        </span>
      </div>
      {children}
    </section>
  )
}
