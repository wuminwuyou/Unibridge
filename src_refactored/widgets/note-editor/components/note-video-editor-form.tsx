// 01）视频笔记编辑表单（NoteVideoEditorForm）
import { useCallback, useLayoutEffect, useRef } from 'react'
import { TagInput } from '@shared/ui/TagInput'
import {
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  NOTE_SUMMARY_MAX_LENGTH,
} from '@features/note-editor'
import { NoteCoverPicker } from '@features/note-editor-cover'
import { NoteVideoSourcePanel } from '@features/note-editor-video'
import type { UseNoteEditorFormResult } from '../hooks/useNoteEditorForm'
import styles from './note-video-editor-form.module.css'

// 02）表单 Props（NoteVideoEditorFormProps）
export interface NoteVideoEditorFormProps {
  form: UseNoteEditorFormResult
}

const VIDEO_AUTO_COVER_HINT = '从当前视频首帧提取 16:9 封面，可调整裁剪区域，保存或发布时再上传。'

// 03）同步描述输入框高度（syncNoteVideoDescriptionHeight）
/**
 * 函数名：syncNoteVideoDescriptionHeight
 * 功能：将视频描述 textarea 高度调整为至少容纳 min-height。
 * 输入：
 * - element：textarea 元素
 * 输出：
 * - 副作用：写入 element.style.height
 */
function syncNoteVideoDescriptionHeight(element: HTMLTextAreaElement | null): void {
  if (!element) {
    return
  }
  element.style.height = 'auto'
  element.style.height = `${Math.max(element.scrollHeight, 128)}px`
}

/**
 * 函数名：NoteVideoEditorForm
 * 功能：视频笔记编辑页——左栏视频源与预览，右栏封面/标题/标签/描述。
 * 实现方法：
 * - 消费 useNoteEditorForm 的 draft、videoUpload、coverPicker
 * - 左右分栏布局；窄屏上下堆叠
 * 输入：
 * - form：useNoteEditorForm 返回值
 * 输出：
 * - 返回值：React 节点
 */
export function NoteVideoEditorForm({ form }: NoteVideoEditorFormProps) {
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  useLayoutEffect(() => {
    syncNoteVideoDescriptionHeight(descriptionRef.current)
  }, [form.draft.videoDescription])

  const renderCoverPicker = useCallback(
    () => (
      <NoteCoverPicker
        source={form.coverPicker.source}
        previewUrl={form.coverPicker.activePreviewUrl}
        adjustSourceUrl={form.coverPicker.coverAdjustSourceUrl}
        cropTransform={form.coverPicker.coverCropTransform}
        aspect={form.coverAspect}
        isUploading={
          form.submitPhase === 'uploading-cover' && form.coverPicker.source === 'upload'
        }
        isGenerating={
          form.isGeneratingCover
          || (form.submitPhase === 'uploading-cover' && form.coverPicker.source === 'auto')
        }
        disabled={form.isSubmitting}
        autoCoverHint={VIDEO_AUTO_COVER_HINT}
        onSourceChange={form.coverPicker.setSource}
        onSelectFile={(file) => { void form.handleUploadCoverFile(file) }}
        onRequestAutoGenerate={() => form.handleGenerateAutoCover()}
        onApplyAdjustedCover={form.handleApplyAdjustedCover}
      />
    ),
    [form],
  )

  return (
    <div className={styles.noteVideoEditorRoot}>
      <div className={styles.noteVideoEditorShell}>
        <div className={styles.noteVideoEditorHero}>
          <div className={styles.noteVideoEditorLeftCol}>
            <NoteVideoSourcePanel
              mode={form.videoUpload.mode}
              previewUrl={form.videoUpload.previewUrl}
              urlInput={form.videoUpload.urlInput}
              selectedFileName={form.videoUpload.selectedFileName}
              isUploading={form.videoUpload.isUploading}
              uploadProgress={form.videoUpload.uploadProgress}
              error={form.videoUpload.error}
              posterUrl={form.coverPicker.activePreviewUrl}
              disabled={form.isSubmitting}
              onModeChange={form.videoUpload.setMode}
              onSelectFile={(file) => {
                void form.videoUpload.selectFile(file)
              }}
              onUrlChange={form.videoUpload.setUrlInput}
              onUrlConfirm={() => {
                void form.videoUpload.confirmUrl()
              }}
              onClear={form.handleClearVideo}
            />
          </div>

          <div className={styles.noteVideoEditorRightCol}>
            <div className={styles.noteVideoEditorCoverSection}>
              <span className={styles.noteVideoEditorCoverLabel}>封面图</span>
              {renderCoverPicker()}
            </div>

            <div className={styles.noteVideoEditorTitleField}>
              <input
                type="text"
                className={styles.noteVideoEditorTitleInput}
                placeholder="输入视频笔记标题…"
                value={form.draft.title}
                maxLength={NOTE_TITLE_MAX_LENGTH}
                disabled={form.isSubmitting}
                onChange={(event) => form.updateField('title', event.target.value)}
              />
              <p className={styles.noteVideoEditorTitleCount}>
                {form.draft.title.length}/{NOTE_TITLE_MAX_LENGTH}
              </p>
            </div>

            <TagInput
              value={form.draft.tags}
              onChange={(tags) => form.updateField('tags', tags)}
              label="话题标签"
              required
              maxTags={NOTE_TAG_MAX_COUNT}
              maxTagLength={NOTE_TAG_MAX_LENGTH}
              suggestedTags={form.suggestedNoteTags}
              placeholder="输入后回车添加标签"
              disabled={form.isSubmitting}
            />

            <div className={styles.noteVideoEditorDescriptionField}>
              <label className={styles.noteVideoEditorDescriptionLabel} htmlFor="note-video-description">
                视频描述
              </label>
              <textarea
                ref={descriptionRef}
                id="note-video-description"
                className={styles.noteVideoEditorDescriptionInput}
                placeholder="补充视频说明，帮助读者了解内容…"
                value={form.draft.videoDescription}
                maxLength={NOTE_SUMMARY_MAX_LENGTH}
                disabled={form.isSubmitting}
                onChange={(event) => {
                  form.updateField('videoDescription', event.target.value.slice(0, NOTE_SUMMARY_MAX_LENGTH))
                  syncNoteVideoDescriptionHeight(event.target)
                }}
              />
              <p className={styles.noteVideoEditorDescriptionCount}>
                {form.draft.videoDescription.length}/{NOTE_SUMMARY_MAX_LENGTH}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
