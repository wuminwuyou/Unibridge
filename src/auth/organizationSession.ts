import type { EntityCode } from '../api/resourceUid'
import type { AuthUserProfile } from '../contexts/AuthContext'
import { getEntityCode, getEntityName, getUserUid } from './tokenStorage'

// 01）主体管理员 uid 正则（ENTITY_ADMIN_UID_REGEXP）
const ENTITY_ADMIN_UID_REGEXP = /^EA[A-Za-z0-9]{11}$/

// 02）判断是否为主体管理员角色（isOrganizationAdminRole）
/**
 * 函数名：isOrganizationAdminRole
 * 功能：判断当前登录角色是否为主体通道管理员。
 * 输入：
 * - userRole：认证上下文中的 userRole
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function isOrganizationAdminRole(userRole?: string | null): boolean {
  return userRole === 'organization-admin'
}

// 03）判断是否为主体管理员 uid（isEntityAdminUid）
/**
 * 函数名：isEntityAdminUid
 * 功能：判断 uid 是否为 EA 前缀的主体管理员对外标识。
 * 输入：
 * - uid：用户对外 uid
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function isEntityAdminUid(uid?: string | null): boolean {
  return typeof uid === 'string' && ENTITY_ADMIN_UID_REGEXP.test(uid.trim())
}

// 04）解析当前会话的主体代码（resolveSessionEntityCode）
/**
 * 函数名：resolveSessionEntityCode
 * 功能：从认证档案、本地缓存或 uid（主体根绑定）解析机构 entityCode。
 * 实现方法：
 * - 优先 userProfile.entityCode 与 localStorage entity_code
 * - 当 uid 非 EA 管理员格式时，将 uid 视为主体代码（无管理员行绑定场景）
 * 输入：
 * - userProfile：认证用户档案，可选
 * 输出：
 * - 返回值：EntityCode | null
 * - 副作用：无
 */
export function resolveSessionEntityCode(userProfile?: AuthUserProfile | null): EntityCode | null {
  const profileEntityCode = userProfile?.entityCode?.trim()
  if (profileEntityCode) {
    return profileEntityCode
  }

  const storedEntityCode = getEntityCode()?.trim()
  if (storedEntityCode) {
    return storedEntityCode
  }

  const uid = userProfile?.uid?.trim() ?? getUserUid()?.trim()
  if (uid && !isEntityAdminUid(uid)) {
    return uid
  }

  return null
}

// 05）解析主体空间展示名称（resolveOrganizationDisplayName）
/**
 * 函数名：resolveOrganizationDisplayName
 * 功能：为主体管理员菜单提供展示用名称。
 * 输入：
 * - userProfile：认证用户档案，可选
 * - entityCode：已解析的主体代码，可选
 * 输出：
 * - 返回值：string
 * - 副作用：无
 */
export function resolveOrganizationDisplayName(
  userProfile?: AuthUserProfile | null,
  entityCode?: EntityCode | null,
): string {
  const profileName = userProfile?.entityName?.trim() || getEntityName()?.trim()
  if (profileName) {
    return profileName
  }

  const code = entityCode ?? resolveSessionEntityCode(userProfile)
  if (code) {
    return code
  }

  return '主体账号'
}
