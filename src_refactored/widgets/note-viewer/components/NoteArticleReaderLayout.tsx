import { useEffect, useRef, useState, useMemo } from 'react'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
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

// 02）图文阅读布局组件（NoteArticleReaderLayout）
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

  // 编辑器折叠动画
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const editorCardRef = useRef<HTMLDivElement>(null)
  const [editorHeight, setEditorHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!isEditorExpanded) { setEditorHeight(null); return }
    const compute = () => {
      if (!editorCardRef.current) return
      const cardRect = editorCardRef.current.getBoundingClientRect()
      setEditorHeight(Math.max(280, window.innerHeight - cardRect.top - 16))
    }
    const rafId = requestAnimationFrame(compute)
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute, { passive: true })
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('scroll', compute); window.removeEventListener('resize', compute) }
  }, [isEditorExpanded])

  const editorStyle: React.CSSProperties | undefined =
    isEditorExpanded && editorHeight != null ? { height: `${editorHeight}px` } : undefined

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

              {note.parentNote ? (
                <ParentNoteEntry>
                  {note.parentNote ? '' : null}
                </ParentNoteEntry>
              ) : null}

              {note.uid ? (
                <div ref={editorCardRef} className={`${styles.noteArticleEditorCard} flex flex-col`} style={editorStyle}>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex-shrink-0"
                    onClick={() => setIsEditorExpanded((prev) => !prev)}
                    aria-expanded={isEditorExpanded}
                  >
                    <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-zinc-400 dark:text-zinc-500">
                      <BookOpen size={14} aria-hidden="true" />学习笔记
                    </h3>
                    {isEditorExpanded ? (
                      <ChevronRight size={16} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    ) : (
                      <ChevronLeft size={16} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    )}
                  </button>
                  {isEditorExpanded ? (
                    <div className={styles.noteArticleEditorCardBody}>
                      <NoteQuickMdEditor
                        note={{ uid: note.uid, title: note.title, body: '', tags: note.tags }}
                        initialContent=""
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
