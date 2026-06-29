import './UserAvatar.css'

// 01）用户头像组件参数（UserAvatarProps）
export interface UserAvatarProps {
  avatarUrl?: string | null
  fallbackText: string
  alt?: string
  className?: string
  /** 提供时在 <a> 中渲染，点击跳转目标链接 */
  href?: string
  target?: string
  rel?: string
}

// 02）用户头像原子组件（UserAvatar）
/**
 * 函数名：UserAvatar
 * 功能：根据 URL 或 fallback 文案渲染圆形用户头像；可配置 href 作为链接跳转。
 * 实现方法：
 * - 有 avatarUrl 时渲染 img，否则渲染首字占位
 * - 传入 href 时用 <a> 包裹并跳转
 * 输入：
 * - avatarUrl：头像图片地址，可选
 * - fallbackText：无 URL 时的占位文案（取首字）
 * - href：跳转链接，可选
 * - target / rel：链接行为，默认新标签页打开
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无（href 跳转由浏览器处理）
 */
function UserAvatar({
  avatarUrl,
  fallbackText,
  alt,
  className,
  href,
  target = '_blank',
  rel = 'noopener noreferrer',
}: UserAvatarProps) {
  const resolvedAlt = alt ?? `${fallbackText}头像`
  const extraClass = className ? ` ${className}` : ''

  const avatarNode = avatarUrl ? (
    <img
      className={`user-avatar user-avatar--image${href ? '' : extraClass}`}
      src={avatarUrl}
      alt={resolvedAlt}
    />
  ) : (
    <span className={`user-avatar user-avatar--fallback${href ? '' : extraClass}`} aria-hidden={Boolean(href)}>
      {fallbackText.slice(0, 1)}
    </span>
  )

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={`user-avatar-link${extraClass}`}
        aria-label={resolvedAlt}
      >
        {avatarNode}
      </a>
    )
  }

  return avatarNode
}

export default UserAvatar
