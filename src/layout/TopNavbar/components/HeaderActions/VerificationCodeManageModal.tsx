import { createPortal } from 'react-dom'
import { useState, useEffect, useCallback, type MouseEvent } from 'react'
import { AlertTriangle, RotateCcw, Users, GitFork } from 'lucide-react'
import { getVerificationCodeList, invalidateVerificationCode, renewVerificationCode, getVerificationCodeStudents, getSubCodeList } from '../../../../api/verification'
import { VerificationApiError } from '../../../../api/verification'
import type { VerificationCodeItem, VerifiedStudentItem } from '../../../../api/verification/types'
import CloseIconButton from '../../../../components/common/CloseIconButton'
import InfoPromptModal from '../../../../components/common/InfoPromptModal'
import './VerificationCodeManageModal.css'

// 01）认证码管理弹窗参数（VerificationCodeManageModalProps）
interface VerificationCodeManageModalProps {
  open: boolean
  onClose: () => void
}

// 02）延期确认弹窗参数（RenewConfirmModalProps）
interface RenewConfirmModalProps {
  code: string
  currentExpireTime: string
  /** 创建时间，用于计算最大可选日期（创建时间 + 28 天） */
  createdAt: string
  onConfirm: () => void
  onCancel: () => void
}

// 03）学生列表弹窗参数（StudentListModalProps）
interface StudentListModalProps {
  code: string
  onClose: () => void
}

// 04）附属子码列表弹窗参数（SubCodeListModalProps）
interface SubCodeListModalProps {
  masterCode: string
  onClose: () => void
}

// 05）根据 isActive 与额度判定状态详情（getStatusDetail）
/**
 * 函数名：getStatusDetail
 * 功能：根据认证码的激活状态与额度使用情况返回中文状态标签和样式名。
 * 输入：
 * - active：是否激活（Boolean）
 * - used：已用额度
 * - max：总额度
 * 输出：{ label: string, cssClass: string }
 */
function getStatusDetail(active: boolean, used: number, max: number): { label: string; cssClass: string } {
  if (!active) {
    if (max > 0 && used >= max) {
      return { label: '额度耗尽', cssClass: 'vcm__status--exhausted' }
    }
    return { label: '过期', cssClass: 'vcm__status--expired' }
  }
  return { label: '进行', cssClass: 'vcm__status--active' }
}

// 06）错误码中文映射（getErrorChineseMessage）
/**
 * 函数名：getErrorChineseMessage
 * 功能：将后端错误码映射为用户可读的中文提示信息。
 * 输入：
 * - code：错误码字符串（如 CODE_ALREADY_INACTIVE）
 * 输出：
 * - 返回值：中文字符串
 */
function getErrorChineseMessage(code: number | string): string {
  const map: Record<string, string> = {
    CODE_ALREADY_INACTIVE: '该认证码已停用，无法延期，请重新创建认证码',
  }
  return map[String(code)] ?? '操作失败，请稍后重试'
}

// 07）延期确认弹窗（RenewConfirmModal）
/**
 * 函数名：RenewConfirmModal
 * 功能：小弹窗，让管理员选择延期至目标日期并确认。
 * 实现方法：
 * - 日期选择器，最小日期为失效时间后一天，最大日期为创建时间 + 28 天
 * - 默认选择失效时间后一天
 * 输入：code、currentExpireTime、createdAt、onConfirm、onCancel
 * 输出：JSX.Element | null
 */
