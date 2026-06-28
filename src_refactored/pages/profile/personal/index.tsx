// 01）个人/团队/机构空间页（ProfileSpacePage）
import TopNavbar from '../../../widgets/top-navbar'
import ProfileSpaceWidget from '../../../widgets/profile-space'

function ProfileSpacePage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main"><ProfileSpaceWidget /></div>
    </div>
  </>
}
export default ProfileSpacePage
