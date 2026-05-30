import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import { ProfileNotesSection } from '../../components/ProfileNotesSection'
import { ProfileProjectsSection } from '../../components/ProfileProjectsSection'
import {
  PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT,
} from '../../profileSpaceTabConstants'
import { usePersonalHomeTabData } from './usePersonalHomeTabData'

// 01）个人主页 Tab 内容 Props（PersonalHomeTabContentProps）
interface PersonalHomeTabContentProps {
  profileUid: string
  enabled: boolean
  onViewAllProjects: () => void
  onViewAllNotes: () => void
}

// 02）个人主页 Tab 内容（PersonalHomeTabContent）
/**
 * 函数名：PersonalHomeTabContent
 * 功能：渲染个人空间「主页」Tab 下的项目与笔记预览。
 * 输入：
 * - profileUid：用户 uid
 * - enabled：是否允许加载
 * - onViewAllProjects / onViewAllNotes：查看全部回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求
 */
export function PersonalHomeTabContent({
  profileUid,
  enabled,
  onViewAllProjects,
  onViewAllNotes,
}: PersonalHomeTabContentProps) {
  const { loadState, errorMessage, projects, notes, projectTotal, noteTotal } = usePersonalHomeTabData({
    profileUid,
    enabled,
  })

  if (!enabled) {
    return null
  }

  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载主页内容…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载主页内容失败，请稍后重试'}
      </p>
    )
  }

  return (
    <>
      <ProfileProjectsSection
        title="项目"
        projects={projects}
        mode="preview"
        previewLimit={PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT}
        total={projectTotal}
        listVariant="home"
        onViewAll={onViewAllProjects}
      />
      <ProfileNotesSection
        title="笔记"
        notes={notes}
        mode="preview"
        previewLimit={PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT}
        total={noteTotal}
        layout="row-list"
        onViewAll={onViewAllNotes}
      />
    </>
  )
}
