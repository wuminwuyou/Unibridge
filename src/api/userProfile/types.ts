// 01）用户资料菜单数据类型定义（UserProfileMenuData）
export interface UserProfileMenuData {
  userId: number
  nickname: string
  level: string | null
  avatarUrl: string | null
  verifiedOrganization: string | null
}
