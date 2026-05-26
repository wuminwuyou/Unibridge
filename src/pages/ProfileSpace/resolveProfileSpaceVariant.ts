import type { ProfileSpaceVariant } from './profileSpaceShellTypes'

// 01）解析个人空间视图变体（resolveProfileSpaceVariant）
/**
 * 函数名：resolveProfileSpaceVariant
 * 功能：根据路由解析应渲染的个人空间变体（Personal / Team / Organization）。
 * 实现方法：
 * - 当前 /profile 路由统一映射为 PersonalView
 * - 后续可扩展 /team/:id、/org/:id 等路径
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：ProfileSpaceVariant
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
