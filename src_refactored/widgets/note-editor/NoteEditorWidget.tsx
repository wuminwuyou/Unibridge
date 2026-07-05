// 01）笔记编辑 Widget（NoteEditorWidget）
import { useSearchParams } from 'react-router-dom'
import { resolveNoteEditorRouteType } from '@shared/lib/noteRoutes'
import { NoteEditorMissingTypeFallback } from './components/note-editor-missing-type-fallback'
import { NoteEditorWidgetBody } from './NoteEditorWidgetBody'

/**
 * 函数名：NoteEditorWidget
 * 功能：笔记编辑页 Widget 入口——无 type 时展示类型兜底页，有 type 时渲染编辑 UI。
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
function NoteEditorWidget() {
  const [searchParams] = useSearchParams()
  const routeType = resolveNoteEditorRouteType(searchParams.get('type'))

  if (!routeType) {
    return <NoteEditorMissingTypeFallback />
  }

  return <NoteEditorWidgetBody />
}

export default NoteEditorWidget
export { NoteEditorWidget }
