import type { ReactNode } from 'react'

// 01）侧栏通用容器参数（SidebarCardProps）
interface SidebarCardProps {
  title: string
  actionText?: string
  children: ReactNode
}

// 02）侧栏通用容器（SidebarCard）
/**
 * 函数名：SidebarCard
 * 功能：提供项目频道页右侧栏统一卡片外壳：标题 + 可选「查看更多」入口 + children。
 * 实现方法：
 * - 渲染统一的 sidebar-card 外层结构
 * - 仅当传入 actionText 时显示右上角入口
 * - 子内容通过 children 透传
 * 输入：
 * - title：卡片标题
 * - actionText：可选，右上角操作文案
 * - children：卡片正文
 * 输出：
 * - 返回值：JSX.Element
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

export default SidebarCard
