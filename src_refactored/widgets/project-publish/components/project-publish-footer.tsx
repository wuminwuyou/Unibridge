// 01）发布项目底部操作栏（ProjectPublishFooter）
// 保存草稿 / 预览 / 发布 三个按钮 + 提交状态提示
import InfoPromptModal from '@shared/ui/InfoPromptModal'
import styles from './project-publish-footer.module.css'

// 02）发布项目 API 错误码中文映射（PROJECT_PUBLISH_ERROR_MESSAGES）
/** @see API.md 02.1）常见错误码 */
const PROJECT_PUBLISH_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '未登录，请先登录后再发布',
  ACCESS_TOKEN_EXPIRED: '登录已过期，请重新登录后再试',
  VALIDATION_FAILED: '提交内容校验失败，请检查标题、摘要、描述、技能标签或金额',
  AMOUNT_PARSE_FAILED: '金额无法解析，请填写有效的预算数值',
  PROJECT_PUBLISH_FORBIDDEN: '无权限发布该项目，当前身份无法发布所选频道类型',
  PROJECT_NOT_FOUND: '项目不存在或已被删除',
  PROJECT_NOT_OWNER: '无权编辑该项目',
}

// 03）解析提交错误展示文案（resolveProjectPublishSubmitErrorMessage）
/**
 * 函数名：resolveProjectPublishSubmitErrorMessage
 * 功能：将 API 错误码或前端校验文案转为底部栏可展示的中文提示。
 * 实现方法：
 * - 命中 PROJECT_PUBLISH_ERROR_MESSAGES 时返回映射文案
 * - 否则原样返回（前端本地校验已为中文）
 * 输入：
 * - rawError：Hook 传入的 submitError 字符串
 * 输出：
 * - 返回值：展示用中文；无错误时为 null
 */
function resolveProjectPublishSubmitErrorMessage(rawError: string | null): string | null {
  if (!rawError) {
    return null
  }
  return PROJECT_PUBLISH_ERROR_MESSAGES[rawError] ?? rawError
}

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
  const displaySubmitError = resolveProjectPublishSubmitErrorMessage(submitError)

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <p className={styles.hint}>
            {displaySubmitError ? (
              <span className={styles.error}>{displaySubmitError}</span>
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
