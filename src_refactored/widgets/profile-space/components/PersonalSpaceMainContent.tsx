// 01）个人空间 Tab 主体内容（PersonalSpaceMainContent）
import type { PersonalSpaceWidgetModel } from '../hooks/usePersonalSpaceWidget'
import { PersonalHomeTabContent } from './tabs/PersonalHomeTabContent'
import { PersonalNotesTabContent } from './tabs/PersonalNotesTabContent'
import { PersonalProjectsTabContent } from './tabs/PersonalProjectsTabContent'

// 02）个人空间 Tab 主体内容 Props（PersonalSpaceMainContentProps）
interface PersonalSpaceMainContentProps {
  model: PersonalSpaceWidgetModel
}

// 03）个人空间 Tab 主体内容（PersonalSpaceMainContent）
/**
 * 函数名：PersonalSpaceMainContent
 * 功能：按当前 Tab 渲染个人空间主体内容（主页 / 项目 / 笔记）。
 * 输入：
 * - model：usePersonalSpaceWidget 返回的状态
 * 输出：
 * - 返回值：React 节点
 * - 副作用：按 Tab 发起网络请求
 */
export function PersonalSpaceMainContent({ model }: PersonalSpaceMainContentProps) {
  const {
    activeTab,
    isHomeLikeTabActive,
    isShellReady,
    userCoreProfile,
    profileUidFromQuery,
    handleTabClick,
  } = model

  const profileUid = userCoreProfile?.uid ?? ''
  const isHomeContentEnabled = isHomeLikeTabActive && isShellReady

  return (
    <>
      {isHomeLikeTabActive ? (
        <PersonalHomeTabContent
          profileUid={profileUid}
          enabled={isHomeContentEnabled}
          onViewAllProjects={() => handleTabClick('项目')}
          onViewAllNotes={() => handleTabClick('笔记')}
        />
      ) : null}
      {activeTab === '项目' ? (
        <PersonalProjectsTabContent profileUid={profileUidFromQuery} />
      ) : null}
      {activeTab === '笔记' ? (
        <PersonalNotesTabContent profileUid={profileUidFromQuery} />
      ) : null}
    </>
  )
}
