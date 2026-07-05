// 01）视频编辑占位（NoteVideoEditorPlaceholder）
import { Video } from 'lucide-react'
import styles from './note-editor-fallback.module.css'

/**
 * 函数名：NoteVideoEditorPlaceholder
 * 功能：Milestone B 完成前的视频笔记编辑占位页。
 * 输出：
 * - 返回值：React 节点
 */
export function NoteVideoEditorPlaceholder() {
  return (
    <main className={styles.noteEditorFallback} aria-label="视频笔记编辑">
      <Video size={40} strokeWidth={1.5} className={styles.noteEditorFallbackIcon} />
      <h1 className={styles.noteEditorFallbackTitle}>视频笔记编辑</h1>
      <p className={styles.noteEditorFallbackDesc}>
        视频笔记编辑 UI 将在 Milestone B 交付。请先使用图文笔记完成发布流程验证。
      </p>
    </main>
  )
}
