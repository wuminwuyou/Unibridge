// 01）笔记封面选择器（NoteCoverPicker）
import { useId, useRef, useState, type ReactNode } from 'react'
import { Crop, ImageIcon, Sparkles, Upload } from 'lucide-react'
import type { CoverCropTransform } from '@shared/lib/cropCoverImage'
import type { NoteCoverSource } from '../hooks/useNoteCoverPicker'
import { NoteCoverAdjustModal } from './NoteCoverAdjustModal'
import styles from './NoteCoverPicker.module.css'

const DEFAULT_AUTO_COVER_HINT = '根据笔记标题自动生成冷色系封面（3:4），保存或发布时再上传。'
const UPLOAD_COVER_HINT = '支持 JPG、PNG、WebP；上传后可调整裁剪区域，保存或发布时再上传。'

// 02）NoteCoverPicker Props（NoteCoverPickerProps）
export interface NoteCoverPickerProps {
  source: NoteCoverSource
  previewUrl: string | null
  /** 调整封面使用的源图 URL（原始上传图或未裁剪视频帧） */
  adjustSourceUrl?: string | null
  /** 当前裁剪变换，用于再次打开调整弹窗时恢复 */
  cropTransform?: CoverCropTransform
  /** 封面目标宽高比，默认 3:4 */
  aspect?: { width: number; height: number }
  isUploading?: boolean
  isGenerating?: boolean
  disabled?: boolean
  /** 自动生成模式提示文案；视频笔记可传入首帧提取说明 */
  autoCoverHint?: string
  /** 是否在自动生成模式下展示「重新生成」（图文标题/配色封面） */
  showRegenerateAutoCover?: boolean
  onSourceChange: (source: NoteCoverSource) => void
  onSelectFile: (file: File) => void | Promise<void>
  onRequestAutoGenerate: () => void
  onApplyAdjustedCover?: (file: File, transform: CoverCropTransform) => void
}

/**
 * 函数名：NoteCoverPicker
 * 功能：笔记编辑页封面控件（自动生成 / 手动上传 / 调整裁剪）。
 * 实现方法：
 * - Segment 切换 auto / upload 模式
 * - 预览区按 aspect 展示；有预览时可打开调整弹窗
 * 输入：
 * - 封面状态与回调，见 NoteCoverPickerProps
 * 输出：
 * - 返回值：React 节点
 */
