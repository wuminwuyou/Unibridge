import { useState, useMemo } from 'react'
import { Bookmark, ChevronDown, ChevronUp, Eye, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VideoPlayer } from '@shared/ui/VideoPlayer'
import { useElementHeight } from '@shared/hooks/useElementHeight'
import { NoteEditorialBanner } from '@features/note-viewer-editorial'
import { NoteQuickMdEditor } from '@features/note-viewer-annotation'
import type { NoteVideoDetailPayload } from '@entities/note'
import { resolveNoteAuthorInitial, noteDetailPublishStatusLabelMap, useSimilarNotes, RowNoteCard } from '@entities/note'
import { formatMetricCount } from '@shared/lib'
import { isUserResourceUid } from '@shared/api/resourceUid'
import { buildPersonalSpacePath } from '@shared/lib/userRoutes'
import styles from './NoteVideoReaderLayout.module.css'

// 01）视频阅读布局 Props（NoteVideoReaderLayoutProps）
interface NoteVideoReaderLayoutProps {
  note: NoteVideoDetailPayload
  isEditorialFlow?: boolean
}

const SIDEBAR_COLLAPSED_HEIGHT_PX = 40

// 02）视频阅读布局组件（NoteVideoReaderLayout）
export function NoteVideoReaderLayout({ note, isEditorialFlow = false }: NoteVideoReaderLayoutProps) {
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

  // 播放器高度同步：侧栏高度 = 播放器高度
  const [playerRef, playerHeight] = useElementHeight<HTMLDivElement>('.art-video')
  const sidebarHeightStyle = sidebarCollapsed
    ? `${SIDEBAR_COLLAPSED_HEIGHT_PX}px`
    : playerHeight != null
      ? `${playerHeight}px`
      : undefined

  const { notes: similarNotes, loading: similarNotesLoading } = useSimilarNotes(note.uid ?? null, 10)

  return (
    <div className={`${styles.noteVideoLayout} ${isEditorialFlow ? styles.noteVideoLayoutEditorial : ''}`}>
      <div className={styles.noteVideoShell}>
        {isEditorialFlow ? <NoteEditorialBanner publishStatus={note.publishStatus} /> : null}

        <section className={styles.noteVideoHero} aria-label="视频播放区">
          <div className={styles.noteVideoLeftCol}>
            <div className={styles.noteVideoMain} ref={playerRef}>
              {note.videoUrl ? (
                <VideoPlayer videoUrl={note.videoUrl} posterUrl={note.coverUrl} />
              ) : null}
            </div>

            <div className={styles.noteVideoContent}>
              <h1 className={styles.noteVideoTitle} title={note.title}>{note.title}</h1>

              <div className={styles.noteVideoChannelRow}>
                <div className={styles.noteVideoAuthor}>
                  {authorProfilePath ? (
                    <Link to={authorProfilePath} className={styles.noteVideoAuthorLink} aria-label={`查看 ${note.author.name} 的个人空间`}>
                      {note.author.avatarUrl ? (
                        <img className={styles.noteVideoAvatar} src={note.author.avatarUrl} alt="" />
                      ) : (
                        <span className={styles.noteVideoAvatarFallback}>{resolveNoteAuthorInitial(note.author.name)}</span>
                      )}
                      <div className={styles.noteVideoAuthorMeta}>
                        <div className={styles.noteVideoAuthorLine}>
                          <strong>{note.author.name}</strong>
                          <span>{note.author.organization}</span>
                          {note.publishStatus !== 'PUBLISHED' ? (
                            <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${note.publishStatus === 'DRAFT' ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                              {statusLabel}
                            </span>
                          ) : null}
                        </div>
                        <time className={styles.noteVideoTime} dateTime={note.publishTime}>发布于 {note.publishTime}</time>
                      </div>
                    </Link>
                  ) : (
                    <>
                      {note.author.avatarUrl ? (
                        <img className={styles.noteVideoAvatar} src={note.author.avatarUrl} alt="" />
                      ) : (
                        <span className={styles.noteVideoAvatarFallback}>{resolveNoteAuthorInitial(note.author.name)}</span>
                      )}
                      <div className={styles.noteVideoAuthorMeta}>
                        <div className={styles.noteVideoAuthorLine}>
                          <strong>{note.author.name}</strong>
                          <span>{note.author.organization}</span>
                        </div>
                        <time className={styles.noteVideoTime} dateTime={note.publishTime}>发布于 {note.publishTime}</time>
                      </div>
                    </>
                  )}
                  <button type="button" className={styles.noteVideoFollowBtn} aria-label="关注作者">关注</button>
                </div>

                <div className={styles.noteVideoActions}>
                  <span className={styles.noteVideoViews}><Eye className="h-3.5 w-3.5" />{formatMetricCount(note.views)} 浏览</span>
                  <button type="button" className={styles.noteVideoActionBtn}><ThumbsUp className="h-4 w-4" />点赞</button>
                  <button type="button" className={styles.noteVideoActionBtn}><Share2 className="h-4 w-4" />分享</button>
                  <button type="button" className={styles.noteVideoActionBtn} aria-label="收藏"><Bookmark className="h-4 w-4" /></button>
                  <button type="button" className={styles.noteVideoActionBtn} aria-label="更多操作"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
              </div>

              <div className={styles.noteVideoDescBox}>
                {hasSummary ? (
                  <div className={styles.noteVideoSummaryBlock}>
                    <p className={`${styles.noteVideoSummary} ${summaryExpanded ? '' : styles.noteVideoSummaryCollapsed}`}>{note.summary}</p>
                    <button type="button" className={styles.noteVideoSummaryToggle} onClick={() => setSummaryExpanded((e) => !e)} aria-expanded={summaryExpanded}>
                      {summaryExpanded ? '收起' : '...更多'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* 右侧栏：学习笔记 — 高度与播放器同步，折叠有 CSS transition */}
          <div className={styles.noteVideoRightCol}>
            <aside className={styles.noteVideoSidebar} style={{ height: sidebarHeightStyle }} aria-label="学习笔记">
              <div className={styles.noteVideoSidebarCard}>
                <div className={styles.noteVideoSidebarCardHead}>
                  <button type="button" className={styles.noteVideoSidebarCardHeadInner}
                    onClick={() => setSidebarCollapsed((c) => !c)} aria-expanded={!sidebarCollapsed}>
                    <span className={styles.noteVideoSidebarCardTitle}>学习笔记</span>
                    {sidebarCollapsed ? (
                      <ChevronUp className="h-4 w-4 flex-shrink-0 text-zinc-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className={styles.noteVideoSidebarCardBody}>
                  <NoteQuickMdEditor note={note} />
                </div>
              </div>
            </aside>

            <section className={styles.noteVideoRecommendations} aria-label="推荐笔记">
              <h3 className={styles.noteVideoRecommendationsTitle}>推荐阅读</h3>
              {similarNotesLoading ? (
                <p className={styles.noteVideoRecommendationsEmpty}>加载中...</p>
              ) : similarNotes.length > 0 ? (
                similarNotes.map((item) => (
                  <RowNoteCard key={item.uid ?? item.title} note={item} />
                ))
              ) : (
                <p className={styles.noteVideoRecommendationsEmpty}>暂无推荐</p>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}
