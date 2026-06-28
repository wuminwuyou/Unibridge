// 01）首页极薄路由入口（HomePage）
import TopNavbar from '../../widgets/top-navbar'
import HomeFeedWidget from '../../widgets/home-feed'
import '../../widgets/home-feed/HomeFeedLayout.css'
import './HomePage.css'

function HomePage() {
  return (
    <div className="home-page">
      <TopNavbar />
      <HomeFeedWidget />
    </div>
  )
}

export default HomePage
