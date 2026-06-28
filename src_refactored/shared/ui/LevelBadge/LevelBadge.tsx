import type { LevelCode } from '../../types/level'

// 01）能力等级色板映射（levelPaletteMap）
const levelPaletteMap: Record<LevelCode, { color: string; background: string }> = {
  N: { color: '#3a8edb', background: 'rgba(58, 142, 219, 0.15)' },
  R: { color: '#46b357', background: 'rgba(70, 179, 87, 0.15)' },
  SR: { color: '#d09a2f', background: 'rgba(208, 154, 47, 0.15)' },
  SSR: { color: '#db5a7d', background: 'rgba(219, 90, 125, 0.15)' },
  UR: { color: '#a44ad3', background: 'rgba(164, 74, 211, 0.15)' },
}

// 02）能力等级标识参数类型（LevelBadgeProps）
export interface LevelBadgeProps {
  level: LevelCode
  className?: string
  variant?: 'text' | 'pill'
}

// 03）能力等级标识组件（LevelBadge）
/**
 * 函数名：LevelBadge
 * 功能：统一渲染能力等级文案与颜色规则，供项目卡片和个人空间等页面复用。
 * 实现方法：
 * - 基于 levelPaletteMap 读取等级对应文本色与背景色
 * - variant 为 text 时仅渲染文本色，保持轻量展示
 * - variant 为 pill 时渲染文本色与半透明背景，适配徽章场景
 * 输入：
 * - level：能力等级值（N/R/SR/SSR/UR）
 * - className：可选附加类名
 * - variant：展示样式类型，默认 text
 * 输出：
 * - 返回值：JSX.Element，能力等级标识节点
 * - 副作用：无
 */
function LevelBadge({ level, className, variant = 'text' }: LevelBadgeProps) {
  const palette = levelPaletteMap[level]
  const style =
    variant === 'pill'
      ? { color: palette.color, background: palette.background, borderRadius: '999px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }
      : { color: palette.color }

  return (
    <span className={className} style={style}>
      {level}
    </span>
  )
}

export default LevelBadge
