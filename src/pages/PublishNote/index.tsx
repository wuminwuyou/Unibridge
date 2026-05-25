import TopNavbar from '../../layout/TopNavbar'
import { usePublishEntryFreshFormKey } from '../../hooks/usePublishEntryFreshFormKey'
import { PublishNoteView } from './PublishNoteView.tsx'
import { usePublishNoteForm } from './usePublishNoteForm'
import './style.css'

// 01）发布笔记表单容器（PublishNoteFormHost）
function PublishNoteFormHost() {
  const form = usePublishNoteForm()
  return <PublishNoteView form={form} />
}

// 02）发布笔记页入口（PublishNotePage）
/**
 * 函数名：PublishNotePage
 * 功能：发布笔记 UI 草图页面入口，组合顶栏与表单视图。
 * 实现方法：
 * - 挂载 TopNavbar
 * - 顶栏发布入口进入时 remount 表单实例
 * - usePublishNoteForm 管理表单状态并传给 PublishNoteView
 * 输入：无
 * 输出：
 * - 返回值：页面 React 节点
 * - 副作用：无
 */
export default function PublishNotePage() {
  const formInstanceKey = usePublishEntryFreshFormKey()

  return (
    <>
      <TopNavbar />
      <PublishNoteFormHost key={formInstanceKey} />
    </>
  )
}
