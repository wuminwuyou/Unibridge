import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Eye, Heart, ThumbsUp, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useMemo, useState } from 'react'
import {
  MarkdownMdCatalogPanel,
  NoteContentReader,
  useMarkdownReaderId,
} from '../../../components/Reader'
import {
  noteDetailPublishStatusLabelMap,
  resolveNoteEditorialBannerText,
} from '../shared/noteDetailShared'
import { NoteQuickMdEditor } from '../NoteVideoDetail/components/NoteQuickMdEditor'
import RowNoteCard from '../../../components/NoteCard/RowNoteCard'
import type { NoteArticleDetailPayload } from './types'
import { isUserResourceUid } from '../../../api/resourceUid'
import { buildPersonalSpacePath } from '../../ProfileSpace/variants/PersonalView/personalTabRouting'
import './TextNoteReader.css'

// 01）图文笔记阅读视图 Props（TextNoteReaderViewProps）
interface TextNoteReaderViewProps {
  note: NoteArticleDetailPayload
  isEditorialFlow?: boolean
}

// 02）格式化时间为 yyyy-MM-dd HH:mm:ss（formatFullDateTime）
function formatFullDateTime(dateTime: string): string {
  const normalized = dateTime.replace('T', ' ').trim()
  if (!normalized) {
    return ''
  }
  if (normalized.length <= 10) {
    return `${normalized} 00:00:00`
  }
  if (normalized.length <= 16) {
    return `${normalized}:00`
  }
  return normalized.slice(0, 19)
}

// 03）解析作者所属机构文案（resolveAuthorOrganization）
function resolveAuthorOrganization(author: NoteArticleDetailPayload['author']): string {
  return author.organization || ''
  // 无机构为空，不渲染
}

// 04）导航栏高度常量
const NAVBAR_HEIGHT = 64

