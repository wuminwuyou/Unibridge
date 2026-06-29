import type { ReactNode } from 'react'
import styles from '../PublishFormSection/PublishFormSection.module.css'

// 01）表单段容器 Props（FormSectionCardProps）
export interface FormSectionCardProps {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}

// 02）表单段容器原子组件（FormSectionCard）
/**
 * 函数名：FormSectionCard
 * 功能：发布表单分段卡片容器原子组件——仅提供 icon / title / description / children 插槽结构，无业务语义。
 * 实现方法：
 * - 段首图标 + 标题 + 描述区
 * - 下方 children 插槽渲染调用方填充的字段
 * - 样式使用全局 CSS 变量（--card-border / --card-bg / --text-main 等）
 * 输入：
 * - icon / title / description / children
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function FormSectionCard({ icon, title, description, children }: FormSectionCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}>{icon}</div>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
