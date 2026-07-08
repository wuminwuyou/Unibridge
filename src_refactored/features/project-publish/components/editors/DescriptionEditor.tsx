// 01）需求说明编辑器交互组件（DescriptionEditor）
/**
 * 函数名：DescriptionEditor
 * 功能：发布项目表单的「需求详情」段——委托 shared/ui/MarkdownEditor 渲染。
 * 实现方法：
 * - 包装 MarkdownEditor 并开启 Markdown 文件上传
 * - 粘贴/上传超限时弹出 InfoPromptModal，用户确认后才截断写入
 * 输入：
 * - value / onChange / maxLength / required
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { useCallback, useRef, useState } from 'react'
import {
  MarkdownEditor,
  type MarkdownEditorLengthLimitExceededPayload,
} from '@shared/ui/MarkdownEditor'
import InfoPromptModal from '@shared/ui/InfoPromptModal'
import styles from './DescriptionEditor.module.css'

export interface DescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  required?: boolean
  /** 额外排除的工具栏按钮（传递给共享的 MarkdownEditor） */
  toolbarsExcludeExtra?: readonly string[]
}

const LENGTH_LIMIT_MODAL_MESSAGE = '内容将超过字数限制，是否继续执行？继续后将自动截断至上限字数。'

// 02）需求说明编辑器（DescriptionEditor）
export function DescriptionEditor({ value, onChange, maxLength = 5000, toolbarsExcludeExtra }: DescriptionEditorProps) {
  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const pendingConfirmRef = useRef<((confirmed: boolean) => void) | null>(null)

  // 03）关闭字数超限确认弹窗（closeLimitModal）
  const closeLimitModal = useCallback((confirmed: boolean): void => {
    pendingConfirmRef.current?.(confirmed)
    pendingConfirmRef.current = null
    setLimitModalOpen(false)
  }, [])

  // 04）字数超限上报处理（handleLengthLimitExceeded）
  /**
   * 函数名：handleLengthLimitExceeded
   * 功能：接收 MarkdownEditor 超限上报，弹出确认框等待用户选择。
   * 输入：
   * - payload：超限事件载荷（shared 层上报）
   * 输出：
   * - 返回值：Promise<boolean>，true 表示继续执行（截断写入）
   */
  const handleLengthLimitExceeded = useCallback(
    (_payload: MarkdownEditorLengthLimitExceededPayload): Promise<boolean> => {
      return new Promise((resolve) => {
        pendingConfirmRef.current = resolve
        setLimitModalOpen(true)
      })
    },
    [],
  )

  const handleLimitModalClose = useCallback((): void => {
    closeLimitModal(false)
  }, [closeLimitModal])

  const handleLimitModalConfirm = useCallback((): void => {
    closeLimitModal(true)
  }, [closeLimitModal])

  return (
    <div className={styles.root}>
      <div className={styles.editorShell}>
        <MarkdownEditor
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          allowMarkdownFileUpload
          onLengthLimitExceeded={handleLengthLimitExceeded}
          placeholder="请输入项目需求说明，支持 Markdown 语法..."
          toolbarsExcludeExtra={toolbarsExcludeExtra}
        />
      </div>

      <InfoPromptModal
        open={limitModalOpen}
        title="温馨提示"
        message={LENGTH_LIMIT_MODAL_MESSAGE}
        cancelText="取消"
        confirmText="继续"
        onClose={handleLimitModalClose}
        onConfirm={handleLimitModalConfirm}
      />
    </div>
  )
}