export function NoteCoverPicker({
  source,
  previewUrl,
  adjustSourceUrl = null,
  cropTransform,
  aspect = { width: 3, height: 4 },
  isUploading = false,
  isGenerating = false,
  disabled = false,
  autoCoverHint = DEFAULT_AUTO_COVER_HINT,
  showRegenerateAutoCover = false,
  onSourceChange,
  onSelectFile,
  onRequestAutoGenerate,
  onApplyAdjustedCover,
}: NoteCoverPickerProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const isBusy = isUploading || isGenerating
  const isDisabled = disabled || isBusy
  const aspectRatioValue = `${aspect.width} / ${aspect.height}`
  const previewStyle = { aspectRatio: aspectRatioValue } as const
  const isPortraitAspect = aspect.height > aspect.width
  const previewOrientationClass = isPortraitAspect
    ? styles.noteCoverPickerPreviewPortrait
    : styles.noteCoverPickerPreviewLandscape
  const canAdjust = Boolean(previewUrl && onApplyAdjustedCover)

  const buildPreviewClassName = (...extra: Array<string | false | undefined>): string =>
    [styles.noteCoverPickerPreview, previewOrientationClass, ...extra.filter(Boolean)].join(' ')

  const openFilePicker = (): void => {
    if (isDisabled) {
      return
    }
    fileInputRef.current?.click()
  }

  const showRegenerate = source === 'auto' && showRegenerateAutoCover && Boolean(previewUrl)

  const renderPreviewActions = () => {
    if (!canAdjust && !showRegenerate) {
      return null
    }

    const actionsClassName = styles.noteCoverPickerPreviewActions

    return (
      <div className={actionsClassName}>
        {canAdjust ? (
          <button
            type="button"
            className={styles.noteCoverPickerActionBtn}
            onClick={() => setAdjustOpen(true)}
            disabled={isDisabled}
            aria-label="调整封面裁剪区域"
          >
            <Crop size={13} strokeWidth={2.2} />
            调整封面
          </button>
        ) : null}

        {showRegenerate ? (
          <button
            type="button"
            className={styles.noteCoverPickerActionBtn}
            onClick={onRequestAutoGenerate}
            disabled={isDisabled}
            aria-label="重新生成封面"
          >
            <Sparkles size={13} strokeWidth={2.2} />
            {isGenerating ? '生成中…' : '重新生成'}
          </button>
        ) : null}
      </div>
    )
  }

  const renderPreviewWithActions = (previewNode: ReactNode) => (
    <div className={styles.noteCoverPickerPreviewBlock}>
      <div className={styles.noteCoverPickerPreviewStage}>{previewNode}</div>
      {renderPreviewActions()}
    </div>
  )

  const renderCenteredPreview = (previewNode: ReactNode) => (
    <div className={styles.noteCoverPickerPreviewStage}>{previewNode}</div>
  )

  const renderAutoPreview = () => {
    if (previewUrl) {
      return renderPreviewWithActions(
        <div className={buildPreviewClassName()} style={previewStyle}>
          <img src={previewUrl} alt="封面预览" className={styles.noteCoverPickerPreviewImg} />
        </div>,
      )
    }

    return renderCenteredPreview(
      <button
        type="button"
        className={buildPreviewClassName(
          styles.noteCoverPickerPlaceholder,
          styles.noteCoverPickerPlaceholderInteractive,
          styles.noteCoverPickerPlaceholderDashed,
        )}
        style={previewStyle}
        onClick={onRequestAutoGenerate}
        disabled={isDisabled}
        aria-label="点击生成封面"
      >
        <Sparkles size={22} strokeWidth={1.8} />
        <span className={styles.noteCoverPickerPlaceholderAction}>
          {isGenerating ? '生成中…' : '点击生成封面'}
        </span>
        <span className={styles.noteCoverPickerPlaceholderHint}>{autoCoverHint}</span>
      </button>,
    )
  }

  const renderUploadPreview = () => {
    if (previewUrl) {
      return renderPreviewWithActions(
        <button
          type="button"
          className={buildPreviewClassName(styles.noteCoverPickerPreviewInteractive)}
          style={previewStyle}
          onClick={openFilePicker}
          disabled={isDisabled}
          aria-label="点击更换封面图片"
        >
          <img src={previewUrl} alt="封面预览" className={styles.noteCoverPickerPreviewImg} />
          <span className={styles.noteCoverPickerPreviewReplaceHint}>点击更换图片</span>
        </button>,
      )
    }

    return renderCenteredPreview(
      <button
        type="button"
        className={buildPreviewClassName(
          styles.noteCoverPickerPlaceholder,
          styles.noteCoverPickerUploadZone,
          styles.noteCoverPickerPlaceholderDashed,
        )}
        style={previewStyle}
        onClick={openFilePicker}
        disabled={isDisabled}
        aria-label="点击上传封面图片"
      >
        <ImageIcon size={22} strokeWidth={1.8} />
        <span className={styles.noteCoverPickerPlaceholderAction}>
          {isUploading ? '上传中…' : '点击上传图片'}
        </span>
        <span className={styles.noteCoverPickerPlaceholderHint}>{UPLOAD_COVER_HINT}</span>
      </button>,
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

      {source === 'auto' ? renderAutoPreview() : renderUploadPreview()}

      {source === 'upload' ? (
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={styles.noteCoverPickerHiddenInput}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void onSelectFile(file)
            }
            event.target.value = ''
          }}
        />
      ) : null}

      <NoteCoverAdjustModal
        open={adjustOpen}
        imageUrl={adjustSourceUrl ?? previewUrl}
        aspect={aspect}
        initialTransform={cropTransform}
        onClose={() => setAdjustOpen(false)}
        onConfirm={(file, transform) => {
          onApplyAdjustedCover?.(file, transform)
        }}
      />
    </section>
  )
}
