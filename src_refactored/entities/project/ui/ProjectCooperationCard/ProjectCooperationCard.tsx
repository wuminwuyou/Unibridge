// 01）合作信息卡片纯展示组件（ProjectCooperationCard）
// 职责：展示预算区间、周期两项信息
// 禁止：navigate / API / feature import
import { CircleDollarSign, Clock3 } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './ProjectCooperationCard.module.css'

// 02）合作信息卡片 Props（ProjectCooperationCardProps）
export interface ProjectCooperationCardProps {
  amountMin: string
  amountMax: string
  duration: string
  /** 允许上层注入自定义图标，不传则使用默认 */
  icons?: {
    amount?: ReactNode
    duration?: ReactNode
  }
}

// 03）合作信息卡片（ProjectCooperationCard）
/**
 * 函数名：ProjectCooperationCard
 * 功能：纯展示项目合作信息：预算区间 / 周期。
 * 输入：
 * - amountMin / amountMax：预算区间两端值
 * - duration：周期文案
 * - icons：可选图标插槽
 * 输出：
 * - 返回值：React 节点
 */
export function ProjectCooperationCard({
  amountMin,
  amountMax,
  duration,
  icons,
}: ProjectCooperationCardProps) {
  const amountDisplay = [amountMin, amountMax].filter(Boolean).join(' – ')

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>合作信息</h2>
      <ul className={styles.facts}>
        <li className={styles.factItem}>
          {icons?.amount ?? <CircleDollarSign className="h-4 w-4" aria-hidden="true" />}
          <span>预算</span>
          <strong className={styles.factValue}>{amountDisplay}</strong>
        </li>
        <li className={styles.factItem}>
          {icons?.duration ?? <Clock3 className="h-4 w-4" aria-hidden="true" />}
          <span>周期</span>
          <strong className={styles.factValue}>{duration}</strong>
        </li>
      </ul>
    </section>
  )
}
