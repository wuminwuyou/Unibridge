import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import TopNavbar from '../components/layout/TopNavbar'
import '../styles/DetailPage.css'
import '../styles/HomePage.css'

// 01）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）项目标题解析函数（resolveProjectTitleFromSearch）
/**
 * 函数名：resolveProjectTitleFromSearch
 * 功能：从查询参数中解析项目标题，用于详情页展示卡片来源信息。
 * 实现方法：
 * - 使用 URLSearchParams 读取 title 参数
 * - 对 title 进行 trim 处理避免空白污染
 * - 参数缺失时返回默认占位文案
 * 输入：
 * - search：location.search 查询字符串
 * 输出：
 * - 返回值：string，项目标题
 * - 副作用：无
 */
function resolveProjectTitleFromSearch(search: string): string {
  const searchParams = new URLSearchParams(search)
  const title = searchParams.get('title')?.trim()
  return title && title.length > 0 ? title : '未命名项目'
}

// 03）项目详情页面组件（ProjectDetailPage）
/**
 * 函数名：ProjectDetailPage
 * 功能：承接项目卡片新标签页跳转，展示项目标题与后续详情页建设占位内容。
 * 实现方法：
 * - 读取 URL 查询参数解析项目标题
 * - 渲染统一 TopNavbar 保持页面导航体验一致
 * - 输出简洁占位卡片，便于后续接入真实项目详情数据
 * 输入：
 * - 无（标题由 URL 查询参数提供）
 * 输出：
 * - 返回值：JSX.Element，项目详情页面结构
 * - 副作用：无
 */
function ProjectDetailPage() {
  const location = useLocation()
  const projectTitle = useMemo<string>(() => resolveProjectTitleFromSearch(location.search), [location.search])

  return (
    <div className="detail-page">
      <TopNavbar navItems={navItems} />
      <main className="detail-page-main">
        <section className="detail-card" aria-label="项目详情信息">
          <p className="detail-card__label">项目详情</p>
          <h1>{projectTitle}</h1>
          <p>项目详情页已预留，后续可在此接入完整项目内容、成员信息与进度动态。</p>
        </section>
      </main>
    </div>
  )
}

export default ProjectDetailPage
