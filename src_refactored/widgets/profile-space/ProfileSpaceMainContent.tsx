// 01）空间页统一大部件主内容（ProfileSpaceMainContent）— 按变体与 Tab 分发
import { useState } from 'react'
import { useAuth } from '@shared/hooks/useAuth'
import { getUserUid } from '@shared/lib/tokenStorage'
import { isOrganizationAdminRole } from '@shared/lib/organizationSession'
import {
  isLabTeamUid, resolveViewerIsTeamMember,
} from '@entities/member/lib/memberDisplayUtils'
import { resolveMemberCanManageTeam } from '@entities/member/lib/memberCardUtils'
import { ManageMembersForm, ManageLabsForm, OrgMembersManageForm } from '@features/team-management'
import { MembersTabContent } from '@features/team-management/components/MembersTabContent'
import { OrgMembersTabContent } from '@features/team-management/components/OrgMembersTabContent'
import { LabsTabContent } from '@features/team-management/components/LabsTabContent'
import { ProjectsList } from '@entities/project/ui/ProjectsList'
import { NotesList } from '@entities/note/ui/NotesList'
import { AchievementsList } from '@entities/team/ui/AchievementsList'
import { PersonalHomeTabContent } from '@features/profile-space/components/HomeTab/PersonalHomeTabContent'
import { TeamHomeTabContent } from '@features/profile-space/components/HomeTab/TeamHomeTabContent'
import { OrganizationHomeTabContent } from '@features/profile-space/components/HomeTab/OrganizationHomeTabContent'
import { PersonalNotesTabContent } from '@features/profile-space/components/NotesTab/PersonalNotesTabContent'

import {
  useTeamProfileMembersTabData, useTeamProfileProjectsTabData,
  useTeamProfileNotesTabData, useTeamProfileAchievementsTabData,
} from '@entities/team/model/useTeamProfileTabData'
import {
  useEntityProfileLabsTabData, useEntityProfileMembersTabData,
  useEntityProfileProjectsTabData, useEntityProfileNotesTabData,
} from '@entities/organization/model/useEntityProfileTabData'
import { useUserProfileProjectsTabData } from '@entities/user/model/useUserProfileTabData'
import type {
  PersonalSpaceVariantModel, TeamSpaceVariantModel, OrganizationSpaceVariantModel,
} from './model/useProfileSpaceWidget'

// ---- 个人项目 Tab ----
function PersonalProjectsContent({ profileUid }: { profileUid?: string | null }) {
  const { loadState, errorMessage, projects, total } = useUserProfileProjectsTabData(profileUid)
  return <ProjectsList title="项目" projects={projects} mode="full" total={total} loadState={loadState} errorMessage={errorMessage} />
}

// ---- 个人空间主内容 ----
interface PersonalMainContentProps { model: PersonalSpaceVariantModel }
function PersonalMainContent({ model }: PersonalMainContentProps) {
  const { activeTab, isHomeLikeTabActive, isShellReady, userCoreProfile, profileUidFromQuery, handleTabClick } = model
  const profileUid = userCoreProfile?.uid ?? ''

  return (
    <>
      {isHomeLikeTabActive && isShellReady ? (
        <PersonalHomeTabContent
          profileUid={profileUid}
          enabled={isShellReady}
          onViewAllProjects={() => handleTabClick('项目')}
          onViewAllNotes={() => handleTabClick('笔记')}
        />
      ) : null}
      {activeTab === '项目' ? (
        <PersonalProjectsContent profileUid={profileUidFromQuery} />
      ) : null}
      {activeTab === '笔记' ? (
        <PersonalNotesTabContent profileUid={profileUidFromQuery} />
      ) : null}
    </>
  )
}

