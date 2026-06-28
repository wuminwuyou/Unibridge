// 01）认证事件名常量（Auth Event Names）
const AUTH_TOKENS_UPDATED_EVENT = 'auth:tokens-updated'
const AUTH_FORCE_LOGOUT_EVENT = 'auth:force-logout'

// 02）认证令牌更新事件载荷（AuthTokensUpdatedDetail）
export interface AuthTokensUpdatedDetail {
  accessToken: string
  refreshToken: string
}

// 03）派发令牌更新事件（dispatchAuthTokensUpdated）
/**
 * 函数名：dispatchAuthTokensUpdated
 * 功能：在令牌刷新成功后通知全局认证状态同步更新。
 * 输入：
 * - detail：刷新后的认证令牌
 * 输出：
 * - 返回值：void
 * - 副作用：触发全局浏览器事件
 */
export function dispatchAuthTokensUpdated(detail: AuthTokensUpdatedDetail): void {
  window.dispatchEvent(new CustomEvent<AuthTokensUpdatedDetail>(AUTH_TOKENS_UPDATED_EVENT, { detail }))
}

// 04）派发强制登出事件（dispatchAuthForceLogout）
/**
 * 函数名：dispatchAuthForceLogout
 * 功能：在 refresh 失败等场景通知全局强制退出登录。
 * 输入：无
 * 输出：
 * - 返回值：void
 * - 副作用：触发全局浏览器事件
 */
export function dispatchAuthForceLogout(): void {
  window.dispatchEvent(new Event(AUTH_FORCE_LOGOUT_EVENT))
}

export { AUTH_TOKENS_UPDATED_EVENT, AUTH_FORCE_LOGOUT_EVENT }
