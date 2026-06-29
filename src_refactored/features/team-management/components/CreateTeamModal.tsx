// 01）创建团队弹窗（CreateTeamModal）— 隶属于 features/team-management
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import CloseIconButton from '@shared/ui/CloseIconButton'
import { isUserResourceUid } from '@shared/api/resourceUid'
import {
  createStudentTeam, TeamProfileApiError,
} from '@entities/team/api/teamProfileApi'
import {
  getUserVerifiedPreview, UserApiError,
} from '@entities/user/api/userApi'
import type { UserVerifiedPreviewDto } from '@entities/user/model/types'
import { buildTeamSpacePath } from '@features/profile-space/lib/routing/teamTabRouting'

// 02）Props（CreateTeamModalProps）
interface CreateTeamModalProps {
  open: boolean
  onClose: () => void
}

// 03）创建团队弹窗（CreateTeamModal）
/**
 * 函数名：CreateTeamModal
 * 功能：提供创建学生团队的表单弹窗；创建成功后路由跳转至新团队空间。
 * 实现方法：
 * - 初始成员 UID 反抖动调用 getUserVerifiedPreview 校验
 * - 提交时调用 createStudentTeam（entities/team/api）
 * 输入：
 * - open / onClose
 * 输出：
 * - 返回值：React Portal 节点
 * - 副作用：发起网络请求、路由跳转
 */
export function CreateTeamModal({ open, onClose }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [memberUid, setMemberUid] = useState('')
  const [memberPreview, setMemberPreview] = useState<UserVerifiedPreviewDto | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout>>(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      requestAnimationFrame(() => { nameInputRef.current?.focus() })
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      document.body.style.overflow = ''
      return () => clearTimeout(timer)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleClose = (): void => {
    setTeamName('')
    setTeamDescription('')
    setMemberUid('')
    setMemberPreview(null)
    setErrorMessage(null)
    clearTimeout(previewTimerRef.current)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) handleClose()
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const handleMemberUidChange = useCallback((value: string): void => {
    setMemberUid(value)
    setMemberPreview(null)
    clearTimeout(previewTimerRef.current)
    const trimmed = value.trim()
    if (!isUserResourceUid(trimmed)) return

    previewTimerRef.current = setTimeout(() => {
      setIsPreviewLoading(true)
      void getUserVerifiedPreview(trimmed)
        .then((preview) => { setMemberPreview(preview) })
        .catch((error: unknown) => {
          setMemberPreview(null)
          if (error instanceof UserApiError && error.code === 403) {
            setErrorMessage('该用户未实名，无法加入团队')
          }
        })
        .finally(() => { setIsPreviewLoading(false) })
    }, 300)
  }, [])

  const clearMember = (): void => {
    setMemberUid('')
    setMemberPreview(null)
  }

  const handleSubmit = async (): Promise<void> => {
    const trimmedName = teamName.trim()
    if (!trimmedName) { setErrorMessage('请输入团队名称'); return }
    if (trimmedName.length > 32) { setErrorMessage('团队名称不能超过 32 个字符'); return }
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const payload: { name: string; description?: string; initialMemberUids?: string[] } = {
        name: trimmedName,
        description: teamDescription.trim() || undefined,
      }
      const trimmedUid = memberUid.trim()
      if (isUserResourceUid(trimmedUid) && memberPreview) {
        payload.initialMemberUids = [trimmedUid]
      }
      const result = await createStudentTeam(payload as Parameters<typeof createStudentTeam>[0])
      handleClose()
      navigate(buildTeamSpacePath(result.teamUid), { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof TeamProfileApiError ? error.message : '创建团队失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) return null

  const bc = open
    ? 'create-team-modal-backdrop create-team-modal-backdrop--enter'
    : 'create-team-modal-backdrop create-team-modal-backdrop--exit'
  const cc = open
    ? 'create-team-modal-card create-team-modal-card--enter'
    : 'create-team-modal-card create-team-modal-card--exit'

  return createPortal(
    <div className={bc} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="创建团队">
      <div className={cc}>
        <div className="create-team-modal__header">
          <h2>创建团队</h2>
          <CloseIconButton onClick={handleClose} ariaLabel="关闭创建团队弹窗" className="create-team-modal__close-btn" />
        </div>
        <p className="create-team-modal__hint">创建一个新的团队，你将自动成为该团队的负责人。可预先添加初始成员。</p>
        {errorMessage ? <div className="create-team-modal__error" role="alert">{errorMessage}</div> : null}
        <form className="create-team-modal__form" onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}>
          <div className="create-team-modal__field">
            <label htmlFor="create-team-name" className="create-team-modal__label">
              团队名称 <span className="create-team-modal__required">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="create-team-name" type="text" className="create-team-modal__input"
              value={teamName}
              onChange={(e) => { setTeamName(e.target.value); if (errorMessage) setErrorMessage(null) }}
              placeholder="请输入团队名称" maxLength={32} disabled={isSubmitting} autoComplete="off"
            />
            <span className="create-team-modal__char-count">{teamName.length}/32</span>
          </div>
          <div className="create-team-modal__field">
            <label htmlFor="create-team-desc" className="create-team-modal__label">团队简介</label>
            <textarea
              id="create-team-desc" className="create-team-modal__textarea" value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="一句话介绍团队方向…" rows={3} maxLength={120} disabled={isSubmitting}
            />
            <span className="create-team-modal__char-count">{teamDescription.length}/120</span>
          </div>
          <div className="create-team-modal__field">
            <label htmlFor="create-team-member" className="create-team-modal__label">初始成员 UID（选填）</label>
            {memberPreview ? (
              <div className="create-team-modal__leader-preview">
                <img
                  className="create-team-modal__leader-avatar"
                  src={memberPreview.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent((memberPreview.realName || memberPreview.nickname).slice(0, 1) || 'U')}`}
                  alt={memberPreview.realName || memberPreview.nickname}
                />
                <div className="create-team-modal__leader-info">
                  <span className="create-team-modal__leader-name">{memberPreview.realName || memberPreview.nickname}</span>
                  <span className="create-team-modal__leader-uid-small">{memberPreview.uid}</span>
                </div>
                <button type="button" className="create-team-modal__leader-clear" onClick={clearMember} aria-label="清除成员">✕</button>
              </div>
            ) : (
              <input
                id="create-team-member" type="text" className="create-team-modal__input"
                value={memberUid}
                onChange={(e) => handleMemberUidChange(e.target.value)}
                placeholder="输入 US+11 位 UID（选填）" maxLength={14} disabled={isSubmitting} autoComplete="off"
              />
            )}
            {isPreviewLoading ? <span className="create-team-modal__char-count" style={{ color: '#94a3b8' }}>查询中…</span> : null}
          </div>
          <div className="create-team-modal__actions">
            <button
              type="button"
              className="create-team-modal__btn create-team-modal__btn--cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="create-team-modal__btn create-team-modal__btn--submit"
              disabled={isSubmitting || !teamName.trim()}
            >
              {isSubmitting ? <span className="create-team-modal__spinner" aria-hidden="true" /> : null}
              {isSubmitting ? '创建中…' : '创建团队'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
