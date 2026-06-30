// 01）发布项目底部操作栏（ProjectPublishFooter）
// 保存草稿 / 预览 / 发布 三个按钮 + 提交状态提示
import InfoPromptModal from '@shared/ui/InfoPromptModal'
import styles from './project-publish-footer.module.css'

export interface ProjectPublishFooterProps {
  submitError: string | null
  isSubmitting: boolean
  leavePromptOpen: boolean
  leavePromptMessage: string
  onSaveDraft: () => void
  onPreview: () => void
  onPublish: () => void
  onConfirmLeave: () => void
  onCancelLeave: () => void
}

export function ProjectPublishFooter({
  submitError,
  isSubmitting,
  leavePromptOpen,
  leavePromptMessage,
  onSaveDraft,
  onPreview,
  onPublish,
  onConfirmLeave,
  onCancelLeave,
}: ProjectPublishFooterProps) {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <p className={styles.hint}>
            {submitError ? (
              <span className={styles.error}>{submitError}</span>
            ) : (
              '预览为本地快照；保存草稿与发布将写入服务端'
            )}
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={onSaveDraft} className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? '提交中…' : '保存草稿'}
            </button>
            <button type="button" onClick={onPreview} className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? '保存并预览…' : '预览'}
            </button>
            <button type="button" onClick={onPublish} className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? '提交中…' : '发布项目'}
            </button>
          </div>
        </div>
      </footer>

      <InfoPromptModal
        open={leavePromptOpen}
        message={leavePromptMessage}
        title="温馨提示"
        cancelText="继续编辑"
        confirmText="确认退出"
        onClose={onCancelLeave}
        onConfirm={onConfirmLeave}
      />
    </>
  )
}
