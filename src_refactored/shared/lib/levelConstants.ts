// 01）项目/人员难度等级静态配置（levelConstants）
// 全项目唯一等级数据源，LevelBadge / 表单选项 / 归一化均从此读取
import type { LevelCode } from '../types/level'

// 02）等级定义接口（LevelDefinition）
export interface LevelDefinition {
  /** 等级代号（与 LevelCode 联合类型一一对应） */
  code: LevelCode
  /** 中文名称 */
  label: string
  /** 中文含义说明 */
  description: string
  /** 展示文字色 */
  color: string
  /** 展示背景色 */
  background: string
}

// 03）等级元数据表（LEVEL_DEFINITIONS）
// 从高到低排列：S → E
// S: 研究突破级 — 探索未知领域，产出原创性方案或论文级成果
// A: 专业应用级 — 运用深度专业知识，解决复杂的真实世界问题
// B: 复杂工程级 — 多模块协作，需独立完成架构设计与关键技术选型
// C: 标准工程级 — 遵循规范完成中等规模功能模块的完整开发周期
// D: 基础实践级 — 在指导下完成独立功能点，掌握基本工具链与流程
// E: 入门操作级 — 学习基本概念，完成简单任务以熟悉领域环境
export const LEVEL_DEFINITIONS: Record<LevelCode, LevelDefinition> = {
  S: { code: 'S', label: '研究突破级', description: '探索未知领域，产出原创性方案或论文级成果', color: '#e6a817', background: 'rgba(230, 168, 23, 0.15)' },
  A: { code: 'A', label: '专业应用级', description: '运用深度专业知识，解决复杂的真实世界问题', color: '#e05555', background: 'rgba(224, 85, 85, 0.15)' },
  B: { code: 'B', label: '复杂工程级', description: '多模块协作，需独立完成架构设计与关键技术选型', color: '#a44ad3', background: 'rgba(164, 74, 211, 0.15)' },
  C: { code: 'C', label: '标准工程级', description: '遵循规范完成中等规模功能模块的完整开发周期', color: '#3a8edb', background: 'rgba(58, 142, 219, 0.15)' },
  D: { code: 'D', label: '基础实践级', description: '在指导下完成独立功能点，掌握基本工具链与流程', color: '#46b357', background: 'rgba(70, 179, 87, 0.15)' },
  E: { code: 'E', label: '入门操作级', description: '学习基本概念，完成简单任务以熟悉领域环境', color: '#8b97a8', background: 'rgba(139, 151, 168, 0.15)' },
}

// 04）等级代码列表（LEVEL_CODES）— 按 S→E 排列，用于白名单校验
export const LEVEL_CODES: LevelCode[] = Object.keys(LEVEL_DEFINITIONS) as LevelCode[]

// 05）等级选项列表（LEVEL_OPTIONS）— 用于下拉选择器 { value, label }
export const LEVEL_OPTIONS = LEVEL_CODES.map((code) => ({
  value: code,
  label: `${code} (${LEVEL_DEFINITIONS[code].label})`,
}))

// 06）默认项目等级（DEFAULT_PROJECT_LEVEL）
// 新建项目表单 / 回退占位场景均使用此默认值
export const DEFAULT_PROJECT_LEVEL: LevelCode = 'C'

// 07）兜底等级定义（FALLBACK_LEVEL_DEFINITION）
// 当 level 不在 LEVEL_DEFINITIONS 白名单时（如后端尚未迁移的旧数据），使用此兜底。
// 展示效果为灰色 "未知" 标识，避免页面直接崩白。
export const FALLBACK_LEVEL_DEFINITION: LevelDefinition = {
  code: 'C',
  label: '未知',
  description: '未识别的等级，可能来自后端旧数据',
  color: '#999999',
  background: 'rgba(153, 153, 153, 0.15)',
}

// 08）安全获取等级定义（resolveLevelDefinition）
/**
 * 函数名：resolveLevelDefinition
 * 功能：从 LEVEL_DEFINITIONS 安全获取指定 level 的定义，未知值时返回兜底定义。
 * 输入：
 * - level：LevelCode 值
 * 输出：
 * - 返回值：LevelDefinition（已知等级的真实定义 或 兜底定义）
 */
export function resolveLevelDefinition(level: LevelCode): LevelDefinition {
  return LEVEL_DEFINITIONS[level] ?? FALLBACK_LEVEL_DEFINITION
}

// 09）归一化等级（normalizeLevel）
/**
 * 函数名：normalizeLevel
 * 功能：将任意字符串归一化为合法的 LevelCode，不在白名单内则返回 fallback。
 * 实现方法：
 * - trim + toUpperCase 后与 LEVEL_CODES 白名单比对
 * - 命中白名单则返回对应 LevelCode
 * - 未命中时返回指定的 fallback 值
 * 输入：
 * - raw：原始等级字符串（可能来自 API DTO / 表单 / 缓存）
 * - fallback：非法值时的回退等级（若为 null 则在非法时返回 null）
 * 输出：
 * - 返回值：LevelCode | null
 * - 副作用：无
 */
export function normalizeLevel(raw: string | null | undefined, fallback: LevelCode | null): LevelCode | null {
  const normalized = (raw ?? '').trim().toUpperCase()
  if (!normalized || normalized === 'NULL' || normalized === 'UNDEFINED') return fallback
  return (LEVEL_CODES as string[]).includes(normalized) ? (normalized as LevelCode) : fallback
}
