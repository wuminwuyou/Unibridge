// 01）项目难度评估 API 层（evaluateProjectApi）
// 获取公钥 → 混合加密内容 → 提交评估请求
import { getApi, httpClient } from '@shared/api/http'
import type { ApiEnvelope } from '@shared/api/http'

// 02）获取公钥响应（PublicKeyResponse）
export interface PublicKeyResponse {
  /** 密钥标识（对应 sys_asymmetric_keys.key_id），提交评估时必须回传以定位私钥 */
  keyId: string
  /** PEM 格式 RSA 公钥 */
  publicKey: string
}

// 03）评估请求体（EvaluateProjectRequest）
export interface EvaluateProjectRequest {
  /** 密钥标识（来自 GET /public-key 响应），后端据此定位解密私钥 */
  keyId: string
  /** 需求详情原文（公开项，不加密） */
  description: string
  /** 项目内容详细描述（经公钥 RSA 加密后的 base64 字符串） */
  encryptedContentDetail: string
}

// 04）评估响应体（EvaluateProjectResponse）
export interface EvaluateProjectResponse {
  /** 评估得出的等级代号 */
  level: string
  /** 评估结果说明（始终返回，解释为何给出该等级） */
  explanation: string
  /** 修改建议（仅内容不够详尽时有，为 null 表示无需补充） */
  suggestions: string | null
}

// 05）获取评估公钥（fetchEvaluatePublicKey）
/**
 * 函数名：fetchEvaluatePublicKey
 * 功能：从后端获取项目难度评估用的 RSA 公钥。
 * 输入：无
 * 输出：
 * - 返回值：PublicKeyResponse（含 PEM 格式公钥字符串）
 * - 副作用：发起 GET 网络请求
 */
export function fetchEvaluatePublicKey(): Promise<PublicKeyResponse> {
  return getApi<PublicKeyResponse>('/projects/evaluate/public-key')
}

// 06）提交项目难度评估（submitEvaluateProject）
/**
 * 函数名：submitEvaluateProject
 * 功能：将需求说明与加密后的内容详情提交给后端，获取评估结果。
 * 实现方法：
 * - 模型分析评估耗时较长（可能超过默认 10s），单独设置 60s 超时
 * 输入：
 * - request：评估请求体
 * 输出：
 * - 返回值：EvaluateProjectResponse
 * - 副作用：发起 POST 网络请求
 */
export function submitEvaluateProject(request: EvaluateProjectRequest): Promise<EvaluateProjectResponse> {
  return httpClient.post<ApiEnvelope<EvaluateProjectResponse>, EvaluateProjectResponse>(
    '/projects/evaluate',
    request,
    { timeout: 120000 },
  )
}
