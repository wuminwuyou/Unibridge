// 01）空间页统筹 Hook（useProfileSpaceWidget）— 仅做变体分发
import { useLocation } from 'react-router-dom'
import {
  resolveProfileSpaceVariant,
  type ProfileSpaceVariant,
} from '../lib/profileSpaceVariant'

// 02）空间页统筹 Hook 入参（UseProfileSpaceWidgetOptions）
interface UseProfileSpaceWidgetOptions {
  /** 由页面层显式注入的变体，缺省时按 pathname 自动判定 */
  variant?: ProfileSpaceVariant
}

// 03）空间页统筹 Hook 返回值（UseProfileSpaceWidgetResult）
export interface UseProfileSpaceWidgetResult {
  variant: ProfileSpaceVariant
  pathname: string
}

// 04）空间页统筹 Hook（useProfileSpaceWidget）
/**
 * 函数名：useProfileSpaceWidget
 * 功能：判定当前空间页应渲染的变体（个人 / 团队 / 机构），供大部件分发子区块。
 * 实现方法：
 * - 优先使用页面层显式注入的 variant
 * - 否则按 location.pathname 解析（/profile → personal / /team → team / /org → organization）
 * 输入：
 * - options.variant：可选，页面层强制变体
 * 输出：
 * - 返回值：{ variant, pathname }
 * - 副作用：无
 */
export function useProfileSpaceWidget(
  options: UseProfileSpaceWidgetOptions = {},
): UseProfileSpaceWidgetResult {
  const location = useLocation()
  const resolvedVariant = options.variant ?? resolveProfileSpaceVariant(location.pathname)

  return {
    variant: resolvedVariant,
    pathname: location.pathname,
  }
}
