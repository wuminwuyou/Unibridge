// 01）空间页变体类型（ProfileSpaceVariant）
export type ProfileSpaceVariant = 'personal' | 'team' | 'organization'

// 02）页壳加载状态（ProfileSpaceShellLoadState）
export type ProfileSpaceShellLoadState = 'loading' | 'error' | 'ready'

// 03）根据 pathname 解析变体（resolveProfileSpaceVariant）
/**
 * 函数名：resolveProfileSpaceVariant
 * 功能：根据 URL pathname 解析当前空间页变体（个人/团队/机构）。
 * 实现方法：
 * - /org 或 /org/* → organization
 * - /team 或 /team/* → team
 * - 其它（包含 /profile/*）→ personal
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：ProfileSpaceVariant
 * - 副作用：无
 */
export function resolveProfileSpaceVariant(pathname: string): ProfileSpaceVariant {
  if (pathname === '/org' || pathname.startsWith('/org/')) {
    return 'organization'
  }
  if (pathname === '/team' || pathname.startsWith('/team/')) {
    return 'team'
  }
  return 'personal'
}
