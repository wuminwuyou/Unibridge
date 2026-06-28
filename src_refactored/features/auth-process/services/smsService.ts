// 01）验证码下发服务（SMS/Email）
import { HttpApiError, postApi } from '../../../shared/api/http'

export class CommonApiError extends HttpApiError {}

export type CommonCodeChannel = 'sms' | 'email'

export interface SendVerificationCodeRequest { account: string; bizType: 'login' | 'register'; channel: CommonCodeChannel; captchaToken?: string }

export interface SendVerificationCodeData { requestId: string; expireInSec: number; retryAfterSec: number }

export async function sendVerificationCode(payload: SendVerificationCodeRequest): Promise<SendVerificationCodeData> {
  try { return await postApi<SendVerificationCodeRequest, SendVerificationCodeData>('/auth/personal/sms/send', payload) }
  catch (e) { if (e instanceof HttpApiError) throw new CommonApiError(e.code, e.message); throw e }
}
