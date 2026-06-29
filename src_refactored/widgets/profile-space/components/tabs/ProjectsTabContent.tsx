// 01）项目 Tab 内容（ProjectsTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { ProjectItem } from '@shared/types/project'
import { ProfileProjectsSection } from '../sections/ProfileProjectsSection'
import type { ProfileTabLoadState } from '../../lib/profileTabLoadState'

// 02）项目 Tab 内容 Props（ProjectsTabContentProps）
export interface ProjectsTabContentProps {
  title?: string
  projects: ProjectItem[]
  total?: number | null
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  emptyLabel?: string
}

// 03）项目 Tab 内容（ProjectsTabContent）
/**
 * 函数名：ProjectsTabContent
 * 功能：渲染个人/团队/机构空间「项目」Tab 完整列表（含可选加载态）。
 * 输入：
 * - title / projects / total / loadState / errorMessage / emptyLabel
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProjectsTabContent({
  title = '项目',
  projects,
  total,
  loadState,
  errorMessage,
  emptyLabel = '暂无项目内容',
}: ProjectsTabContentProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载项目数据…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载项目列表失败，请稍后重试'}
      </p>
    )
  }

  return (
    <ProfileProjectsSection
      title={title}
      projects={projects}
      mode="full"
      total={total}
      emptyLabel={emptyLabel}
    />
  )
}
