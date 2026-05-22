import TopNavbar from '../../layout/TopNavbar'
import { publishProjectNavItems } from './publishProjectPageData'
import { PublishProjectView } from './PublishProjectView'
import { usePublishProjectForm } from './usePublishProjectForm'
import './style.css'

// 01）发布项目页入口（PublishProjectPage）
/**
 * 函数名：PublishProjectPage
 * 功能：发布项目 UI 草图页面入口，组合顶栏与表单视图。
 * 实现方法：
 * - 挂载 TopNavbar
 * - usePublishProjectForm 管理表单状态并传给 PublishProjectView
 * 输入：无
 * 输出：
 * - 返回值：页面 React 节点
 * - 副作用：无
 */
export default function PublishProjectPage() {
  const form = usePublishProjectForm()

  return (
    <>
      <TopNavbar navItems={publishProjectNavItems} />
      <PublishProjectView form={form} />
    </>
  )
}
