import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  AuthApiError,
  loginOrganizationByCredentials,
  loginOrganizationByOtp,
  loginPersonalByPassword,
  loginPersonalBySms,
  registerPersonalAccount,
  type AuthChannel,
} from '../../api/Auth'
import { CommonApiError, sendVerificationCode } from '../../api/common'
import { useAuth } from '../../contexts/AuthContext'
import { hashPassword } from '../../utils/crypto'
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

// 02）个人账号缓存键常量（PERSONAL_ACCOUNT_CACHE_KEY）
const PERSONAL_ACCOUNT_CACHE_KEY = 'rememberedPersonalAccount'

// 03）读取缓存的个人账号（getCachedPersonalAccount）
/**
 * 函数名：getCachedPersonalAccount
 * 功能：从本地存储读取“记住我”缓存的个人登录账号。
 * 实现方法：
 * - 从 localStorage 固定键读取账号
 * - 若不存在则返回空字符串
 * 输入：无
 * 输出：
 * - 返回值：缓存账号字符串
 * - 副作用：读取 localStorage
 */
function getCachedPersonalAccount(): string {
  return window.localStorage.getItem(PERSONAL_ACCOUNT_CACHE_KEY) ?? ''
}

// 04）根据记住我设置同步个人账号缓存（syncPersonalAccountCache）
/**
 * 函数名：syncPersonalAccountCache
 * 功能：根据“记住我”状态同步个人账号缓存（仅账号，不保存密码）。
 * 实现方法：
 * - rememberMe=true 且账号非空：写入缓存
 * - 其他情况：移除缓存键
 * 输入：
 * - account：当前账号输入值
 * - rememberMe：是否勾选记住我
 * 输出：
 * - 返回值：void
 * - 副作用：写入或删除 localStorage
 */
function syncPersonalAccountCache(account: string, rememberMe: boolean): void {
  const normalizedAccount = account.trim()
  if (rememberMe && normalizedAccount) {
    window.localStorage.setItem(PERSONAL_ACCOUNT_CACHE_KEY, normalizedAccount)
    return
  }
  window.localStorage.removeItem(PERSONAL_ACCOUNT_CACHE_KEY)
}

// 05）邮箱后缀校验（isEduCnMailbox）
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

// 06）账号通道推断（resolveChannelByAccount）
/**
 * 函数名：resolveChannelByAccount
 * 功能：根据个人账号内容推断验证码/登录通道类型。
 * 实现方法：
 * - 识别邮箱格式时返回 email
 * - 其他情况默认返回 sms
 * 输入：
 * - account：个人账号（手机号或邮箱）
 * 输出：
 * - 返回值：AuthChannel（sms 或 email）
 * - 副作用：无
 */
function resolveChannelByAccount(account: string): AuthChannel {
  return account.includes('@') ? 'email' : 'sms'
}

// 07）认证错误文案映射（mapAuthApiErrorMessage）
/**
 * 函数名：mapAuthApiErrorMessage
 * 功能：将后端认证错误码映射为前端可读文案。
 * 实现方法：
 * - 识别 AuthApiError.code 并返回约定中文提示
 * - 对未知错误返回默认兜底文案
 * 输入：
 * - error：请求层抛出的异常
 * - fallbackMessage：默认兜底文案
 * 输出：
 * - 返回值：可展示给用户的错误提示
 * - 副作用：无
 */
function mapAuthApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof AuthApiError) && !(error instanceof CommonApiError)) {
    return fallbackMessage
  }

  switch (error.message) {
    case 'ACCOUNT_OR_PASSWORD_INVALID':
    case 'SMS_CODE_INVALID':
      return '手机号或验证码错误，请检查后重试'
    case 'ORGANIZATION_CREDENTIAL_INVALID':
      return '主体账号信息不匹配，请确认后重试'
    case 'OTP_INVALID':
      return '动态验证码错误，请重试'
    case 'OTP_FORMAT_INVALID':
      return '请输入 6 位数字动态验证码'
    case 'ORGANIZATION_FIELDS_REQUIRED':
      return '服务端校验未通过：缺少机构代码或登录凭证字段（请联系后端核对请求体字段名）'
    case 'ACCOUNT_ALREADY_EXISTS':
      return '该账号已注册，请直接登录'
    case 'INVALID_VERIFY_CODE':
    case 'VERIFY_CODE_EXPIRED':
      return '验证码无效或已过期，请重新获取'
    case 'WEAK_PASSWORD':
      return '密码强度不足，请更换更复杂的密码'
    case 'PASSWORD_NOT_MATCH':
      return '两次输入的密码不一致，请检查'
    default:
      return error.message || fallbackMessage
  }
}

