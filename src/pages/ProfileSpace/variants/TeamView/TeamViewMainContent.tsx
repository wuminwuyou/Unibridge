import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import { useAuth } from '../../../../contexts/AuthContext'
import { getUserUid } from '../../../../auth/tokenStorage'
import {
  isLabTeamUid,
  resolveViewerIsTeamMember,
} from '../../components/MemberCard/memberDisplayUtils'
import { resolveMemberCanManageTeam } from '../../components/MemberCard/memberCardUtils'
import { AchievementsTabContent } from '../../tabs/AchievementsTab'
import { TeamHomeTabContent } from '../../tabs/HomeTab'
import { ManageMembersForm, MembersTabContent } from '../../tabs/MembersTab'
import { NotesTabContent } from '../../tabs/NotesTab'
import { ProjectsTabContent } from '../../tabs/ProjectsTab'
import type { TeamViewModel } from './useTeamViewPage'
import {
  useTeamAchievementsTabData,
  useTeamMembersTabData,
  useTeamNotesTabData,
  useTeamProjectsTabData,
} from './useTeamViewTabData'

// 01）团队 Tab 主体内容 Props（TeamViewMainContentProps）
interface TeamViewMainContentProps {
  model: TeamViewModel
}

// 02）团队 Tab 主体内容（TeamViewMainContent）
/**
 * 函数名：TeamViewMainContent
 * 功能：按当前 Tab 懒加载并渲染团队空间主体内容。
 * 输入：
 * - model：useTeamViewPage 返回的状态
 * 输出：
 * - 返回值：React 节点
 * - 副作用：按 Tab 发起网络请求
 */
export function TeamViewMainContent({ model }: TeamViewMainContentProps) {
  const { isLoggedIn, userProfile } = useAuth()
  const {
    teamUid,
    isHomeTabActive,
    isMembersTabActive,
    isMembersManageActive,
    isAchievementsTabActive,
    isProjectTabActive,
    isNotesTabActive,
    handleManageMembersClick,
    handleExitMembersManage,
  } = model

  const membersTabData = useTeamMembersTabData(teamUid, isMembersTabActive)
  const achievementsTabData = useTeamAchievementsTabData(teamUid, isAchievementsTabActive)
  const projectsTabData = useTeamProjectsTabData(teamUid, isProjectTabActive)
  const notesTabData = useTeamNotesTabData(teamUid, isNotesTabActive)

  const currentUserUid = userProfile?.uid ?? getUserUid()
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
    if (!model.isShellReady) {
      return null
    }

    return <TeamHomeTabContent model={model} />
  }

  if (isMembersTabActive) {
    if (membersTabData.loadState === 'loading') {
      return (
        <div className="profile-tab-status">
          <LoadingSpinner size={32} label="正在加载团队成员…" />
        </div>
      )
    }

    if (membersTabData.loadState === 'error') {
      return (
        <p className="profile-tab-status profile-tab-status--error" role="alert">
          {membersTabData.errorMessage ?? '加载团队成员失败，请稍后重试'}
        </p>
      )
    }

    if (isMembersManageActive && canCurrentUserManageTeam) {
      return (
        <ManageMembersForm
          teamUid={teamUid}
          isLabSpace={isLabSpace}
          isLoggedIn={isLoggedIn}
          isViewerTeamMember={isViewerTeamMember}
          members={membersTabData.members}
          onCancel={handleExitMembersManage}
          onSaved={handleMembersSaved}
        />
      )
    }

    return (
      <MembersTabContent
        teamUid={teamUid}
        members={membersTabData.members}
        isLoggedIn={isLoggedIn}
        isViewerTeamMember={isViewerTeamMember}
        showManageMembers={canCurrentUserManageTeam}
        onManageMembers={handleManageMembersClick}
      />
    )
  }

  if (isAchievementsTabActive) {
    return (
      <AchievementsTabContent
        achievements={achievementsTabData.achievements}
        loadState={achievementsTabData.loadState}
        errorMessage={achievementsTabData.errorMessage}
      />
    )
  }

  if (isProjectTabActive) {
    return (
      <ProjectsTabContent
        title="团队项目"
        projects={projectsTabData.projects}
        loadState={projectsTabData.loadState}
        errorMessage={projectsTabData.errorMessage}
        emptyLabel="暂无团队项目"
      />
    )
  }

  if (isNotesTabActive) {
    return (
      <NotesTabContent
        title="团队笔记"
        notes={notesTabData.notes}
        loadState={notesTabData.loadState}
        errorMessage={notesTabData.errorMessage}
        emptyLabel="暂无团队笔记"
      />
    )
  }

  return null
}
