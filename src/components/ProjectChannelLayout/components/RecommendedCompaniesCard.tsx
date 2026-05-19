import type { RecommendedCompany } from '../../../types/project'
import SidebarCard from './SidebarCard'

// 01）推荐企业/实验室卡片参数（RecommendedCompaniesCardProps）
interface RecommendedCompaniesCardProps {
  companies: RecommendedCompany[]
  title?: string
  actionText?: string
  avatarText?: string
}

// 02）推荐企业/实验室卡片（RecommendedCompaniesCard）
/**
 * 函数名：RecommendedCompaniesCard
 * 功能：渲染项目频道页右栏的「推荐企业」或「推荐本校实验室」卡片。
 * 实现方法：
 * - 复用 SidebarCard 外壳，标题与入口文案均可外部覆盖
 * - 遍历企业/实验室列表渲染头像、名称、在招项目数与关注按钮
 * 输入：
 * - companies：企业/实验室列表
 * - title：卡片标题，默认「推荐企业」
 * - actionText：右上角入口文案，默认「查看更多」
 * - avatarText：头像占位文案，默认「企」（实验室页可传「校」）
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function RecommendedCompaniesCard({
  companies,
  title = '推荐企业',
  actionText = '查看更多',
  avatarText = '企',
}: RecommendedCompaniesCardProps) {
  return (
    <SidebarCard title={title} actionText={actionText}>
      <ul className="company-list">
        {companies.map((company) => (
          <li key={company.name}>
            <div className="company-item">
              <span className="company-avatar" aria-hidden="true">
                {avatarText}
              </span>
              <div>
                <strong>{company.name}</strong>
                <p>{company.projects}</p>
              </div>
            </div>
            <button type="button" className="follow-button">
              关注
            </button>
          </li>
        ))}
      </ul>
    </SidebarCard>
  )
}

export default RecommendedCompaniesCard
