// 01）即时通讯页（InstantMessagePage）
import TopNavbar from '../../widgets/top-navbar'
import ImLayoutWidget from '../../widgets/im-layout'

function InstantMessagePage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><ImLayoutWidget /></div>
    </div>
  </>
}
export default InstantMessagePage
