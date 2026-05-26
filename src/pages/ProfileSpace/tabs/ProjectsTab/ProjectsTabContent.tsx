import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import type { ProjectItem } from '../../../../types/project'
import { ProfileProjectsSection } from '../../components/ProfileProjectsSection'
import type { ProfileTabLoadState } from '../../components/profileTabLoadState'
import { usePersonalProjectsTabData } from './usePersonalProjectsTabData'

// 01）项目 Tab 内容 Props（ProjectsTabContentProps）
export interface ProjectsTabContentProps {
  title?: string
  projects: ProjectItem[]
  total?: number | null
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  emptyLabel?: string
}

// 02）项目 Tab 内容（ProjectsTabContent）
/**
 * 函数名：ProjectsTabContent
 * 功能：渲染个人/团队空间「项目」Tab 完整列表（含可选加载态）。
 * 输入：
 * - title：区块标题，默认「项目」
 * - projects：项目列表
 * - total：总数
 * - loadState / errorMessage：可选加载与错误态
 * - emptyLabel：空态文案
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

// 03）个人项目 Tab 内容 Props（PersonalProjectsTabContentProps）
interface PersonalProjectsTabContentProps {
  profileUid?: string | null
}

// 04）个人项目 Tab 内容（PersonalProjectsTabContent）
/**
 * 函数名：PersonalProjectsTabContent
 * 功能：个人空间「项目」Tab 入口，内部拉取数据并渲染 ProjectsTabContent。
 * 输入：
 * - profileUid：目标用户 uid（查看他人空间时由 ?uid= 传入）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求
 */
export function PersonalProjectsTabContent({ profileUid }: PersonalProjectsTabContentProps = {}) {
  const { loadState, errorMessage, projects, total } = usePersonalProjectsTabData(profileUid)

  return (
    <ProjectsTabContent
      title="项目"
      projects={projects}
      total={total}
      loadState={loadState}
      errorMessage={errorMessage}
    />
  )
}
