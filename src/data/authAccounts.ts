import { hashPassword } from '../utils/crypto'

// 01）个人通道账号类型定义（PersonalAuthAccount）
export interface PersonalAuthAccount {
  role: 'student' | 'mentor' | 'pm'
  phone: string
  smsCode: string
  authStatus: 'verified' | 'unverified'
}

// 02）主体通道账号类型定义（OrganizationAuthAccount）
export interface OrganizationAuthAccount {
  institutionCode: string
  account: string
  passwordHash: string
  otpCode: string
  authStatus: 'verified' | 'unverified'
}

// 03）个人通道账号数据（personalAuthAccounts）
export const personalAuthAccounts: PersonalAuthAccount[] = [
  {
    role: 'student',
    phone: '13800000001',
    smsCode: '123456',
    authStatus: 'unverified',
  },
  {
    role: 'mentor',
    phone: '13800000002',
    smsCode: '234567',
    authStatus: 'verified',
  },
  {
    role: 'pm',
    phone: '13800000003',
    smsCode: '345678',
    authStatus: 'verified',
  },
]

// 04）主体通道账号数据（organizationAuthAccounts）
export const organizationAuthAccounts: OrganizationAuthAccount[] = [
  {
    institutionCode: 'COMP-2026-SZTU',
    account: 'admin_sztu',
    passwordHash: hashPassword('Admin@2026'),
    otpCode: '112233',
    authStatus: 'verified',
  },
  {
    institutionCode: 'SCH-2026-BJ',
    account: 'school_bj_admin',
    passwordHash: hashPassword('School@2026'),
    otpCode: '223344',
    authStatus: 'verified',
  },
]
