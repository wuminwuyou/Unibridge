import { HttpApiError, getApi, postApi } from '../http'
import type {
  FaceIdInitRequest,
  FaceIdInitResponse,
  FaceIdResultResponse,
  EntitySearchResponse,
  StaffVerificationApplyRequest,
  StaffVerificationApplyResponse,
  StudentVerificationActivateRequest,
  StudentVerificationActivateResponse,
  GenerateMasterCodeRequest,
  GenerateMasterCodeResponse,
  GenerateSubCodeRequest,
  GenerateSubCodeResponse,
  VerificationCodeListResponse,
} from './types'

// 01）认证模块异常类型（VerificationApiError）
export class VerificationApiError extends HttpApiError {}

// 02）POST 请求封装（postVerificationApi）
async function postVerificationApi<TPayload extends object, TData>(path: string, payload: TPayload): Promise<TData> {
  try {
    return await postApi<TPayload, TData>(path, payload)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new VerificationApiError(error.code, error.message)
    }
    throw error
  }
}

// 03）GET 请求封装（getVerificationApi）
async function getVerificationApi<TData>(path: string): Promise<TData> {
  try {
    return await getApi<TData>(path)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new VerificationApiError(error.code, error.message)
    }
    throw error
  }
}

// 04）初始化人脸核身（initFaceVerification）
/**
 * 函数名：initFaceVerification
 * 功能：提交姓名+身份证号，获取腾讯云 H5 核身链接。
 * 输入：realName、idCard
 * 输出：{ url, token, expireInSec }
 */
export async function initFaceVerification(body: FaceIdInitRequest): Promise<FaceIdInitResponse> {
  return postVerificationApi<FaceIdInitRequest, FaceIdInitResponse>('/verification/face/init', body)
}

// 05）查询人脸核身结果（queryFaceVerificationResult）
/**
 * 函数名：queryFaceVerificationResult
 * 功能：根据 token 查询人脸核身结果。
 * 输入：token
 * 输出：{ passed, realName, idCardMasked }
 */
export async function queryFaceVerificationResult(token: string): Promise<FaceIdResultResponse> {
  const encodedToken = encodeURIComponent(token.trim())
  return getVerificationApi<FaceIdResultResponse>(`/verification/face/result?token=${encodedToken}`)
}

// 06）检索机构（searchEntities）
/**
 * 函数名：searchEntities
 * 功能：根据关键词模糊检索机构（entity_code / name）。
 * 输入：keyword
 * 输出：EntitySearchItem[]
 */
export async function searchEntities(keyword: string): Promise<EntitySearchResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('keyword', keyword.trim())
  return getVerificationApi<EntitySearchResponse>(`/verification/entities/search?${searchParams.toString()}`)
}

// 07）教职工认证申请（applyStaffVerification）
/**
 * 函数名：applyStaffVerification
 * 功能：提交教职工（PM/MENTOR）认证申请。
 * 输入：entityCode、realName、staffNumber
 * 输出：{ applicationId, status: 'PENDING' }
 */
export async function applyStaffVerification(body: StaffVerificationApplyRequest): Promise<StaffVerificationApplyResponse> {
  return postVerificationApi<StaffVerificationApplyRequest, StaffVerificationApplyResponse>('/verification/staff-apply', body)
}

// 08）学生认证码激活（activateStudentVerification）
/**
 * 函数名：activateStudentVerification
 * 功能：使用认证码激活学生认证。
 * 输入：verificationCode（子码）、studentNumber（学号）、realName（实名）、graduationYear（毕业年份）
 * 输出：{ entityCode, entityName, role }
 */
export async function activateStudentVerification(body: StudentVerificationActivateRequest): Promise<StudentVerificationActivateResponse> {
  return postVerificationApi<StudentVerificationActivateRequest, StudentVerificationActivateResponse>('/verification/codes/activate', body)
}

// 09）生成母码（generateMasterCode）
/**
 * 函数名：generateMasterCode
 * 功能：机构管理员生成院级认证母码。
 * 输入：maxQuota（可选，默认 1000，上限 5000）、description（可选）
 * 输出：{ code, entityCode, maxQuota, expireTime }
 */
export async function generateMasterCode(body: GenerateMasterCodeRequest): Promise<GenerateMasterCodeResponse> {
  return postVerificationApi<GenerateMasterCodeRequest, GenerateMasterCodeResponse>('/verification/codes/generate', body)
}

// 10）生成子码（generateSubCode）
/**
 * 函数名：generateSubCode
 * 功能：辅导员在母码下创建班级/专业级子码。
 * 输入：masterCode（必填）、maxQuota（可选，默认 50，上限 500）、graduationYear（可选）、description（可选）
 * 输出：{ code, entityCode, graduationYear, maxQuota, expireTime }
 */
export async function generateSubCode(body: GenerateSubCodeRequest): Promise<GenerateSubCodeResponse> {
  return postVerificationApi<GenerateSubCodeRequest, GenerateSubCodeResponse>('/verification/codes/sub-code', body)
}

// 11）获取认证码列表（getVerificationCodeList）
/**
 * 函数名：getVerificationCodeList
 * 功能：机构管理员查看当前机构的认证码列表（母码+子码）。
 * 输出：{ codes[], total }
 */
export async function getVerificationCodeList(): Promise<VerificationCodeListResponse> {
  return getVerificationApi<VerificationCodeListResponse>('/verification/codes')
}

// 12）无效化认证码（invalidateVerificationCode）
/**
 * 函数名：invalidateVerificationCode
 * 功能：机构管理员无效化指定的认证码。
 * 输入：code
 */
export async function invalidateVerificationCode(code: string): Promise<void> {
  return postVerificationApi<{ code: string }, void>('/verification/codes/invalidate', { code })
}

export type {
  FaceIdInitRequest,
  FaceIdInitResponse,
  FaceIdResultResponse,
  EntitySearchItem,
  EntitySearchResponse,
  StaffVerificationApplyRequest,
  StaffVerificationApplyResponse,
  StudentVerificationActivateRequest,
  StudentVerificationActivateResponse,
  GenerateMasterCodeRequest,
  GenerateMasterCodeResponse,
  GenerateSubCodeRequest,
  GenerateSubCodeResponse,
  VerificationCodeListResponse,
} from './types'
