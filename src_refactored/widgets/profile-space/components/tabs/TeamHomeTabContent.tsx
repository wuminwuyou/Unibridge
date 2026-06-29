// 01）团队主页 Tab 内容（TeamHomeTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import { useAuth } from '@shared/hooks/useAuth'
import { getUserUid } from '@shared/lib/tokenStorage'
import { resolveViewerIsTeamMember } from '@entities/member/lib/memberDisplayUtils'
import { ProfileAchievementsSection } from '../sections/ProfileAchievementsSection'
import { ProfileMembersSection } from '../sections/ProfileMembersSection'
import { ProfileNotesSection } from '../sections/ProfileNotesSection'
import { ProfileProjectsSection } from '../sections/ProfileProjectsSection'
import {
  PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT,
} from '../../lib/profileSpaceTabConstants'
import type { TeamSpaceWidgetModel } from '../../hooks/useTeamSpaceWidget'
import { useTeamHomeTabData } from '../../hooks/useTeamTabData'

// 02）团队主页 Tab 内容 Props（TeamHomeTabContentProps）
interface TeamHomeTabContentProps {
  model: TeamSpaceWidgetModel
}

// 03）团队主页 Tab 内容（TeamHomeTabContent）
/**
 * 函数名：TeamHomeTabContent
 * 功能：渲染团队空间「主页」Tab，包含成员预览与项目/笔记/成果预览区块。
 * 输入：
 * - model：useTeamSpaceWidget 返回的状态
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求
 */
export function TeamHomeTabContent({ model }: TeamHomeTabContentProps) {
  const { isLoggedIn, userProfile } = useAuth()
  const { teamUid, handleTabClick, teamMembers } = model
  const currentUserUid = userProfile?.uid ?? getUserUid()
  const isViewerTeamMember = resolveViewerIsTeamMember(teamMembers, currentUserUid)
  const { loadState, errorMessage, projects, notes, achievements } = useTeamHomeTabData(
    teamUid,
    Boolean(teamUid),
  )

  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载团队主页内容…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载团队主页内容失败，请稍后重试'}
      </p>
    )
  }

  return (
    <>
      <ProfileMembersSection
        title="团队成员"
        teamUid={teamUid}
        members={teamMembers}
        mode="preview"
        isLoggedIn={isLoggedIn}
        isViewerTeamMember={isViewerTeamMember}
        onViewAll={() => handleTabClick('成员')}
      />
      <ProfileProjectsSection
        title="团队项目"
        projects={projects}
        mode="preview"
        previewLimit={PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT}
        emptyLabel="暂无团队项目"
        onViewAll={() => handleTabClick('项目')}
      />
      <ProfileNotesSection
        title="团队笔记"
        notes={notes}
        mode="preview"
        previewLimit={PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT}
        emptyLabel="暂无团队笔记"
        onViewAll={() => handleTabClick('笔记')}
      />
      <ProfileAchievementsSection
        title="团队成果"
        achievements={achievements}
        mode="preview"
        previewLimit={PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT}
        onViewAll={() => handleTabClick('成果')}
      />
    </>
  )
}
