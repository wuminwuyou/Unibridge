// 01）网格笔记卡片底部统计（GridNoteCardFooter）
import { Eye } from 'lucide-react'
import { formatMetricCount } from '@shared/lib'
import { resolveGridNoteSmartUpdateTime } from '../lib/grid-note-card-utils'
import { GridNoteCardMoreMenu } from './grid-note-card-more-menu'

// 02）网格笔记卡片底部 Props（GridNoteCardFooterProps）
export interface GridNoteCardFooterProps {
  views: number
  publishTime: string
  updateTime: string
  showMoreMenu?: boolean
  onNotInterestedInContent?: () => void
  onNotInterestedInAuthor?: () => void
}

// 03）网格笔记卡片底部组件（GridNoteCardFooter）
/**
 * 函数名：GridNoteCardFooter
 * 功能：展示网格笔记卡片底部浏览量、智能更新时间，可选 Footer 更多菜单。
 * 实现方法：
 * - 左侧浏览量；右侧时间 + 纵向三点更多菜单（非 ProfileSpace 场景）
 * 输入：
 * - views / publishTime / updateTime：展示数据
 * - showMoreMenu：是否展示更多菜单
 * - onNotInterestedInContent / onNotInterestedInAuthor：菜单回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function GridNoteCardFooter({
  views,
  publishTime,
  updateTime,
  showMoreMenu = false,
  onNotInterestedInContent,
  onNotInterestedInAuthor,
}: GridNoteCardFooterProps) {
  const smartTime = resolveGridNoteSmartUpdateTime(publishTime, updateTime)

  return (
    <div className="grid-note-card__footer">
      <div className="grid-note-card__stats">
        <span className="grid-note-card__stat">
          <Eye aria-hidden="true" />
          {formatMetricCount(views)}
        </span>
      </div>
      <div className="grid-note-card__footer-trailing">
        <span className="grid-note-card__time">
          {smartTime.kind === 'modified' ? `修改于 · ${smartTime.dateLabel}` : smartTime.label}
        </span>
        {showMoreMenu ? (
          <GridNoteCardMoreMenu
            onNotInterestedInContent={onNotInterestedInContent}
            onNotInterestedInAuthor={onNotInterestedInAuthor}
          />
        ) : null}
      </div>
    </div>
  )
}
