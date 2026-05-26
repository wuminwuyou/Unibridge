// 01）TOTP 绑定支持的应用列表（ENTITY_TOTP_SUPPORTED_APPS）
export interface EntityTotpSupportedApp {
  name: string
  platforms: string
}

/** 常见支持 TOTP（RFC 6238）的验证器应用 */
export const ENTITY_TOTP_SUPPORTED_APPS: EntityTotpSupportedApp[] = [
  { name: 'Google Authenticator', platforms: 'iOS / Android' },
  { name: 'Microsoft Authenticator', platforms: 'iOS / Android' },
  { name: '腾讯身份验证器', platforms: 'iOS / Android / 微信小程序' },
  { name: '阿里云 App', platforms: 'iOS / Android' },
  { name: '1Password', platforms: 'iOS / Android / 桌面端' },
  { name: 'Authy', platforms: 'iOS / Android / 桌面端' },
  { name: 'Bitwarden Authenticator', platforms: 'iOS / Android / 浏览器扩展' },
  { name: 'FreeOTP', platforms: 'iOS / Android' },
]

/** 后端未返回 qrCodeExpireInSec 时的默认 QR 展示时长（秒） */
export const ENTITY_TOTP_DEFAULT_QR_EXPIRE_SEC = 300
