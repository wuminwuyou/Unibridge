import { createPortal } from 'react-dom'
import { useState, useEffect, useCallback, type MouseEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { generateSubCode } from '../../../../api/verification'
import type { GenerateSubCodeResponse } from '../../../../api/verification/types'
import CloseIconButton from '../../../../components/common/CloseIconButton'
import './SchoolVerificationCodeModal.css'

interface SubCodeGenerateModalProps {
  open: boolean
  onClose: () => void
}

export function SubCodeGenerateModal({ open, onClose }: SubCodeGenerateModalProps) {
  const [masterCode, setMasterCode] = useState('')
  const [description, setDescription] = useState('')
  const [maxQuota, setMaxQuota] = useState(50)
  const [graduationYear, setGraduationYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<GenerateSubCodeResponse | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscKeyDown)
    }
  }, [open, onClose])

  const handleClose = useCallback(() => {
    setMasterCode('')
    setDescription('')
    setMaxQuota(50)
    setGraduationYear('')
    setError(null)
    setGeneratedCode(null)
    setCopied(false)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(async () => {
    setError(null)
    const trimmedMasterCode = masterCode.trim()
    if (!trimmedMasterCode) {
      setError('请输入母码')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await generateSubCode({
        masterCode: trimmedMasterCode,
        description: description.trim() || undefined,
        maxQuota: maxQuota || undefined,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
      })
      setGeneratedCode(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成子码失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }, [masterCode, description, maxQuota, graduationYear])

  const handleCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
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

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  const headerTitle = generatedCode ? '子码已生成' : '生成认证子码'

  if (!open) return null

  return createPortal(
    <div className="scvc-mask" role="presentation" onClick={handleClose}>
      <section className="scvc-card" role="dialog" aria-modal="true" aria-label={headerTitle} onClick={handleContainerClick}>
        <CloseIconButton className="scvc-card__close" onClick={handleClose} ariaLabel="关闭生成子码弹窗" />
        <div className="scvc__header"><h2>{headerTitle}</h2></div>
        {error ? <div className="scvc__error" role="alert">{error}</div> : null}
        {generatedCode ? (
          <div className="scvc__result">
            <div className="scvc__result-head">
              <span className="scvc__check-icon"><CheckCircle2 size={16} /></span>
              子码生成成功
            </div>
            <p className="scvc__result-code-label">
              实体编码：{generatedCode.entityCode}　｜　失效时间：{generatedCode.expireTime}
            </p>
            {generatedCode.graduationYear ? (
              <p className="scvc__result-code-label">毕业年份：{generatedCode.graduationYear}</p>
            ) : null}
            <div className="scvc__code-list">
              <div className="scvc__code-item" key={generatedCode.code}>
                <span className="scvc__code-text">{generatedCode.code}</span>
                <button type="button" className="scvc__copy-btn" onClick={() => handleCopy(generatedCode.code)}>
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
            <p className="scvc__result-hint">子码总额度：{generatedCode.maxQuota}</p>
            <button type="button" className="scvc__submit-btn" onClick={handleClose}>完成</button>
          </div>
        ) : (
          <>
            <p className="scvc__hint">在母码下创建班级/专业级子码，供学生认证使用。</p>
            <div className="scvc__form">
              <div className="scvc__field">
                <label htmlFor="scvc-master-code" className="scvc__field-label">母码</label>
                <input id="scvc-master-code" type="text" className="scvc__input" value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value)} placeholder="输入母码，如 10598-2026-00123" disabled={isSubmitting} />
              </div>
              <div className="scvc__field">
                <label htmlFor="scvc-description" className="scvc__field-label">用途描述</label>
                <input id="scvc-description" type="text" className="scvc__input" value={description}
                  onChange={(e) => setDescription(e.target.value)} placeholder="例如：计算机专业 3 班" disabled={isSubmitting} />
              </div>
              <div className="scvc__field">
                <label htmlFor="scvc-max-quota" className="scvc__field-label">额度</label>
                <input id="scvc-max-quota" type="number" className="scvc__input" value={maxQuota}
                  onChange={(e) => setMaxQuota(Number(e.target.value))} min={1} max={500} disabled={isSubmitting} />
              </div>
              <div className="scvc__field">
                <label htmlFor="scvc-graduation-year" className="scvc__field-label">毕业年份（可选）</label>
                <input id="scvc-graduation-year" type="number" className="scvc__input" value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)} placeholder="如 2030" min={2020} max={2100} disabled={isSubmitting} />
              </div>
              <button type="button" className="scvc__submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '正在生成…' : '生成子码'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>,
    document.body,
  )
}
