// 01）团队主页 Tab 内容（TeamHomeTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import { useAuth } from '@shared/hooks/useAuth'
import { getUserUid } from '@shared/lib/tokenStorage'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import { resolveViewerIsTeamMember } from '@entities/member/lib/memberDisplayUtils'
import { MembersList } from '@entities/member/ui/MembersList'
import type { ProfileMemberItem } from '@entities/member/model'
import { NotesList } from '@entities/note/ui/NotesList'
import { ProjectsList } from '@entities/project/ui/ProjectsList'
import { AchievementsList } from '@entities/team/ui/AchievementsList'
import { useTeamProfileHomeTabData } from '@entities/team/model/useTeamProfileTabData'
import type { TeamProfileTab } from '@features/profile-space/lib/routing/teamTabRouting'
import {
  PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT,
} from '@features/profile-space/constants/profileSpaceTabConstants'

// 02）团队主页 Tab 内容 Props（TeamHomeTabContentProps）
interface TeamHomeTabContentProps {
  teamUid: TeamResourceUid
  teamMembers: ProfileMemberItem[]
  onNavigateTab: (tab: TeamProfileTab) => void
}

// 03）团队主页 Tab 内容（TeamHomeTabContent）
/**
 * 函数名：TeamHomeTabContent
 * 功能：渲染团队空间「主页」Tab，含成员预览 + 项目/笔记/成果预览区块。
 * 实现方法：
 * - 调用 entities/team/model/useTeamProfileHomeTabData 拉取项目/笔记/成果预览
 * - 成员预览复用页壳已加载的 teamMembers
 * 输入：
 * - teamUid：团队 uid
 * - teamMembers：页壳已加载的团队成员（用于预览展示与判定当前用户身份）
 * - onNavigateTab：Tab 跳转回调（由 widget 注入）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求
 */
export function TeamHomeTabContent({
  teamUid,
  teamMembers,
  onNavigateTab,
}: TeamHomeTabContentProps) {
  const { isLoggedIn, userProfile } = useAuth()
  const currentUserUid = userProfile?.uid ?? getUserUid()
  const isViewerTeamMember = resolveViewerIsTeamMember(teamMembers, currentUserUid)
  const { loadState, errorMessage, projects, notes, achievements } = useTeamProfileHomeTabData({
    teamUid,
    enabled: Boolean(teamUid),
    projectLimit: PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT,
    noteLimit: PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT,
    achievementLimit: PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT,
  })

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
      <MembersList
        title="团队成员"
        teamUid={teamUid}
        members={teamMembers}
        mode="preview"
        isLoggedIn={isLoggedIn}
        isViewerTeamMember={isViewerTeamMember}
        onViewAll={() => onNavigateTab('成员')}
      />
      <ProjectsList
        title="团队项目"
        projects={projects}
        mode="preview"
        previewLimit={PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT}
        emptyLabel="暂无团队项目"
        onViewAll={() => onNavigateTab('项目')}
      />
      <NotesList
        title="团队笔记"
        notes={notes}
        mode="preview"
        previewLimit={PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT}
        emptyLabel="暂无团队笔记"
        onViewAll={() => onNavigateTab('笔记')}
      />
      <AchievementsList
        title="团队成果"
        achievements={achievements}
        mode="preview"
        previewLimit={PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT}
        onViewAll={() => onNavigateTab('成果')}
      />
    </>
  )
}
