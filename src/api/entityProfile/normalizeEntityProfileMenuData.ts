import { readRecordBoolean, readRecordField, readRecordNumber, readRecordString } from '../recordFieldUtils'
import type { EntityProfileMenuData } from './menuTypes'

// 01）归一化机构顶部菜单响应（normalizeEntityProfileMenuData）
/**
 * 函数名：normalizeEntityProfileMenuData
 * 功能：归一化 GET /entity-profile/menu 响应字段。
 * 输入：
 * - raw：接口原始 data
 * 输出：
 * - 返回值：EntityProfileMenuData
 * - 副作用：无
 */
export function normalizeEntityProfileMenuData(
  raw: EntityProfileMenuData & Record<string, unknown>,
): EntityProfileMenuData {
  const record = raw as Record<string, unknown>
  const boundAdminCount = readRecordNumber(record, 'boundAdminCount', 0, 'bound_admin_count')
  const minAdminCount = readRecordNumber(record, 'minAdminCount', 2, 'min_admin_count')
  const maxAdminCount = readRecordNumber(record, 'maxAdminCount', 3, 'max_admin_count')

  return {
    entityCode:
      readRecordString(record, 'entityCode', { snakeKey: 'entity_code' }) ??
      readRecordString(record, 'institutionCode', { snakeKey: 'institution_code' }) ??
      raw.entityCode,
    entityName:
      readRecordString(record, 'entityName', { snakeKey: 'entity_name' }) ??
      readRecordString(record, 'name') ??
      raw.entityName ??
      '',
    logoUrl: readRecordString(record, 'logoUrl', { nullable: true, snakeKey: 'logo_url' }) ?? null,
    boundAdminCount,
    minAdminCount,
    maxAdminCount,
    entityFullyActivated:
      readRecordBoolean(record, 'entityFullyActivated', 'entity_fully_activated') ||
      boundAdminCount >= minAdminCount,
  }
}
