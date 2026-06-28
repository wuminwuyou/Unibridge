import type { UserResourceUid } from '../../../shared/api/resourceUid'

// 01）用户公开预览 DTO（UserPublicPreviewDto）
export interface UserPublicPreviewDto {
  uid: UserResourceUid
  nickname: string
  realName?: string | null
  avatarUrl: string | null
}

// 02）用户实名认证预览 DTO（UserVerifiedPreviewDto）
export interface UserVerifiedPreviewDto {
  uid: UserResourceUid
  realName: string
  nickname: string
  avatarUrl: string | null
  verified: boolean
  role: string | null
}
