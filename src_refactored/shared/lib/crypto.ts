import { SHA256 } from 'crypto-js'

// 01）将明文密码转换为 SHA256 哈希值（hashPassword）
/**
 * 函数名：hashPassword
 * 功能：将用户输入的明文密码转为 64 位十六进制 SHA256 哈希。
 * 输入：
 * - password：用户输入的明文密码
 * 输出：
 * - 返回值：64 位十六进制字符串，空密码返回 ''
 * - 副作用：无
 */
export const hashPassword = (password: string): string => {
  if (!password) return ''
  return SHA256(password).toString()
}

// 02）带盐 SHA256 哈希（hashPasswordWithSalt）
/**
 * 函数名：hashPasswordWithSalt
 * 功能：使用固定盐值对密码进行 SHA256 哈希，提供前端第一层加密。
 * 注意：前端加盐仅为第一层防护，后端存库时应再次加盐。
 * 输入：
 * - password：用户输入的明文密码
 * - salt：盐值，默认 'UniBridge_Secure_2026'
 * 输出：
 * - 返回值：哈希后的字符串
 * - 副作用：无
 */
export const hashPasswordWithSalt = (password: string, salt: string = 'UniBridge_Secure_2026'): string => {
  return SHA256(password + salt).toString()
}
