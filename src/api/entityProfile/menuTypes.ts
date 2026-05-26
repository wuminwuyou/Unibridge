import type { EntityCode } from '../resourceUid'

// 01）机构顶部菜单数据（EntityProfileMenuData）
export interface EntityProfileMenuData {
  entityCode: EntityCode
  entityName: string
  logoUrl: string | null
  boundAdminCount: number
  minAdminCount: number
  maxAdminCount: number
  entityFullyActivated: boolean
}
