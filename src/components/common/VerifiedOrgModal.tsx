import { BadgeCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './VerifiedOrgModal.css'

// 01）主体认证页路由常量（ORGANIZATION_VERIFY_PATH）
export const ORGANIZATION_VERIFY_PATH = '/verify/organization'

// 01）认证主体展示组件参数（VerifiedOrgModalProps）
export interface VerifiedOrgModalProps {
  organization: string | null
  isVerified?: boolean
  unverifiedLabel?: string
  className?: string
}

// 02）认证主体展示组件（VerifiedOrgModal）
/**
 * 函数名：VerifiedOrgModal
 * 功能：渲染用户认证主体胶囊标签，支持已认证与未认证两种视觉状态。
 * 实现方法：
 * - isVerified=false 时展示未认证样式（灰底白字）与默认文案
 * - isVerified=true 且 organization 非空时展示已认证样式（蓝底 + 认证图标）
 * - organization 为空且已认证时返回 null
 * 输入：
 * - organization：认证主体名称，可为 null
 * - isVerified：是否已认证主体，默认 true
 * - unverifiedLabel：未认证时展示文案，默认「未认证主体」
 * - className：可选追加类名
 * 输出：
 * - 返回值：JSX.Element | null
 * - 副作用：无
 */
function VerifiedOrgModal({
  organization,
  isVerified = true,
  unverifiedLabel = '未认证主体',
  className = '',
}: VerifiedOrgModalProps) {
  const normalizedOrganization = organization?.trim() ?? ''

  if (!isVerified) {
    const unverifiedClassName = `verified-org-modal verified-org-modal--unverified ${className}`.trim()
    return <span className={unverifiedClassName}>{unverifiedLabel}</span>
  }

  if (!normalizedOrganization) {
    return null
  }

  const verifiedClassName = `verified-org-modal verified-org-modal--verified ${className}`.trim()

  return (
    <span className={verifiedClassName}>
      <BadgeCheck size={16} strokeWidth={2} aria-hidden="true" />
      {normalizedOrganization}
    </span>
  )
}

// 03）去认证按钮参数（VerifiedOrgButtonProps）
export interface VerifiedOrgButtonProps {
  to?: string
  className?: string
  onNavigate?: () => void
}

// 04）去认证按钮（VerifiedOrgButton）
/**
 * 函数名：VerifiedOrgButton
 * 功能：渲染「去认证」入口按钮，点击后跳转主体认证页面。
 * 实现方法：
 * - 默认跳转 /verify/organization
 * - 支持 onNavigate 供父组件在跳转前执行副作用（如关闭菜单）
 * 输入：
 * - to：目标路由，可选
 * - className：可选追加类名
 * - onNavigate：跳转前回调，可选
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：触发路由跳转
 */
export function VerifiedOrgButton({ to = ORGANIZATION_VERIFY_PATH, className = '', onNavigate }: VerifiedOrgButtonProps) {
  const navigate = useNavigate()

  const handleClick = (): void => {
    onNavigate?.()
    navigate(to)
  }

  const buttonClassName = `verified-org-button ${className}`.trim()

  return (
    <button type="button" className={buttonClassName} onClick={handleClick} aria-label="前往主体认证">
      <span>去认证</span>
    </button>
  )
}

export default VerifiedOrgModal
