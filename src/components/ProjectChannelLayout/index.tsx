import './style.css'
import { ProjectChannelLayoutView } from './ProjectChannelLayout'
import type { ProjectChannelLayoutProps } from './types'

// 01）项目频道布局对外组件（ProjectChannelLayout）
/**
 * 函数名：ProjectChannelLayout
 * 功能：项目频道页的统一布局壳，对外作为默认导出。
 * 使用方页面：
 * - apps/web-client/src/pages/CommercialProjects（企业实战频道）
 * - apps/web-client/src/pages/CampusCoCreation（高校共创频道）
 * 实现方法：
 * - 将业务参数交给 ProjectChannelLayoutView 完成结构渲染
 * 输入：
 * - props：ProjectChannelLayoutProps
 * 输出：
 * - 返回值：JSX.Element，项目频道页整体结构
 * - 副作用：无
 */
function ProjectChannelLayout(props: ProjectChannelLayoutProps) {
  return <ProjectChannelLayoutView {...props} />
}

export default ProjectChannelLayout

export type { ProjectChannelLayoutProps } from './types'
export { buildCommercialLabFilterTabs, buildProjectLabFilterTabs } from './projectLabFilters'
