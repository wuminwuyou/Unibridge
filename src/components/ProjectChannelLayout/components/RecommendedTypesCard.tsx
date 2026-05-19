import SidebarCard from './SidebarCard'

// 01）推荐类型卡片参数（RecommendedTypesCardProps）
interface RecommendedTypesCardProps {
  types: string[]
}

// 02）推荐项目类型卡片（RecommendedTypesCard）
/**
 * 函数名：RecommendedTypesCard
 * 功能：渲染项目频道页右栏的「推荐项目类型」标签卡片。
 * 实现方法：
 * - 复用 SidebarCard 外壳，含「查看全部」入口
 * - 遍历 types 渲染为 chip 按钮
 * 输入：
 * - types：推荐类型字符串数组
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function RecommendedTypesCard({ types }: RecommendedTypesCardProps) {
  return (
    <SidebarCard title="推荐项目类型" actionText="查看全部">
      <div className="chip-list">
        {types.map((type) => (
          <button key={type} type="button" className="type-chip">
            {type}
          </button>
        ))}
      </div>
    </SidebarCard>
  )
}

export default RecommendedTypesCard
