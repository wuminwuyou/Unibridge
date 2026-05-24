import { Film, Trash2, Upload } from 'lucide-react'
import { useId, useRef } from 'react'
import type { PublishNoteVideoUploadModel } from '../../usePublishNoteForm'

// 01）视频上传卡片 Props（PublishNoteVideoUploadCardProps）
interface PublishNoteVideoUploadCardProps {
  video: PublishNoteVideoUploadModel
}

// 02）格式化文件大小（formatVideoFileSize）
/**
 * 函数名：formatVideoFileSize
 * 功能：将字节数格式化为可读的 MB 文案。
 * 实现方法：
 * - 除以 1024² 并保留一位小数
 * 输入：
 * - bytes：文件字节数
 * 输出：
 * - 返回值：string
 * - 副作用：无
 */
function formatVideoFileSize(bytes: number): string {
  if (bytes <= 0) {
    return '0 MB'
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 03）视频上传卡片（PublishNoteVideoUploadCard）
/**
 * 函数名：PublishNoteVideoUploadCard
 * 功能：在「视频」内容类型下展示拖拽/点击上传区域与已选视频预览。
 * 实现方法：
 * - 隐藏 file input，点击卡片或按钮触发选择
 * - 已选文件时展示预览 video 与移除按钮
 * 输入：
 * - video：usePublishNoteForm 提供的视频上传状态与处理器
 * 输出：
 * - 返回值：React 节点
 * - 副作用：由父级 Hook 管理 Object URL 生命周期
 */
export function PublishNoteVideoUploadCard({ video }: PublishNoteVideoUploadCardProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { file, previewUrl, fileName, fileSizeBytes, handleSelectVideo, handleRemoveVideo } = video

  const openFilePicker = (): void => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        className="sr-only"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0]
          if (selectedFile) {
            handleSelectVideo(selectedFile)
          }
          event.target.value = ''
        }}
      />

      {!file ? (
        <button type="button" className="video-upload-card" onClick={openFilePicker}>
          <span className="video-upload-card__icon" aria-hidden="true">
            <Upload className="h-8 w-8" />
          </span>
          <span className="video-upload-card__title">点击或拖拽上传视频</span>
          <span className="video-upload-card__hint">支持 MP4、WebM、MOV，单文件建议不超过 500MB（原型）</span>
          <span className="btn-secondary video-upload-card__btn">选择视频文件</span>
        </button>
      ) : (
        <div className="video-upload-preview">
          <div className="video-upload-preview__player-wrap">
            {previewUrl ? (
              <video className="video-upload-preview__player" src={previewUrl} controls preload="metadata" />
            ) : (
              <div className="video-upload-preview__player video-upload-preview__player--placeholder">
                <Film className="h-10 w-10 text-icon-muted" />
              </div>
            )}
          </div>
          <div className="video-upload-preview__meta">
            <p className="video-upload-preview__name">{fileName}</p>
            <p className="video-upload-preview__size">{formatVideoFileSize(fileSizeBytes)}</p>
          </div>
          <div className="video-upload-preview__actions">
            <button type="button" className="btn-secondary" onClick={openFilePicker}>
              更换视频
            </button>
            <button type="button" className="btn-secondary video-upload-preview__remove" onClick={handleRemoveVideo}>
              <Trash2 className="h-4 w-4" />
              移除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
