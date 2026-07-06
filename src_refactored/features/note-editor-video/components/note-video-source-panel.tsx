// 01）视频源输入面板（NoteVideoSourcePanel）
import { useId, useRef, type DragEvent } from 'react'
import { Link2, Upload, Video } from 'lucide-react'
import { VideoPlayer } from '@shared/ui/VideoPlayer'
import { NOTE_VIDEO_ACCEPT, type NoteVideoSourceMode } from '@features/note-editor'
import styles from './note-video-source-panel.module.css'

// 02）面板 Props（NoteVideoSourcePanelProps）
export interface NoteVideoSourcePanelProps {
  mode: NoteVideoSourceMode
  previewUrl: string | null
  urlInput: string
  selectedFileName: string | null
  isUploading: boolean
  uploadProgress: number
  error: string | null
  posterUrl?: string | null
  disabled?: boolean
  onModeChange: (mode: NoteVideoSourceMode) => void
  onSelectFile: (file: File) => void
  onUrlChange: (value: string) => void
  onUrlConfirm: () => void
  onClear: () => void
}

/**
 * 函数名：NoteVideoSourcePanel
 * 功能：视频笔记编辑页左栏——上传文件 / 粘贴链接 Tab；有视频时在原输入区渲染播放器。
 * 实现方法：
 * - 无视频：展示拖拽区或链接输入
 * - 有视频：隐藏输入区，在原位展示 VideoPlayer + 清除按钮
 * 输入：
 * - 视频源状态与回调，见 NoteVideoSourcePanelProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无（文件选择由父级处理）
 */
export function NoteVideoSourcePanel({
  mode,
  previewUrl,
  urlInput,
  selectedFileName,
  isUploading,
  uploadProgress,
  error,
  posterUrl,
  disabled = false,
  onModeChange,
  onSelectFile,
  onUrlChange,
  onUrlConfirm,
  onClear,
}: NoteVideoSourcePanelProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isDisabled = disabled || isUploading
  const hasPreview = Boolean(previewUrl?.trim())

  const openFilePicker = (): void => {
    if (isDisabled) {
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) {
      onSelectFile(file)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    if (isDisabled) {
      return
    }
    const file = event.dataTransfer.files?.[0]
    if (file) {
      onSelectFile(file)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
  }

  const renderPreviewSlot = () => (
    <div className={styles.noteVideoSourcePanelContentSlot} aria-label="视频预览">
      <div className={styles.noteVideoSourcePanelPlayer}>
        <VideoPlayer videoUrl={previewUrl!} posterUrl={posterUrl} />
      </div>
      {selectedFileName ? (
        <p className={styles.noteVideoSourcePanelFileName}>{selectedFileName}</p>
      ) : null}
      {isUploading ? (
        <div className={styles.noteVideoSourcePanelProgress} aria-live="polite">
          <div className={styles.noteVideoSourcePanelProgressTrack}>
            <div
              className={styles.noteVideoSourcePanelProgressBar}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className={styles.noteVideoSourcePanelProgressLabel}>正在上传视频… {uploadProgress}%</p>
        </div>
      ) : null}
      <div className={styles.noteVideoSourcePanelActions}>
        <button
          type="button"
          className={styles.noteVideoSourcePanelClearBtn}
          onClick={onClear}
          disabled={isDisabled}
        >
          清除视频
        </button>
      </div>
    </div>
  )

  const renderFileInput = () => (
    <>
      <div
        className={`${styles.noteVideoSourcePanelDropzone} ${isDisabled ? styles.noteVideoSourcePanelDropzoneDisabled : ''}`.trim()}
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openFilePicker()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        aria-label="上传视频文件"
      >
        <Video size={32} strokeWidth={1.5} className={styles.noteVideoSourcePanelDropzoneIcon} />
        <p className={styles.noteVideoSourcePanelDropzoneTitle}>拖拽或点击上传视频</p>
        <p className={styles.noteVideoSourcePanelDropzoneHint}>支持 MP4、MOV、WebM，最大 500MB</p>
      </div>
      {isUploading ? (
        <div className={styles.noteVideoSourcePanelProgress} aria-live="polite">
          <div className={styles.noteVideoSourcePanelProgressTrack}>
            <div
              className={styles.noteVideoSourcePanelProgressBar}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className={styles.noteVideoSourcePanelProgressLabel}>正在上传视频… {uploadProgress}%</p>
        </div>
      ) : null}
    </>
  )

  const renderUrlInput = () => (
    <div className={styles.noteVideoSourcePanelUrlRow}>
      <input
        id={inputId}
        type="url"
        className={styles.noteVideoSourcePanelUrlInput}
        placeholder="粘贴视频直链 URL…"
        value={urlInput}
        onChange={(event) => onUrlChange(event.target.value)}
        disabled={isDisabled}
      />
      <button
        type="button"
        className={styles.noteVideoSourcePanelUrlBtn}
        onClick={onUrlConfirm}
        disabled={isDisabled}
      >
        预览
      </button>
    </div>
  )

  return (
    <section className={styles.noteVideoSourcePanel} aria-label="视频源">
      {!hasPreview ? (
        <div className={styles.noteVideoSourcePanelTabs} role="tablist" aria-label="视频输入方式">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'file'}
            className={`${styles.noteVideoSourcePanelTab} ${mode === 'file' ? styles.noteVideoSourcePanelTabActive : ''}`.trim()}
            onClick={() => onModeChange('file')}
            disabled={isDisabled}
          >
            <Upload size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            上传视频
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'url'}
            className={`${styles.noteVideoSourcePanelTab} ${mode === 'url' ? styles.noteVideoSourcePanelTabActive : ''}`.trim()}
            onClick={() => onModeChange('url')}
            disabled={isDisabled}
          >
            <Link2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            视频链接
          </button>
        </div>
      ) : null}

      {hasPreview ? renderPreviewSlot() : mode === 'file' ? renderFileInput() : renderUrlInput()}

      {error ? <p className={styles.noteVideoSourcePanelError}>{error}</p> : null}

      <input
        ref={fileInputRef}
        id={`${inputId}-file`}
        type="file"
        accept={NOTE_VIDEO_ACCEPT}
        className={styles.noteVideoSourcePanelHiddenInput}
        onChange={handleFileChange}
        disabled={isDisabled}
      />
    </section>
  )
}
