// 01）笔记阅读页（NoteReaderPage）
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import TopNavbar from '@widgets/top-navbar'
import NoteViewerWidget, { useNoteReaderWidget } from '@widgets/note-viewer'
import { NOTE_READER_EDITOR_REDIRECT_SEGMENTS, NOTES_EDITOR_PATH } from '@shared/lib/noteRoutes'

// 02）笔记阅读页内容（NoteReaderPageContent）
function NoteReaderPageContent() {
  const data = useNoteReaderWidget()

  return (
    <>
      {!data.isEditorialFlow ? <TopNavbar /> : null}
      <NoteViewerWidget data={data} />
    </>
  )
}

function NoteReaderPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  // 兜底：若 :id 误匹配 editor/create 静态段，重定向至编辑页（保留 query）
  if (id && (NOTE_READER_EDITOR_REDIRECT_SEGMENTS as readonly string[]).includes(id)) {
    const query = searchParams.toString()
    return <Navigate to={`${NOTES_EDITOR_PATH}${query ? `?${query}` : ''}`} replace />
  }

  return <NoteReaderPageContent />
}

export default NoteReaderPage
