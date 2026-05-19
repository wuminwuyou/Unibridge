import SidebarCard from './SidebarCard'

// 01）搜索卡片参数（SearchSidebarCardProps）
interface SearchSidebarCardProps {
  inputId: string
}

// 02）项目搜索卡片（SearchSidebarCard）
/**
 * 函数名：SearchSidebarCard
 * 功能：渲染项目频道页右栏的「搜索项目」卡片。
 * 实现方法：
 * - 复用 SidebarCard 外壳
 * - 输出带 🔍 图标的搜索输入框
 * - inputId 由父级传入，便于多频道页共存时避免 id 冲突
 * 输入：
 * - inputId：输入框 id
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function SearchSidebarCard({ inputId }: SearchSidebarCardProps) {
  return (
    <SidebarCard title="搜索项目">
      <label className="search-box" htmlFor={inputId}>
        <span aria-hidden="true">🔍</span>
        <input id={inputId} type="text" placeholder="搜索项目名称 / 企业名称 / 技术关键词" />
      </label>
    </SidebarCard>
  )
}

export default SearchSidebarCard
