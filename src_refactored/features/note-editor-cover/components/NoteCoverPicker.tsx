// 01）笔记封面选择器（NoteCoverPicker）
import { useId, useRef } from 'react'
import { ImageIcon, Sparkles, Upload } from 'lucide-react'
import type { NoteCoverSource } from '../hooks/useNoteCoverPicker'
import styles from './NoteCoverPicker.module.css'

const AUTO_COVER_HINT = '根据笔记标题自动生成冷色系封面，保存或发布时再上传。'
const UPLOAD_COVER_HINT = '支持 JPG、PNG、WebP；先本地预览，保存或发布时再上传。'

// 02）NoteCoverPicker Props（NoteCoverPickerProps）
export interface NoteCoverPickerProps {
  source: NoteCoverSource
  previewUrl: string | null
  isUploading?: boolean
  isGenerating?: boolean
  disabled?: boolean
  onSourceChange: (source: NoteCoverSource) => void
  onSelectFile: (file: File) => void
  onRequestAutoGenerate: () => void
  onReplaceUpload?: () => void
}

/**
 * 函数名：NoteCoverPicker
 * 功能：图文笔记编辑页右栏封面提交控件（自动生成 / 手动上传）。
 * 实现方法：
 * - Segment 切换 auto / upload 模式
 * - 自动生成：Placeholder 点击触发 onRequestAutoGenerate，提示文案内嵌预览区
 * - 手动上传：Placeholder / 预览图点击上传或更换，提示文案内嵌预览区
 * 输入：
 * - 封面状态与回调，见 NoteCoverPickerProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无（文件选择由父级处理）
 */
export function NoteCoverPicker({
  source,
  previewUrl,
  isUploading = false,
  isGenerating = false,
  disabled = false,
  onSourceChange,
  onSelectFile,
  onRequestAutoGenerate,
}: NoteCoverPickerProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isBusy = isUploading || isGenerating
  const isDisabled = disabled || isBusy

  const openFilePicker = (): void => {
    if (isDisabled) {
      return
    }
    fileInputRef.current?.click()
  }

  const renderAutoPreview = () => {
    if (previewUrl) {
      return (
        <div className={styles.noteCoverPickerPreview}>
          <img src={previewUrl} alt="封面预览" className={styles.noteCoverPickerPreviewImg} />
        </div>
      )
    }

    return (
      <button
        type="button"
        className={`${styles.noteCoverPickerPreview} ${styles.noteCoverPickerPlaceholder} ${styles.noteCoverPickerPlaceholderInteractive} ${styles.noteCoverPickerPlaceholderDashed}`}
        onClick={onRequestAutoGenerate}
        disabled={isDisabled}
        aria-label="点击生成封面"
      >
        <Sparkles size={22} strokeWidth={1.8} />
        <span className={styles.noteCoverPickerPlaceholderAction}>
          {isGenerating ? '生成中…' : '点击生成封面'}
        </span>
        <span className={styles.noteCoverPickerPlaceholderHint}>{AUTO_COVER_HINT}</span>
      </button>
    )
  }

  const renderUploadPreview = () => {
    if (previewUrl) {
      return (
        <button
          type="button"
          className={`${styles.noteCoverPickerPreview} ${styles.noteCoverPickerPreviewInteractive}`}
          onClick={openFilePicker}
          disabled={isDisabled}
          aria-label="点击更换封面图片"
        >
          <img src={previewUrl} alt="封面预览" className={styles.noteCoverPickerPreviewImg} />
          <span className={styles.noteCoverPickerPreviewReplaceHint}>点击更换图片</span>
        </button>
      )
    }

    return (
      <button
        type="button"
        className={`${styles.noteCoverPickerPreview} ${styles.noteCoverPickerPlaceholder} ${styles.noteCoverPickerUploadZone} ${styles.noteCoverPickerPlaceholderDashed}`}
        onClick={openFilePicker}
        disabled={isDisabled}
        aria-label="点击上传封面图片"
      >
        <ImageIcon size={22} strokeWidth={1.8} />
        <span className={styles.noteCoverPickerPlaceholderAction}>
          {isUploading ? '上传中…' : '点击上传图片'}
        </span>
        <span className={styles.noteCoverPickerPlaceholderHint}>{UPLOAD_COVER_HINT}</span>
      </button>
    )
  }

  return (
    <section className={styles.noteCoverPicker} aria-label="封面图提交">
      <div className={styles.noteCoverPickerSegment} role="tablist" aria-label="封面来源">
        <button
          type="button"
          role="tab"
          aria-selected={source === 'auto'}
          className={`${styles.noteCoverPickerSegmentBtn} ${source === 'auto' ? styles.noteCoverPickerSegmentBtnActive : ''}`.trim()}
          onClick={() => onSourceChange('auto')}
          disabled={isDisabled}
        >
          <Sparkles size={13} strokeWidth={2.2} className={styles.noteCoverPickerSegmentBtnIcon} />
          自动生成
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={source === 'upload'}
          className={`${styles.noteCoverPickerSegmentBtn} ${source === 'upload' ? styles.noteCoverPickerSegmentBtnActive : ''}`.trim()}
          onClick={() => onSourceChange('upload')}
          disabled={isDisabled}
        >
          <Upload size={13} strokeWidth={2.2} className={styles.noteCoverPickerSegmentBtnIcon} />
          手动上传
        </button>
      </div>

      {source === 'auto' ? (
        renderAutoPreview()
      ) : (
        <>
          {renderUploadPreview()}

          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className={styles.noteCoverPickerHiddenInput}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                onSelectFile(file)
              }
              event.target.value = ''
            }}
          />
        </>
      )}
    </section>
  )
}
