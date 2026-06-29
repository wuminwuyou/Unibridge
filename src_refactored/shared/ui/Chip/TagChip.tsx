// 01）标签 Chip 原子（TagChip）
import styles from './TagChip.module.css'

/**
 * 函数名：TagChip
 * 功能：通用标签 chip 原子组件——支持选中态与可移除态，无业务语义。
 * 实现方法：
 * - 渲染内联 flex 标签块
 * - selected 为 true 时附加突出样式
 * - onRemove 存在时展示 × 按钮
 * 输入：
 * - label / selected / onClick / onRemove
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export interface TagChipProps {
  /** 标签文本 */
  label: string
  /** 是否选中 */
  selected: boolean
  /** 点击回调（切换选中 / 添加） */
  onClick: () => void
  /** 移除回调（存在时显示 × 按钮） */
  onRemove?: () => void
}

export function TagChip({ label, selected, onClick, onRemove }: TagChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove ?? onClick}
      className={`${styles.chip} ${selected ? styles.selected : ''}`.trim()}
    >
      {label}
      {onRemove ? ' ×' : null}
    </button>
  )
}
