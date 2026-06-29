// 01）机构主页 Tab 内容（OrganizationHomeTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { EntityCode, TeamResourceUid } from '@shared/api/resourceUid'
import { OrgMembersList } from '@entities/member/ui/OrgMembersList'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import { NotesList } from '@entities/note/ui/NotesList'
import { ProjectsList } from '@entities/project/ui/ProjectsList'
import { OrgTeamsList } from '@entities/team/ui/OrgTeamsList'
import { useEntityProfileHomeTabData } from '@entities/organization/model/useEntityProfileTabData'
import type { OrganizationProfileTab } from '@features/profile-space/lib/routing/organizationTabRouting'
import { buildTeamSpacePath } from '@features/profile-space/lib/routing/teamTabRouting'
import {
  PROFILE_SPACE_ORG_HOME_MEMBER_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_TEAM_PREVIEW_LIMIT,
} from '@features/profile-space/constants/profileSpaceTabConstants'

// 02）机构主页 Tab 内容 Props（OrganizationHomeTabContentProps）
interface OrganizationHomeTabContentProps {
  entityCode: EntityCode
  supportsLabs: boolean
  orgMembersPreview: ProfileOrgMemberItem[]
  onNavigateTab: (tab: OrganizationProfileTab) => void
}

// 03）机构主页 Tab 内容（OrganizationHomeTabContent）
/**
 * 函数名：OrganizationHomeTabContent
 * 功能：渲染机构空间「主页」Tab；高校展示实验室预览 + 人员，企业仅展示人员及项目/笔记。
 * 实现方法：
 * - 调用 entities/organization/model/useEntityProfileHomeTabData 拉取主页预览
 * - 若接口未返回人员列表则回退到页壳已加载的 orgMembersPreview
 * 输入：
 * - entityCode / supportsLabs / orgMembersPreview / onNavigateTab
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求
 */
export function OrganizationHomeTabContent({
  entityCode,
  supportsLabs,
  orgMembersPreview,
  onNavigateTab,
}: OrganizationHomeTabContentProps) {
  const { loadState, errorMessage, projects, notes, teams, members } =
    useEntityProfileHomeTabData({
      entityCode,
      enabled: Boolean(entityCode),
      supportsLabs,
      teamLimit: PROFILE_SPACE_ORG_HOME_TEAM_PREVIEW_LIMIT,
      memberLimit: PROFILE_SPACE_ORG_HOME_MEMBER_PREVIEW_LIMIT,
      projectLimit: PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT,
      noteLimit: PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT,
    })

  const displayMembers =
    loadState === 'ready' && members.length === 0 && orgMembersPreview.length > 0
      ? orgMembersPreview
      : members

  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载机构主页内容…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载机构主页内容失败，请稍后重试'}
      </p>
    )
  }

  return (
    <>
      {supportsLabs ? (
        <OrgTeamsList
          title="下属实验室"
          teams={teams}
          mode="preview"
          resolveTeamSpacePath={(teamUid: TeamResourceUid) => buildTeamSpacePath(teamUid)}
          onViewAll={() => onNavigateTab('实验室')}
        />
      ) : null}
      <OrgMembersList
        title="机构人员"
        members={displayMembers}
        mode="preview"
        onViewAll={() => onNavigateTab('人员')}
      />
      <ProjectsList
        title="机构项目"
        projects={projects}
        mode="preview"
        previewLimit={PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT}
        emptyLabel="暂无机构项目"
        onViewAll={() => onNavigateTab('项目')}
      />
      <NotesList
        title="机构笔记"
        notes={notes}
        mode="preview"
        previewLimit={PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT}
        emptyLabel="暂无机构笔记"
        onViewAll={() => onNavigateTab('笔记')}
      />
    </>
  )
}
