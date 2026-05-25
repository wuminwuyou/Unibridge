import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  isPublishEntryFreshNavigation,
  readPublishEntryInstanceKey,
} from '../layout/TopNavbar/components/HeaderActions/publishEntryNavigation'

// 01）发布页顶栏入口 remount key Hook（usePublishEntryFreshFormKey）
/**
 * 函数名：usePublishEntryFreshFormKey
 * 功能：在从顶栏「发布」菜单进入时返回新的表单实例 key，并清除一次性路由 state。
 * 实现方法：
 * - 检测 publishEntryFresh 标记
 * - 用 instanceKey 更新本地 state 以 remount 子表单组件
 * - replace 清掉 location.state，避免刷新或返回时重复 remount
 * 输入：
 * - defaultKey：非顶栏入口时的默认 key，默认 'default'
 * 输出：
 * - 返回值：供 React key 使用的字符串
 * - 副作用：可能触发 replace 导航
 */
export function usePublishEntryFreshFormKey(defaultKey = 'default'): string {
  const location = useLocation()
  const navigate = useNavigate()
  const [formInstanceKey, setFormInstanceKey] = useState(defaultKey)
  const handledInstanceKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isPublishEntryFreshNavigation(location.state)) {
      handledInstanceKeyRef.current = null
      return
    }

    const instanceKey = readPublishEntryInstanceKey(location.state) ?? `fresh-${Date.now()}`
    if (handledInstanceKeyRef.current === instanceKey) {
      return
    }
    handledInstanceKeyRef.current = instanceKey
    setFormInstanceKey(instanceKey)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  return formInstanceKey
}
