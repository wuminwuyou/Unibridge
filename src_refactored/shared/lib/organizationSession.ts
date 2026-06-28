import type { EntityCode } from '../api/resourceUid'
import type { AuthUserProfile } from '../hooks/useAuth'
import { getEntityCode, getEntityName, getUserUid } from './tokenStorage'

// 01）主体管理员 uid 正则（ENTITY_ADMIN_UID_REGEXP）
const ENTITY_ADMIN_UID_REGEXP = /^EA[A-Za-z0-9]{11}$/

// 02）判断是否为主体管理员角色（isOrganizationAdminRole）
export function isOrganizationAdminRole(userRole?: string | null): boolean {
  return userRole === 'organization-admin'
}

// 02-1）判断是否为辅导员角色（isCounselorRole）
export function isCounselorRole(userRole?: string | null): boolean {
  return userRole === 'counselor'
}

// 03）判断是否为主体管理员 uid（isEntityAdminUid）
export function isEntityAdminUid(uid?: string | null): boolean {
  return typeof uid === 'string' && ENTITY_ADMIN_UID_REGEXP.test(uid.trim())
}

// 04）解析当前会话的主体代码（resolveSessionEntityCode）
export function resolveSessionEntityCode(userProfile?: AuthUserProfile | null): EntityCode | null {
  const profileEntityCode = userProfile?.entityCode?.trim()
  if (profileEntityCode) return profileEntityCode
  const storedEntityCode = getEntityCode()?.trim()
  if (storedEntityCode) return storedEntityCode
  const uid = userProfile?.uid?.trim() ?? getUserUid()?.trim()
  if (uid && !isEntityAdminUid(uid)) return uid
  return null
}

// 05）解析主体空间展示名称（resolveOrganizationDisplayName）
export function resolveOrganizationDisplayName(
  userProfile?: AuthUserProfile | null,
  entityCode?: EntityCode | null,
): string {
  const profileName = userProfile?.entityName?.trim() || getEntityName()?.trim()
  if (profileName) return profileName
  const code = entityCode ?? resolveSessionEntityCode(userProfile)
  if (code) return code
  return '主体账号'
}
