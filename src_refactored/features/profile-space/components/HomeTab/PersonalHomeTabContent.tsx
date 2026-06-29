// 01）个人主页 Tab 内容（PersonalHomeTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { UserResourceUid } from '@shared/api/resourceUid'
import { NotesList } from '@entities/note/ui/NotesList'
import { ProjectsList } from '@entities/project/ui/ProjectsList'
import { useUserProfileHomeTabData } from '@entities/user/model/useUserProfileTabData'
import {
  PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT,
} from '@features/profile-space/constants/profileSpaceTabConstants'

// 02）个人主页 Tab 内容 Props（PersonalHomeTabContentProps）
interface PersonalHomeTabContentProps {
  profileUid: UserResourceUid
  enabled: boolean
  onViewAllProjects: () => void
  onViewAllNotes: () => void
}

// 03）个人主页 Tab 内容（PersonalHomeTabContent）
/**
 * 函数名：PersonalHomeTabContent
 * 功能：渲染个人空间「主页」Tab 下的项目与笔记预览区块。
 * 实现方法：
 * - 调用 entities/user/model/useUserProfileHomeTabData 拉取预览数据
 * - 项目列表使用 home 变体；笔记列表使用 row-list 布局
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
  const { loadState, errorMessage, projects, notes, projectTotal, noteTotal } =
    useUserProfileHomeTabData({
      profileUid,
      enabled,
      projectLimit: PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT,
      noteLimit: PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT,
    })

  if (!enabled) return null

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
      <ProjectsList
        title="项目"
        projects={projects}
        mode="preview"
        previewLimit={PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT}
        total={projectTotal}
        listVariant="home"
        onViewAll={onViewAllProjects}
      />
      <NotesList
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
