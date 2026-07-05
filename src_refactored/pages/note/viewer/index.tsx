// 01）笔记阅读页（NoteReaderPage）
import TopNavbar from '@widgets/top-navbar'
import NoteViewerWidget, { useNoteReaderWidget } from '@widgets/note-viewer'

function NoteReaderPage() {
  const data = useNoteReaderWidget()

  return (
    <>
      {!data.isEditorialFlow ? <TopNavbar /> : null}
      <NoteViewerWidget data={data} />
    </>
  )
}
export default NoteReaderPage
