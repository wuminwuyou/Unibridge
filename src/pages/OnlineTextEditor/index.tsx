import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  OnlineTextEditor,
  type OnlineTextEditorLocationState,
  type OnlineTextEditorResultState,
} from '../../components/OnlineEditor'

// 01）在线正文编辑页路由（OnlineTextEditorPage）
/**
 * 函数名：OnlineTextEditorPage
 * 功能：全屏在线正文编辑页路由入口，无 TopNavbar；支持 Markdown / 富文本双模式。
 * 实现方法：
 * - 从 location.state 读取回跳路径与初始内容
 * - 保存时带 markdownResult 回传并 replace 导航
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 * - 副作用：路由跳转
 */
export default function OnlineTextEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const editorState = location.state as OnlineTextEditorLocationState | null

  if (!editorState?.returnTo) {
    return <Navigate to="/" replace />
  }

  const handleSave = (payload: { content: string; editorType: 'MARKDOWN' | 'RICHTEXT' }): void => {
    const resultState: OnlineTextEditorResultState = {
      markdownResult: payload.content,
      editorType: payload.editorType,
      content: payload.content,
      publishNoteRestore: editorState.publishNoteRestore,
      publishProjectRestore: editorState.publishProjectRestore,
    }
    navigate(editorState.returnTo, { replace: true, state: resultState })
  }

  const handleCancel = (): void => {
    navigate(editorState.returnTo, {
      replace: true,
      state: {
        publishNoteRestore: editorState.publishNoteRestore,
        publishProjectRestore: editorState.publishProjectRestore,
      },
    })
  }

  return (
    <OnlineTextEditor
      title={editorState.title}
      initialValue={editorState.initialValue}
      initialEditorType={editorState.initialEditorType}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
