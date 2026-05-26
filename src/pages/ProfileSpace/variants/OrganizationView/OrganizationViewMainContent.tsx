import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import { LabsTabContent } from '../../tabs/LabsTab'
import { OrganizationHomeTabContent } from '../../tabs/HomeTab/OrganizationHomeTabContent'
import { OrgMembersTabContent } from '../../tabs/MembersTab/OrgMembersTabContent'
import { NotesTabContent } from '../../tabs/NotesTab'
import { ProjectsTabContent } from '../../tabs/ProjectsTab'
import type { OrganizationViewModel } from './useOrganizationViewPage'
import {
  useOrganizationLabsTabData,
  useOrganizationMembersTabData,
  useOrganizationNotesTabData,
  useOrganizationProjectsTabData,
} from './useOrganizationViewTabData'

// 01）机构 Tab 主体内容 Props（OrganizationViewMainContentProps）
interface OrganizationViewMainContentProps {
  model: OrganizationViewModel
}

// 02）机构 Tab 主体内容（OrganizationViewMainContent）
/**
 * 函数名：OrganizationViewMainContent
 * 功能：按当前 Tab 懒加载并渲染机构空间主体内容。
 * 输入：
 * - model：useOrganizationViewPage 返回的状态
 * 输出：
 * - 返回值：React 节点
 * - 副作用：按 Tab 发起网络请求
 */
export function OrganizationViewMainContent({ model }: OrganizationViewMainContentProps) {
  const {
    entityCode,
    supportsLabs,
    isHomeTabActive,
    isLabsTabActive,
    isMembersTabActive,
    isProjectTabActive,
    isNotesTabActive,
  } = model

  const labsTabData = useOrganizationLabsTabData(entityCode, isLabsTabActive)
  const membersTabData = useOrganizationMembersTabData(entityCode, isMembersTabActive)
  const projectsTabData = useOrganizationProjectsTabData(entityCode, isProjectTabActive)
  const notesTabData = useOrganizationNotesTabData(entityCode, isNotesTabActive)

  if (isHomeTabActive) {
    if (!model.isShellReady) {
      return null
    }

    return <OrganizationHomeTabContent model={model} />
  }

  if (isLabsTabActive) {
    if (labsTabData.loadState === 'loading') {
      return (
        <div className="profile-tab-status">
          <LoadingSpinner size={32} label="正在加载实验室列表…" />
        </div>
      )
    }

    if (labsTabData.loadState === 'error') {
      return (
        <p className="profile-tab-status profile-tab-status--error" role="alert">
          {labsTabData.errorMessage ?? '加载实验室列表失败，请稍后重试'}
        </p>
      )
    }

    return <LabsTabContent teams={labsTabData.teams} />
  }

  if (isMembersTabActive) {
    if (membersTabData.loadState === 'loading') {
      return (
        <div className="profile-tab-status">
          <LoadingSpinner size={32} label="正在加载机构人员…" />
        </div>
      )
    }

    if (membersTabData.loadState === 'error') {
      return (
        <p className="profile-tab-status profile-tab-status--error" role="alert">
          {membersTabData.errorMessage ?? '加载机构人员失败，请稍后重试'}
        </p>
      )
    }

    return <OrgMembersTabContent members={membersTabData.members} />
  }

  if (isProjectTabActive) {
    return (
      <ProjectsTabContent
        title="机构项目"
        projects={projectsTabData.projects}
        loadState={projectsTabData.loadState}
        errorMessage={projectsTabData.errorMessage}
        emptyLabel="暂无机构项目"
      />
    )
  }

  if (isNotesTabActive) {
    return (
      <NotesTabContent
        title="机构笔记"
        notes={notesTabData.notes}
        loadState={notesTabData.loadState}
        errorMessage={notesTabData.errorMessage}
        emptyLabel="暂无机构笔记"
      />
    )
  }

  return null
}
