import type { ReactNode } from 'react'
import './style.css'

// 01）发布表单区块 Props（PublishFormSectionProps）
export interface PublishFormSectionProps {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}

// 02）发布表单区块组件（PublishFormSection）
/**
 * 函数名：PublishFormSection
 * 功能：发布项目/笔记页共用的表单分段卡片容器。
 * 实现方法：
 * - 段首图标 + 标题区
 * - 下方渲染子表单控件
 * - 样式由同目录 style.css 提供，颜色对齐 index.css 全局变量
 * 输入：
 * - icon / title / description / children
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function PublishFormSection({ icon, title, description, children }: PublishFormSectionProps) {
  return (
    <section className="publish-form-section">
      <div className="publish-form-section__header">
        <div className="publish-form-section__icon">{icon}</div>
        <div>
          <h2 className="publish-form-section__title">{title}</h2>
          <p className="publish-form-section__description">{description}</p>
        </div>
      </div>
      <div className="publish-form-section__body">{children}</div>
    </section>
  )
}
