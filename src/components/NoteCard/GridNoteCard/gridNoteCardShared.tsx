import type { ProfileNoteItem } from '../../../pages/ProfileSpace/components/types'
import { Eye, Heart, MoreHorizontal, ThumbsUp } from 'lucide-react'
import { type MouseEvent } from 'react'
import {
  formatGridNoteMetricCount,
  resolveGridNoteRelativeTime,
} from './gridNoteCardUtils'

// 01）网格笔记卡片数据（GridNoteCardNote）
export type GridNoteCardNote = ProfileNoteItem

// 02）网格笔记卡片页脚参数（GridNoteCardFooterProps）
interface GridNoteCardFooterProps {
  views: number
  comments: number
  favorites: number
  publishTime: string
}

// 03）阻止菜单点击触发卡片跳转（stopGridNoteCardMenuNavigation）
/**
 * 函数名：stopGridNoteCardMenuNavigation
 * 功能：阻止右上角更多按钮的点击事件冒泡到卡片 Link。
 * 实现方法：
 * - 调用 preventDefault 与 stopPropagation
 * 输入：
 * - event：按钮点击事件
 * 输出：
 * - 返回值：void
 * - 副作用：无
 */
export function stopGridNoteCardMenuNavigation(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault()
  event.stopPropagation()
}

// 04）网格笔记卡片更多操作按钮（GridNoteCardMenuButton）
interface GridNoteCardMenuButtonProps {
  className?: string
}

/**
 * 函数名：GridNoteCardMenuButton
 * 功能：渲染卡片右上角「更多操作」按钮。
 * 输入：
 * - className：可选附加类名
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function GridNoteCardMenuButton({ className }: GridNoteCardMenuButtonProps) {
  return (
    <button
      type="button"
      className={className ? `grid-note-card__menu ${className}` : 'grid-note-card__menu'}
      aria-label="更多操作"
      onClick={stopGridNoteCardMenuNavigation}
    >
      <MoreHorizontal size={16} aria-hidden="true" />
    </button>
  )
}

// 05）网格笔记卡片页脚（GridNoteCardFooter）
/**
 * 函数名：GridNoteCardFooter
 * 功能：渲染社交指标行：左侧图标计数，右侧相对时间。
 * 实现方法：
 * - 左侧依次展示浏览、收藏、点赞 Lucide 图标与紧凑计数
 * - 右侧展示相对发布时间文案
 * 输入：
 * - views：浏览量
 * - comments：评论/点赞数
 * - favorites：收藏数
 * - publishTime：发布时间字符串
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function GridNoteCardFooter({ views, comments, favorites, publishTime }: GridNoteCardFooterProps) {
  return (
    <div className="grid-note-card__footer">
      <div className="grid-note-card__stats">
        <span className="grid-note-card__stat">
          <Eye size={14} aria-hidden="true" />
          {formatGridNoteMetricCount(views)}
        </span>
        <span className="grid-note-card__stat">
          <Heart size={14} aria-hidden="true" />
          {formatGridNoteMetricCount(favorites)}
        </span>
        <span className="grid-note-card__stat">
          <ThumbsUp size={14} aria-hidden="true" />
          {formatGridNoteMetricCount(comments)}
        </span>
      </div>
      <span className="grid-note-card__time">{resolveGridNoteRelativeTime(publishTime)}</span>
    </div>
  )
}

// 06）网格笔记作者栏（GridNoteCardAuthor）
interface GridNoteCardAuthorProps {
  authorAvatar?: string
  authorFallback: string
  authorText: string
}

/**
 * 函数名：GridNoteCardAuthor
 * 功能：渲染作者圆形头像与「姓名 · 组织」身份栏。
 * 实现方法：
 * - 有 authorAvatar 时渲染 img，否则渲染首字占位圆
 * - 单行截断展示 authorText
 * 输入：
 * - authorAvatar：头像 URL，可选
 * - authorFallback：无头像时的占位字符
 * - authorText：作者身份展示文案
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function GridNoteCardAuthor({ authorAvatar, authorFallback, authorText }: GridNoteCardAuthorProps) {
  return (
    <div className="grid-note-card__author">
      {authorAvatar ? (
        <img className="grid-note-card__author-avatar" src={authorAvatar} alt="" loading="lazy" />
      ) : (
        <span className="grid-note-card__author-avatar">{authorFallback}</span>
      )}
      <span className="grid-note-card__author-text">{authorText}</span>
    </div>
  )
}
