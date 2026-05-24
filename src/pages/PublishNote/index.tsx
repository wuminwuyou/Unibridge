import TopNavbar from '../../layout/TopNavbar'
import { publishNoteNavItems } from './publishNotePageData'
import { PublishNoteView } from './PublishNoteView.tsx'
import { usePublishNoteForm } from './usePublishNoteForm'
import './style.css'

// 01）发布笔记页入口（PublishNotePage）
/**
 * 函数名：PublishNotePage
 * 功能：发布笔记 UI 草图页面入口，组合顶栏与表单视图。
 * 实现方法：
 * - 挂载 TopNavbar
 * - usePublishNoteForm 管理表单状态并传给 PublishNoteView
 * 输入：无
 * 输出：
 * - 返回值：页面 React 节点
 * - 副作用：无
 */
export default function PublishNotePage() {
  const form = usePublishNoteForm()

  return (
    <>
      <TopNavbar navItems={publishNoteNavItems} />
      <PublishNoteView form={form} />
    </>
  )
}
