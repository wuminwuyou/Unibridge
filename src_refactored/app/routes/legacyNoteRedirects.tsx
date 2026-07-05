// 01）笔记旧路由重定向（兼容书签 / 外链）
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  NOTES_LIST_PATH,
  buildNoteDetailPath,
  buildNoteEditorPathWithDefaults,
} from '@shared/lib/noteRoutes'

// 02）解析旧详情 query 并跳转（resolveLegacyNoteDetailTarget）
function resolveLegacyNoteDetailTarget(searchParams: URLSearchParams): string {
  const uid = searchParams.get('uid')
  const title = searchParams.get('title')
  if (uid) {
    return buildNoteDetailPath(uid)
  }
  if (title) {
    return buildNoteDetailPath(title)
  }
  return NOTES_LIST_PATH
}

// 03）/note → /notes
export function RedirectNoteToNotes() {
  return <Navigate to={NOTES_LIST_PATH} replace />
}

// 04）/note/detail、/note-detail → /notes/:id（读取 uid/title query）
export function RedirectLegacyNoteDetail() {
  const [searchParams] = useSearchParams()
  return <Navigate to={resolveLegacyNoteDetailTarget(searchParams)} replace />
}

// 05）/note/publish、/publish/note → /notes/editor?type=article（保留 query）
export function RedirectNotePublishToNotesEditor() {
  const location = useLocation()
  return <Navigate to={buildNoteEditorPathWithDefaults(location.search)} replace />
}

// 06）/notes/create → /notes/editor（保留 query，缺省 type=article）
export function RedirectNotesCreateToNotesEditor() {
  const location = useLocation()
  return <Navigate to={buildNoteEditorPathWithDefaults(location.search)} replace />
}