// ---- 团队空间主内容 ----
interface TeamMainContentProps { model: TeamSpaceVariantModel }
function TeamMainContent({ model }: TeamMainContentProps) {
  const { isLoggedIn, userProfile } = useAuth()
  const {
    teamUid, isHomeTabActive, isMembersTabActive, isMembersManageActive,
    isAchievementsTabActive, isProjectTabActive, isNotesTabActive,
    isShellReady, handleManageMembersClick, handleExitMembersManage,
  } = model

  const membersTabData = useTeamProfileMembersTabData(teamUid, isMembersTabActive)
  const achievementsTabData = useTeamProfileAchievementsTabData(teamUid, isAchievementsTabActive)
  const projectsTabData = useTeamProfileProjectsTabData(teamUid, isProjectTabActive)
  const notesTabData = useTeamProfileNotesTabData(teamUid, isNotesTabActive)

  const currentUserUid = userProfile?.uid ?? getUserUid() ?? ''
  const isLabSpace = isLabTeamUid(teamUid)
  const isViewerTeamMember = resolveViewerIsTeamMember(membersTabData.members, currentUserUid)
  const canCurrentUserManageTeam =
    membersTabData.loadState === 'ready'
      ? resolveMemberCanManageTeam(membersTabData.members, currentUserUid)
      : false

  const handleMembersSaved = (): void => {
    membersTabData.reloadMembers()
    handleExitMembersManage()
  }

  if (isHomeTabActive) {
    if (!isShellReady) return null
    return <TeamHomeTabContent teamUid={teamUid} teamMembers={model.teamMembers} onNavigateTab={model.handleTabClick} />
  }

  if (isMembersTabActive) {
    if (isMembersManageActive && canCurrentUserManageTeam) {
      return (
        <ManageMembersForm
          teamUid={teamUid} isLabSpace={isLabSpace} isLoggedIn={isLoggedIn}
          isViewerTeamMember={isViewerTeamMember} members={membersTabData.members}
          onCancel={handleExitMembersManage} onSaved={handleMembersSaved}
        />
      )
    }
    return (
      <MembersTabContent
        teamUid={teamUid} members={membersTabData.members}
        isLoggedIn={isLoggedIn} isViewerTeamMember={isViewerTeamMember}
        showManageMembers={canCurrentUserManageTeam}
        onManageMembers={handleManageMembersClick}
        loadState={membersTabData.loadState} errorMessage={membersTabData.errorMessage}
      />
    )
  }

  if (isAchievementsTabActive) {
    return <AchievementsList title="团队成果" achievements={achievementsTabData.achievements} mode="full" loadState={achievementsTabData.loadState} errorMessage={achievementsTabData.errorMessage} />
  }

  if (isProjectTabActive) {
    return <ProjectsList title="团队项目" projects={projectsTabData.projects} mode="full" loadState={projectsTabData.loadState} errorMessage={projectsTabData.errorMessage} emptyLabel="暂无团队项目" />
  }

  if (isNotesTabActive) {
    return <NotesList title="团队笔记" notes={notesTabData.notes} mode="full" layout="grid-three" loadState={notesTabData.loadState} errorMessage={notesTabData.errorMessage} emptyLabel="暂无团队笔记" />
  }

  return null
}

// ---- 机构空间主内容 ----
interface OrganizationMainContentProps { model: OrganizationSpaceVariantModel }
function OrganizationMainContent({ model }: OrganizationMainContentProps) {
  const { userProfile } = useAuth()
  const {
    entityCode, orgCoreProfile, isHomeTabActive, isLabsTabActive,
    isMembersTabActive, isProjectTabActive, isNotesTabActive, isShellReady,
  } = model

  const labsTabData = useEntityProfileLabsTabData(entityCode, isLabsTabActive)
  const membersTabData = useEntityProfileMembersTabData(entityCode, isMembersTabActive)
  const projectsTabData = useEntityProfileProjectsTabData(entityCode, isProjectTabActive)
  const notesTabData = useEntityProfileNotesTabData(entityCode, isNotesTabActive)

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
    return (
      <OrganizationHomeTabContent
        entityCode={entityCode}
        supportsLabs={orgCoreProfile?.supportsLabs ?? true}
        orgMembersPreview={model.orgMembersPreview}
        onNavigateTab={model.handleTabClick}
      />
    )
  }

  if (isLabsTabActive) {
    if (isManagingLabs && isEntityAdmin) {
      return <ManageLabsForm entityCode={entityCode} labs={labsTabData.teams} onCancel={() => setIsManagingLabs(false)} onSaved={handleLabsSaved} />
    }
    return <LabsTabContent teams={labsTabData.teams} showManageLabs={isEntityAdmin} onManageLabs={() => setIsManagingLabs(true)} loadState={labsTabData.loadState} errorMessage={labsTabData.errorMessage} />
  }

  if (isMembersTabActive) {
    if (isManagingMembers && isEntityAdmin) {
      return <OrgMembersManageForm entityCode={entityCode} members={membersTabData.members} entityType={orgCoreProfile?.type ?? 'ENTERPRISE'} onCancel={() => setIsManagingMembers(false)} onSaved={handleMembersSaved} />
    }
    return <OrgMembersTabContent members={membersTabData.members} showManageMembers={isEntityAdmin} onManageMembers={() => setIsManagingMembers(true)} loadState={membersTabData.loadState} errorMessage={membersTabData.errorMessage} />
  }

  if (isProjectTabActive) {
    return <ProjectsList title="机构项目" projects={projectsTabData.projects} mode="full" loadState={projectsTabData.loadState} errorMessage={projectsTabData.errorMessage} emptyLabel="暂无机构项目" />
  }

  if (isNotesTabActive) {
    return <NotesList title="机构笔记" notes={notesTabData.notes} mode="full" layout="grid-three" loadState={notesTabData.loadState} errorMessage={notesTabData.errorMessage} emptyLabel="暂无机构笔记" />
  }

  return null
}

// 02）对外公开导出
export { PersonalMainContent, TeamMainContent, OrganizationMainContent }
