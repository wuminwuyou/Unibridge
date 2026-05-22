import type { ReactNode } from 'react'

// 01）发布表单区块 Props（FormSectionProps）
export interface FormSectionProps {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}

// 02）发布表单区块组件（FormSection）
/**
 * 函数名：FormSection
 * 功能：发布项目/笔记页共用的表单分段卡片容器。
 * 实现方法：
 * - 段首图标 + 标题区
 * - 下方渲染子表单控件
 * 输入：
 * - icon / title / description / children
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function FormSection({ icon, title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-2xl border bg-surface p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3 border-b pb-4">
        <div className="section-icon-wrap">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-main">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}
