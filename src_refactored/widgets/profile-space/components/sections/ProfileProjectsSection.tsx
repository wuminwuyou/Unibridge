// 01）空间项目区块（ProfileProjectsSection）
import ProjectCard from '@entities/project/ui/ProjectCard'
import type { ProjectItem } from '@shared/types/project'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import './ProfileProjectsSection.css'

// 02）Props（ProfileProjectsSectionProps）
export interface ProfileProjectsSectionProps {
  title: string
  projects: ProjectItem[]
  mode: 'preview' | 'full'
  previewLimit?: number
  total?: number | null
  emptyLabel?: string
  listVariant?: 'home' | 'tab'
  onViewAll?: () => void
}

// 03）空间项目区块（ProfileProjectsSection）
/**
 * 函数名：ProfileProjectsSection
 * 功能：渲染个人 / 团队 / 机构空间的项目预览或完整列表。
 * 实现方法：
 * - preview：按 previewLimit 截断并提供「查看全部」按钮
 * - full：显示带计数后缀的完整列表
 * 输入：
 * - title / projects / mode / previewLimit / total / emptyLabel / listVariant / onViewAll
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileProjectsSection({
  title, projects, mode, previewLimit = 3, total, emptyLabel = '暂无项目内容',
  listVariant = 'tab', onViewAll,
}: ProfileProjectsSectionProps) {
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

  return (
    <ProfileTabSection
      title={title}
      titleSuffix={titleSuffix}
      headerAction={
        isPreview && projectTotal > 0 && onViewAll ? (
          <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
            {viewAllLabel}
          </button>
        ) : undefined
      }
    >
      {visibleProjects.length > 0 ? (
        <div className={listClassName}>
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.uid ?? `${project.title}-${project.publishTime}`}
              project={project}
              showStatus
            />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
