import './IdentityBadge.css'

// 01）身份类型（IdentityKind）
export type IdentityKind = 'teacher' | 'student' | 'staff' | 'counselor'

// 02）身份标签 Props（IdentityBadgeProps）
export interface IdentityBadgeProps {
  kind: IdentityKind
  label: string
  className?: string
}

const identityLabelMap: Record<IdentityKind, string> = {
  teacher: '教师',
  student: '学生',
  staff: '职工',
  counselor: '辅导员',
}

// 03）身份标签组件（IdentityBadge）
/**
 * 函数名：IdentityBadge
 * 功能：渲染个人空间等场景下的身份类型徽章。
 * 实现方法：
 * - 根据 kind 映射 CSS 修饰类（teacher/student/staff/counselor）
 * - 优先展示传入 label，未传则使用内置中文标签
 * 输入：
 * - kind：身份类型
 * - label：展示文案，可选
 * - className：附加类名，可选
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function IdentityBadge({ kind, label, className }: IdentityBadgeProps) {
  const displayLabel = label.trim() || identityLabelMap[kind]
  const classNames = ['identity-badge', `identity-badge--${kind}`, className].filter(Boolean).join(' ')

  return <span className={classNames}>{displayLabel}</span>
}
