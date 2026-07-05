// 01）网格笔记卡片底部统计（GridNoteCardFooter）
import { Eye } from 'lucide-react'
import { formatMetricCount } from '@shared/lib'
import { resolveGridNoteSmartUpdateTime } from '../lib/grid-note-card-utils'

// 02）网格笔记卡片底部组件（GridNoteCardFooter）
/**
 * 函数名：GridNoteCardFooter
 * 功能：展示网格笔记卡片底部浏览量与智能更新时间。
 * 实现方法：
 * - 仅保留浏览量指标，去掉收藏/点赞等低频噪音字段
 * - 有修改时展示「修改于 + 日期」，未修改则展示相对时效
 * 输入：
 * - views：浏览量
 * - publishTime：发布时间
 * - updateTime：最近更新时间
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function GridNoteCardFooter({
  views,
  publishTime,
  updateTime,
}: {
  views: number
  publishTime: string
  updateTime: string
}) {
  const smartTime = resolveGridNoteSmartUpdateTime(publishTime, updateTime)

  return (
    <div className="grid-note-card__footer">
      <div className="grid-note-card__stats">
        <span className="grid-note-card__stat">
          <Eye aria-hidden="true" />
          {formatMetricCount(views)}
        </span>
      </div>
      <span className="grid-note-card__time">
        {smartTime.kind === 'modified' ? `修改于 · ${smartTime.dateLabel}` : smartTime.label}
      </span>
    </div>
  )
}
