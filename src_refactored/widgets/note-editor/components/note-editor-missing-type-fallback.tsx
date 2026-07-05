// 01）缺少 type 参数时的兜底页（NoteEditorMissingTypeFallback）
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpenText } from 'lucide-react'
import { NoteEditorTypeCardGrid, type NoteEditorRouteType } from '@features/note-editor-entry'
import { isNoteResourceUid } from '@shared/api/resourceUid'
import { buildNoteEditorPath } from '@shared/lib/noteRoutes'
import styles from './note-editor-fallback.module.css'

/**
 * 函数名：NoteEditorMissingTypeFallback
 * 功能：编辑页缺少 `type=article|video` query 时的路由分流兜底页，内嵌类型卡片直接跳转。
 * 实现方法：
 * - 展示标题与说明文案
 * - 复用 NoteEditorTypeCardGrid，点击卡片 replace 至对应编辑路由（保留 uid）
 * - 提供回到首页链接
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 * - 副作用：路由 replace
 */
export function NoteEditorMissingTypeFallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uidFromQuery = searchParams.get('uid')
  const editNoteUid = isNoteResourceUid(uidFromQuery) ? uidFromQuery : undefined

  const handleSelectType = (type: NoteEditorRouteType): void => {
    navigate(buildNoteEditorPath({ type, uid: editNoteUid }), { replace: true })
  }

  return (
    <main className={styles.noteEditorFallback} aria-label="选择笔记类型">
      <BookOpenText size={40} strokeWidth={1.5} className={styles.noteEditorFallbackIcon} />
      <h1 className={styles.noteEditorFallbackTitle}>请选择笔记类型</h1>
      <p className={styles.noteEditorFallbackDesc}>
        选择你要创建的笔记形式，后续可在编辑页继续完善内容。
      </p>
      <NoteEditorTypeCardGrid
        onSelect={handleSelectType}
        gridClassName={styles.noteEditorFallbackCardGrid}
      />
      <Link to="/" className={styles.noteEditorFallbackLink}>
        回到首页
      </Link>
    </main>
  )
}
