import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { useMarkdownReaderId, ContentReader, MarkdownMdCatalogPanel } from '@shared/ui/MarkdownReader'
import { NoteEditorialBanner } from '@features/note-viewer-editorial'
import { NoteQuickMdEditor } from '@features/note-viewer-annotation'
import { NoteAuthorCard, NotePublishStatusBadge, NoteTagList, NoteSummaryBox, NoteMetaRow, ParentNoteEntry } from '@entities/note'
import type { NoteArticleDetailPayload } from '@entities/note'
import { isUserResourceUid } from '@shared/api/resourceUid'
import { buildPersonalSpacePath } from '@shared/lib/userRoutes'
import styles from './NoteArticleReaderLayout.module.css'

// 01）图文阅读布局 Props（NoteArticleReaderLayoutProps）
interface NoteArticleReaderLayoutProps {
  note: NoteArticleDetailPayload
  isEditorialFlow?: boolean
}

const NAVBAR_HEIGHT = 64
const STICKY_TOP_PX = NAVBAR_HEIGHT + 24
const STICKY_TOP_CLASS = 'top-[5.5rem]'
const SIDEBAR_PANEL_ANIMATION_MS = 350
const EDITOR_MIN_EXPANDED_HEIGHT_PX = 280

// 03）解析侧栏默认展开面板（resolveInitialSidebarPanel）
function resolveInitialSidebarPanel(note: NoteArticleDetailPayload): SidebarExpandedPanel {
  if (note.parentNote?.title?.trim()) {
    return 'parentNote'
  }
  return null
}

// 04）侧栏可折叠面板类型（SidebarExpandedPanel）
type SidebarExpandedPanel = 'parentNote' | 'learningNote' | null

