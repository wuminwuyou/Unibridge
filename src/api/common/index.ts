import { HttpApiError, postApi } from '../http'
import type { SendVerificationCodeData, SendVerificationCodeRequest } from './types'

// 01）通用接口异常类型定义（CommonApiError）
export class CommonApiError extends HttpApiError {}

// 02）通用 POST 请求封装（postCommonApi）
/**
 * 函数名：postCommonApi
 * 功能：通过统一 axios 拦截器发送通用模块 POST 请求。
 * 实现方法：
 * - 调用 api/http.ts 暴露的 postApi 方法
 * - 将 HttpApiError 映射为 CommonApiError
 * - 返回解包后的 data 数据
 * 输入：
 * - path：接口相对路径（以 / 开头）
 * - payload：请求参数对象
 * 输出：
 * - 返回值：业务数据（泛型 TData）
 * - 副作用：发起网络请求
 */
async function postCommonApi<TPayload extends object, TData>(path: string, payload: TPayload): Promise<TData> {
  try {
    return await postApi<TPayload, TData>(path, payload)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new CommonApiError(error.code, error.message)
    }
    throw error
  }
}

// 03）通用验证码下发接口（sendVerificationCode）
/**
 * 函数名：sendVerificationCode
 * 功能：调用验证码下发接口，供登录/注册等场景复用。
 * 实现方法：
 * - 透传账号、业务类型、通道与验证码风控参数
 * - 请求 /auth/personal/sms/send 并返回 requestId 与频控数据
 * 输入：
 * - payload：验证码发送请求参数
 * 输出：
 * - 返回值：验证码下发结果（requestId、expireInSec、retryAfterSec）
 * - 副作用：发起网络请求
 */
export async function sendVerificationCode(payload: SendVerificationCodeRequest): Promise<SendVerificationCodeData> {
  return postCommonApi<SendVerificationCodeRequest, SendVerificationCodeData>('/auth/personal/sms/send', payload)
}

export type { CommonCodeChannel, SendVerificationCodeData, SendVerificationCodeRequest } from './types'
