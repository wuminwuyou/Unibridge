// 01）检查清单条目原子（ChecklistItem）
/**
 * 函数名：ChecklistItem
 * 功能：通用检查清单条目原子——左侧打勾图标 + 文本，无业务语义。
 * 实现方法：
 * - 渲染 flex 行布局
 * - 左侧固定 CheckCircle2 图标
 * 输入：
 * - text：清单文本
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { CheckCircle2 } from 'lucide-react'
import styles from './ChecklistItem.module.css'

export interface ChecklistItemProps {
  /** 清单文本 */
  text: string
}

export function ChecklistItem({ text }: ChecklistItemProps) {
  return (
    <li className={styles.item}>
      <CheckCircle2 className={styles.icon} />
      {text}
    </li>
  )
}
