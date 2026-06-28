// 01）个人通道认证 Hook（usePersonalAuth）
import { useState, type FormEvent } from 'react'
import { hashPassword } from '../../../shared/lib/crypto'
import { useAuth } from '../../../shared/hooks/useAuth'
import { loginPersonalByPassword, loginPersonalBySms, registerPersonalAccount } from '../services/authService'
import { sendVerificationCode } from '../services/smsService'
import { getCachedPersonalAccount, resolveChannelByAccount, mapAuthApiErrorMessage, normalizeRetryAfterSec } from '../utils/authHelpers'
import type { PersonalLoginMode, PersonalPanelView } from '../types/authModalTypes'

interface UsePersonalAuthReturn {
  // State
  personalPhone: string
  personalCode: string
  rememberMe: boolean
  personalLoginMode: PersonalLoginMode
  personalPanelView: PersonalPanelView
  showPersonalLogin: boolean
  showPersonalRegister: boolean
  isPersonalPasswordVisible: boolean
  isSendingPersonalLoginCode: boolean
  personalLoginCodeCooldownSec: number
  // Register state
  registerAccount: string
  registerPassword: string
  registerConfirmPassword: string
  registerCode: string
  registerHintMessage: string
  isSendingRegisterCode: boolean
  registerCodeCooldownSec: number
  // Handlers
  setPersonalPhone: (v: string) => void
  setPersonalCode: (v: string) => void
  setRememberMe: (v: boolean) => void
  setRegisterAccount: (v: string) => void
  setRegisterPassword: (v: string) => void
  setRegisterConfirmPassword: (v: string) => void
  setRegisterCode: (v: string) => void
  handleSendPersonalLoginCode: () => void
  handlePersonalSubmit: (e: FormEvent<HTMLFormElement>) => void
  handleSendRegisterCode: () => void
  handlePersonalRegisterSubmit: (e: FormEvent<HTMLFormElement>) => void
  switchToSms: () => void
  switchToPassword: () => void
  switchToRegister: () => void
  switchToLogin: () => void
  togglePersonalPasswordVisibility: () => void
}

