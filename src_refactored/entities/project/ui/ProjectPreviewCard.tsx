// 01）项目预览卡片（ProjectPreviewCard）
/**
 * 函数名：ProjectPreviewCard
 * 功能：发布页右侧的只读预览卡片——展示 badge / 标题 / 摘要 / 预算 / 技能标签。
 * 实现方法：
 * - 纯展示，所有数据由 props 注入
 * 输入：
 * - badge / title / summary / amount / tags / level
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { Sparkles } from 'lucide-react'
import styles from './ProjectPreviewCard.module.css'

export interface ProjectPreviewCardProps {
  /** 左上角频道/类型角标文本 */
  badge: string
  /** 项目标题 */
  title: string
  /** 一句话摘要 */
  summary: string
  /** 预算文本 */
  amount: string
  /** 能力等级 */
  level: string
  /** 技能标签列表（根据截断后展示） */
  tags: string[]
}

export function ProjectPreviewCard({ badge, title, summary, amount, level, tags }: ProjectPreviewCardProps) {
  const displayTags = tags.length > 0 ? tags.slice(0, 4) : ['标签']

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <Sparkles className={styles.headerIcon} />
        卡片预览
      </div>
      <article className={styles.card}>
        <div className={styles.topRow}>
          <span className={styles.badge}>{badge}</span>
          <span className={styles.level}>{level}</span>
        </div>
        <h3 className={styles.title}>
          {title.trim() || '项目标题将显示在这里'}
        </h3>
        <p className={styles.summary}>
          {summary || '摘要将显示在卡片副标题区域'}
        </p>
        <p className={styles.amount}>
          {amount.trim() || '预算待填写'}
        </p>
        <div className={styles.tagList}>
          {displayTags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </article>
    </section>
  )
}
