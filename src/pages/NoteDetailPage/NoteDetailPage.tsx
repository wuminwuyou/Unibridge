import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import TopNavbar from '../../components/layout/TopNavbar'
import '../../styles/DetailPage.css'
import '../../styles/HomePage.css'

// 01）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）笔记标题解析函数（resolveNoteTitleFromSearch）
/**
 * 函数名：resolveNoteTitleFromSearch
 * 功能：从查询参数中解析笔记标题，用于详情页展示卡片来源信息。
 * 实现方法：
 * - 使用 URLSearchParams 读取 title 参数
 * - 对 title 进行 trim 清理
 * - 参数缺失时返回默认占位文案
 * 输入：
 * - search：location.search 查询字符串
 * 输出：
 * - 返回值：string，笔记标题
 * - 副作用：无
 */
function resolveNoteTitleFromSearch(search: string): string {
  const searchParams = new URLSearchParams(search)
  const title = searchParams.get('title')?.trim()
  return title && title.length > 0 ? title : '未命名笔记'
}

// 03）笔记详情页面组件（NoteDetailPage）
/**
 * 函数名：NoteDetailPage
 * 功能：承接笔记卡片新标签页跳转，展示笔记标题与后续详情页建设占位内容。
 * 实现方法：
 * - 读取 URL 查询参数解析笔记标题
 * - 渲染统一 TopNavbar 保持页面导航体验一致
 * - 输出占位卡片，便于后续接入图文/视频笔记详情能力
 * 输入：
 * - 无（标题由 URL 查询参数提供）
 * 输出：
 * - 返回值：JSX.Element，笔记详情页面结构
 * - 副作用：无
 */
function NoteDetailPage() {
  const location = useLocation()
  const noteTitle = useMemo<string>(() => resolveNoteTitleFromSearch(location.search), [location.search])

  return (
    <div className="detail-page">
      <TopNavbar navItems={navItems} />
      <main className="detail-page-main">
        <section className="detail-card" aria-label="笔记详情信息">
          <p className="detail-card__label">笔记详情</p>
          <h1>{noteTitle}</h1>
          <p>笔记详情页已预留，后续可在此接入正文内容、评论互动与相关推荐模块。</p>
        </section>
      </main>
    </div>
  )
}

export default NoteDetailPage
