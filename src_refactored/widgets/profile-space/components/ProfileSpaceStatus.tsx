// 01）个人空间页壳 loading/error 占位（ProfileSpaceShellStatus）
import LoadingSpinner from '@shared/ui/LoadingSpinner'

// 02）页壳加载/错误态 Props（ProfileSpaceShellStatusProps）
interface ProfileSpaceShellStatusProps {
  loadState: 'loading' | 'error'
  errorMessage?: string | null
  loadingLabel: string
}

// 03）页壳加载/错误态展示组件（ProfileSpaceShellStatus）
/**
 * 函数名：ProfileSpaceShellStatus
 * 功能：在 Hero/侧栏/主内容区根据 loadState 展示统一的 loading/error 占位。
 * 输入：
 * - loadState：'loading' | 'error'
 * - errorMessage：错误信息（可选）
 * - loadingLabel：loading 文案
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileSpaceShellStatus({
  loadState,
  errorMessage,
  loadingLabel,
}: ProfileSpaceShellStatusProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-space-shell-status">
        <LoadingSpinner size={32} label={loadingLabel} />
      </div>
    )
  }

  return (
    <p className="profile-space-shell-error" role="alert">
      {errorMessage ?? '加载失败，请稍后重试'}
    </p>
  )
}
