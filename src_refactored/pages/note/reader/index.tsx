// 01）笔记阅读页（NoteReaderPage）
import TopNavbar from '../../../widgets/top-navbar'
import NoteDetailWidget from '../../../widgets/note-detail'

function NoteReaderPage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><NoteDetailWidget /></div>
    </div>
  </>
}
export default NoteReaderPage
