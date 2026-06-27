import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Eye,
  MoreHorizontal,
  Share2,
  ThumbsUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { NoteCommentsSection } from '../../../components/NoteCommentsSection'
import { NoteVideoPlayer } from '../../../components/NoteVideoPlayer'
import RowNoteCard from '../../../components/NoteCard/RowNoteCard'
import { NoteQuickMdEditor } from '../shared/components/NoteQuickMdEditor'
import { useElementHeight } from './hooks/useElementHeight'
import { getSimilarNotes, mapFeedNotes } from '../../../api/feed'
import type { ProfileNoteItem } from '../../ProfileSpace/components/types'
import { isNoteResourceUid, isUserResourceUid } from '../../../api/resourceUid'
import {
  formatNoteStatCount,
  noteDetailPublishStatusLabelMap,
  resolveNoteAuthorInitial,
  resolveNoteEditorialBannerText,
} from '../shared/utils/noteDetailShared'
import { buildPersonalSpacePath } from '../../ProfileSpace/variants/PersonalView/personalTabRouting'
import type { NoteVideoDetailPayload } from './types'
import './VideoNoteView.css'

// 01）视频笔记详情视图 Props（VideoNoteViewProps）
interface VideoNoteViewProps {
  note: NoteVideoDetailPayload
  isEditorialFlow?: boolean
}

// 03）侧栏卡片折叠态高度（仅显示头部，与 .note-video-page__sidebar-card-head 内边距 + 字号一致）
const SIDEBAR_COLLAPSED_HEIGHT_PX = 40

// 03.1）推荐列表默认加载条数（RECOMMENDATION_LIMIT_DEFAULT）
const RECOMMENDATION_LIMIT_DEFAULT = 3

// 04）视频笔记详情视图（VideoNoteView）
/**
 * 函数名：VideoNoteView
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
export function VideoNoteView({ note, isEditorialFlow = false }: VideoNoteViewProps) {
  const statusLabel = noteDetailPublishStatusLabelMap[note.publishStatus]
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const hasSummary = Boolean(note.summary.trim())

  const authorProfilePath = useMemo(() => {
    if (note.author.uid && isUserResourceUid(note.author.uid)) {
      return buildPersonalSpacePath(note.author.uid)
    }
    return null
  }, [note.author.uid])

  const [playerRef, playerHeight] = useElementHeight<HTMLDivElement>('.art-video')
  const sidebarHeightStyle =
    sidebarCollapsed
      ? `${SIDEBAR_COLLAPSED_HEIGHT_PX}px`
      : playerHeight != null
        ? `${playerHeight}px`
        : undefined

  // 相似笔记推荐列表（接入 GET /feed/notes/{uid}/similar）
  const [recommendations, setRecommendations] = useState<ProfileNoteItem[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  useEffect(() => {
    if (!isNoteResourceUid(note.uid)) {
      return
    }

    let cancelled = false
    setRecommendationsLoading(true)

    const load = async () => {
      try {
        const items = await getSimilarNotes(note.uid!, RECOMMENDATION_LIMIT_DEFAULT)
        if (!cancelled) {
          setRecommendations(mapFeedNotes(items))
        }
      } catch {
        if (!cancelled) {
          setRecommendations([])
        }
      } finally {
        if (!cancelled) {
          setRecommendationsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [note.uid])

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
          <div className="note-video-page__left-column">
            <div className="note-video-page__main" ref={playerRef}>
              <NoteVideoPlayer videoUrl={note.videoUrl} posterUrl={note.coverUrl} className="note-video-page__player" />
            </div>

            <div className="note-video-page__content">
              <h1 className="note-video-page__title" title={note.title}>
                {note.title}
              </h1>

              <div className="note-video-page__channel-row">
                <div className="note-video-page__author">
                  {authorProfilePath ? (
                    <Link
                      to={authorProfilePath}
                      className="note-video-page__author-link"
                      aria-label={`查看 ${note.author.name} 的个人空间`}
                    >
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
                          <span>{note.author.organization}</span>
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
                    </Link>
                  ) : (
                    <>
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
                          <span>{note.author.organization}</span>
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
                    </>
                  )}
                  <button type="button" className="note-video-page__follow-btn" aria-label="关注作者">
                    关注
                  </button>
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

            <NoteCommentsSection commentCount={note.comments} />
          </div>

          <div className="note-video-page__right-column">
            <aside
              className={`note-video-page__sidebar ${sidebarCollapsed ? 'note-video-page__sidebar--collapsed' : ''}`.trim()}
              style={{ height: sidebarHeightStyle }}
              aria-label="学习笔记"
            >
              <div className="note-video-page__sidebar-card">
                <div className="note-video-page__sidebar-card-head">
                  <button
                    type="button"
                    className="note-video-page__sidebar-card-head-inner"
                    onClick={() => setSidebarCollapsed((c) => !c)}
                    aria-expanded={!sidebarCollapsed}
                    aria-label={sidebarCollapsed ? '展开笔记编辑器' : '收起笔记编辑器'}
                  >
                    <span className="note-video-page__sidebar-card-title">学习笔记</span>
                    {sidebarCollapsed ? (
                      <ChevronUp className="note-video-page__sidebar-card-arrow h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="note-video-page__sidebar-card-arrow h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="note-video-page__sidebar-card-body">
                  <NoteQuickMdEditor note={note} />
                </div>
              </div>
            </aside>

            <section className="note-video-page__recommendations" aria-label="推荐笔记">
              <h3 className="note-video-page__recommendations-title">推荐阅读</h3>
              {recommendations.length > 0 ? (
                recommendations.map((item) => (
                  <RowNoteCard key={item.uid ?? item.title} note={item} />
                ))
              ) : (
                <p className="note-video-page__recommendations-empty">
                  {recommendationsLoading ? '加载中...' : '暂无推荐'}
                </p>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}
