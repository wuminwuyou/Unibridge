import { createPortal } from 'react-dom'
import { useState, useEffect, useCallback, type MouseEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { generateMasterCode } from '../../../../api/verification'
import type { GenerateMasterCodeResponse } from '../../../../api/verification/types'
import CloseIconButton from '../../../../components/common/CloseIconButton'
import './SchoolVerificationCodeModal.css'

// 01）学校认证码弹窗参数（SchoolVerificationCodeModalProps）
interface SchoolVerificationCodeModalProps {
  open: boolean
  onClose: () => void
}

// 02）学校认证码弹窗（SchoolVerificationCodeModal）
/**
 * 函数名：SchoolVerificationCodeModal
 * 功能：学校管理员生成院级认证母码的弹窗。
 * 实现方法：
 * - createPortal 挂载至 document.body，确保居中与层级正确
 * - 表单提交后调用 generateMasterCode API 生成母码
 * - 生成成功后展示认证码列表并支持一键复制
 * - 打开时锁定 body 滚动，ESC / 遮罩点击关闭
 * 输入：
 * - open：是否打开弹窗
 * - onClose：关闭弹窗回调
 * 输出：
 * - 返回值：JSX.Element | null
 * - 副作用：调用 API 生成认证码、锁定 body overflow、注册键盘事件
 */
export function SchoolVerificationCodeModal({ open, onClose }: SchoolVerificationCodeModalProps) {
  const [description, setDescription] = useState('')
  const [maxQuota, setMaxQuota] = useState(1000)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<GenerateMasterCodeResponse | null>(null)
  const [copied, setCopied] = useState(false)

  // 03）锁定 body 滚动与 ESC 关闭（useEffect）
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscKeyDown)
    }
  }, [open, onClose])

  // 04）关闭弹窗并重置表单状态（handleClose）
  const handleClose = useCallback(() => {
    setDescription('')
    setMaxQuota(1000)
    setError(null)
    setGeneratedCode(null)
    setCopied(false)
    onClose()
  }, [onClose])

  // 05）提交生成母码（handleSubmit）
  const handleSubmit = useCallback(async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await generateMasterCode({
        description: description.trim() || undefined,
        maxQuota: maxQuota || undefined,
      })
      setGeneratedCode(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成认证码失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }, [description, maxQuota])

  // 06）复制认证码（handleCopy）
  const handleCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  // 07）遮罩点击关闭处理（handleMaskClick）
  const handleMaskClick = (): void => {
    handleClose()
  }

  // 08）弹窗容器阻止冒泡处理（handleContainerClick）
  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="scvc-mask" role="presentation" onClick={handleMaskClick}>
      <section
        className="scvc-card"
        role="dialog"
        aria-modal="true"
        aria-label="学校认证码"
        onClick={handleContainerClick}
      >
        <CloseIconButton className="scvc-card__close" onClick={handleClose} ariaLabel="关闭学校认证码弹窗" />

        {/* 弹窗头部 */}
        <div className="scvc__header">
          <h2>{generatedCode ? '认证码已生成' : '学校认证码'}</h2>
        </div>

        {error ? <div className="scvc__error" role="alert">{error}</div> : null}

        {generatedCode ? (
          /* 生成结果展示 */
          <div className="scvc__result">
            <div className="scvc__result-head">
              <span className="scvc__check-icon"><CheckCircle2 size={16} /></span>
              认证码生成成功
            </div>
            <p className="scvc__result-code-label">
              实体编码：{generatedCode.entityCode}　｜　失效时间：{generatedCode.expireTime}
            </p>
            <div className="scvc__code-list">
              <div className="scvc__code-item" key={generatedCode.code}>
                <span className="scvc__code-text">{generatedCode.code}</span>
                <button
                  type="button"
                  className="scvc__copy-btn"
                  onClick={() => handleCopy(generatedCode.code)}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
            <p className="scvc__result-hint">认证码总额度：{generatedCode.maxQuota}</p>
            <button type="button" className="scvc__submit-btn" onClick={handleClose}>
              完成
            </button>
          </div>
        ) : (
          /* 生成表单 */
          <>
            <p className="scvc__hint">创建院级母码后，辅导员可在母码下创建班级/专业级子码，供学生认证使用。</p>
            <div className="scvc__form">
              <div className="scvc__field">
                <label htmlFor="scvc-description" className="scvc__field-label">用途描述</label>
                <input
                  id="scvc-description"
                  type="text"
                  className="scvc__input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：2026 级计算机学院"
                  disabled={isSubmitting}
                />
              </div>
              <div className="scvc__field">
                <label htmlFor="scvc-max-quota" className="scvc__field-label">总额度</label>
                <input
                  id="scvc-max-quota"
                  type="number"
                  className="scvc__input"
                  value={maxQuota}
                  onChange={(e) => setMaxQuota(Number(e.target.value))}
                  min={1}
                  max={5000}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="button"
                className="scvc__submit-btn"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '正在生成…' : '生成母码'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>,
    document.body,
  )
}
