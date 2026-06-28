// 01）主体通道认证 Hook（useOrgAuth）
import { useState, type FormEvent } from 'react'
import { hashPassword } from '../../../shared/lib/crypto'
import { useAuth, type AuthUserProfile } from '../../../shared/hooks/useAuth'
import {
  loginOrganizationByCredentials, loginOrganizationByOtp, selectOrganizationAdmin,
  registerOrganizationAdmin, confirmOrganizationTotpSetup, initOrganizationTotpSetup,
  type OrganizationAdminOption, type OrganizationCredentialChallengeData,
} from '../services/authService'
import { mapAuthApiErrorMessage, ENTITY_TOTP_DEFAULT_QR_EXPIRE_SEC } from '../utils/authHelpers'
import type { OrganizationLoginStep } from '../types/authModalTypes'

interface UseOrgAuthReturn {
  orgStep: OrganizationLoginStep
  orgCode: string; setOrgCode: (v: string) => void
  orgPassword: string; setOrgPassword: (v: string) => void
  isOrgPasswordVisible: boolean
  orgOtpCode: string; setOrgOtpCode: (v: string) => void
  orgChallengeId: string
  orgEntityName: string | null
  orgBoundAdminCount: number; orgMinAdminCount: number; orgMaxAdminCount: number
  orgCurrentAdminOrder: number | null
  orgAdminOptions: OrganizationAdminOption[]
  orgSelectedAdminUid: string; setOrgSelectedAdminUid: (v: string) => void
  orgAdminDisplayName: string; setOrgAdminDisplayName: (v: string) => void
  orgAdminPassword: string; setOrgAdminPassword: (v: string) => void
  isOrgAdminPasswordVisible: boolean
  // TOTP
  totpQrDataUrl: string | null; totpQrCountdownSec: number; totpQrExpireTotalSec: number
  isTotpQrExpired: boolean; isTotpQrLoading: boolean
  totpOtpCode: string; setTotpOtpCode: (v: string) => void
  totpSuccessMessage: string; isTotpBindModalOpen: boolean
  // Handlers
  handleOrgCredentialsSubmit: (e: FormEvent<HTMLFormElement>) => void
  handleOrgOtpSubmit: (e: FormEvent<HTMLFormElement>) => void
  handleOrgAdminSelectSubmit: (e: FormEvent<HTMLFormElement>) => void
  handleOrgAdminRegisterSubmit: (e: FormEvent<HTMLFormElement>) => void
  handleTotpSetupConfirm: (e: FormEvent<HTMLFormElement>) => void
  handleBackFromOrgAdminRegister: () => void
  handleOpenTotpBindModal: () => void
  handleCloseTotpBindModal: () => void
  loadTotpSetupQr: () => void
  resetOrgState: () => void
  toggleOrgPasswordVisibility: () => void
  toggleOrgAdminPasswordVisibility: () => void
}

