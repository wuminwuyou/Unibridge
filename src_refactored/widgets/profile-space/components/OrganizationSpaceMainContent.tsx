// 01）机构空间 Tab 主体内容（OrganizationSpaceMainContent）
import { useState } from 'react'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import { useAuth } from '@shared/hooks/useAuth'
import { isOrganizationAdminRole } from '@shared/lib/organizationSession'
import { ManageLabsForm, OrgMembersManageForm } from '@features/team-management'
import type { OrganizationSpaceWidgetModel } from '../hooks/useOrganizationSpaceWidget'
import {
  useOrganizationLabsTabData, useOrganizationMembersTabData,
  useOrganizationNotesTabData, useOrganizationProjectsTabData,
} from '../hooks/useOrganizationTabData'
import { OrganizationHomeTabContent } from './tabs/OrganizationHomeTabContent'
import { LabsTabContent } from './tabs/LabsTabContent'
import { OrgMembersTabContent } from './tabs/OrgMembersTabContent'
import { NotesTabContent } from './tabs/NotesTabContent'
import { ProjectsTabContent } from './tabs/ProjectsTabContent'

// 02）机构空间 Tab 主体内容 Props（OrganizationSpaceMainContentProps）
interface OrganizationSpaceMainContentProps {
  model: OrganizationSpaceWidgetModel
}

// 03）机构空间 Tab 主体内容（OrganizationSpaceMainContent）
/**
 * 函数名：OrganizationSpaceMainContent
 * 功能：按当前 Tab 懒加载并渲染机构空间主体内容。
 * 实现方法：
 * - 实验室 Tab 支持切换到管理表单（ManageLabsForm）
 * - 管理入口按钮仅在当前用户为机构管理员时显示
 * 输入：
 * - model：useOrganizationSpaceWidget 返回的状态
 * 输出：
 * - 返回值：React 节点
 * - 副作用：按 Tab 发起网络请求
 */
export function OrganizationSpaceMainContent({ model }: OrganizationSpaceMainContentProps) {
  const { userProfile } = useAuth()
  const {
    entityCode,
    orgCoreProfile,
    isHomeTabActive,
    isLabsTabActive,
    isMembersTabActive,
    isProjectTabActive,
    isNotesTabActive,
    isShellReady,
  } = model

  const labsTabData = useOrganizationLabsTabData(entityCode, isLabsTabActive)
  const membersTabData = useOrganizationMembersTabData(entityCode, isMembersTabActive)
  const projectsTabData = useOrganizationProjectsTabData(entityCode, isProjectTabActive)
  const notesTabData = useOrganizationNotesTabData(entityCode, isNotesTabActive)

  const [isManagingLabs, setIsManagingLabs] = useState(false)
  const [isManagingMembers, setIsManagingMembers] = useState(false)

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
    if (!isShellReady) return null
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
          entityType={orgCoreProfile?.type ?? 'ENTERPRISE'}
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
