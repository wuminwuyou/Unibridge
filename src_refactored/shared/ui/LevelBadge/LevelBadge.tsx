// 01）能力等级标识组件（LevelBadge）
// 色板与展示数据来源于 shared/lib/levelConstants.ts，统一管理
import type { LevelCode } from '@shared/types/level'
import { LEVEL_DEFINITIONS, FALLBACK_LEVEL_DEFINITION } from '@shared/lib/levelConstants'
import type { LevelDefinition } from '@shared/lib/levelConstants'
import './LevelBadge.css'

// 02）能力等级标识参数类型（LevelBadgeProps）
export interface LevelBadgeProps {
  level: LevelCode
  className?: string
  variant?: 'text' | 'pill'
  /** 是否显示半透明背景色（pill 变体有效，默认 true） */
  showBackground?: boolean
}

// 03）安全获取等级定义
// 当 level 不在 LEVEL_DEFINITIONS 白名单时（如后端尚未迁移的旧数据 N/R/SR 等），
// 返回灰色兜底定义而非 undefined，避免页面直接崩白。
function safeGetDefinition(level: LevelCode): LevelDefinition {
  return LEVEL_DEFINITIONS[level] ?? FALLBACK_LEVEL_DEFINITION
}

// 04）能力等级标识组件（LevelBadge）
/**
 * 函数名：LevelBadge
 * 功能：统一渲染能力等级文案与颜色规则，供项目卡片和个人空间等页面复用。
 * 实现方法：
 * - 从 LEVEL_DEFINITIONS 安全读取等级对应色板（未识别时使用灰色兜底）
 * - variant 为 text 时仅渲染文本色
 * - variant 为 pill 时渲染文本色 + 半透明背景 + 圆角徽章样式
 * - 仅展示等级代号（如 "S"），中文名称仅在项目发布页的下拉选项中显示
 * 输入：
 * - level：能力等级值（S/A/B/C/D/E 或后端旧数据如 N/R）
 * - className：可选附加类名
 * - variant：展示样式类型，默认 text
 * 输出：
 * - 返回值：JSX.Element，能力等级标识节点
 * - 副作用：无
 */
function LevelBadge({ level, className, variant = 'text', showBackground = true }: LevelBadgeProps) {
  const def = safeGetDefinition(level)
  const display = level

  if (variant === 'pill') {
    return (
      <span
        className={`level-badge--pill${className ? ` ${className}` : ''}`}
        style={{
          color: def.color,
          background: showBackground ? def.background : 'transparent',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {display}
      </span>
    )
  }

  return (
    <span className={className} style={{ color: def.color }}>
      {display}
    </span>
  )
}

export default LevelBadge
