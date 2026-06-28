// 01）经验分享页（NoteSharePage）
import TopNavbar from '../../widgets/top-navbar'
import NoteFeedWidget from '../../widgets/note-feed'

function NoteSharePage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><NoteFeedWidget /></div>
    </div>
  </>
}
export default NoteSharePage
