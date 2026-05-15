import type { ReactNode } from 'react'
import type { Announcement, RecommendedCompany } from './types'

// 01）右侧通用卡片参数类型（SidebarCardProps）
interface SidebarCardProps {
  title: string
  actionText?: string
  children: ReactNode
}

// 02）搜索卡片参数类型（SearchSidebarCardProps）
interface SearchSidebarCardProps {
  inputId: string
}

// 03）推荐类型卡片参数类型（RecommendedTypesCardProps）
interface RecommendedTypesCardProps {
  types: string[]
}

// 04）推荐企业卡片参数类型（RecommendedCompaniesCardProps）
interface RecommendedCompaniesCardProps {
  companies: RecommendedCompany[]
  title?: string
  actionText?: string
  avatarText?: string
}

// 05）公告卡片参数类型（AnnouncementsCardProps）
interface AnnouncementsCardProps {
  announcements: Announcement[]
}

// 06）右侧通用容器组件（SidebarCard）
/**
 * 函数名：SidebarCard
 * 功能：提供统一的侧边栏卡片容器，复用标题、右上角入口与内容区域结构。
 * 实现方法：
 * - 渲染统一卡片外层样式类名
 * - 根据 actionText 是否存在决定是否显示“查看更多”入口
 * - 在卡片主体中渲染 children 透传内容
 * 输入：
 * - title：卡片标题文本
 * - actionText：可选操作入口文案
 * - children：卡片正文内容
 * 输出：
 * - 返回值：JSX.Element，通用侧边栏卡片结构
 * - 副作用：无
 */
function SidebarCard({ title, actionText, children }: SidebarCardProps) {
  return (
    <section className="sidebar-card">
      <div className="sidebar-card__header">
        <h3>{title}</h3>
        {actionText ? <a href="#!">{actionText}</a> : null}
      </div>
      {children}
    </section>
  )
}

// 07）搜索卡片组件（SearchSidebarCard）
/**
 * 函数名：SearchSidebarCard
 * 功能：渲染项目搜索卡片，提供关键词搜索输入框。
 * 实现方法：
 * - 调用 SidebarCard 复用外层结构
 * - 输出带图标的输入框并绑定 inputId
 * 输入：
 * - inputId：输入框 id，便于标签关联与后续扩展
 * 输出：
 * - 返回值：JSX.Element，搜索卡片结构
 * - 副作用：无
 */
export function SearchSidebarCard({ inputId }: SearchSidebarCardProps) {
  return (
    <SidebarCard title="搜索项目">
      <label className="search-box" htmlFor={inputId}>
        <span aria-hidden="true">🔍</span>
        <input id={inputId} type="text" placeholder="搜索项目名称 / 企业名称 / 技术关键词" />
      </label>
    </SidebarCard>
  )
}

// 08）推荐类型卡片组件（RecommendedTypesCard）
/**
 * 函数名：RecommendedTypesCard
 * 功能：渲染推荐项目类型卡片，以标签按钮展示类型列表。
 * 实现方法：
 * - 调用 SidebarCard 复用卡片标题与“查看全部”入口
 * - 循环渲染 types 为可交互 chip 按钮
 * 输入：
 * - types：推荐类型字符串数组
 * 输出：
 * - 返回值：JSX.Element，推荐类型卡片结构
 * - 副作用：无
 */
export function RecommendedTypesCard({ types }: RecommendedTypesCardProps) {
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

// 09）推荐企业卡片组件（RecommendedCompaniesCard）
/**
 * 函数名：RecommendedCompaniesCard
 * 功能：渲染推荐企业列表卡片，展示企业名称、项目数量与关注按钮。
 * 实现方法：
 * - 调用 SidebarCard 复用标题与“查看更多”入口
 * - 循环渲染企业列表项，包含头像、名称、在招项目数
 * - 为每条企业数据输出关注按钮
 * 输入：
 * - companies：推荐企业数据数组
 * 输出：
 * - 返回值：JSX.Element，推荐企业卡片结构
 * - 副作用：无
 */
export function RecommendedCompaniesCard({
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

// 10）公告卡片组件（AnnouncementsCard）
/**
 * 函数名：AnnouncementsCard
 * 功能：渲染平台公告卡片，展示公告标题与日期列表。
 * 实现方法：
 * - 调用 SidebarCard 复用标题与“查看更多”入口
 * - 循环渲染公告列表项并显示日期
 * 输入：
 * - announcements：公告数据数组
 * 输出：
 * - 返回值：JSX.Element，公告卡片结构
 * - 副作用：无
 */
export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  return (
    <SidebarCard title="平台公告" actionText="查看更多">
      <ul className="notice-list">
        {announcements.map((notice) => (
          <li key={`${notice.title}-${notice.date}`}>
            <a href="#!">{notice.title}</a>
            <span>{notice.date}</span>
          </li>
        ))}
      </ul>
    </SidebarCard>
  )
}