// 05）图文阅读布局组件（NoteArticleReaderLayout）
export function NoteArticleReaderLayout({ note, isEditorialFlow = false }: NoteArticleReaderLayoutProps) {
  const markdownReaderId = useMarkdownReaderId()
  const showMarkdownCatalog = note.body.trim().length > 0

  const authorProfilePath = useMemo(() => {
    if (note.author.uid && isUserResourceUid(note.author.uid)) {
      return buildPersonalSpacePath(note.author.uid)
    }
    return null
  }, [note.author.uid])

  // TOC sticky
  const contentShellRef = useRef<HTMLElement>(null)
  const tocRef = useRef<HTMLElement>(null)
  const [tocSticky, setTocSticky] = useState(true)

  useEffect(() => {
    const handler = () => {
      const shell = contentShellRef.current
      const toc = tocRef.current
      if (!shell || !toc) { setTocSticky(true); return }
      const shellRect = shell.getBoundingClientRect()
      setTocSticky(shellRect.top <= STICKY_TOP_PX)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler, { passive: true })
    return () => { window.removeEventListener('scroll', handler); window.removeEventListener('resize', handler) }
  }, [])

  // 侧栏折叠面板（关联笔记 / 学习笔记互斥展开；有关联笔记时默认展开关联笔记）
  const [expandedPanel, setExpandedPanel] = useState<SidebarExpandedPanel>(() => resolveInitialSidebarPanel(note))
  const isParentNoteExpanded = expandedPanel === 'parentNote'
  const isLearningNoteExpanded = expandedPanel === 'learningNote'

  const toggleParentNotePanel = () => {
    setExpandedPanel((prev) => (prev === 'parentNote' ? null : 'parentNote'))
  }

  const toggleLearningNotePanel = () => {
    setExpandedPanel((prev) => (prev === 'learningNote' ? null : 'learningNote'))
  }

  useEffect(() => {
    setExpandedPanel(resolveInitialSidebarPanel(note))
  }, [note.uid, note.parentNote?.title])

  // 学习笔记编辑器高度动画（与关联笔记折叠同步）
  const editorCardRef = useRef<HTMLDivElement>(null)
  const editorHeaderRef = useRef<HTMLButtonElement>(null)
  const [editorCollapsedHeight, setEditorCollapsedHeight] = useState(48)
  const [editorExpandedHeight, setEditorExpandedHeight] = useState(EDITOR_MIN_EXPANDED_HEIGHT_PX)

  const computeEditorExpandedHeight = useCallback(() => {
    if (!editorCardRef.current) {
      return EDITOR_MIN_EXPANDED_HEIGHT_PX
    }
    const top = editorCardRef.current.getBoundingClientRect().top
    return Math.max(EDITOR_MIN_EXPANDED_HEIGHT_PX, window.innerHeight - top - 16)
  }, [])

  useLayoutEffect(() => {
    if (!editorHeaderRef.current) {
      return
    }
    setEditorCollapsedHeight(editorHeaderRef.current.offsetHeight)
  }, [note.uid])

  useEffect(() => {
    if (!isLearningNoteExpanded) {
      return
    }

    const updateHeight = () => {
      setEditorExpandedHeight(computeEditorExpandedHeight())
    }

    updateHeight()

    let rafId = 0
    const animationEndAt = performance.now() + SIDEBAR_PANEL_ANIMATION_MS + 80
    const trackHeightDuringPanelAnimation = () => {
      updateHeight()
      if (performance.now() < animationEndAt) {
        rafId = requestAnimationFrame(trackHeightDuringPanelAnimation)
      }
    }
    rafId = requestAnimationFrame(trackHeightDuringPanelAnimation)

    window.addEventListener('scroll', updateHeight, { passive: true })
    window.addEventListener('resize', updateHeight)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updateHeight)
      window.removeEventListener('resize', updateHeight)
    }
  }, [isLearningNoteExpanded, isParentNoteExpanded, computeEditorExpandedHeight])

  const editorCardHeight = isLearningNoteExpanded ? editorExpandedHeight : editorCollapsedHeight
  const editorCardStyle: React.CSSProperties = { height: `${editorCardHeight}px` }

  return (
    <div className={`bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${isEditorialFlow ? 'min-h-screen' : 'min-h-[calc(100vh-4rem)]'}`}>
      {isEditorialFlow ? <NoteEditorialBanner publishStatus={note.publishStatus} /> : null}

      <main className={styles.noteArticleLayout}>
        <div className={styles.noteArticleGrid}>
          {/* 左侧 TOC */}
          {showMarkdownCatalog ? (
            <aside
              ref={tocRef}
              className={`${styles.noteArticleTocAside} ${tocSticky ? `sticky ${STICKY_TOP_CLASS}` : ''}`}
              aria-label="文章目录"
            >
              <MarkdownMdCatalogPanel
                editorId={markdownReaderId}
                title="目录"
                scrollElementOffsetTop={STICKY_TOP_PX}
                offsetTop={STICKY_TOP_PX}
              />
            </aside>
          ) : (<div className="col-span-3" />)}

          {/* 中间正文 */}
          <article ref={contentShellRef} className={styles.noteArticleBodyCol} aria-label="笔记正文">
            <header className="mb-8">
              <NotePublishStatusBadge status={note.publishStatus} />
              <h1 className="m-0 text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                {note.title}
              </h1>
              <NoteSummaryBox summary={note.summary} />
              <NoteTagList tags={note.tags} />
              <NoteMetaRow publishTime={note.publishTime} updateTime={note.updateTime} />
            </header>

            <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-[5.5rem] prose-a:text-sky-600 dark:prose-a:text-sky-400 prose-p:max-w-3xl prose-p:mx-auto">
              <ContentReader
                contentLongtext={{ editorType: 'MARKDOWN', longtext: note.body }}
                className="markdown-md-reader"
                markdownPreviewId={markdownReaderId}
              />
            </div>
          </article>

          {/* 右侧栏 */}
          <aside className={`${styles.noteArticleSidebar} sticky ${STICKY_TOP_CLASS} self-start`}>
            <div className={styles.noteArticleSidebarInner}>
              <NoteAuthorCard
                author={note.author}
                views={note.views}
                favorites={note.favorites}
                comments={note.comments}
                profilePath={authorProfilePath}
              />

              <ParentNoteEntry
                note={note.parentNote}
                expanded={isParentNoteExpanded}
                onToggle={toggleParentNotePanel}
              />

              {note.uid ? (
                <div
                  ref={editorCardRef}
                  className={`${styles.noteArticleEditorCard} ${isLearningNoteExpanded ? '' : styles.noteArticleEditorCardCollapsed}`}
                  style={editorCardStyle}
                >
                  <button
                    ref={editorHeaderRef}
                    type="button"
                    className={styles.noteArticleEditorToggle}
                    onClick={toggleLearningNotePanel}
                    aria-expanded={isLearningNoteExpanded}
                  >
                    <h3 className={styles.noteArticleEditorToggleTitle}>
                      <Pencil size={14} aria-hidden="true" />
                      学习笔记
                    </h3>
                    {isLearningNoteExpanded ? (
                      <ChevronRight size={16} className={styles.noteArticleEditorToggleChevron} aria-hidden="true" />
                    ) : (
                      <ChevronLeft size={16} className={styles.noteArticleEditorToggleChevron} aria-hidden="true" />
                    )}
                  </button>
                  <div className={styles.noteArticleEditorCardBody} aria-hidden={!isLearningNoteExpanded}>
                    <NoteQuickMdEditor
                      note={{ uid: note.uid, title: note.title, body: '', tags: note.tags }}
                      initialContent=""
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
