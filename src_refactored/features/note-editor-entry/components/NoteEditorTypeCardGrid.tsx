// 01）笔记类型选择卡片网格（NoteEditorTypeCardGrid）
import {
  noteEditorTypeOptions,
  type NoteEditorRouteType,
} from '../constants/noteEditorTypeOptions'
import styles from './NoteEditorTypeModal.module.css'

// 02）卡片网格 Props（NoteEditorTypeCardGridProps）
export interface NoteEditorTypeCardGridProps {
  onSelect: (type: NoteEditorRouteType) => void
  gridClassName?: string
}

/**
 * 函数名：NoteEditorTypeCardGrid
 * 功能：渲染图文 / 视频两种笔记类型的选择卡片网格，供弹窗或兜底页复用。
 * 实现方法：
 * - 遍历 noteEditorTypeOptions 渲染 noteEditorTypeCard 按钮
 * - 点击卡片触发 onSelect 并传入对应 route type
 * 输入：
 * - onSelect：选定类型回调（article | video）
 * - gridClassName：可选，覆盖默认网格容器类名
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function NoteEditorTypeCardGrid({ onSelect, gridClassName }: NoteEditorTypeCardGridProps) {
  return (
    <div className={gridClassName ?? styles.noteEditorTypeModalGrid}>
      {noteEditorTypeOptions.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.type}
            type="button"
            className={styles.noteEditorTypeCard}
            onClick={() => onSelect(option.type)}
          >
            <span className={styles.noteEditorTypeCardIcon}>
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <span className={styles.noteEditorTypeCardLabel}>{option.label}</span>
            <span className={styles.noteEditorTypeCardDesc}>{option.description}</span>
          </button>
        )
      })}
    </div>
  )
}
