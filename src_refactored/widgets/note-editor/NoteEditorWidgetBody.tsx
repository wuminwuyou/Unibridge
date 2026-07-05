// 01）笔记编辑 Widget 主体（NoteEditorWidgetBody）
import { useCallback } from 'react'
import InfoPromptModal from '@shared/ui/InfoPromptModal'
import { TagInput } from '@shared/ui/TagInput'
import { NoteCoverPicker } from '@features/note-editor-cover'
import {
  NoteArticleEditorForm,
  NoteArticleEditorLayout,
  NoteEditorActionBar,
  NoteVideoEditorPlaceholder,
} from './components'
import { useNoteEditorForm } from './hooks/useNoteEditorForm'
import styles from './note-editor-widget.module.css'

/**
 * 函数名：NoteEditorWidgetBody
 * 功能：在已确定 type=article|video 后渲染笔记编辑 UI。
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function NoteEditorWidgetBody() {
  const form = useNoteEditorForm()

  const handleMarkdownImageUpload = useCallback(
    async (file: File): Promise<string> => {
      const url = await form.coverUpload.uploadCoverFile(file, 'upload', file.name)
      if (!url) {
        throw new Error('图片上传失败')
      }
      return url
    },
    [form.coverUpload],
  )

  const renderCoverPicker = useCallback(
    (slotClassName: string) => (
      <div className={slotClassName}>
        <NoteCoverPicker
          source={form.coverPicker.source}
          previewUrl={form.coverPicker.activePreviewUrl}
          isUploading={
            form.submitPhase === 'uploading-cover' && form.coverPicker.source === 'upload'
          }
          isGenerating={
            form.submitPhase === 'uploading-cover' && form.coverPicker.source === 'auto'
          }
          disabled={form.isSubmitting}
          onSourceChange={form.coverPicker.setSource}
          onSelectFile={form.handleUploadCoverFile}
          onRequestAutoGenerate={() => form.handleGenerateAutoCover()}
        />
      </div>
    ),
    [form],
  )

  if (form.type === 'video') {
    return <NoteVideoEditorPlaceholder />
  }

  if (form.uid && form.editLoadState === 'loading') {
    return (
      <main className={styles.noteEditorWidgetStatus} aria-label="笔记加载中">
        <h1 className={styles.noteEditorWidgetStatusTitle}>加载中…</h1>
        <p className={styles.noteEditorWidgetStatusDesc}>正在从服务器获取笔记内容。</p>
      </main>
    )
  }

  if (form.uid && form.editLoadState === 'error') {
    return (
      <main className={styles.noteEditorWidgetStatus} aria-label="笔记加载失败">
        <h1 className={styles.noteEditorWidgetStatusTitle}>加载失败</h1>
        <p className={styles.noteEditorWidgetStatusDesc}>
          {form.editLoadError ?? '无法获取笔记内容，请稍后重试。'}
        </p>
      </main>
    )
  }

  const sidebarTags = (
    <TagInput
      value={form.draft.tags}
      onChange={(tags) => form.updateField('tags', tags)}
      label="话题标签"
      required
      maxTags={5}
      suggestedTags={form.suggestedNoteTags}
      placeholder="输入后回车添加标签"
      disabled={form.isSubmitting}
    />
  )

  return (
    <div key={form.formResetKey}>
      <NoteArticleEditorLayout renderCoverPicker={renderCoverPicker} sidebarExtra={sidebarTags}>
        <NoteArticleEditorForm
          form={form}
          onMarkdownImageUpload={handleMarkdownImageUpload}
        />
      </NoteArticleEditorLayout>

      <NoteEditorActionBar
        isSubmitting={form.isSubmitting}
        submitError={form.submitError}
        submitPhase={form.submitPhase}
        onSaveDraft={form.onSaveDraft}
        onPreview={form.onPreview}
        onPublish={form.onPublish}
      />

      <InfoPromptModal
        open={form.leavePromptOpen}
        message={form.leavePromptMessage}
        title="温馨提示"
        cancelText="继续编辑"
        confirmText="确认退出"
        onClose={form.cancelLeave}
        onConfirm={form.confirmLeave}
      />

      <InfoPromptModal
        open={form.coverGeneratePromptOpen}
        message="请先填写笔记标题，再生成封面。"
        title="温馨提示"
        confirmText="我知道了"
        onClose={form.closeCoverGeneratePrompt}
        onConfirm={form.closeCoverGeneratePrompt}
      />

      <InfoPromptModal
        open={form.submitResultModal.open}
        message={form.submitResultModal.message}
        title={form.submitResultModal.title}
        confirmText={form.submitResultModal.isSuccess ? '回到首页' : '确认'}
        onClose={form.submitResultModal.isSuccess ? form.confirmSubmitResultModal : form.closeSubmitResultModal}
        onConfirm={form.submitResultModal.isSuccess ? form.confirmSubmitResultModal : form.closeSubmitResultModal}
      />
    </div>
  )
}
