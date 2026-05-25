import './NoteReaderPage.css'
import TopNavbar from '../../layout/TopNavbar'
import { TextNoteReaderView } from './NoteArticleDetail'
import { NoteVideoDetailView } from './NoteVideoDetail'
import './NoteVideoDetail/NoteVideoDetailPage.css'
import { useNoteReaderPage } from './useNoteReaderPage'

// 01）笔记阅读路由页（NoteReaderPage）
/**
 * 函数名：NoteReaderPage
 * 功能：笔记阅读入口；图文走 TextNoteReader，视频走 NoteVideoDetail。
 * 实现方法：
 * - useNoteReaderPage 解析预览 / API / query 载荷
 * - 非发布预览流展示 TopNavbar
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
function NoteReaderPage() {
  const {
    isEditorialFlow,
    showLoading,
    showError,
    errorMessage,
    articleNote,
    videoNote,
  } = useNoteReaderPage()

  return (
    <div className={`note-reader-page ${isEditorialFlow ? 'note-reader-page--editorial' : ''}`.trim()}>
      {!isEditorialFlow ? <TopNavbar /> : null}

      {showLoading ? (
        <main className="note-reader-page__status" aria-label="笔记加载中">
          <p className="note-reader-page__status-label">笔记阅读</p>
          <h1 className="note-reader-page__status-title">加载中…</h1>
          <p className="note-reader-page__status-desc">正在从服务器获取笔记内容。</p>
        </main>
      ) : showError ? (
        <main className="note-reader-page__status" aria-label="笔记加载失败">
          <p className="note-reader-page__status-label">笔记阅读</p>
          <h1 className="note-reader-page__status-title">加载失败</h1>
          <p className="note-reader-page__status-desc">{errorMessage ?? '无法获取笔记内容，请稍后重试。'}</p>
        </main>
      ) : articleNote ? (
        <TextNoteReaderView note={articleNote} isEditorialFlow={isEditorialFlow} />
      ) : videoNote ? (
        <NoteVideoDetailView note={videoNote} isEditorialFlow={isEditorialFlow} />
      ) : (
        <main className="note-reader-page__status" aria-label="笔记未找到">
          <p className="note-reader-page__status-label">笔记阅读</p>
          <h1 className="note-reader-page__status-title">未找到笔记</h1>
          <p className="note-reader-page__status-desc">请从经验分享频道进入，或在发布笔记页预览后查看。</p>
        </main>
      )}
    </div>
  )
}

export default NoteReaderPage
