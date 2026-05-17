import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { hashPassword } from '../../utils/crypto'
import { organizationAuthAccounts, personalAuthAccounts, type OrganizationAuthAccount } from '../../data/authAccounts'
import type {
  AuthModalProps,
  AuthTabType,
  OrganizationLoginStep,
  PersonalLoginMode,
  PersonalPanelView,
  VerificationGuideTab,
} from './types'

// 01）Hook 参数类型定义（UseAuthModalParams）
interface UseAuthModalParams extends AuthModalProps {}

// 02）邮箱后缀校验（isEduCnMailbox）
/**
 * 函数名：isEduCnMailbox
 * 功能：校验输入邮箱是否为 .edu.cn 后缀。
 * 实现方法：
 * - 裁剪空白并转小写
 * - 使用 endsWith 做后缀匹配
 * 输入：
 * - email：邮箱字符串
 * 输出：
 * - 返回值：是否匹配 .edu.cn
 * - 副作用：无
 */
function isEduCnMailbox(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail.endsWith('.edu.cn')
}

// 03）认证弹窗业务状态 Hook（useAuthModal）
/**
 * 函数名：useAuthModal
 * 功能：聚合 AuthModal 的切换、校验、重置等状态与行为。
 * 实现方法：
 * - 管理个人/主体双通道状态
 * - 管理登录注册切换与过渡定时器
 * - 管理账号校验与错误信息
 * 输入：
 * - params：open/onClose/onSuccess
 * 输出：
 * - 返回值：状态与处理函数集合
 * - 副作用：锁定 body 滚动并监听 ESC
 */