function RenewConfirmModal({ code, currentExpireTime, createdAt, onConfirm, onCancel }: RenewConfirmModalProps) {
  // minDate = max(失效时间后一天, 今天后一天)，防止延期到比今天还早的无效日期
  const expireDate = new Date(currentExpireTime)
  const expireNextDay = new Date(expireDate.getTime() + 24 * 60 * 60 * 1000)
  const todayNextDay = new Date()
  todayNextDay.setDate(todayNextDay.getDate() + 1)
  const minDateObj = expireNextDay > todayNextDay ? expireNextDay : todayNextDay
  const minDate = minDateObj.toISOString().slice(0, 10)
  const createdAtDate = new Date(createdAt)
  const maxDate = new Date(createdAtDate.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [newExpireDate, setNewExpireDate] = useState(minDate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await renewVerificationCode({ code, newExpireDate })
      onConfirm()
    } catch (err) {
      setIsSubmitting(false)
      if (err instanceof VerificationApiError) {
        setErrorMessage(getErrorChineseMessage(err.message))
      } else {
        setErrorMessage('延期失败，请稍后重试')
      }
    }
  }, [code, newExpireDate, onConfirm])

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  return (
    <>
      {errorMessage ? (
        <InfoPromptModal
          open={Boolean(errorMessage)}
          message={errorMessage}
          title="操作失败"
          confirmText="知道了"
          onConfirm={() => setErrorMessage(null)}
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
      {createPortal(
        <div className="vcm-sub-modal-mask" role="presentation" onClick={onCancel}>
          <div className="vcm-sub-modal-card" role="dialog" aria-modal="true" aria-label="延期认证码" onClick={handleContainerClick}>
            <CloseIconButton className="vcm-sub-modal__close" onClick={onCancel} ariaLabel="关闭延期弹窗" />
            <h3 className="vcm-sub-modal__title">延期认证码</h3>
            <p className="vcm-sub-modal__info">当前失效时间：{currentExpireTime}</p>
            <div className="vcm-sub-modal__field">
              <label htmlFor="vcm-renew-date" className="vcm-sub-modal__label">延期至</label>
              <input
                id="vcm-renew-date"
                type="date"
                className="vcm-sub-modal__input"
                value={newExpireDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setNewExpireDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <button type="button" className="vcm-sub-modal__btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '延期提交中…' : '确认延期'}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// 07）学生列表弹窗（StudentListModal）
/**
 * 函数名：StudentListModal
 * 功能：小弹窗，展示指定子码下已激活的学生列表。
 * 输入：code、onClose
 * 输出：JSX.Element | null
 */
function StudentListModal({ code, onClose }: StudentListModalProps) {
  const [students, setStudents] = useState<VerifiedStudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getVerificationCodeStudents(code).then((data) => {
      if (cancelled) return
      setStudents(data.students)
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setError('获取学生列表失败')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [code])

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  return createPortal(
    <div className="vcm-sub-modal-mask" role="presentation" onClick={onClose}>
      <div className="vcm-sub-modal-card vcm-sub-modal-card--wide" role="dialog" aria-modal="true" aria-label="认证学生列表" onClick={handleContainerClick}>
        <CloseIconButton className="vcm-sub-modal__close" onClick={onClose} ariaLabel="关闭学生列表弹窗" />
        <h3 className="vcm-sub-modal__title">认证学生列表</h3>
        <p className="vcm-sub-modal__info">子码：{code}</p>
        {loading ? (
          <p className="vcm-sub-modal__loading">加载中…</p>
        ) : error ? (
          <p className="vcm-sub-modal__error" role="alert">{error}</p>
        ) : students.length === 0 ? (
          <p className="vcm-sub-modal__empty">暂无认证学生</p>
        ) : (
          <div className="vcm-student-table">
            <div className="vcm-student-table__header">
              <span>昵称</span>
              <span>学号</span>
              <span>毕业年份</span>
              <span>激活时间</span>
            </div>
            {students.map((s) => (
              <div key={s.uid} className="vcm-student-table__row">
                <span>{s.nickname}</span>
                <span>{s.studentId}</span>
                <span>{s.graduationYear}</span>
                <span>{s.activatedAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// 08）附属子码列表弹窗（SubCodeListModal）
/**
 * 函数名：SubCodeListModal
 * 功能：小弹窗，展示指定母码下的所有附属子码列表（沿用管理弹窗表格设计）。
 * 输入：masterCode、onClose
 * 输出：JSX.Element | null
 */
function SubCodeListModal({ masterCode, onClose }: SubCodeListModalProps) {
  const [codes, setCodes] = useState<VerificationCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getSubCodeList(masterCode).then((data) => {
      if (cancelled) return
      setCodes(data.codes.map((c) => ({
        ...c,
        isActive: Boolean(c.isActive),
        isMaster: Boolean(c.isMaster),
        canRenew: Boolean(c.canRenew),
      })))
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setError('获取子码列表失败')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [masterCode])

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  return createPortal(
    <div className="vcm-sub-modal-mask" role="presentation" onClick={onClose}>
      <div className="vcm-sub-modal-card vcm-sub-modal-card--wide" role="dialog" aria-modal="true" aria-label="附属子码列表" onClick={handleContainerClick}>
        <CloseIconButton className="vcm-sub-modal__close" onClick={onClose} ariaLabel="关闭子码列表弹窗" />
        <h3 className="vcm-sub-modal__title">附属子码列表</h3>
        <p className="vcm-sub-modal__info">母码：{masterCode}</p>
        {loading ? (
          <p className="vcm-sub-modal__loading">加载中…</p>
        ) : error ? (
          <p className="vcm-sub-modal__error" role="alert">{error}</p>
        ) : codes.length === 0 ? (
          <p className="vcm-sub-modal__empty">暂无附属子码</p>
        ) : (
          <div className="vcm-student-table">
            <div className="vcm-student-table__header vcm-student-table__header--sub-code">
              <span>子码名称</span>
              <span>子码</span>
              <span>创建者</span>
              <span>额度使用</span>
              <span>状态</span>
            </div>
            {codes.map((sub) => {
              const quotaPercent = sub.maxQuota > 0 ? Math.round((sub.usedQuota / sub.maxQuota) * 100) : 0
              const status = getStatusDetail(sub.isActive, sub.usedQuota, sub.maxQuota)

              return (
                <div key={sub.code} className={`vcm-student-table__row vcm-student-table__row--sub-code ${!sub.isActive ? 'vcm-student-table__row--inactive' : ''}`}>
                  <span>{sub.description ?? <span className="vcm__name-null">null</span>}</span>
                  <span><code className="vcm__code-text-sm">{sub.code}</code></span>
                  <span className="vcm__creator-cell">{sub.createdByName}</span>
                  <span className="vcm__creator-cell-uid">{sub.createdBy}</span>
                  <span>
                    <div className="vcm__progress vcm__progress--sm">
                      <div className="vcm__progress-bar" style={{ width: `${quotaPercent}%` }} />
                    </div>
                    <span className="vcm__progress-label">已用 {sub.usedQuota} / 总额 {sub.maxQuota}</span>
                  </span>
                  <span>
                    <span className={`vcm__status ${status.cssClass}`}>{status.label}</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

// 09）认证码管理弹窗（VerificationCodeManageModal）
/**
 * 函数名：VerificationCodeManageModal
 * 功能：学校管理员查看和管理所有认证码（母码+子码）的弹窗。
 * 实现方法：
 * - createPortal 挂载至 document.body，确保居中与层级正确
 * - 打开时调用 getVerificationCodeList 加载认证码列表
 * - 将后端返回的 isActive / isMaster 显式转为 Boolean，避免整数/字符串误判
 * - 每条认证码支持：停用（invalidate）、延期（renew）、查看附属子码（仅母码）/ 查看认证学生（仅子码）
 * - 子弹窗（延期/学生/子码）同样使用 portal 挂载
 * - 打开时锁定 body 滚动，ESC / 遮罩点击关闭
 * 输入：
 * - open：是否打开弹窗
 * - onClose：关闭弹窗回调
 * 输出：
 * - 返回值：JSX.Element | null
 * - 副作用：调用 API、锁定 body overflow、注册键盘事件
 */
export function VerificationCodeManageModal({ open, onClose }: VerificationCodeManageModalProps) {
  const [codes, setCodes] = useState<VerificationCodeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // 子弹窗状态
  const [renewTarget, setRenewTarget] = useState<{ code: string; expireTime: string; createdAt: string } | null>(null)
  const [studentTarget, setStudentTarget] = useState<string | null>(null)
  const [subCodeTarget, setSubCodeTarget] = useState<string | null>(null)

  // 10）锁定 body 滚动与 ESC 关闭（useEffect）
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscKeyDown = (event: KeyboardEvent): void => {
      // 子弹窗打开时 ESC 先关子弹窗
      if (studentTarget) { setStudentTarget(null); return }
      if (subCodeTarget) { setSubCodeTarget(null); return }
      if (renewTarget) { setRenewTarget(null); return }
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscKeyDown)
    }
  }, [open, onClose, renewTarget, studentTarget, subCodeTarget])

  // 11）加载认证码列表并规范化布尔字段（loadCodeList）
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setActionError(null)

    void getVerificationCodeList().then((data) => {
      if (cancelled) return
      // 显式转换为 Boolean，防止后端返回 1/0 或字符串导致误判
      setCodes(data.codes.map((c) => ({
        ...c,
        isActive: Boolean(c.isActive),
        isMaster: Boolean(c.isMaster),
        canRenew: Boolean(c.canRenew),
      })))
      setLoading(false)
    }).catch((err) => {
      if (cancelled) return
      setError(err instanceof VerificationApiError ? err.message : '加载认证码列表失败')
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [open])

  // 12）停用认证码（handleInvalidate）
  const handleInvalidate = useCallback(async (code: string) => {
    setActionError(null)
    try {
      await invalidateVerificationCode(code)
      setCodes((prev) => prev.map((c) => (c.code === code ? { ...c, isActive: false } : c)))
    } catch (err) {
      setActionError(err instanceof VerificationApiError ? err.message : '停用失败')
    }
  }, [])

  // 13）延期确认后刷新列表（handleRenewConfirm）
  const handleRenewConfirm = useCallback(() => {
    // 刷新列表以获取最新 expireTime
    void getVerificationCodeList().then((data) => {
      setCodes(data.codes.map((c) => ({
        ...c,
        isActive: Boolean(c.isActive),
        isMaster: Boolean(c.isMaster),
        canRenew: Boolean(c.canRenew),
      })))
    }).catch(() => { /* 静默 */ })
    setRenewTarget(null)
  }, [])

  // 14）关闭弹窗并重置状态（handleClose）
  const handleClose = useCallback(() => {
    setRenewTarget(null)
    setStudentTarget(null)
    setSubCodeTarget(null)
    setActionError(null)
    onClose()
  }, [onClose])

  // 15）遮罩点击关闭处理（handleMaskClick）
  const handleMaskClick = (): void => {
    if (renewTarget || studentTarget || subCodeTarget) return // 子弹窗打开时不关闭主弹窗
    handleClose()
  }

  // 16）弹窗容器阻止冒泡处理（handleContainerClick）
  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="vcm-mask" role="presentation" onClick={handleMaskClick}>
      <section
        className="vcm-card"
        role="dialog"
        aria-modal="true"
        aria-label="认证码管理"
        onClick={handleContainerClick}
      >
        <CloseIconButton className="vcm-card__close" onClick={handleClose} ariaLabel="关闭认证码管理弹窗" />

        {/* 弹窗头部 */}
        <div className="vcm__header">
          <h2>认证码管理</h2>
        </div>

        {actionError ? <div className="vcm__error" role="alert">{actionError}</div> : null}

        {loading ? (
          <div className="vcm__loading">
            <span className="vcm__spinner" aria-hidden="true" />
            加载中…
          </div>
        ) : error ? (
          <div className="vcm__error" role="alert">{error}</div>
        ) : codes.length === 0 ? (
          <div className="vcm__empty">暂无认证码</div>
        ) : (
          /* 认证码列表表格 */
          <div className="vcm__table">
            <div className="vcm__table-header">
              <span className="vcm__col-name">认证码名称</span>
              <span className="vcm__col-code">认证码</span>
              <span className="vcm__col-creator">创建者</span>
              <span className="vcm__col-quota">额度使用</span>
              <span className="vcm__col-status">状态</span>
              <span className="vcm__col-actions">操作</span>
            </div>
            <div className="vcm__table-body">
              {codes.map((item) => {
                const isMaster = item.isMaster
                const isActive = item.isActive
                const quotaPercent = item.maxQuota > 0 ? Math.round((item.usedQuota / item.maxQuota) * 100) : 0
                const status = getStatusDetail(isActive, item.usedQuota, item.maxQuota)
                const isInactive = !isActive
                const showRenew = item.canRenew

                return (
                  <div key={item.code} className={`vcm__row ${isInactive ? 'vcm__row--expired' : ''}`}>
                    {/* 认证码名称 */}
                    <span className="vcm__col-name">
                      {item.description ? (
                        <span className="vcm__name-text" title={item.description}>{item.description}</span>
                      ) : (
                        <span className="vcm__name-null">null</span>
                      )}
                      {isMaster ? (
                        <span className="vcm__tag vcm__tag--master">母码</span>
                      ) : (
                        <span className="vcm__tag vcm__tag--sub">子码</span>
                      )}
                    </span>

                    {/* 认证码 */}
                    <span className="vcm__col-code">
                      <code className="vcm__code-text">{item.code}</code>
                    </span>

                    {/* 创建者 */}
                    <span className="vcm__col-creator">
                      <span className="vcm__creator">{item.createdByName}</span>
                      <span className="vcm__creator-uid">{item.createdBy}</span>
                    </span>

                    {/* 额度使用（进度条） */}
                    <span className="vcm__col-quota">
                      <div className="vcm__progress">
                        <div
                          className={`vcm__progress-bar ${status.cssClass.startsWith('vcm__status--exhausted') ? 'vcm__progress-bar--full' : ''}`}
                          style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                        />
                      </div>
                      <span className="vcm__progress-label">已用 {item.usedQuota} / 总额 {item.maxQuota}</span>
                    </span>

                    {/* 状态 */}
                    <span className="vcm__col-status">
                      <span className={`vcm__status ${status.cssClass}`}>{status.label}</span>
                    </span>

                    {/* 操作栏 */}
                    <span className="vcm__col-actions">
                      {isActive ? (
                        <span className="vcm__action-pair">
                          <button
                            type="button"
                            className="vcm__action-btn vcm__action-btn--danger vcm__action-btn--fill"
                            onClick={() => handleInvalidate(item.code)}
                            title="停用（立即失效）"
                          >
                            <AlertTriangle size={14} aria-hidden="true" />
                            停用
                          </button>
                          {showRenew ? (
                            <button
                              type="button"
                              className="vcm__action-btn vcm__action-btn--fill"
                              onClick={() => setRenewTarget({ code: item.code, expireTime: item.expireTime, createdAt: item.createdAt })}
                              title="延长过期时间"
                            >
                              <RotateCcw size={14} aria-hidden="true" />
                              延期
                            </button>
                          ) : (
                            <span className="vcm__action-btn vcm__action-btn--fill" aria-hidden="true" />
                          )}
                        </span>
                      ) : showRenew ? (
                        <span className="vcm__action-pair">
                          <button
                            type="button"
                            className="vcm__action-btn vcm__action-btn--fill"
                            onClick={() => setRenewTarget({ code: item.code, expireTime: item.expireTime, createdAt: item.createdAt })}
                            title="延长过期时间"
                          >
                            <RotateCcw size={14} aria-hidden="true" />
                            延期
                          </button>
                        </span>
                      ) : (
                        <span className="vcm__action-pair" />
                      )}
                      {isMaster ? (
                        <button
                          type="button"
                          className="vcm__action-btn"
                          onClick={() => setSubCodeTarget(item.code)}
                          title="查看附属子码"
                        >
                          <GitFork size={14} aria-hidden="true" />
                          查看附属子码
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="vcm__action-btn"
                          onClick={() => setStudentTarget(item.code)}
                          title="查看认证学生"
                        >
                          <Users size={14} aria-hidden="true" />
                          查看认证学生
                        </button>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* 子弹窗：延期 */}
      {renewTarget ? (
        <RenewConfirmModal
          code={renewTarget.code}
          currentExpireTime={renewTarget.expireTime}
          createdAt={renewTarget.createdAt}
          onConfirm={handleRenewConfirm}
          onCancel={() => setRenewTarget(null)}
        />
      ) : null}

      {/* 子弹窗：学生列表（仅子码使用） */}
      {studentTarget ? (
        <StudentListModal
          code={studentTarget}
          onClose={() => setStudentTarget(null)}
        />
      ) : null}

      {/* 子弹窗：附属子码列表（仅母码使用） */}
      {subCodeTarget ? (
        <SubCodeListModal
          masterCode={subCodeTarget}
          onClose={() => setSubCodeTarget(null)}
        />
      ) : null}
    </div>,
    document.body,
  )
}
