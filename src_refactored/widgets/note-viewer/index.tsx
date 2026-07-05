// 01）笔记阅读 Widget（NoteViewerWidget）
import { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from '@entities/note'
import { NoteArticleReaderLayout } from './components/NoteArticleReaderLayout'
import { NoteVideoReaderLayout } from './components/NoteVideoReaderLayout'
import styles from './NoteViewerWidget.module.css'
import type { UseNoteReaderWidgetResult } from './hooks/useNoteReaderWidget'

// 02）笔记阅读 Widget Props（NoteViewerWidgetProps）
interface NoteViewerWidgetProps {
  /** 数据端点（由 Pages 通过 useNoteReaderWidget 获取后传入） */
  data: UseNoteReaderWidgetResult
}

function NoteViewerWidget({ data }: NoteViewerWidgetProps) {
  const { isEditorialFlow, showLoading, showError, errorMessage, payload } = data

  if (showLoading) {
    return (
      <main className={styles.noteReaderStatus} aria-label="笔记加载中">
        <p className={styles.noteReaderStatusLabel}>笔记阅读</p>
        <h1 className={styles.noteReaderStatusTitle}>加载中…</h1>
        <p className={styles.noteReaderStatusDesc}>正在从服务器获取笔记内容。</p>
      </main>
    )
  }

  if (showError) {
    return (
      <main className={styles.noteReaderStatus} aria-label="笔记加载失败">
        <p className={styles.noteReaderStatusLabel}>笔记阅读</p>
        <h1 className={styles.noteReaderStatusTitle}>加载失败</h1>
        <p className={styles.noteReaderStatusDesc}>{errorMessage ?? '无法获取笔记内容，请稍后重试。'}</p>
      </main>
    )
  }

  if (!payload) {
    return (
      <main className={styles.noteReaderStatus} aria-label="笔记未找到">
        <p className={styles.noteReaderStatusLabel}>笔记阅读</p>
        <h1 className={styles.noteReaderStatusTitle}>未找到笔记</h1>
        <p className={styles.noteReaderStatusDesc}>请从经验分享频道进入，或在发布笔记页预览后查看。</p>
      </main>
    )
  }

  if (isNoteArticleDetailPayload(payload)) {
    return <NoteArticleReaderLayout note={payload} isEditorialFlow={isEditorialFlow} />
  }

  if (isNoteVideoDetailPayload(payload)) {
    return <NoteVideoReaderLayout note={payload} isEditorialFlow={isEditorialFlow} />
  }

  return null
}

export default NoteViewerWidget
export type { NoteViewerWidgetProps }
export { useNoteReaderWidget } from './hooks/useNoteReaderWidget'
export type { UseNoteReaderWidgetResult } from './hooks/useNoteReaderWidget'
