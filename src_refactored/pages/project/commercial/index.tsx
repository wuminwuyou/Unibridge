// 01）企业实战频道页（CommercialProjects）
import TopNavbar from '../../../widgets/top-navbar'
import ProjectChannelWidget from '../../../widgets/project-channel'

function CommercialProjectsPage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><ProjectChannelWidget /></div>
    </div>
  </>
}
export default CommercialProjectsPage
