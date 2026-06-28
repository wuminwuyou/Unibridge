// 01）认证弹窗工具函数与常量
import { AuthApiError } from '../services/authService'
import { CommonApiError } from '../services/smsService'
import type { AuthChannel } from '../services/authService'

export const PERSONAL_ACCOUNT_CACHE_KEY = 'rememberedPersonalAccount'
export const ENTITY_TOTP_DEFAULT_QR_EXPIRE_SEC = 300

export function getCachedPersonalAccount(): string { return window.localStorage.getItem(PERSONAL_ACCOUNT_CACHE_KEY) ?? '' }

export function syncPersonalAccountCache(account: string, rememberMe: boolean): void { const a = account.trim(); if (rememberMe && a) window.localStorage.setItem(PERSONAL_ACCOUNT_CACHE_KEY, a); else window.localStorage.removeItem(PERSONAL_ACCOUNT_CACHE_KEY) }

export function resolveChannelByAccount(account: string): AuthChannel { return account.includes('@') ? 'email' : 'sms' }

export function mapAuthApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof AuthApiError) && !(error instanceof CommonApiError)) return fallback
  const msg = (error as AuthApiError).message
  if (msg === 'ACCOUNT_OR_PASSWORD_INVALID' || msg === 'SMS_CODE_INVALID') return '手机号或验证码错误，请检查后重试'
  if (msg === 'ORGANIZATION_CREDENTIAL_INVALID') return '主体账号信息不匹配，请确认后重试'
  if (msg === 'OTP_INVALID') return '动态验证码错误，请重试'
  if (msg === 'ACCOUNT_ALREADY_EXISTS') return '该账号已注册，请直接登录'
  if (msg === 'INVALID_VERIFY_CODE' || msg === 'VERIFY_CODE_EXPIRED') return '验证码无效或已过期，请重新获取'
  if (msg === 'WEAK_PASSWORD') return '密码强度不足，请更换更复杂的密码'
  if (msg === 'PASSWORD_NOT_MATCH') return '两次输入的密码不一致，请检查'
  return msg || fallback
}

export function normalizeRetryAfterSec(sec: number): number { return Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 60 }
