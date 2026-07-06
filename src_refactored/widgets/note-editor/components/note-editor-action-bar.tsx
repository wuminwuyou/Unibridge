// 01）编辑操作栏（NoteEditorActionBar）
import type { NoteEditorContentType } from '@features/note-editor'
import type { NoteEditorSubmitPhase } from '../hooks/useNoteEditorForm'
import styles from './note-editor-action-bar.module.css'

// 02）操作栏 Props（NoteEditorActionBarProps）
export interface NoteEditorActionBarProps {
  isSubmitting: boolean
  submitError: string | null
  submitPhase: NoteEditorSubmitPhase
  contentType?: NoteEditorContentType
  onSaveDraft: () => void
  onPreview: () => void
  onPublish: () => void
}

/**
 * 函数名：NoteEditorActionBar
 * 功能：笔记编辑页底部操作栏（保存草稿 / 预览 / 发布）。
 * 实现方法：
 * - fixed 底栏固定于浏览器视口底部
 * - 按 submitPhase 展示进度提示
 * 输入：
 * - 提交状态与三个 action 回调
 * 输出：
 * - 返回值：React 节点
 */
export function NoteEditorActionBar({
  isSubmitting,
  submitError,
  submitPhase,
  contentType = '图文',
  onSaveDraft,
  onPreview,
  onPublish,
}: NoteEditorActionBarProps) {
  const isVideo = contentType === '视频'

  const statusHint =
    submitPhase === 'uploading-video'
      ? '正在上传视频…'
      : submitPhase === 'uploading-cover'
        ? '正在上传封面…'
        : submitPhase === 'saving-note'
          ? '正在保存笔记…'
          : isVideo
            ? '预览仅本地展示；保存草稿与发布将先上传视频与封面，再写入服务端'
            : '预览仅本地展示；保存草稿与发布将先上传封面，再写入服务端'

  const busyUploadLabel = submitPhase === 'uploading-video' ? '上传视频…' : '上传封面…'

  const saveDraftLabel =
    isSubmitting && (submitPhase === 'uploading-cover' || submitPhase === 'uploading-video')
      ? busyUploadLabel
      : isSubmitting && submitPhase === 'saving-note'
        ? '保存中…'
        : '保存草稿'

  const previewLabel = '预览'

  const publishLabel =
    isSubmitting && (submitPhase === 'uploading-cover' || submitPhase === 'uploading-video')
      ? busyUploadLabel
      : isSubmitting && submitPhase === 'saving-note'
        ? '发布中…'
        : '发布笔记'

  return (
    <footer className={styles.noteEditorActionBar} aria-label="笔记发布操作">
      <div className={styles.noteEditorActionBarInner}>
        <p
          className={`${styles.noteEditorActionBarHint} ${submitError ? styles.noteEditorActionBarHintError : ''}`.trim()}
        >
          {submitError ?? statusHint}
        </p>
        <div className={styles.noteEditorActionBarActions}>
          <button
            type="button"
            className={styles.noteEditorActionBarBtn}
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            {saveDraftLabel}
          </button>
          <button
            type="button"
            className={styles.noteEditorActionBarBtn}
            onClick={onPreview}
            disabled={isSubmitting}
          >
            {previewLabel}
          </button>
          <button
            type="button"
            className={`${styles.noteEditorActionBarBtn} ${styles.noteEditorActionBarBtnPrimary}`.trim()}
            onClick={onPublish}
            disabled={isSubmitting}
          >
            {publishLabel}
          </button>
        </div>
      </div>
    </footer>
  )
}
