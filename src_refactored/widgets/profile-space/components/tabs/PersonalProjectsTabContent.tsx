// 01）个人项目 Tab 内容（PersonalProjectsTabContent）
import { usePersonalProjectsTabData } from '../../hooks/usePersonalTabData'
import { ProjectsTabContent } from './ProjectsTabContent'

// 02）个人项目 Tab 内容 Props（PersonalProjectsTabContentProps）
interface PersonalProjectsTabContentProps {
  profileUid?: string | null
}

// 03）个人项目 Tab 内容（PersonalProjectsTabContent）
/**
 * 函数名：PersonalProjectsTabContent
 * 功能：个人空间「项目」Tab 入口，内部拉取数据并渲染 ProjectsTabContent。
 * 输入：
 * - profileUid：目标用户 uid（查看他人空间时由 ?uid= 传入）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求
 */
export function PersonalProjectsTabContent({ profileUid }: PersonalProjectsTabContentProps = {}) {
  const { loadState, errorMessage, projects, total } = usePersonalProjectsTabData(profileUid)

  return (
    <ProjectsTabContent
      title="项目"
      projects={projects}
      total={total}
      loadState={loadState}
      errorMessage={errorMessage}
    />
  )
}
