import { useState } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import { useAuth } from '../../../../contexts/AuthContext'
import { isOrganizationAdminRole } from '../../../../auth/organizationSession'
import { LabsTabContent, ManageLabsForm } from '../../tabs/LabsTab'
import { OrganizationHomeTabContent } from '../../tabs/HomeTab/OrganizationHomeTabContent'
import { OrgMembersTabContent, OrgMembersManageForm } from '../../tabs/MembersTab'
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
 * 实现方法：
 * - 实验室 Tab 支持切换到管理表单（ManageLabsForm）
 * - 管理入口按钮仅在当前用户为机构管理员时显示
 * 输入：
 * - model：useOrganizationViewPage 返回的状态
 * 输出：
 * - 返回值：React 节点
 * - 副作用：按 Tab 发起网络请求
 */
export function OrganizationViewMainContent({ model }: OrganizationViewMainContentProps) {
  const { userProfile } = useAuth()
  const {
    entityCode,
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

  // 实验室管理表单切换
  const [isManagingLabs, setIsManagingLabs] = useState(false)

  // 人员管理表单切换
  const [isManagingMembers, setIsManagingMembers] = useState(false)

  // 判断当前用户是否为机构管理员
  const isEntityAdmin = isOrganizationAdminRole(userProfile?.userRole)

  const handleLabsSaved = (): void => {
    labsTabData.reloadLabs()
    setIsManagingLabs(false)
  }

  const handleMembersSaved = (): void => {
    membersTabData.reloadMembers()
    setIsManagingMembers(false)
  }

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

    if (isManagingLabs && isEntityAdmin) {
      return (
        <ManageLabsForm
          entityCode={entityCode}
          labs={labsTabData.teams}
          onCancel={() => setIsManagingLabs(false)}
          onSaved={handleLabsSaved}
        />
      )
    }

    return (
      <LabsTabContent
        teams={labsTabData.teams}
        showManageLabs={isEntityAdmin}
        onManageLabs={() => setIsManagingLabs(true)}
      />
    )
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

    if (isManagingMembers && isEntityAdmin) {
      return (
        <OrgMembersManageForm
          entityCode={entityCode}
          members={membersTabData.members}
          entityType={model.orgCoreProfile?.type ?? 'ENTERPRISE'}
          onCancel={() => setIsManagingMembers(false)}
          onSaved={handleMembersSaved}
        />
      )
    }

    return (
      <OrgMembersTabContent
        members={membersTabData.members}
        showManageMembers={isEntityAdmin}
        onManageMembers={() => setIsManagingMembers(true)}
      />
    )
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