export function useAuthModal({ open, onClose, onSuccess }: UseAuthModalParams) {
  const [activeTab, setActiveTab] = useState<AuthTabType>('personal')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showVerificationGuide, setShowVerificationGuide] = useState<boolean>(false)
  const [verificationTab, setVerificationTab] = useState<VerificationGuideTab>('edu-mail')
  const [eduMailbox, setEduMailbox] = useState<string>('')
  const [organizationStep, setOrganizationStep] = useState<OrganizationLoginStep>('credentials')
  const [organizationPasswordDigest, setOrganizationPasswordDigest] = useState<string>('')
  const [matchedOrganizationAccount, setMatchedOrganizationAccount] = useState<OrganizationAuthAccount | null>(null)
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('')

  const [personalPhone, setPersonalPhone] = useState<string>('')
  const [personalCode, setPersonalCode] = useState<string>('')
  const [organizationCode, setOrganizationCode] = useState<string>('')
  const [organizationAccount, setOrganizationAccount] = useState<string>('')
  const [organizationPassword, setOrganizationPassword] = useState<string>('')
  const [organizationOtpCode, setOrganizationOtpCode] = useState<string>('')
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [personalLoginMode, setPersonalLoginMode] = useState<PersonalLoginMode>('password')
  const [personalPanelView, setPersonalPanelView] = useState<PersonalPanelView>('login')
  const [shouldRenderPersonalLoginForm, setShouldRenderPersonalLoginForm] = useState<boolean>(true)
  const [shouldRenderPersonalRegisterForm, setShouldRenderPersonalRegisterForm] = useState<boolean>(false)
  const [registerAccount, setRegisterAccount] = useState<string>('')
  const [registerPassword, setRegisterPassword] = useState<string>('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState<string>('')
  const [registerCode, setRegisterCode] = useState<string>('')
  const [registerHintMessage, setRegisterHintMessage] = useState<string>('')
  const [isPersonalPasswordVisible, setIsPersonalPasswordVisible] = useState<boolean>(false)
  const [isOrganizationPasswordVisible, setIsOrganizationPasswordVisible] = useState<boolean>(false)

  const registerTransitionTimerRef = useRef<number | null>(null)
  const PERSONAL_PANEL_TRANSITION_MS = 360
  const eduMailboxMatched = useMemo<boolean>(() => isEduCnMailbox(eduMailbox), [eduMailbox])

  // 04）页面副作用：锁滚动和 ESC 监听
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

  // 05）页面副作用：关闭时重置
  useEffect(() => {
    if (open) {
      return
    }
    if (registerTransitionTimerRef.current !== null) {
      window.clearTimeout(registerTransitionTimerRef.current)
      registerTransitionTimerRef.current = null
    }
    setPersonalPanelView('login')
    setShouldRenderPersonalLoginForm(true)
    setShouldRenderPersonalRegisterForm(false)
    setPersonalLoginMode('password')
    setRegisterAccount('')
    setRegisterPassword('')
    setRegisterConfirmPassword('')
    setRegisterCode('')
    setRegisterHintMessage('')
    setAuthErrorMessage('')
  }, [open])

  // 06）页面副作用：卸载清理
  useEffect(() => {
    return () => {
      if (registerTransitionTimerRef.current !== null) {
        window.clearTimeout(registerTransitionTimerRef.current)
      }
    }
  }, [])

  // 07）个人登录提交
  const handlePersonalSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!personalPhone.trim() || !personalCode.trim()) {
      setAuthErrorMessage(personalLoginMode === 'password' ? '请输入账号与密码' : '请输入账号与短信验证码')
      return
    }
    const matchedPersonalAccount = personalAuthAccounts.find(
      (account) => account.phone === personalPhone.trim() && account.smsCode === personalCode.trim(),
    )
    if (!matchedPersonalAccount) {
      setAuthErrorMessage('手机号或验证码错误，请检查后重试')
      return
    }
    setAuthErrorMessage('')
    setIsSubmitting(true)
    window.setTimeout(() => {
      setIsSubmitting(false)
      onSuccess?.(matchedPersonalAccount.role, matchedPersonalAccount.authStatus)
      if (matchedPersonalAccount.authStatus === 'unverified') {
        setShowVerificationGuide(true)
      } else {
        onClose()
      }
    }, 450)
  }

  // 08）主体账号密码校验
  const handleOrganizationCredentialsSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!organizationCode.trim() || !organizationAccount.trim() || !organizationPassword.trim()) {
      setAuthErrorMessage('请完整输入机构代码、账号和密码')
      return
    }
    const passwordDigest = hashPassword(organizationPassword.trim())
    const matchedAccount = organizationAuthAccounts.find(
      (account) =>
        account.institutionCode === organizationCode.trim() &&
        account.account === organizationAccount.trim() &&
        account.passwordHash === passwordDigest,
    )
    if (!matchedAccount) {
      setAuthErrorMessage('主体账号信息不匹配，请确认后重试')
      return
    }
    setAuthErrorMessage('')
    setMatchedOrganizationAccount(matchedAccount)
    setOrganizationPasswordDigest(passwordDigest)
    setOrganizationStep('otp')
  }

  // 09）主体 OTP 校验
  const handleOrganizationOtpSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!matchedOrganizationAccount) {
      setAuthErrorMessage('请先完成主体账号密码登录')
      setOrganizationStep('credentials')
      return
    }
    if (!/^\d{6}$/.test(organizationOtpCode.trim())) {
      setAuthErrorMessage('请输入 6 位数字动态验证码')
      return
    }
    if (organizationOtpCode.trim() !== matchedOrganizationAccount.otpCode) {
      setAuthErrorMessage('动态验证码错误，请重试')
      return
    }
    setAuthErrorMessage('')
    onSuccess?.('organization-admin', matchedOrganizationAccount.authStatus)
    setMatchedOrganizationAccount(null)
    setOrganizationStep('credentials')
    onClose()
  }

  // 10）个人通道模式切换
  const handleSwitchToSmsLoginMode = (): void => {
    setPersonalLoginMode('sms')
    setAuthErrorMessage('')
    setPersonalCode('')
  }
  const handleSwitchToPasswordLoginMode = (): void => {
    setPersonalLoginMode('password')
    setAuthErrorMessage('')
    setPersonalCode('')
  }

  // 11）登录/注册视图切换
  const handleSwitchToRegisterForm = (): void => {
    if (personalPanelView === 'register') {
      return
    }
    if (registerTransitionTimerRef.current !== null) {
      window.clearTimeout(registerTransitionTimerRef.current)
    }
    setAuthErrorMessage('')
    setRegisterHintMessage('')
    setShouldRenderPersonalRegisterForm(true)
    window.requestAnimationFrame(() => setPersonalPanelView('register'))
    registerTransitionTimerRef.current = window.setTimeout(() => {
      setShouldRenderPersonalLoginForm(false)
      registerTransitionTimerRef.current = null
    }, PERSONAL_PANEL_TRANSITION_MS)
  }

  const handleSwitchToLoginForm = (): void => {
    if (personalPanelView === 'login') {
      return
    }
    if (registerTransitionTimerRef.current !== null) {
      window.clearTimeout(registerTransitionTimerRef.current)
    }
    setAuthErrorMessage('')
    setShouldRenderPersonalLoginForm(true)
    window.requestAnimationFrame(() => setPersonalPanelView('login'))
    registerTransitionTimerRef.current = window.setTimeout(() => {
      setShouldRenderPersonalRegisterForm(false)
      registerTransitionTimerRef.current = null
    }, PERSONAL_PANEL_TRANSITION_MS)
  }

  // 12）个人注册提交
  const handlePersonalRegisterSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!registerAccount.trim() || !registerPassword.trim() || !registerConfirmPassword.trim() || !registerCode.trim()) {
      setRegisterHintMessage('请完整输入账号、密码、确认密码与验证码')
      return
    }
    if (registerPassword.trim().length < 6) {
      setRegisterHintMessage('密码长度至少 6 位')
      return
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterHintMessage('两次输入的密码不一致，请检查')
      return
    }
    setRegisterHintMessage('注册信息已提交，请返回登录继续')
  }

  // 13）密码可见切换
  const handleTogglePersonalPasswordVisibility = (): void => {
    setIsPersonalPasswordVisible((previousValue) => !previousValue)
  }
  const handleToggleOrganizationPasswordVisibility = (): void => {
    setIsOrganizationPasswordVisible((previousValue) => !previousValue)
  }

  // 14）认证引导返回
  const handleBackToAuthForm = (): void => {
    setShowVerificationGuide(false)
  }

  return {
    activeTab,
    setActiveTab,
    isSubmitting,
    showVerificationGuide,
    verificationTab,
    setVerificationTab,
    eduMailbox,
    setEduMailbox,
    eduMailboxMatched,
    organizationStep,
    organizationPasswordDigest,
    authErrorMessage,
    setAuthErrorMessage,
    personalPhone,
    setPersonalPhone,
    personalCode,
    setPersonalCode,
    organizationCode,
    setOrganizationCode,
    organizationAccount,
    setOrganizationAccount,
    organizationPassword,
    setOrganizationPassword,
    organizationOtpCode,
    setOrganizationOtpCode,
    rememberMe,
    setRememberMe,
    personalLoginMode,
    personalPanelView,
    shouldRenderPersonalLoginForm,
    shouldRenderPersonalRegisterForm,
    registerAccount,
    setRegisterAccount,
    registerPassword,
    setRegisterPassword,
    registerConfirmPassword,
    setRegisterConfirmPassword,
    registerCode,
    setRegisterCode,
    registerHintMessage,
    isPersonalPasswordVisible,
    isOrganizationPasswordVisible,
    handlePersonalSubmit,
    handleOrganizationCredentialsSubmit,
    handleOrganizationOtpSubmit,
    handleSwitchToSmsLoginMode,
    handleSwitchToPasswordLoginMode,
    handleSwitchToRegisterForm,
    handleSwitchToLoginForm,
    handlePersonalRegisterSubmit,
    handleTogglePersonalPasswordVisibility,
    handleToggleOrganizationPasswordVisibility,
    handleBackToAuthForm,
  }
}

export type AuthModalModel = ReturnType<typeof useAuthModal>
