import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  MarkdownMdCatalogPanel,
  NoteContentReader,
  useMarkdownReaderId,
} from '../../../components/Reader'
import {
  noteDetailPublishStatusLabelMap,
  resolveNoteEditorialBannerText,
} from '../shared/noteDetailShared'
import '../../../components/Reader/MarkdownMdPreviewReader.css'
import type { NoteArticleDetailPayload } from './types'
import './TextNoteReader.css'

// 01）图文笔记阅读视图 Props（TextNoteReaderViewProps）
interface TextNoteReaderViewProps {
  note: NoteArticleDetailPayload
  isEditorialFlow?: boolean
}

// 02）图文笔记阅读视图（TextNoteReaderView）
/**
 * 函数名：TextNoteReaderView
 * 功能：高保真图文笔记阅读页；居中 max-w-3xl 正文 + 左侧悬浮 Markdown 目录。
 * 实现方法：
 * - 去除社交噪声，仅保留标题、标签、摘要与 Reader 正文
 * - 目录卡片 fixed 浮于左侧留白，毛玻璃 + 翠绿激活指示
 * - 发布预览流展示返回编辑横幅
 * 输入：
 * - note：NoteArticleDetailPayload
 * - isEditorialFlow：来自发布页跳转时为 true
 * 输出：
 * - 返回值：React 节点
 */
export function TextNoteReaderView({ note, isEditorialFlow = false }: TextNoteReaderViewProps) {
  const showMarkdownCatalog = note.body.trim().length > 0 && note.editorType === 'MARKDOWN'
  const markdownReaderId = useMarkdownReaderId()
  const statusLabel = noteDetailPublishStatusLabelMap[note.publishStatus]

  return (
    <div className={`text-note-reader ${isEditorialFlow ? 'text-note-reader--editorial' : ''}`.trim()}>
      {showMarkdownCatalog ? (
        <aside className="text-note-reader__toc-rail" aria-label="文章目录">
          <MarkdownMdCatalogPanel
            editorId={markdownReaderId}
            className="text-note-reader__toc-panel"
            title="目录"
          />
        </aside>
      ) : null}

      <div className="text-note-reader__canvas">
        {isEditorialFlow ? (
          <div className="text-note-reader__banner" role="status">
            <p className="text-note-reader__banner-text">{resolveNoteEditorialBannerText(note.publishStatus)}</p>
            <Link to="/publish/note" className="text-note-reader__banner-action">
              <ArrowLeft size={16} aria-hidden="true" />
              返回编辑
            </Link>
          </div>
        ) : null}

        <article className="text-note-reader__article" aria-label="笔记正文">
          <header className="text-note-reader__header">
            {note.publishStatus !== 'PUBLISHED' ? (
              <span className={`text-note-reader__status text-note-reader__status--${note.publishStatus.toLowerCase()}`}>
                {statusLabel}
              </span>
            ) : null}
            <h1 className="text-note-reader__title">{note.title}</h1>
            {note.summary ? <p className="text-note-reader__summary">{note.summary}</p> : null}
            {note.tags.length > 0 ? (
              <ul className="text-note-reader__tags" aria-label="话题标签">
                {note.tags.map((tag) => (
                  <li key={tag} className="text-note-reader__tag">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="text-note-reader__meta">
              <time dateTime={note.publishTime}>发布于 {note.publishTime}</time>
              {note.updateTime !== note.publishTime ? (
                <span className="text-note-reader__meta-sep">·</span>
              ) : null}
              {note.updateTime !== note.publishTime ? (
                <time dateTime={note.updateTime}>更新于 {note.updateTime}</time>
              ) : null}
            </div>
          </header>

          <div className="text-note-reader__body markdown-content-shell">
            <NoteContentReader
              contentLongtext={{ editorType: note.editorType, longtext: note.body }}
              className="text-note-reader__reader markdown-md-reader"
              markdownPreviewId={markdownReaderId}
            />
          </div>
        </article>
      </div>
    </div>
  )
}
