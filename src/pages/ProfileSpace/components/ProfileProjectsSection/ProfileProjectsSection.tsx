import ProjectCard from '../../../../components/ProjectCard'
import type { ProjectItem } from '../../../../types/project'
import { ProfileTabSection } from '../ProfileTabSection'
import './ProfileProjectsSection.css'

// 01）空间项目区块 Props（ProfileProjectsSectionProps）
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

// 02）空间项目区块（ProfileProjectsSection）
/**
 * 函数名：ProfileProjectsSection
 * 功能：渲染个人/团队空间的项目预览或完整列表。
 * 输入：
 * - title：区块标题
 * - projects：项目列表
 * - mode：preview | full
 * - previewLimit：预览条数上限
 * - total：总数（用于「查看全部（N）」）
 * - emptyLabel：空态文案
 * - listVariant：home 使用主页紧凑样式，tab 使用 Tab 列表样式
 * - onViewAll：预览模式跳转回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProfileProjectsSection({
  title,
  projects,
  mode,
  previewLimit = 3,
  total,
  emptyLabel = '暂无项目内容',
  listVariant = 'tab',
  onViewAll,
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
