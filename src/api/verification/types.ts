// 01）人脸核身初始化请求（FaceIdInitRequest）
export interface FaceIdInitRequest {
  realName: string
  idCard: string
}

// 02）人脸核身初始化响应（FaceIdInitResponse）
export interface FaceIdInitResponse {
  /** 腾讯云 H5 核身二维码（data:image/png;base64,…），可直接赋给 img src */
  qrCodeDataUrl: string
  /** 核身令牌 */
  token: string
  /** 有效期（秒） */
  expireInSec: number
}

// 03）人脸核身结果查询请求（FaceIdResultRequest）
export interface FaceIdResultRequest {
  token: string
}

// 04）人脸核身结果查询响应（FaceIdResultResponse）
export interface FaceIdResultResponse {
  passed: boolean
  realName: string
  idCardMasked: string
}

// 05）机构检索项（EntitySearchItem）
export interface EntitySearchItem {
  entityCode: string
  name: string
  type: string
}

// 06）机构检索响应（EntitySearchResponse）
export interface EntitySearchResponse {
  entities: EntitySearchItem[]
}

// 07）教职工认证申请请求（StaffVerificationApplyRequest）
export interface StaffVerificationApplyRequest {
  entityCode: string
  realName: string
  staffNumber: string
}

// 08）教职工认证申请响应（StaffVerificationApplyResponse）
export interface StaffVerificationApplyResponse {
  applicationId: string
  status: 'PENDING'
}

// 09）学生认证激活请求（StudentVerificationActivateRequest）
export interface StudentVerificationActivateRequest {
  verificationCode: string
  /** 学号 */
  studentId: string
  /** 真实姓名（阶段一核身通过后自动填充） */
  realName: string
  /** 毕业年份 */
  graduationYear: number
}

// 10）学生认证激活响应（StudentVerificationActivateResponse）
export interface StudentVerificationActivateResponse {
  entityCode: string
  entityName: string
  role: 'STUDENT'
}

// 11）生成母码请求（GenerateMasterCodeRequest）
export interface GenerateMasterCodeRequest {
  /** 母码总额度（默认 1000，上限 5000） */
  maxQuota?: number
  /** 用途描述 */
  description?: string
}

// 12）生成母码响应（GenerateMasterCodeResponse）
export interface GenerateMasterCodeResponse {
  code: string
  entityCode: string
  maxQuota: number
  /** 失效时间（yyyy-MM-dd HH:mm:ss） */
  expireTime: string
}

// 13）生成子码请求（GenerateSubCodeRequest）
export interface GenerateSubCodeRequest {
  /** 母码 code */
  masterCode: string
  /** 子码额度（默认 50，上限 500） */
  maxQuota?: number
  /** 毕业年份（可选，仅子码可填写） */
  graduationYear?: number
  /** 用途描述（如：计算机专业 3 班） */
  description?: string
}

// 14）生成子码响应（GenerateSubCodeResponse）
export interface GenerateSubCodeResponse {
  code: string
  entityCode: string
  graduationYear: number | null
  maxQuota: number
  /** 失效时间（yyyy-MM-dd HH:mm:ss） */
  expireTime: string
}

// 15）认证码列表项（VerificationCodeItem）
export interface VerificationCodeItem {
  code: string
  maxQuota: number
  usedQuota: number
  description: string | null
  createdBy: string
  /** 创建者显示名称 */
  createdByName: string
  isActive: boolean
  isMaster: boolean
  createdAt: string
  /** 失效时间（yyyy-MM-dd HH:mm:ss） */
  expireTime: string
  /** 是否可以延期 */
  canRenew: boolean
}

// 16）认证码列表响应（VerificationCodeListResponse）
export interface VerificationCodeListResponse {
  codes: VerificationCodeItem[]
  total: number
}

// 17）延期认证码请求（RenewVerificationCodeRequest）
export interface RenewVerificationCodeRequest {
  code: string
  /** 延期至日期（yyyy-MM-dd） */
  newExpireDate: string
}

// 18）延期认证码响应（RenewVerificationCodeResponse）
export interface RenewVerificationCodeResponse {
  code: string
  /** 新的失效时间 */
  newExpireTime: string
}

// 19）认证学生项（VerifiedStudentItem）
export interface VerifiedStudentItem {
  uid: string
  nickname: string
  realName: string
  studentId: string
  graduationYear: number
  /** 激活该学生的子码 */
  subCode: string
  /** 激活时间 */
  activatedAt: string
}

// 20）认证学生列表响应（VerifiedStudentListResponse）
export interface VerifiedStudentListResponse {
  students: VerifiedStudentItem[]
  total: number
}

// 21）附属子码列表响应（SubCodeListResponse）
export interface SubCodeListResponse {
  codes: VerificationCodeItem[]
  total: number
}
