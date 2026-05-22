import './style.css'
import { AuthModalView } from './AuthModalView'
import { useAuthModal } from './useAuthModal'
import type { AuthModalProps } from './types'

// 01）认证弹窗对外组件（AuthModal）
/**
 * 函数名：AuthModal
 * 功能：对外入口组件，挂载业务 Hook 并将模型交给纯布局视图渲染。
 * 实现方法：
 * - 始终调用 useAuthModal 以保持关闭时的清理副作用
 * - open 为 false 时不挂载 Portal，减少 DOM 负担
 * - 样式由同目录 style.css 随模块一并加载
 * 输入：
 * - props：AuthModalProps（open/onClose/onSuccess）
 * 输出：
 * - 返回值：JSX.Element | null
 * - 副作用：由 useAuthModal 管理（如 body overflow）
 */
function AuthModal(props: AuthModalProps) {
  const model = useAuthModal(props)

  if (!props.open) {
    return null
  }

  return <AuthModalView onClose={props.onClose} model={model} />
}

export default AuthModal

export { default as VerificationStep } from './components/VerificationStep'
export type {
  AuthStatus,
  AuthTabType,
  AuthUserRole,
  AuthModalProps,
  OrganizationLoginStep,
  PersonalLoginMode,
  PersonalPanelView,
  VerificationGuideTab,
} from './types'
export type { AuthModalModel } from './useAuthModal'
