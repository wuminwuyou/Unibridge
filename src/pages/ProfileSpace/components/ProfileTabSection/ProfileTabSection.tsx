import type { ReactNode } from 'react'
import './ProfileTabSection.css'

// 01）空间 Tab 区块 Props（ProfileTabSectionProps）
export interface ProfileTabSectionProps {
  title: string
  titleSuffix?: string
  countLabel?: string
  headerAction?: ReactNode
  className?: string
  children: ReactNode
}

// 02）空间 Tab 通用区块（ProfileTabSection）
/**
 * 函数名：ProfileTabSection
 * 功能：个人/团队空间 Tab 下统一的卡片区块外壳（标题、计数、右侧操作区）。
 * 实现方法：
 * - 渲染 profile-section-card 结构
 * - 支持标题后缀（如总数）与独立 countLabel（如「4 人」）
 * - headerAction 插槽放置「查看全部」「管理成员」等按钮
 * 输入：
 * - title：区块标题
 * - titleSuffix：标题后缀，如「（12）」
 * - countLabel：标题旁计数文案
 * - headerAction：右侧操作区 React 节点
 * - className：附加 class
 * - children：区块主体内容
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProfileTabSection({
  title,
  titleSuffix,
  countLabel,
  headerAction,
  className,
  children,
}: ProfileTabSectionProps) {
  const sectionClassName = ['profile-section-card', 'profile-tab-section', className].filter(Boolean).join(' ')

  return (
    <article className={sectionClassName}>
      <header className="profile-section-card__head profile-tab-section__head">
        <div className="profile-tab-section__title-group">
          <h2>
            {title}
            {titleSuffix}
          </h2>
          {countLabel ? <span className="profile-tab-section__count">{countLabel}</span> : null}
        </div>
        {headerAction}
      </header>
      {children}
    </article>
  )
}
