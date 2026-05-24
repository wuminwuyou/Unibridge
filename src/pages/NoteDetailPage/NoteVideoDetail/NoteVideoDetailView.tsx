import { useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  Eye,
  MoreHorizontal,
  Share2,
  ThumbsUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { NoteCommentsSection } from '../../../components/NoteCommentsSection'
import { NoteVideoPlayer } from '../../../components/NoteVideoPlayer'
import {
  formatNoteStatCount,
  noteDetailPublishStatusLabelMap,
  resolveNoteAuthorInitial,
  resolveNoteEditorialBannerText,
} from '../shared/noteDetailShared'
import type { NoteVideoDetailPayload } from './types'
import './NoteVideoDetailPage.css'

// 01）视频笔记详情视图 Props（NoteVideoDetailViewProps）
interface NoteVideoDetailViewProps {
  note: NoteVideoDetailPayload
  isEditorialFlow?: boolean
}

// 02）视频笔记详情视图（NoteVideoDetailView）
/**
 * 函数名：NoteVideoDetailView
 * 功能：视频模式笔记详情页；参考 YouTube 信息层级布局。
 * 实现方法：
 * - 标题置于播放器下方、作者行上方（较小字号、单行省略）
 * - 发布时间在昵称下方；浏览量位于点赞按钮左侧
 * - 简介区默认折叠，标签置于简介下方
 * 输入：
 * - note：NoteVideoDetailPayload
 * - isEditorialFlow：发布页回流时为 true
 * 输出：
 * - 返回值：React 节点
 */
export function NoteVideoDetailView({ note, isEditorialFlow = false }: NoteVideoDetailViewProps) {
  const statusLabel = noteDetailPublishStatusLabelMap[note.publishStatus]
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const hasSummary = Boolean(note.summary.trim())

  return (
    <div className={`note-video-page ${isEditorialFlow ? 'note-video-page--editorial' : ''}`.trim()}>
      <div className="note-video-page__shell">
        {isEditorialFlow ? (
          <div className="detail-preview-banner" role="status">
            <p className="detail-preview-banner__text">{resolveNoteEditorialBannerText(note.publishStatus)}</p>
            <Link to="/publish/note" className="detail-preview-banner__action">
              <ArrowLeft className="h-4 w-4" />
              返回编辑
            </Link>
          </div>
        ) : null
        }

        <section className="note-video-page__hero" aria-label="视频播放区">
          <div className="note-video-page__main">
            <NoteVideoPlayer videoUrl={note.videoUrl} posterUrl={note.coverUrl} className="note-video-page__player" />

            <h1 className="note-video-page__title" title={note.title}>
              {note.title}
            </h1>

            <div className="note-video-page__channel-row">
              <div className="note-video-page__author">
                {note.author.avatarUrl ? (
                  <img className="note-video-page__avatar" src={note.author.avatarUrl} alt="" />
                ) : (
                  <span className="note-video-page__avatar note-video-page__avatar--fallback">
                    {resolveNoteAuthorInitial(note.author.name)}
                  </span>
                )}
                <div className="note-video-page__author-meta">
                  <div className="note-video-page__author-line">
                    <strong>{note.author.name}</strong>
                    <span>@{note.author.handle}</span>
                    {note.publishStatus !== 'PUBLISHED' ? (
                      <span
                        className={`note-video-page__status note-video-page__status--${note.publishStatus.toLowerCase()}`}
                      >
                        {statusLabel}
                      </span>
                    ) : null}
                  </div>
                  <time className="note-video-page__time" dateTime={note.publishTime}>
                    发布于 {note.publishTime}
                  </time>
                </div>
              </div>

              <div className="note-video-page__actions">
                <span className="note-video-page__views">
                  <Eye className="h-3.5 w-3.5" />
                  {formatNoteStatCount(note.views)} 浏览
                </span>
                <button type="button" className="note-video-page__action-btn">
                  <ThumbsUp className="h-4 w-4" />
                  点赞
                </button>
                <button type="button" className="note-video-page__action-btn">
                  <Share2 className="h-4 w-4" />
                  分享
                </button>
                <button type="button" className="note-video-page__action-btn" aria-label="收藏">
                  <Bookmark className="h-4 w-4" />
                </button>
                <button type="button" className="note-video-page__action-btn" aria-label="更多操作">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="note-video-page__desc-box">
              {hasSummary ? (
                <div className="note-video-page__summary-block">
                  <p
                    className={`note-video-page__summary ${summaryExpanded ? '' : 'note-video-page__summary--collapsed'}`.trim()}
                  >
                    {note.summary}
                  </p>
                  <button
                    type="button"
                    className="note-video-page__summary-toggle"
                    onClick={() => setSummaryExpanded((expanded) => !expanded)}
                    aria-expanded={summaryExpanded}
                  >
                    {summaryExpanded ? '收起' : '...更多'}
                  </button>
                </div>
              ) : null}

              {note.tags.length > 0 ? (
                <div className="note-video-page__tags">
                  {note.tags.map((tag) => (
                    <span key={tag} className="note-video-page__tag">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="note-video-page__sidebar" aria-label="视频侧栏">
            <div className="note-video-page__sidebar-card">
              <p className="note-video-page__sidebar-label">侧栏</p>
              <p className="note-video-page__sidebar-placeholder">推荐视频、作者卡片等组件将在此展示。</p>
            </div>
          </aside>
        </section>

        <NoteCommentsSection commentCount={note.comments} />
      </div>
    </div>
  )
}
