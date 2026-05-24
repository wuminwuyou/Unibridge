import { MessageCircle } from 'lucide-react'
import './NoteCommentsSection.css'

// 01）笔记评论区 Props（NoteCommentsSectionProps）
export interface NoteCommentsSectionProps {
  commentCount: number
  className?: string
}

// 02）笔记评论区（NoteCommentsSection）
/**
 * 函数名：NoteCommentsSection
 * 功能：图文/视频笔记详情页共用的评论区占位 UI。
 * 实现方法：
 * - 展示评论数量标题
 * - 预留后续评论列表与输入框接入位
 * 输入：
 * - commentCount：评论总数
 * 输出：
 * - 返回值：React 节点
 */
export function NoteCommentsSection({ commentCount, className }: NoteCommentsSectionProps) {
  return (
    <section className={`note-comments-section ${className ?? ''}`.trim()} aria-label="评论区">
      <h2 className="note-comments-section__title">
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        讨论 ({commentCount})
      </h2>
      <div className="note-comments-section__placeholder">
        <p>评论区即将开放，敬请期待社区互动能力。</p>
      </div>
    </section>
  )
}
