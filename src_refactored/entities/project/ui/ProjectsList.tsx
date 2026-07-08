// 01）空间项目列表（ProjectsList）— 名词类纯展示
import type { ReactNode } from 'react'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { ProjectItem } from '@shared/types/project'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import ProjectCard from '@entities/project/ui/ProjectCard'
import './ProjectsList.css'

// 02）项目列表 Props（ProjectsListProps）
export interface ProjectsListProps {
  title: string
  projects: ProjectItem[]
  mode: 'preview' | 'full'
  previewLimit?: number
  total?: number | null
  emptyLabel?: string
  listVariant?: 'home' | 'tab'
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）空间项目列表（ProjectsList）
/**
 * 函数名：ProjectsList
 * 功能：渲染个人 / 团队 / 机构空间的项目预览或完整列表（含可选加载/错误态）。
 * 实现方法：
 * - preview：按 previewLimit 截断并提供「查看全部」按钮
 * - full：显示带计数后缀的完整列表
 * - 接收 loadState 可直接展示行内 loading/error
 * 输入：
 * - ProjectsListProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProjectsList({
  title,
  projects,
  mode,
  previewLimit = 3,
  total,
  emptyLabel = '暂无项目内容',
  listVariant = 'tab',
  loadState,
  errorMessage,
  onViewAll,
  headerAction,
}: ProjectsListProps) {
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

  const isPreview = mode === 'preview'
  const visibleProjects = isPreview ? projects.slice(0, previewLimit) : projects
  const projectTotal = total ?? projects.length
  const titleSuffix = !isPreview && projectTotal > 0 ? `（${projectTotal}）` : undefined
  const viewAllLabel =
    projectTotal > visibleProjects.length ? `查看全部（${projectTotal}）` : '查看全部'
  const listClassName =
    listVariant === 'home'
      ? 'profile-space-project-list profile-space-project-list--home'
      : 'profile-space-project-list'

  const resolvedHeaderAction =
    headerAction ??
    (isPreview && projectTotal > 0 && onViewAll ? (
      <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
        {viewAllLabel}
      </button>
    ) : undefined)

  return (
    <ProfileTabSection
      title={title}
      titleSuffix={titleSuffix}
      headerAction={resolvedHeaderAction}
    >
      {visibleProjects.length > 0 ? (
        <div className={listClassName}>
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.uid ?? `${project.title}-${project.publishTime}`}
              project={project}
              showStatus
              variant="compact"
            />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
