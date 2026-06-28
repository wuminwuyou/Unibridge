// 01）项目详情页（ProjectDetailPage）
import TopNavbar from '../../widgets/top-navbar'
import ProjectDetailWidget from '../../widgets/project-detail'

function ProjectDetailPage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><ProjectDetailWidget /></div>
    </div>
  </>
}
export default ProjectDetailPage
