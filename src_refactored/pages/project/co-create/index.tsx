// 01）高校共创页（CampusCoCreation）
import TopNavbar from '../../widgets/top-navbar'
import ProjectChannelWidget from '../../widgets/project-channel'

function CampusCoCreationPage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><ProjectChannelWidget /></div>
    </div>
  </>
}
export default CampusCoCreationPage
