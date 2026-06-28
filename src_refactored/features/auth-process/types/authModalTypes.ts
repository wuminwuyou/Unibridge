// 01）认证相关类型定义（types/ 段）
export type AuthStatus = 'verified' | 'unverified'
export type AuthUserRole = 'student' | 'mentor' | 'pm' | 'counselor' | 'organization-admin'
export type AuthTabType = 'personal' | 'organization'
export type OrganizationLoginStep = 'credentials' | 'admin-select' | 'admin-register' | 'otp' | 'totp-setup'
export type VerificationGuideTab = 'edu-mail' | 'credentials-upload'
export type PersonalPanelView = 'login' | 'register'
export type PersonalLoginMode = 'password' | 'sms'

export interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (userRole: string, authStatus: string) => void
}
