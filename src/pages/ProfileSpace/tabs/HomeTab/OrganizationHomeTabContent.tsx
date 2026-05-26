import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import { ProfileNotesSection } from '../../components/ProfileNotesSection'
import { ProfileOrgMembersSection } from '../../components/ProfileOrgMembersSection'
import { ProfileProjectsSection } from '../../components/ProfileProjectsSection'
import { ProfileTeamsSection } from '../../components/ProfileTeamsSection'
import {
  PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT,
} from '../../profileSpaceTabConstants'
import type { OrganizationViewModel } from '../../variants/OrganizationView/useOrganizationViewPage'
import { useOrganizationHomeTabData } from '../../variants/OrganizationView/useOrganizationViewTabData'

// 01）机构主页 Tab 内容 Props（OrganizationHomeTabContentProps）
interface OrganizationHomeTabContentProps {
  model: OrganizationViewModel
}

// 02）机构主页 Tab 内容（OrganizationHomeTabContent）
/**
 * 函数名：OrganizationHomeTabContent
 * 功能：渲染机构空间「主页」Tab；高校展示实验室预览 + 人员，企业仅展示人员及项目/笔记。
 * 输入：
 * - model：useOrganizationViewPage 返回的状态
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求
 */
export function OrganizationHomeTabContent({ model }: OrganizationHomeTabContentProps) {
  const { entityCode, supportsLabs, handleTabClick } = model
  const { loadState, errorMessage, projects, notes, teams, members } = useOrganizationHomeTabData(
    entityCode,
    Boolean(entityCode),
    supportsLabs,
  )

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
        <ProfileTeamsSection
          title="下属实验室"
          teams={teams}
          mode="preview"
          onViewAll={() => handleTabClick('实验室')}
        />
      ) : null}
      <ProfileOrgMembersSection
        title="机构人员"
        members={members}
        mode="preview"
        onViewAll={() => handleTabClick('人员')}
      />
      <ProfileProjectsSection
        title="机构项目"
        projects={projects}
        mode="preview"
        previewLimit={PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT}
        emptyLabel="暂无机构项目"
        onViewAll={() => handleTabClick('项目')}
      />
      <ProfileNotesSection
        title="机构笔记"
        notes={notes}
        mode="preview"
        previewLimit={PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT}
        emptyLabel="暂无机构笔记"
        onViewAll={() => handleTabClick('笔记')}
      />
    </>
  )
}