// 05）图文笔记阅读视图（TextNoteReaderView）
export function TextNoteReaderView({ note, isEditorialFlow = false }: TextNoteReaderViewProps) {
  const showMarkdownCatalog = note.body.trim().length > 0
  const markdownReaderId = useMarkdownReaderId()
  const statusLabel = noteDetailPublishStatusLabelMap[note.publishStatus]

  const authorInitial = note.author.name?.trim().slice(0, 1) || 'U'
  const organizationText = resolveAuthorOrganization(note.author)
  const authorProfilePath = useMemo(() => {
    if (note.author.uid && isUserResourceUid(note.author.uid)) {
      return buildPersonalSpacePath(note.author.uid)
    }
    return null
  }, [note.author.uid])

  const publishTimeFull = formatFullDateTime(note.publishTime)
  const updateTimeFull = formatFullDateTime(note.updateTime)
  const showUpdateTime = note.updateTime && formatFullDateTime(note.updateTime) !== publishTimeFull

  const stickyTopPx = NAVBAR_HEIGHT + 24
  const stickyTopClass = 'top-[5.5rem]'

  /* ---- TOC 仅正文区域跟随：正文到导航栏前 static，到达后 sticky ---- */
  const contentShellRef = useRef<HTMLElement>(null)
  const tocRef = useRef<HTMLElement>(null)
  const [tocSticky, setTocSticky] = useState(true)

  useEffect(() => {
    const handler = () => {
      const shell = contentShellRef.current
      const toc = tocRef.current
      if (!shell || !toc) {
        setTocSticky(true)
        return
      }
      const shellRect = shell.getBoundingClientRect()
      setTocSticky(shellRect.top <= stickyTopPx)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler, { passive: true })
    return () => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [stickyTopPx])

  /* ---- 学习笔记编辑器：height CSS transition（沿用视频笔记方案） ---- */
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const editorCardRef = useRef<HTMLDivElement>(null)
  const editorBtnRef = useRef<HTMLButtonElement>(null)
  const [editorHeight, setEditorHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!isEditorExpanded) {
      setEditorHeight(null)
      return
    }
    const compute = () => {
      if (!editorCardRef.current) return
      const cardRect = editorCardRef.current.getBoundingClientRect()
      const available = window.innerHeight - cardRect.top - 16
      setEditorHeight(Math.max(280, available))
    }
    const rafId = requestAnimationFrame(compute)
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute, { passive: true })
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [isEditorExpanded])

  const editorStyle: React.CSSProperties | undefined =
    isEditorExpanded && editorHeight != null
      ? { height: `${editorHeight}px` }
      : undefined

  const tocOffsetTop = stickyTopPx

  return (
    <div
      className={`bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${isEditorialFlow ? 'min-h-screen' : 'min-h-[calc(100vh-4rem)]'
        }`}
    >
      {/* 发布预览横幅 */}
      {isEditorialFlow ? (
        <div className="border-b border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40">
          <div className="w-full mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-emerald-800 dark:text-emerald-200 m-0">
              {resolveNoteEditorialBannerText(note.publishStatus)}
            </p>
            <Link
              to="/publish/note"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              返回编辑
            </Link>
          </div>
        </div>
      ) : null}

      {/* 最外层包裹：10% 呼吸留白 + 12 列 Grid
           clamp 下限 = 三栏 min 宽度之和 (280+640+280) + gap 等 ≈ 1264px */}
      <div className="w-[clamp(1380px,80vw,1500px)] mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-8 items-start w-full">

          {/* ===== 左侧栏 col-span-3：TOC 目录（与右侧栏等宽） ===== */}
          {showMarkdownCatalog ? (
            <aside
              ref={tocRef}
              className={`col-span-3 w-[clamp(280px,22vw,340px)] self-start text-note-reader__toc-aside ${tocSticky ? `sticky ${stickyTopClass}` : ''
                }`}
              aria-label="文章目录"
            >
              <MarkdownMdCatalogPanel
                editorId={markdownReaderId}
                title="目录"
                scrollElementOffsetTop={tocOffsetTop}
                offsetTop={tocOffsetTop}
              />
            </aside>
          ) : (
            <div className="col-span-3" />
          )}

          {/* ===== 中间栏 col-span-6：Markdown 正文 ===== */}
          <article
            ref={contentShellRef}
            className="col-span-6 flex-1 min-w-0 max-w-[clamp(640px,58vw,920px)] mx-auto w-full"
            aria-label="笔记正文"
          >
            <header className="mb-8">
              {note.publishStatus !== 'PUBLISHED' ? (
                <span
                  className={`inline-flex mb-3 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${note.publishStatus === 'DRAFT'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                >
                  {statusLabel}
                </span>
              ) : null}

              <h1 className="m-0 text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                {note.title}
              </h1>

              {note.summary ? (
                <div className="mt-4 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50">
                  <p className="m-0 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {note.summary}
                  </p>
                </div>
              ) : null}

              {note.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-4" aria-label="话题标签">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-zinc-400 dark:text-zinc-500">
                {publishTimeFull ? (
                  <time dateTime={note.publishTime}>
                    发布于 {publishTimeFull}
                  </time>
                ) : null}
                {showUpdateTime ? (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <time dateTime={note.updateTime}>
                      修改于 {updateTimeFull}
                    </time>
                  </>
                ) : null}
              </div>
            </header>

            <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-[5.5rem] prose-a:text-sky-600 dark:prose-a:text-sky-400 prose-p:max-w-3xl prose-p:mx-auto">
              <NoteContentReader
                contentLongtext={{ editorType: 'MARKDOWN', longtext: note.body }}
                className="markdown-md-reader"
                markdownPreviewId={markdownReaderId}
              />
            </div>
          </article>

          {/* ===== 右侧栏 col-span-3：协同信息面板 ===== */}
          <aside className={`col-span-3 w-[clamp(280px,22vw,340px)] sticky ${stickyTopClass} self-start justify-self-end`}>
            <div className="flex flex-col space-y-6">

              {/* 卡片 A：作者信息 */}
              <div className="text-note-reader__sidebar-card p-4">
                <h3 className="text-note-reader__sidebar-card-title mb-3">
                  <User size={14} aria-hidden="true" />
                  作者
                </h3>
                <div className="text-note-reader__author-block">
                  {authorProfilePath ? (
                    <>
                      <Link to={authorProfilePath} className="text-note-reader__author-link">
                        {note.author.avatarUrl ? (
                          <img className="text-note-reader__author-avatar" src={note.author.avatarUrl} alt={note.author.name} />
                        ) : (
                          <span className="text-note-reader__author-avatar text-note-reader__author-avatar--fallback">{authorInitial}</span>
                        )}
                        <div className="text-note-reader__author-text">
                          <p className="text-note-reader__author-name">{note.author.name}</p>
                          <p className="text-note-reader__author-org">{organizationText}</p>
                        </div>
                      </Link>
                      <button type="button" className="text-note-reader__follow-btn" aria-label="关注作者">
                        关注
                      </button>
                    </>
                  ) : (
                    <div className="text-note-reader__author-row">
                      {note.author.avatarUrl ? (
                        <img className="text-note-reader__author-avatar" src={note.author.avatarUrl} alt={note.author.name} />
                      ) : (
                        <span className="text-note-reader__author-avatar text-note-reader__author-avatar--fallback">{authorInitial}</span>
                      )}
                      <div className="text-note-reader__author-text">
                        <p className="text-note-reader__author-name">{note.author.name}</p>
                        <p className="text-note-reader__author-org">{organizationText}</p>
                      </div>
                      <button type="button" className="text-note-reader__follow-btn" aria-label="关注作者">
                        关注
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-note-reader__stats-row">
                  <span className="text-note-reader__stats-item"><Eye size={12} aria-hidden="true" />{note.views} 浏览</span>
                  <span className="text-note-reader__stats-item"><Heart size={12} aria-hidden="true" />{note.favorites} 收藏</span>
                  <span className="text-note-reader__stats-item"><ThumbsUp size={12} aria-hidden="true" />{note.comments} 评论</span>
                </div>
              </div>

              {/* 卡片 B：父笔记快速入口 */}
              {note.parentNote ? (
                <div className="text-note-reader__sidebar-card">
                  <h3 className="text-note-reader__parent-card-header">
                    <BookOpen size={14} aria-hidden="true" />
                    关联笔记
                  </h3>
                  <RowNoteCard note={note.parentNote} hideCover className="row-note-card--embedded" />
                </div>
              ) : null}

              {/* 卡片 C：学习笔记编辑器（高度随动，CSS transition 折叠动画） */}
              {note.uid ? (
                <div
                  ref={editorCardRef}
                  className="text-note-reader__editor-card text-note-reader__sidebar-card flex flex-col"
                  style={editorStyle}
                >
                  {/* 折叠头部按钮 */}
                  <button
                    ref={editorBtnRef}
                    type="button"
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex-shrink-0"
                    onClick={() => setIsEditorExpanded((prev) => !prev)}
                    aria-expanded={isEditorExpanded}
                  >
                    <h3 className="text-note-reader__sidebar-card-title">
                      <BookOpen size={14} aria-hidden="true" />
                      学习笔记
                    </h3>
                    {isEditorExpanded ? (
                      <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    ) : (
                      <ChevronLeft size={16} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    )}
                  </button>

                  {isEditorExpanded ? (
                    <div className="text-note-reader__editor-card-body">
                      <NoteQuickMdEditor
                        note={{ uid: note.uid, title: note.title, body: '', tags: note.tags }}
                        className="border-0 shadow-none rounded-none"
                        initialContent=""
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
