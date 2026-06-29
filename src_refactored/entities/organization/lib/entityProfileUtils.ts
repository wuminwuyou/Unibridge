// 01）机构主体辅助工具（entities/organization/lib/entityProfileUtils）
import type { EntityCode } from '@shared/api/resourceUid'

/** 高校主体代码标准位数（5 位）；企业等统一社会信用代码为 18 位，暂不展示实验室 */
export const ENTITY_SCHOOL_CODE_LENGTH = 5

// 02）判断机构是否支持实验室展示（resolveEntitySupportsLabs）
/**
 * 函数名：resolveEntitySupportsLabs
 * 功能：按 entityCode 位数判断是否渲染实验室相关 UI（高校 5 位，企业等为长码）。
 * 实现方法：
 * - 去除非数字后长度为 5 → 视为高校主体，可展示下属实验室
 * - 其余（如 18 位统一社会信用代码）→ 企业/组织，暂不展示实验室
 * 输入：
 * - entityCode：机构主体代码
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function resolveEntitySupportsLabs(entityCode: EntityCode | string | null | undefined): boolean {
  if (!entityCode) return false
  const digitsOnly = entityCode.trim().replace(/\D/g, '')
  return digitsOnly.length === ENTITY_SCHOOL_CODE_LENGTH
}
