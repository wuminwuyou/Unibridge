// 01）在线编辑器页（OnlineTextEditorPage）
import TopNavbar from '../../widgets/top-navbar'
import OnlineEditorWidget from '../../widgets/online-editor'

function OnlineTextEditorPage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><OnlineEditorWidget /></div>
    </div>
  </>
}
export default OnlineTextEditorPage
