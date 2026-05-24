import {
  ArrowLeft,
  Bookmark,
  Eye,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ThumbsUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { NoteCommentsSection } from '../../../components/NoteCommentsSection'
import {
  MarkdownMdCatalogPanel,
  NoteContentReader,
  useMarkdownReaderId,
} from '../../../components/Reader'
import {
  formatNoteStatCount,
  noteDetailPublishStatusLabelMap,
  resolveNoteAuthorInitial,
  resolveNoteEditorialBannerText,
} from '../shared/noteDetailShared'
import type { NoteArticleDetailPayload } from './types'
import '../../../components/Reader/MarkdownMdPreviewReader.css'
import './NoteArticleDetailPage.css'

// 01）图文笔记详情视图 Props（NoteArticleDetailViewProps）
interface NoteArticleDetailViewProps {
  note: NoteArticleDetailPayload
  isEditorialFlow?: boolean
}

// 02）图文笔记详情视图（NoteArticleDetailView）
/**
 * 函数名：NoteArticleDetailView
 * 功能：图文模式笔记详情页（GitHub Discussions 风格阅读流）。
 * 实现方法：
 * - 顶栏作者信息 + 标题 + 标签
 * - 可选封面图
 * - NoteContentReader 渲染正文；目录悬浮于主栏左侧外部
 * - 发布流程隐藏顶栏面包屑并展示返回编辑
 * 输入：
 * - note：NoteArticleDetailPayload
 * - isEditorialFlow：来自发布页跳转时为 true
 * 输出：
 * - 返回值：React 节点
 */
export function NoteArticleDetailView({ note, isEditorialFlow = false }: NoteArticleDetailViewProps) {
  const statusLabel = noteDetailPublishStatusLabelMap[note.publishStatus]
  const showMarkdownCatalog = note.body.trim().length > 0
  const markdownReaderId = useMarkdownReaderId()

  return (
    <div className={`note-discussion-page ${isEditorialFlow ? 'note-discussion-page--editorial' : ''}`.trim()}>
      <div
        className={`note-discussion-page__layout ${showMarkdownCatalog ? 'note-discussion-page__layout--with-catalog' : ''}`.trim()}
      >
        {showMarkdownCatalog ? (
          <aside className="note-discussion-catalog-column" aria-label="文章目录">
            <MarkdownMdCatalogPanel editorId={markdownReaderId} />
          </aside>
        ) : null}

        <div className="note-discussion-page__inner">
          {isEditorialFlow ? (
            <div className="detail-preview-banner" role="status">
              <p className="detail-preview-banner__text">{resolveNoteEditorialBannerText(note.publishStatus)}</p>
              <Link to="/publish/note" className="detail-preview-banner__action">
                <ArrowLeft className="h-4 w-4" />
                返回编辑
              </Link>
            </div>
          ) : (
            <nav className="note-discussion-nav" aria-label="笔记导航">
              <Link to="/experience-share" className="note-discussion-nav__back">
                <ArrowLeft className="h-4 w-4" />
                经验分享
              </Link>
              <span className="note-discussion-nav__sep">/</span>
              <span className="note-discussion-nav__current">讨论</span>
            </nav>
          )}

          <article className="note-discussion-post" aria-label="笔记正文">
            <header className="note-discussion-post__header">
              <div className="note-discussion-author">
                {note.author.avatarUrl ? (
                  <img className="note-discussion-author__avatar" src={note.author.avatarUrl} alt="" />
                ) : (
                  <span className="note-discussion-author__avatar note-discussion-author__avatar--fallback">
                    {resolveNoteAuthorInitial(note.author.name)}
                  </span>
                )}
                <div className="note-discussion-author__meta">
                  <div className="note-discussion-author__line">
                    <strong className="note-discussion-author__name">{note.author.name}</strong>
                    <span className="note-discussion-author__handle">@{note.author.handle}</span>
                    {note.publishStatus !== 'PUBLISHED' ? (
                      <span
                        className={`note-discussion-status note-discussion-status--${note.publishStatus.toLowerCase()}`}
                      >
                        {statusLabel}
                      </span>
                    ) : null}
                  </div>
                  <time className="note-discussion-author__time" dateTime={note.publishTime}>
                    发布于 {note.publishTime}
                    {note.updateTime !== note.publishTime ? ` · 编辑于 ${note.updateTime}` : null}
                  </time>
                </div>
                <button type="button" className="note-discussion-post__menu" aria-label="更多操作">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <h1 className="note-discussion-post__title">{note.title}</h1>

              {note.tags.length > 0 ? (
                <div className="note-discussion-labels">
                  {note.tags.map((tag) => (
                    <span key={tag} className="note-discussion-label">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {note.summary ? <p className="note-discussion-post__summary">{note.summary}</p> : null}
            </header>

            <div className="note-discussion-post__body">
              <div className="note-discussion-post__body-label">
                <FileText className="h-4 w-4" />
                正文 · {note.editorType === 'RICHTEXT' ? '所见即所得' : 'Markdown'}
              </div>
              <NoteContentReader
                contentLongtext={{ editorType: note.editorType, longtext: note.body }}
                className="note-discussion-reader"
                markdownPreviewId={markdownReaderId}
              />
            </div>

            <footer className="note-discussion-reactions">
              <div className="note-discussion-reactions__stats">
                <span className="note-discussion-reactions__stat">
                  <Eye className="h-4 w-4" />
                  {formatNoteStatCount(note.views)} 浏览
                </span>
                <span className="note-discussion-reactions__stat">
                  <MessageCircle className="h-4 w-4" />
                  {formatNoteStatCount(note.comments)} 评论
                </span>
                <span className="note-discussion-reactions__stat">
                  <Bookmark className="h-4 w-4" />
                  {formatNoteStatCount(note.favorites)} 收藏
                </span>
              </div>
              <div className="note-discussion-reactions__actions">
                <button type="button" className="note-discussion-reactions__btn">
                  <ThumbsUp className="h-4 w-4" />
                  点赞
                </button>
                <button type="button" className="note-discussion-reactions__btn">
                  <MessageCircle className="h-4 w-4" />
                  回复
                </button>
                <button type="button" className="note-discussion-reactions__btn">
                  <Share2 className="h-4 w-4" />
                  分享
                </button>
              </div>
            </footer>
          </article>

          <NoteCommentsSection commentCount={note.comments} />
        </div>
      </div>
    </div>
  )
}
