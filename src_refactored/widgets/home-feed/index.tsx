// 01）首页流 Widget（HomeFeedWidget）— 已引入虚拟滚动（Phase 1：@tanstack/react-virtual，scrollElement = window）
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { NOTES_LIST_PATH, buildNoteEditorPath } from '@shared/lib/noteRoutes'
import { createPublishEntryFreshLocationState } from '@shared/lib/publishEntryNavigation'
import { clearNoteDetailPreview, clearNoteEditorFormSession } from '@features/note-editor'
import { NoteEditorTypeModal, useNoteEditorTypeModal } from '@features/note-editor-entry'
import ProjectCard from '../../entities/project/ui/ProjectCard'
import { GridNoteCard } from '@entities/note'
import LoadingSpinner from '../../shared/ui/LoadingSpinner'
import ProjectLabHeader from '../../features/feed-filter/ui/ProjectLabHeader'
import { useHomeFeedWidget } from './hooks/useHomeFeedWidget'
import './HomeFeedLayout.css'

function HomeFeedWidget() {
  const navigate = useNavigate()
  const { loadState, errorMessage, projects, notes } = useHomeFeedWidget()

  const noteEditorTypeModal = useNoteEditorTypeModal({
    onSelect: (type) => {
      clearNoteDetailPreview()
      clearNoteEditorFormSession()
      navigate(buildNoteEditorPath({ type }), { state: createPublishEntryFreshLocationState() })
    },
  })

  // 02）项目卡片虚拟列表实例（useVirtualizer）—— scrollElement = window，与页面共用滚动
  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => (typeof document !== 'undefined' ? document.documentElement : null),
    estimateSize: () => 220,
    overscan: 3,
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      virtualizer.measure()
    }
  }, [projects, virtualizer])

  const renderedSidebarNotes = useMemo(() => notes.map((n) => <GridNoteCard key={n.uid ?? n.title} note={n} />), [notes])

  return (
    <>
      <main className="home-page__main">
        <section className="home-page__projects" aria-label="项目实验室">
          <div className="home-page__projects-panel">
            <ProjectLabHeader projectTotal={projects.length} />
            {loadState === 'loading' ? <div className="home-page__feed-status"><LoadingSpinner size={32} label="正在加载推荐项目…" /></div>
              : loadState === 'error' ? <p className="home-page__feed-status home-page__feed-status--error" role="alert">{errorMessage ?? '加载推荐项目失败，请稍后重试'}</p>
                : (
                  <div className="home-page__projects-list virtual-scroll">
                    <div className="home-page__projects-list__inner" style={{ height: virtualizer.getTotalSize() }}>
                      {virtualizer.getVirtualItems().map((virtualRow) => {
                        const project = projects[virtualRow.index]
                        return (
                          <div
                            key={virtualRow.key}
                            className="home-page__projects-list__item"
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                          >
                            <ProjectCard project={project} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
          </div>
        </section>
        <aside className="home-page__insights" aria-label="学生项目复盘与经验">
          <header className="home-page__insights-header">
            <h2 className="home-page__insights-title">项目复盘与经验</h2>
            <Link className="home-page__insights-link" to={NOTES_LIST_PATH}>查看全部 &gt;</Link>
          </header>
          {loadState === 'loading' ? <div className="home-page__feed-status"><LoadingSpinner size={24} label="正在加载经验笔记…" /></div>
            : loadState === 'ready' && notes.length > 0 ? <div className="home-page__note-list">{renderedSidebarNotes}</div>
              : loadState === 'ready' && notes.length === 0 ? <p className="home-page__feed-status">暂无推荐笔记</p> : null}
          <button
            type="button"
            className="home-page__compose-trigger"
            onClick={noteEditorTypeModal.open}
          >
            📝 写下你的学习经验
          </button>
        </aside>
      </main>

      <NoteEditorTypeModal
        open={noteEditorTypeModal.isOpen}
        onClose={noteEditorTypeModal.close}
        onSelect={noteEditorTypeModal.selectType}
      />
    </>
  )
}

export default HomeFeedWidget
