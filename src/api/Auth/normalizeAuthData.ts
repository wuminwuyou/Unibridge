import { normalizeUserResourceUid } from '../resourceUid'
import type { PersonalRegisterData, TokenAuthData } from './types'

// 01）归一化令牌登录响应（normalizeTokenAuthData）
/**
 * 函数名：normalizeTokenAuthData
 * 功能：将认证接口响应中的用户标识统一映射为 uid 字段。
 * 实现方法：
 * - 调用 normalizeUserResourceUid 解析 uid / userUid / user_uid / 字符串 userId
 * - 保留其余 token 与角色字段
 * 输入：
 * - data：认证接口原始 data
 * 输出：
 * - 返回值：TokenAuthData（含 uid）
 * - 副作用：无
 */
export function normalizeTokenAuthData<T extends TokenAuthData>(data: T): T {
  const uid = normalizeUserResourceUid(data as unknown as Record<string, unknown>) ?? data.uid
  return {
    ...data,
    uid,
  }
}

// 02）归一化注册响应（normalizePersonalRegisterData）
/**
 * 函数名：normalizePersonalRegisterData
 * 功能：将注册接口响应中的用户标识统一映射为 uid 字段。
 * 输入：
 * - data：注册接口原始 data
 * 输出：
 * - 返回值：PersonalRegisterData（含 uid）
 * - 副作用：无
 */
export function normalizePersonalRegisterData(data: PersonalRegisterData): PersonalRegisterData {
  return normalizeTokenAuthData(data)
}
