// 01）项目难度评估服务（evaluateProjectService）
// 编排完整流程：获取/复用公钥 → 加密 → 提交评估 → 返回结果 + keyPair
import { fetchEvaluatePublicKey, submitEvaluateProject, type EvaluateProjectResponse } from '../api/evaluateProjectApi'
import { encryptContentDetail } from '../lib/encryptContentDetail'

// 02）模块级密钥缓存（脱离 React 组件生命周期，避免 key 变化导致缓存丢失）
let cachedKeyPair: { keyId: string; publicKey: string } | null = null

// 03）清除模块级密钥缓存（clearKeyPairCache）
/**
 * 函数名：clearKeyPairCache
 * 功能：清除前端缓存的评估密钥对，通常在发布项目成功或离开发布页时调用。
 * 输入：无
 * 输出：无
 * 副作用：重置模块级 cachedKeyPair 为 null
 */
export function clearKeyPairCache(): void {
  cachedKeyPair = null
}

// 04）评估输入参数（EvaluateProjectInput）
export interface EvaluateProjectInput {
  /** 需求详情原文 */
  description: string
  /** 项目内容详细描述明文 */
  contentDetail: string
}

// 05）评估输出（EvaluateProjectOutput）— 含 keyPair 供前端缓存复用
export interface EvaluateProjectOutput {
  /** 评估结果 */
  response: EvaluateProjectResponse
  /** 本次使用的密钥对（已缓存在模块级，下次提交自动复用） */
  keyPair: { keyId: string; publicKey: string }
}

// 06）执行项目难度评估（evaluateProject）
/**
 * 函数名：evaluateProject
 * 功能：对项目内容进行难度评估，加密内容后提交后端，返回等级、说明、建议与 keyPair。
 * 实现方法：
 * - 优先读取模块级 cachedKeyPair（首次为 null → 调用 GET /public-key）
 * - 若已有缓存，直接复用 keyId + publicKey，跳过公钥请求
 * - 使用 Web Crypto API 对 contentDetail 做 RSA-OAEP 加密
 * - 调用 POST /projects/evaluate 提交 keyId + description + 密文
 * - 将 keyPair 写入模块级缓存，后续调用自动跳过 GET /public-key
 * 输入：
 * - input：评估输入参数
 * 输出：
 * - 返回值：EvaluateProjectOutput（response + keyPair）
 * - 副作用：发起 1 次网络请求（缓存命中仅 POST，否则 GET+POST）
 */
export async function evaluateProject(input: EvaluateProjectInput): Promise<EvaluateProjectOutput> {
  let keyId: string
  let publicKey: string

  if (cachedKeyPair) {
    keyId = cachedKeyPair.keyId
    publicKey = cachedKeyPair.publicKey
  } else {
    const keyResponse = await fetchEvaluatePublicKey()
    keyId = keyResponse.keyId
    publicKey = keyResponse.publicKey
    cachedKeyPair = { keyId, publicKey }
  }

  const { ciphertext: encryptedContentDetail } =
    await encryptContentDetail(publicKey, input.contentDetail)

  const response = await submitEvaluateProject({
    keyId,
    description: input.description,
    encryptedContentDetail,
  })
  return { response, keyPair: { keyId, publicKey } }
}
