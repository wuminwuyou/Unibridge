import { ImageIcon, Sparkles, Upload } from 'lucide-react'
import { useId, useRef } from 'react'
import type { PublishNoteCoverModel } from '../../usePublishNoteForm'

// 01）笔记封面选择器 Props（PublishNoteCoverPickerProps）
interface PublishNoteCoverPickerProps {
  cover: PublishNoteCoverModel
  isVideoNote: boolean
  summary: string
}

// 02）笔记封面选择器（PublishNoteCoverPicker）
/**
 * 函数名：PublishNoteCoverPicker
 * 功能：提供「系统生成 / 用户上传」双选项封面配置。
 * 实现方法：
 * - 左侧展示系统生成预览（图文按摘要、视频按首帧）
 * - 右侧展示用户上传窗口
 * - 最终封面在侧栏卡片预览中展示
 * 输入：
 * - cover：封面状态与处理器
 * - isVideoNote：是否为视频笔记
 * - summary：一句话摘要（图文生成封面用）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：由 cover 模型管理 Object URL
 */
export function PublishNoteCoverPicker({ cover, isVideoNote, summary }: PublishNoteCoverPickerProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const autoHint = isVideoNote
    ? '根据已上传视频自动截取第一帧'
    : '根据「一句话摘要」自动生成封面'

  const openCoverPicker = (): void => {
    fileInputRef.current?.click()
  }

  return (
    <div className="cover-picker">

      <div className="cover-picker__options">
        <button
          type="button"
          className={`cover-picker__option ${cover.source === 'auto' ? 'cover-picker__option--active' : ''}`}
          onClick={() => cover.setSource('auto')}
        >
          <span className="cover-picker__option-badge">
            <Sparkles className="h-4 w-4" />
            系统自动生成
          </span>
          <div className="cover-picker__thumb">
            {cover.autoPreviewUrl ? (
              <img src={cover.autoPreviewUrl} alt="系统生成封面预览" className="cover-picker__thumb-img" />
            ) : (
              <div className="cover-picker__thumb-placeholder">
                {isVideoNote ? '上传视频后生成' : summary.trim() ? '填写摘要后生成' : '等待摘要'}
              </div>
            )}
          </div>
          <p className="cover-picker__option-hint">{autoHint}</p>
        </button>

        <button
          type="button"
          className={`cover-picker__option ${cover.source === 'upload' ? 'cover-picker__option--active' : ''}`}
          onClick={() => cover.setSource('upload')}
        >
          <span className="cover-picker__option-badge">
            <Upload className="h-4 w-4" />
            用户上传封面
          </span>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                cover.handleSelectCoverImage(file)
              }
              event.target.value = ''
            }}
          />
          {cover.uploadPreviewUrl ? (
            <div className="cover-picker__thumb">
              <img src={cover.uploadPreviewUrl} alt="上传封面预览" className="cover-picker__thumb-img" />
            </div>
          ) : (
            <div
              className="cover-picker__upload-zone"
              onClick={(event) => {
                event.stopPropagation()
                openCoverPicker()
              }}
              onKeyDown={() => undefined}
              role="presentation"
            >
              <ImageIcon className="h-8 w-8 text-icon-muted" />
              <span>点击上传图片</span>
              <span className="cover-picker__upload-formats">PNG / JPG / WebP</span>
            </div>
          )}
          {cover.uploadPreviewUrl ? (
            <button
              type="button"
              className="btn-secondary cover-picker__replace-btn"
              onClick={(event) => {
                event.stopPropagation()
                openCoverPicker()
              }}
            >
              更换图片
            </button>
          ) : null}
        </button>
      </div>
    </div>
  )
}