export function usePersonalAuth(
  setAuthErrorMessage: (v: string) => void,
  setIsSubmitting: (v: boolean) => void,
  onSuccess: ((userRole: string, authStatus: string) => void) | undefined,
  onClose: () => void,
): UsePersonalAuthReturn {
  const { login: commitAuthLogin } = useAuth()
  const cached = getCachedPersonalAccount()

  // State
  const [personalPhone, setPersonalPhone] = useState(cached)
  const [personalCode, setPersonalCode] = useState('')
  const [rememberMe, setRememberMe] = useState(cached.length > 0)
  const [personalLoginMode, setPersonalLoginMode] = useState<PersonalLoginMode>('password')
  const [personalPanelView, setPersonalPanelView] = useState<PersonalPanelView>('login')
  const [showPersonalLogin, setShowPersonalLogin] = useState(true)
  const [showPersonalRegister, setShowPersonalRegister] = useState(false)
  const [isPersonalPasswordVisible, setIsPersonalPasswordVisible] = useState(false)
  const [isSendingPersonalLoginCode, setIsSendingPersonalLoginCode] = useState(false)
  const [personalLoginCodeCooldownSec, setPersonalLoginCodeCooldownSec] = useState(0)

  // Register state
  const [registerAccount, setRegisterAccount] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [registerCode, setRegisterCode] = useState('')
  const [registerHintMessage, setRegisterHintMessage] = useState('')
  const [isSendingRegisterCode, setIsSendingRegisterCode] = useState(false)
  const [registerCodeCooldownSec, setRegisterCodeCooldownSec] = useState(0)

  // ── 发送登录验证码 ──
  const handleSendPersonalLoginCode = (): void => {
    const phone = personalPhone.trim()
    if (!phone) { setAuthErrorMessage('请输入账号'); return }
    if (isSendingPersonalLoginCode || personalLoginCodeCooldownSec > 0) return
    void (async () => {
      try {
        setIsSendingPersonalLoginCode(true); setAuthErrorMessage('')
        const channel = resolveChannelByAccount(phone)
        const res = await sendVerificationCode({ account: phone, bizType: 'login', channel })
        setPersonalLoginCodeCooldownSec(normalizeRetryAfterSec(res.retryAfterSec))
      } catch (e) { setAuthErrorMessage(mapAuthApiErrorMessage(e, '验证码发送失败')) }
      finally { setIsSendingPersonalLoginCode(false) }
    })()
  }

  // ── 个人登录提交 ──
  const handlePersonalSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    const phone = personalPhone.trim(); const code = personalCode.trim()
    if (!phone || !code) { setAuthErrorMessage(personalLoginMode === 'password' ? '请输入账号与密码' : '请输入账号与验证码'); return }
    void (async () => {
      try {
        setAuthErrorMessage(''); setIsSubmitting(true)
        const channel = resolveChannelByAccount(phone)
        const data = personalLoginMode === 'password'
          ? await loginPersonalByPassword({ account: phone, password: hashPassword(code), rememberMe, channel })
          : await loginPersonalBySms({ account: phone, smsCode: code, rememberMe })
        commitAuthLogin({ accessToken: data.accessToken, refreshToken: data.refreshToken, userProfile: { uid: data.uid, userRole: data.userRole, authStatus: data.authStatus, avatarUrl: data.avatarUrl ?? null } })
        onSuccess?.(data.userRole, data.authStatus); onClose()
        window.location.reload()
      } catch (e) { setAuthErrorMessage(mapAuthApiErrorMessage(e, '登录失败')) }
      finally { setIsSubmitting(false) }
    })()
  }

  // ── 发送注册验证码 ──
  const handleSendRegisterCode = (): void => {
    const account = registerAccount.trim()
    if (!account) { setRegisterHintMessage('请输入注册账号'); return }
    if (isSendingRegisterCode || registerCodeCooldownSec > 0) return
    void (async () => {
      try {
        setIsSendingRegisterCode(true); setRegisterHintMessage('')
        const channel = resolveChannelByAccount(account)
        const res = await sendVerificationCode({ account, bizType: 'register', channel })
        setRegisterHintMessage('验证码已发送'); setRegisterCodeCooldownSec(normalizeRetryAfterSec(res.retryAfterSec))
      } catch (e) { setRegisterHintMessage(mapAuthApiErrorMessage(e, '验证码发送失败')) }
      finally { setIsSendingRegisterCode(false) }
    })()
  }

  // ── 个人注册提交 ──
  const handlePersonalRegisterSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    const a = registerAccount.trim(); const p = registerPassword.trim()
    const cp = registerConfirmPassword.trim(); const vc = registerCode.trim()
    if (!a || !p || !cp || !vc) { setRegisterHintMessage('请完整输入注册信息'); return }
    if (p.length < 6) { setRegisterHintMessage('密码长度至少6位'); return }
    if (p !== cp) { setRegisterHintMessage('两次输入的密码不一致'); return }
    void (async () => {
      try {
        setRegisterHintMessage(''); setAuthErrorMessage(''); setIsSubmitting(true)
        const channel = resolveChannelByAccount(a)
        const data = await registerPersonalAccount({ account: a, password: hashPassword(p), confirmPassword: hashPassword(cp), verifyCode: vc, channel })
        commitAuthLogin({ accessToken: data.accessToken, refreshToken: data.refreshToken, userProfile: { uid: data.uid, userRole: data.userRole, authStatus: data.authStatus, avatarUrl: data.avatarUrl ?? null } })
        onSuccess?.(data.userRole, data.authStatus); onClose()
        window.location.reload()
      } catch (e) { setRegisterHintMessage(mapAuthApiErrorMessage(e, '注册失败')) }
      finally { setIsSubmitting(false) }
    })()
  }

  return {
    personalPhone, setPersonalPhone, personalCode, setPersonalCode, rememberMe, setRememberMe,
    personalLoginMode, personalPanelView, showPersonalLogin, showPersonalRegister,
    isPersonalPasswordVisible, isSendingPersonalLoginCode, personalLoginCodeCooldownSec,
    registerAccount, setRegisterAccount, registerPassword, setRegisterPassword,
    registerConfirmPassword, setRegisterConfirmPassword, registerCode, setRegisterCode,
    registerHintMessage, isSendingRegisterCode, registerCodeCooldownSec,
    handleSendPersonalLoginCode, handlePersonalSubmit, handleSendRegisterCode, handlePersonalRegisterSubmit,
    switchToSms: () => { setPersonalLoginMode('sms'); setAuthErrorMessage(''); setPersonalCode('') },
    switchToPassword: () => { setPersonalLoginMode('password'); setAuthErrorMessage(''); setPersonalCode('') },
    switchToRegister: () => { setAuthErrorMessage(''); setRegisterHintMessage(''); setShowPersonalRegister(true); setPersonalPanelView('register') },
    switchToLogin: () => { setAuthErrorMessage(''); setShowPersonalLogin(true); setPersonalPanelView('login') },
    togglePersonalPasswordVisibility: () => setIsPersonalPasswordVisible(v => !v),
  }
}