export function useOrgAuth(
  setAuthErrorMessage: (v: string) => void,
  setIsSubmitting: (v: boolean) => void,
  onSuccess: ((userRole: string, authStatus: string) => void) | undefined,
  onClose: () => void,
): UseOrgAuthReturn {
  const { login: commitAuthLogin } = useAuth()

  const [orgStep, setOrgStep] = useState<OrganizationLoginStep>('credentials')
  const [orgCode, setOrgCode] = useState('')
  const [orgPassword, setOrgPassword] = useState('')
  const [isOrgPasswordVisible, setIsOrgPasswordVisible] = useState(false)
  const [orgOtpCode, setOrgOtpCode] = useState('')
  const [orgChallengeId, setOrgChallengeId] = useState('')
  const [orgEntityName, setOrgEntityName] = useState<string | null>(null)
  const [orgBoundAdminCount, setOrgBoundAdminCount] = useState(0)
  const [orgMinAdminCount, setOrgMinAdminCount] = useState(2)
  const [orgMaxAdminCount, setOrgMaxAdminCount] = useState(3)
  const [orgCurrentAdminOrder, setOrgCurrentAdminOrder] = useState<number | null>(1)
  const [orgAdminOptions, setOrgAdminOptions] = useState<OrganizationAdminOption[]>([])
  const [orgSelectedAdminUid, setOrgSelectedAdminUid] = useState('')
  const [orgRequiresAdminSelectBack, setOrgRequiresAdminSelectBack] = useState(false)
  const [orgAdminDisplayName, setOrgAdminDisplayName] = useState('')
  const [orgAdminPassword, setOrgAdminPassword] = useState('')
  const [isOrgAdminPasswordVisible, setIsOrgAdminPasswordVisible] = useState(false)

  const [totpQrDataUrl, setTotpQrDataUrl] = useState<string | null>(null)
  const [totpQrCountdownSec, setTotpQrCountdownSec] = useState(0)
  const [totpQrExpireTotalSec, setTotpQrExpireTotalSec] = useState(ENTITY_TOTP_DEFAULT_QR_EXPIRE_SEC)
  const [totpOtpCode, setTotpOtpCode] = useState('')
  const [isTotpQrLoading, setIsTotpQrLoading] = useState(false)
  const [totpSuccessMessage, setTotpSuccessMessage] = useState('')
  const [isTotpBindModalOpen, setIsTotpBindModalOpen] = useState(false)
  const isTotpQrExpired = totpQrCountdownSec <= 0 && totpQrDataUrl != null && !isTotpQrLoading

  // ── 构建主体档案 ──
  const buildOrgProfile = (lp: { uid?: string; userRole?: string; authStatus?: string }): AuthUserProfile => ({
    uid: lp.uid || orgSelectedAdminUid || undefined,
    userRole: lp.userRole ?? 'organization-admin',
    authStatus: lp.authStatus,
    entityCode: orgCode.trim(),
    entityName: orgEntityName,
  })

  function applyChallenge(cd: OrganizationCredentialChallengeData): void {
    setOrgChallengeId(cd.challengeId); setOrgEntityName(cd.entityName ?? null)
    setOrgBoundAdminCount(cd.boundAdminCount); setOrgMinAdminCount(cd.minAdminCount)
    setOrgMaxAdminCount(cd.maxAdminCount); setOrgCurrentAdminOrder(cd.currentAdminOrder)
    if (cd.loginMode === 'admin_register') { setOrgStep('admin-register'); return }
    if (cd.loginMode === 'admin_select') {
      setOrgAdminOptions(cd.admins ?? []); setOrgRequiresAdminSelectBack(true)
      setOrgSelectedAdminUid(prev => (prev && (cd.admins ?? []).some(a => a.adminUid === prev)) ? prev : (cd.admins ?? [])[0]?.adminUid ?? '')
      setOrgStep('admin-select'); return
    }
    setOrgAdminOptions([])
    if (cd.loginMode === 'totp_setup') { setOrgStep('totp-setup'); return }
    setOrgStep('otp')
  }

  const resetOrgState = (): void => {
    setOrgStep('credentials'); setOrgOtpCode(''); setOrgChallengeId(''); setOrgEntityName(null)
    setOrgBoundAdminCount(0); setOrgMinAdminCount(2); setOrgMaxAdminCount(3); setOrgCurrentAdminOrder(1)
    setOrgAdminOptions([]); setOrgSelectedAdminUid(''); setOrgRequiresAdminSelectBack(false)
    setOrgAdminDisplayName(''); setOrgAdminPassword(''); setIsOrgAdminPasswordVisible(false)
    setTotpQrDataUrl(null); setTotpQrCountdownSec(0); setTotpOtpCode('')
    setIsTotpQrLoading(false); setTotpSuccessMessage(''); setIsTotpBindModalOpen(false)
    setAuthErrorMessage('')
  }

  // ── 主体凭证 ──
  const handleOrgCredentialsSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); const c = orgCode.trim(); const p = orgPassword.trim()
    if (!c || !p) { setAuthErrorMessage('请完整输入机构代码和密码'); return }
    void (async () => {
      try {
        setAuthErrorMessage(''); setIsSubmitting(true)
        const d = await loginOrganizationByCredentials({ institutionCode: c, password: hashPassword(p) })
        setTotpSuccessMessage(''); setOrgRequiresAdminSelectBack(false); applyChallenge(d)
      } catch (er) { setAuthErrorMessage(mapAuthApiErrorMessage(er, '主体登录失败')) }
      finally { setIsSubmitting(false) }
    })()
  }

  // ── 主体 OTP ──
  const handleOrgOtpSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); const otp = orgOtpCode.trim()
    if (!/^\d{6}$/.test(otp)) { setAuthErrorMessage('请输入6位数字验证码'); return }
    if (!orgChallengeId) { setAuthErrorMessage('登录会话已失效'); return }
    void (async () => {
      try {
        setAuthErrorMessage(''); setIsSubmitting(true)
        const d = await loginOrganizationByOtp({ challengeId: orgChallengeId, otpCode: otp })
        commitAuthLogin({ accessToken: d.accessToken, refreshToken: d.refreshToken, userProfile: buildOrgProfile(d) })
        onSuccess?.(d.userRole, d.authStatus); resetOrgState(); onClose()
        window.location.reload()
      } catch (er) { setAuthErrorMessage(mapAuthApiErrorMessage(er, 'OTP验证失败')) }
      finally { setIsSubmitting(false) }
    })()
  }

  // ── 管理员选择 ──
  const handleOrgAdminSelectSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); if (!orgSelectedAdminUid.trim()) { setAuthErrorMessage('请选择一名管理员'); return }
    if (!orgChallengeId) { setAuthErrorMessage('登录会话已失效'); return }
    void (async () => {
      try {
        setAuthErrorMessage(''); setIsSubmitting(true)
        const d = await selectOrganizationAdmin({ challengeId: orgChallengeId, adminUid: orgSelectedAdminUid.trim() })
        setTotpSuccessMessage(''); applyChallenge(d)
      } catch (er) { setAuthErrorMessage(mapAuthApiErrorMessage(er, '选择管理员失败')) }
      finally { setIsSubmitting(false) }
    })()
  }

  // ── 管理员登记 ──
  const handleOrgAdminRegisterSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); const n = orgAdminDisplayName.trim(); const p = orgAdminPassword.trim()
    if (!n) { setAuthErrorMessage('请填写管理员展示名'); return }
    if (!p) { setAuthErrorMessage('请设置管理员登录密码'); return }
    if (!orgChallengeId) { setAuthErrorMessage('登记会话已失效'); return }
    void (async () => {
      try {
        setAuthErrorMessage(''); setTotpSuccessMessage(''); setIsSubmitting(true)
        const d = await registerOrganizationAdmin({ challengeId: orgChallengeId, displayName: n, password: hashPassword(p) })
        applyChallenge(d)
      } catch (er) { setAuthErrorMessage(mapAuthApiErrorMessage(er, '管理员登记失败')) }
      finally { setIsSubmitting(false) }
    })()
  }

  // ── TOTP 确认 ──
  const handleTotpSetupConfirm = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); const otp = totpOtpCode.trim()
    if (!/^\d{6}$/.test(otp)) { setAuthErrorMessage('请输入6位数字验证码'); return }
    if (!orgChallengeId) { setAuthErrorMessage('绑定会话已失效'); return }
    if (!totpQrDataUrl || isTotpQrExpired) { setAuthErrorMessage('二维码已失效'); return }
    void (async () => {
      try {
        setAuthErrorMessage(''); setTotpSuccessMessage(''); setIsSubmitting(true)
        const d = await confirmOrganizationTotpSetup({ challengeId: orgChallengeId, totpCode: otp })
        if (!d.entityFullyActivated) {
          setOrgBoundAdminCount(d.boundAdminCount); setOrgMinAdminCount(d.minAdminCount)
          if (d.nextChallengeId) setOrgChallengeId(d.nextChallengeId)
          setIsTotpBindModalOpen(false); setTotpQrDataUrl(null); setTotpQrCountdownSec(0)
          setTotpOtpCode(''); setOrgAdminDisplayName(''); setOrgAdminPassword('')
          setOrgCurrentAdminOrder(Math.min(d.boundAdminCount + 1, orgMaxAdminCount))
          setOrgStep('admin-register')
          setTotpSuccessMessage(d.activationHint ?? `第${d.boundAdminCount}位管理员已绑定，请继续登记`)
          setAuthErrorMessage(''); return
        }
        commitAuthLogin({ accessToken: d.accessToken, refreshToken: d.refreshToken, userProfile: buildOrgProfile(d) })
        onSuccess?.(d.userRole, d.authStatus); resetOrgState(); onClose()
        window.location.reload()
      } catch (er) { setAuthErrorMessage(mapAuthApiErrorMessage(er, 'TOTP绑定失败')) }
      finally { setIsSubmitting(false) }
    })()
  }

  // ── TOTP 弹窗 ──
  const handleLoadTotpQr = (): void => {
    if (!orgChallengeId || isTotpQrLoading) return
    void (async () => {
      try {
        setIsTotpQrLoading(true); setAuthErrorMessage(''); setTotpSuccessMessage('')
        const d = await initOrganizationTotpSetup({ challengeId: orgChallengeId })
        setTotpQrDataUrl(d.qrCodeDataUrl); setTotpQrExpireTotalSec(d.qrCodeExpireInSec)
        setTotpQrCountdownSec(d.qrCodeExpireInSec); setOrgBoundAdminCount(d.boundAdminCount)
        setOrgMinAdminCount(d.minAdminCount); setOrgMaxAdminCount(d.maxAdminCount)
        setOrgCurrentAdminOrder(d.currentAdminOrder)
      } catch (er) { setAuthErrorMessage(mapAuthApiErrorMessage(er, '获取二维码失败')); setTotpQrDataUrl(null); setTotpQrCountdownSec(0) }
      finally { setIsTotpQrLoading(false) }
    })()
  }

  return {
    orgStep, orgCode, setOrgCode, orgPassword, setOrgPassword, isOrgPasswordVisible,
    orgOtpCode, setOrgOtpCode, orgChallengeId, orgEntityName,
    orgBoundAdminCount, orgMinAdminCount, orgMaxAdminCount, orgCurrentAdminOrder,
    orgAdminOptions, orgSelectedAdminUid, setOrgSelectedAdminUid,
    orgAdminDisplayName, setOrgAdminDisplayName, orgAdminPassword, setOrgAdminPassword,
    isOrgAdminPasswordVisible,
    totpQrDataUrl, totpQrCountdownSec, totpQrExpireTotalSec, isTotpQrExpired,
    isTotpQrLoading, totpOtpCode, setTotpOtpCode, totpSuccessMessage, isTotpBindModalOpen,
    handleOrgCredentialsSubmit, handleOrgOtpSubmit,
    handleOrgAdminSelectSubmit, handleOrgAdminRegisterSubmit,
    handleTotpSetupConfirm, resetOrgState,
    handleBackFromOrgAdminRegister: () => {
      setAuthErrorMessage(''); setTotpSuccessMessage('')
      if (orgRequiresAdminSelectBack) { setOrgStep('admin-select'); return }
      resetOrgState()
    },
    handleOpenTotpBindModal: () => {
      setAuthErrorMessage(''); setTotpSuccessMessage(''); setTotpOtpCode('')
      setTotpQrDataUrl(null); setTotpQrCountdownSec(0); setIsTotpBindModalOpen(true)
    },
    handleCloseTotpBindModal: () => {
      if (/* isSubmitting */ false) return
      setIsTotpBindModalOpen(false); setTotpOtpCode(''); setTotpQrDataUrl(null)
      setTotpQrCountdownSec(0); setIsTotpQrLoading(false)
      setAuthErrorMessage(''); setTotpSuccessMessage('')
    },
    loadTotpSetupQr: handleLoadTotpQr,
    toggleOrgPasswordVisibility: () => setIsOrgPasswordVisible(v => !v),
    toggleOrgAdminPasswordVisibility: () => setIsOrgAdminPasswordVisible(v => !v),
  }
}
