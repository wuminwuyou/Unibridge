import TopNavbar from '../../layout/TopNavbar'
import { usePublishEntryFreshFormKey } from '../../hooks/usePublishEntryFreshFormKey'
import { PublishProjectView } from './PublishProjectView'
import { usePublishProjectForm } from './usePublishProjectForm'
import './style.css'

// 01）发布项目表单容器（PublishProjectFormHost）
function PublishProjectFormHost() {
  const form = usePublishProjectForm()
  return <PublishProjectView form={form} />
}

// 02）发布项目页入口（PublishProjectPage）
/**
 * 函数名：PublishProjectPage
 * 功能：发布项目 UI 草图页面入口，组合顶栏与表单视图。
 * 实现方法：
 * - 挂载 TopNavbar
 * - 顶栏发布入口进入时 remount 表单实例
 * - usePublishProjectForm 管理表单状态并传给 PublishProjectView
 * 输入：无
 * 输出：
 * - 返回值：页面 React 节点
 * - 副作用：无
 */
export default function PublishProjectPage() {
  const formInstanceKey = usePublishEntryFreshFormKey()

  return (
    <>
      <TopNavbar />
      <PublishProjectFormHost key={formInstanceKey} />
    </>
  )
}
