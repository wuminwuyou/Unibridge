import './style.css'
import { ProfileSpaceView } from './ProfileSpaceView'
import { useProfileSpacePage } from './useProfileSpacePage'

// 01）个人空间页面入口（ProfileSpacePage）
/**
 * 函数名：ProfileSpacePage
 * 功能：个人空间对外入口，挂载业务 Hook 并将模型交给视图渲染。
 * 实现方法：
 * - 调用 useProfileSpacePage 聚合状态与副作用
 * - 将 model 传递给 ProfileSpaceView
 * - 样式由同目录 style.css 随模块加载
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：由 useProfileSpacePage 管理
 */
function ProfileSpacePage() {
  const model = useProfileSpacePage()

  return <ProfileSpaceView model={model} />
}

export default ProfileSpacePage

export type { ProfileSpacePageModel } from './useProfileSpacePage'
export type { ProfileTab, ProfileSpaceShellLoadState } from './types'
