// 01）认证弹窗 Widget（auth-modal）—— 组合 features/auth-process Hook + Layout
import './ui/style.css'
import { AuthModalLayout } from './ui/AuthModalLayout'
import { useAuthModal } from '../../features/auth-process/hooks/useAuthModal'
import type { AuthModalProps } from '../../features/auth-process/types/authModalTypes'

function AuthModal(props: AuthModalProps) {
  const model = useAuthModal(props)
  if (!props.open) return null
  return <AuthModalLayout onClose={props.onClose} model={model} />
}

export default AuthModal
export type AuthModalModel = ReturnType<typeof useAuthModal>
