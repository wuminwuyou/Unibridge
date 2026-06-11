// 01）认证状态类型定义（AuthStatus）
export type AuthStatus = 'verified' | 'unverified'

// 02）用户角色类型定义（AuthUserRole）
export type AuthUserRole = 'student' | 'mentor' | 'pm' | 'counselor' | 'organization-admin'

// 03）登录通道类型定义（AuthTabType）
export type AuthTabType = 'personal' | 'organization'

// 04）主体登录步骤类型定义（OrganizationLoginStep）
export type OrganizationLoginStep = 'credentials' | 'admin-select' | 'admin-register' | 'otp' | 'totp-setup'

// 05）身份认证引导页子 Tab 类型定义（VerificationGuideTab）
export type VerificationGuideTab = 'edu-mail' | 'credentials-upload'

// 06）个人通道面板视图类型定义（PersonalPanelView）
export type PersonalPanelView = 'login' | 'register'

// 07）个人登录表单模式类型定义（PersonalLoginMode）
export type PersonalLoginMode = 'password' | 'sms'

// 08）认证弹窗组件参数类型（AuthModalProps）
export interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (userRole: AuthUserRole, authStatus: AuthStatus) => void
}