// 08）验证码重发冷却时间归一化（normalizeRetryAfterSec）
/**
 * 函数名：normalizeRetryAfterSec
 * 功能：将验证码接口返回的重试秒数转换为可用的倒计时秒数。
 * 实现方法：
 * - 当 retryAfterSec 为正整数时直接使用
 * - 其他场景回退为默认 60 秒
 * 输入：
 * - retryAfterSec：接口返回的重发冷却秒数
 * 输出：
 * - 返回值：前端倒计时秒数
 * - 副作用：无
 */
function normalizeRetryAfterSec(retryAfterSec: number): number {
  return Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? Math.floor(retryAfterSec) : 60
}

// 09）认证弹窗业务状态 Hook（useAuthModal）
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
  const { login: commitAuthLogin } = useAuth()
  const cachedPersonalAccount = getCachedPersonalAccount()
  const [activeTab, setActiveTab] = useState<AuthTabType>('personal')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showVerificationGuide, setShowVerificationGuide] = useState<boolean>(false)
  const [verificationTab, setVerificationTab] = useState<VerificationGuideTab>('edu-mail')
  const [eduMailbox, setEduMailbox] = useState<string>('')
  const [organizationStep, setOrganizationStep] = useState<OrganizationLoginStep>('credentials')
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('')

  const [personalPhone, setPersonalPhone] = useState<string>(cachedPersonalAccount)
  const [personalCode, setPersonalCode] = useState<string>('')
  const [organizationCode, setOrganizationCode] = useState<string>('')
  const [organizationPassword, setOrganizationPassword] = useState<string>('')
  const [organizationOtpCode, setOrganizationOtpCode] = useState<string>('')
  const [organizationChallengeId, setOrganizationChallengeId] = useState<string>('')
  const [rememberMe, setRememberMe] = useState<boolean>(cachedPersonalAccount.length > 0)
  const [personalLoginMode, setPersonalLoginMode] = useState<PersonalLoginMode>('password')
  const [personalPanelView, setPersonalPanelView] = useState<PersonalPanelView>('login')
  const [shouldRenderPersonalLoginForm, setShouldRenderPersonalLoginForm] = useState<boolean>(true)
  const [shouldRenderPersonalRegisterForm, setShouldRenderPersonalRegisterForm] = useState<boolean>(false)
  const [registerAccount, setRegisterAccount] = useState<string>('')
  const [registerPassword, setRegisterPassword] = useState<string>('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState<string>('')
  const [registerCode, setRegisterCode] = useState<string>('')
  const [registerHintMessage, setRegisterHintMessage] = useState<string>('')
  const [isSendingPersonalLoginCode, setIsSendingPersonalLoginCode] = useState<boolean>(false)
  const [isSendingRegisterCode, setIsSendingRegisterCode] = useState<boolean>(false)
  const [personalLoginCodeCooldownSec, setPersonalLoginCodeCooldownSec] = useState<number>(0)
  const [registerCodeCooldownSec, setRegisterCodeCooldownSec] = useState<number>(0)
  const [isPersonalPasswordVisible, setIsPersonalPasswordVisible] = useState<boolean>(false)
  const [isOrganizationPasswordVisible, setIsOrganizationPasswordVisible] = useState<boolean>(false)

  const registerTransitionTimerRef = useRef<number | null>(null)
  const PERSONAL_PANEL_TRANSITION_MS = 360
  const eduMailboxMatched = useMemo<boolean>(() => isEduCnMailbox(eduMailbox), [eduMailbox])

  // 10）页面副作用：锁滚动和 ESC 监听
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

  // 11）页面副作用：关闭时重置
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
    setShowVerificationGuide(false)
    setVerificationTab('edu-mail')
    setEduMailbox('')
    setPersonalLoginMode('password')
    setPersonalPhone(rememberMe ? getCachedPersonalAccount() : '')
    setPersonalCode('')
    setRegisterAccount('')
    setRegisterPassword('')
    setRegisterConfirmPassword('')
    setRegisterCode('')
    setRegisterHintMessage('')
    setIsSendingPersonalLoginCode(false)
    setIsSendingRegisterCode(false)
    setPersonalLoginCodeCooldownSec(0)
    setRegisterCodeCooldownSec(0)
    setAuthErrorMessage('')
    setOrganizationChallengeId('')
  }, [open])

  // 12）页面副作用：个人账号缓存同步
  useEffect(() => {
    syncPersonalAccountCache(personalPhone, rememberMe)
  }, [personalPhone, rememberMe])

  // 13）页面副作用：登录验证码倒计时
  useEffect(() => {
    if (personalLoginCodeCooldownSec <= 0) {
      return undefined
    }
    const countdownTimerId = window.setInterval(() => {
      setPersonalLoginCodeCooldownSec((previousValue) => Math.max(previousValue - 1, 0))
    }, 1000)
    return () => {
      window.clearInterval(countdownTimerId)
    }
  }, [personalLoginCodeCooldownSec])

  // 14）页面副作用：注册验证码倒计时
  useEffect(() => {
    if (registerCodeCooldownSec <= 0) {
      return undefined
    }
    const countdownTimerId = window.setInterval(() => {
      setRegisterCodeCooldownSec((previousValue) => Math.max(previousValue - 1, 0))
    }, 1000)
    return () => {
      window.clearInterval(countdownTimerId)
    }
  }, [registerCodeCooldownSec])

  // 15）页面副作用：卸载清理
  useEffect(() => {
    return () => {
      if (registerTransitionTimerRef.current !== null) {
        window.clearTimeout(registerTransitionTimerRef.current)
      }
    }
  }, [])

  // 16）登录验证码发送（handleSendPersonalLoginCode）
  /**
   * 函数名：handleSendPersonalLoginCode
   * 功能：处理个人登录场景“获取验证码”点击并调用验证码接口。
   * 实现方法：
   * - 校验账号必填并推断短信/邮箱通道
   * - 调用通用验证码发送接口（bizType=login）
   * - 成功后按 retryAfterSec 启动重发倒计时
   * 输入：无
   * 输出：
   * - 返回值：void
   * - 副作用：发起网络请求并更新错误提示、发送状态与倒计时
   */
  const handleSendPersonalLoginCode = (): void => {
    const normalizedAccount = personalPhone.trim()
    if (!normalizedAccount) {
      setAuthErrorMessage('请输入账号后再获取验证码')
      return
    }
    if (isSendingPersonalLoginCode || personalLoginCodeCooldownSec > 0) {
      return
    }

    void (async () => {
      try {
        setIsSendingPersonalLoginCode(true)
        setAuthErrorMessage('')
        const sendCodeData = await sendVerificationCode({
          account: normalizedAccount,
          bizType: 'login',
          channel: resolveChannelByAccount(normalizedAccount),
        })
        setPersonalLoginCodeCooldownSec(normalizeRetryAfterSec(sendCodeData.retryAfterSec))
      } catch (error) {
        setAuthErrorMessage(mapAuthApiErrorMessage(error, '验证码发送失败，请稍后重试'))
      } finally {
        setIsSendingPersonalLoginCode(false)
      }
    })()
  }

  // 17）注册验证码发送（handleSendRegisterCode）
  /**
   * 函数名：handleSendRegisterCode
   * 功能：处理个人注册场景“获取验证码”点击并调用验证码接口。
   * 实现方法：
   * - 校验注册账号必填并推断短信/邮箱通道
   * - 调用通用验证码发送接口（bizType=register）
   * - 成功后按 retryAfterSec 启动重发倒计时并提示已发送
   * 输入：无
   * 输出：
   * - 返回值：void
   * - 副作用：发起网络请求并更新提示、发送状态与倒计时
   */
  const handleSendRegisterCode = (): void => {
    const normalizedAccount = registerAccount.trim()
    if (!normalizedAccount) {
      setRegisterHintMessage('请输入注册账号后再获取验证码')
      return
    }
    if (isSendingRegisterCode || registerCodeCooldownSec > 0) {
      return
    }

    void (async () => {
      try {
        setIsSendingRegisterCode(true)
        setRegisterHintMessage('')
        const sendCodeData = await sendVerificationCode({
          account: normalizedAccount,
          bizType: 'register',
          channel: resolveChannelByAccount(normalizedAccount),
        })
        setRegisterHintMessage('验证码已发送，请注意查收')
        setRegisterCodeCooldownSec(normalizeRetryAfterSec(sendCodeData.retryAfterSec))
      } catch (error) {
        setRegisterHintMessage(mapAuthApiErrorMessage(error, '验证码发送失败，请稍后重试'))
      } finally {
        setIsSendingRegisterCode(false)
      }
    })()
  }

  // 18）个人登录提交（handlePersonalSubmit）
  /**
   * 函数名：handlePersonalSubmit
   * 功能：处理个人通道登录提交，并按密码/短信模式调用对应接口。
   * 实现方法：
   * - 校验账号与凭证必填
   * - 密码模式执行 SHA256 后调用密码登录；短信模式调用短信登录
   * - 成功后按 authStatus 决定关闭弹窗或进入认证引导
   * 输入：
   * - event：React 表单提交事件
   * 输出：
   * - 返回值：void
   * - 副作用：更新提交状态、错误提示、认证引导显隐
   */
  const handlePersonalSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const normalizedAccount = personalPhone.trim()
    const normalizedCredential = personalCode.trim()

    if (!normalizedAccount || !normalizedCredential) {
      setAuthErrorMessage(personalLoginMode === 'password' ? '请输入账号与密码' : '请输入账号与验证码')
      return
    }

    void (async () => {
      try {
        setAuthErrorMessage('')
        setIsSubmitting(true)

        const loginData =
          personalLoginMode === 'password'
            ? await loginPersonalByPassword({
                account: normalizedAccount,
                password: hashPassword(normalizedCredential),
                rememberMe,
                channel: resolveChannelByAccount(normalizedAccount),
              })
            : await loginPersonalBySms({
                account: normalizedAccount,
                smsCode: normalizedCredential,
                rememberMe,
              })

        commitAuthLogin({
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken,
          userProfile: {
            userId: loginData.userId,
            userRole: loginData.userRole,
            authStatus: loginData.authStatus,
          },
        })
        onSuccess?.(loginData.userRole, loginData.authStatus)
        onClose()
      } catch (error) {
        setAuthErrorMessage(mapAuthApiErrorMessage(error, '登录失败，请稍后重试'))
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  // 19）主体第一步提交（handleOrganizationCredentialsSubmit）
  /**
   * 函数名：handleOrganizationCredentialsSubmit
   * 功能：处理主体登录第一步，校验并提交机构代码与登录凭证。
   * 实现方法：
   * - 校验机构代码与密码必填
   * - 密码做 SHA256 后调用主体凭证登录接口
   * - 保存 challengeId 并进入 OTP 阶段
   * 输入：
   * - event：React 表单提交事件
   * 输出：
   * - 返回值：void
   * - 副作用：更新主体步骤、错误提示与挑战 ID
   */
  const handleOrganizationCredentialsSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const normalizedInstitutionCode = organizationCode.trim()
    const normalizedPassword = organizationPassword.trim()

    if (!normalizedInstitutionCode || !normalizedPassword) {
      setAuthErrorMessage('请完整输入机构代码和密码')
      return
    }

    void (async () => {
      try {
        setAuthErrorMessage('')
        setIsSubmitting(true)

        const challengeData = await loginOrganizationByCredentials({
          institutionCode: normalizedInstitutionCode,
          password: hashPassword(normalizedPassword),
        })
        setOrganizationChallengeId(challengeData.challengeId)
        setOrganizationStep('otp')
      } catch (error) {
        if (error instanceof AuthApiError) {
          console.warn('[OrganizationLogin] 后端返回错误：', {
            code: error.code,
            message: error.message,
            requestPayload: { institutionCode: normalizedInstitutionCode, passwordLength: normalizedPassword.length },
          })
        }
        setAuthErrorMessage(mapAuthApiErrorMessage(error, '主体登录失败，请稍后重试'))
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  // 20）主体 TOTP 校验（handleOrganizationOtpSubmit）
  /**
   * 函数名：handleOrganizationOtpSubmit
   * 功能：处理主体登录第二步 OTP 校验并完成登录。
   * 实现方法：
   * - 校验 OTP 为 6 位数字且 challengeId 存在
   * - 调用 OTP 登录接口换取最终 token
   * - 成功后回调 onSuccess 并关闭弹窗
   * 输入：
   * - event：React 表单提交事件
   * 输出：
   * - 返回值：void
   * - 副作用：更新提交状态、重置主体登录步骤与 OTP 输入
   */
  const handleOrganizationOtpSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!/^\d{6}$/.test(organizationOtpCode.trim())) {
      setAuthErrorMessage('请输入 6 位数字 TOTP 验证码')
      return
    }
    if (!organizationChallengeId) {
      setAuthErrorMessage('登录会话已失效，请返回上一步重新校验凭证')
      return
    }

    void (async () => {
      try {
        setAuthErrorMessage('')
        setIsSubmitting(true)
        const loginData = await loginOrganizationByOtp({
          challengeId: organizationChallengeId,
          otpCode: organizationOtpCode.trim(),
        })
        commitAuthLogin({
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken,
          userProfile: {
            userId: loginData.userId,
            userRole: loginData.userRole,
            authStatus: loginData.authStatus,
          },
        })
        onSuccess?.(loginData.userRole, loginData.authStatus)
        setOrganizationStep('credentials')
        setOrganizationOtpCode('')
        setOrganizationChallengeId('')
        onClose()
      } catch (error) {
        setAuthErrorMessage(mapAuthApiErrorMessage(error, 'OTP 验证失败，请稍后重试'))
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  // 21）主体 OTP 表单回退处理函数（handleBackToOrganizationCredentials）
  /**
   * 函数名：handleBackToOrganizationCredentials
   * 功能：从 TOTP 验证表单返回主体凭证输入表单。
   * 实现方法：
   * - 将主体步骤重置为 credentials
   * - 清空 TOTP 输入与错误提示，避免回退后残留状态
   * 输入：无
   * 输出：
   * - 返回值：void
   * - 副作用：更新组件状态
   */
  const handleBackToOrganizationCredentials = (): void => {
    setOrganizationStep('credentials')
    setOrganizationOtpCode('')
    setOrganizationChallengeId('')
    setAuthErrorMessage('')
  }

  // 22）个人通道模式切换
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

  // 23）登录/注册视图切换
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

  // 24）个人注册提交（handlePersonalRegisterSubmit）
  /**
   * 函数名：handlePersonalRegisterSubmit
   * 功能：处理个人注册提交，调用注册接口并反馈注册结果。
   * 实现方法：
   * - 执行必填、密码长度与一致性校验
   * - 对密码做 SHA256 后调用注册接口
   * - 成功时同步登录态并切换到认证引导或关闭弹窗
   * 输入：
   * - event：React 表单提交事件
   * 输出：
   * - 返回值：void
   * - 副作用：更新提交状态、提示文案与认证引导显隐
   */
  const handlePersonalRegisterSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const normalizedAccount = registerAccount.trim()
    const normalizedPassword = registerPassword.trim()
    const normalizedConfirmPassword = registerConfirmPassword.trim()
    const normalizedVerifyCode = registerCode.trim()

    if (!normalizedAccount || !normalizedPassword || !normalizedConfirmPassword || !normalizedVerifyCode) {
      setRegisterHintMessage('请完整输入账号、密码、确认密码与验证码')
      return
    }
    if (normalizedPassword.length < 6) {
      setRegisterHintMessage('密码长度至少 6 位')
      return
    }
    if (normalizedPassword !== normalizedConfirmPassword) {
      setRegisterHintMessage('两次输入的密码不一致，请检查')
      return
    }

    void (async () => {
      try {
        setRegisterHintMessage('')
        setAuthErrorMessage('')
        setIsSubmitting(true)
        const hashedPassword = hashPassword(normalizedPassword)
        const registerData = await registerPersonalAccount({
          account: normalizedAccount,
          password: hashedPassword,
          confirmPassword: hashPassword(normalizedConfirmPassword),
          verifyCode: normalizedVerifyCode,
          channel: resolveChannelByAccount(normalizedAccount),
        })
        commitAuthLogin({
          accessToken: registerData.accessToken,
          refreshToken: registerData.refreshToken,
          userProfile: {
            userId: registerData.userId,
            userRole: registerData.userRole,
            authStatus: registerData.authStatus,
          },
        })
        onSuccess?.(registerData.userRole, registerData.authStatus)
        onClose()
      } catch (error) {
        setRegisterHintMessage(mapAuthApiErrorMessage(error, '注册失败，请稍后重试'))
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  // 25）密码可见切换
  const handleTogglePersonalPasswordVisibility = (): void => {
    setIsPersonalPasswordVisible((previousValue) => !previousValue)
  }
  const handleToggleOrganizationPasswordVisibility = (): void => {
    setIsOrganizationPasswordVisible((previousValue) => !previousValue)
  }

  // 26）认证引导返回
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
    authErrorMessage,
    setAuthErrorMessage,
    personalPhone,
    setPersonalPhone,
    personalCode,
    setPersonalCode,
    organizationCode,
    setOrganizationCode,
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
    isSendingPersonalLoginCode,
    isSendingRegisterCode,
    personalLoginCodeCooldownSec,
    registerCodeCooldownSec,
    isPersonalPasswordVisible,
    isOrganizationPasswordVisible,
    handleSendPersonalLoginCode,
    handleSendRegisterCode,
    handlePersonalSubmit,
    handleOrganizationCredentialsSubmit,
    handleOrganizationOtpSubmit,
    handleBackToOrganizationCredentials,
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
