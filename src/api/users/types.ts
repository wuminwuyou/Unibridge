import type { UserResourceUid } from '../resourceUid'

// 01）用户公开预览 DTO（UserPublicPreviewDto）
export interface UserPublicPreviewDto {
  uid: UserResourceUid
  nickname: string
  realName?: string | null
  avatarUrl: string | null
}
