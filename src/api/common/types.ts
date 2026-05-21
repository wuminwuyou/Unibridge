// 01）通用验证码通道类型定义（CommonCodeChannel）
export type CommonCodeChannel = 'sms' | 'email'

// 02）通用验证码发送请求参数定义（SendVerificationCodeRequest）
export interface SendVerificationCodeRequest {
  account: string
  bizType: 'login' | 'register'
  channel: CommonCodeChannel
  captchaToken?: string
}

// 03）通用验证码发送响应参数定义（SendVerificationCodeData）
export interface SendVerificationCodeData {
  requestId: string
  expireInSec: number
  retryAfterSec: number
}
