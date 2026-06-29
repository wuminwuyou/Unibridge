// 01）频道选项卡片（ChannelOptionCard）
import styles from './ChannelOptionCard.module.css'

/**
 * 函数名：ChannelOptionCard
 * 功能：发布频道选项的纯展示卡片——选中态由 selected prop 控制，点击由 onClick prop 注入，无业务切换逻辑。
 * 实现方法：
 * - 渲染 label + description 文本
 * - selected 为 true 时附加 active 样式
 * 输入：
 * - label / description / selected / onClick
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无（不触发 setState / navigate / API）
 */
export interface ChannelOptionCardProps {
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

export function ChannelOptionCard({ label, description, selected, onClick }: ChannelOptionCardProps) {
  return (
    <label
      className={`${styles.card} ${selected ? styles.active : ''}`.trim()}
      onClick={onClick}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.description}>{description}</span>
    </label>
  )
}
