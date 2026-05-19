import { ProjectChannelLayoutView } from './ProjectChannelLayout'
import { useProjectChannelLayout } from './useProjectChannelLayout'
import type { ProjectChannelLayoutProps } from './types'

// 01）项目频道布局对外组件（ProjectChannelLayout）
/**
 * 函数名：ProjectChannelLayout
 * 功能：项目频道页的统一布局壳，对外作为默认导出。
 * 使用方页面：
 * - apps/web-client/src/pages/HomePage.tsx（首页·默认项目频道，传入 experienceRecommendedNotes 显示经验推荐区）
 * - apps/web-client/src/pages/CampusRecruitPage.tsx（高校招募频道，右侧栏改为推荐本校实验室）
 * - apps/web-client/src/pages/EnterprisePracticePage.tsx（企业实战频道，右侧栏为推荐企业）
 * 实现方法：
 * - 调用 useProjectChannelLayout 聚合项目与经验推荐两路随机批次状态
 * - 将业务参数与 model 一并交给 ProjectChannelLayoutView 完成结构渲染
 * 输入：
 * - props：ProjectChannelLayoutProps
 * 输出：
 * - 返回值：JSX.Element，项目频道页整体结构
 * - 副作用：由 useProjectChannelLayout 内 state 管理
 */
function ProjectChannelLayout(props: ProjectChannelLayoutProps) {
  const model = useProjectChannelLayout({
    projects: props.projects,
    experienceRecommendedNotes: props.experienceRecommendedNotes,
  })

  return <ProjectChannelLayoutView {...props} model={model} />
}

export default ProjectChannelLayout

export type { ProjectChannelLayoutProps } from './types'
export type { ProjectChannelLayoutModel } from './useProjectChannelLayout'
