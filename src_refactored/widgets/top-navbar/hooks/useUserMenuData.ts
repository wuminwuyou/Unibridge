// 01）用户菜单数据 Hook（useUserMenuData）—— React Query 懒加载
import { useQuery } from '@tanstack/react-query'
import { getApi } from '../../../shared/api/http'
import { getAccessToken } from '../../../shared/lib/tokenStorage'
import { getUserUid } from '../../../shared/lib/tokenStorage'

interface UserMenuData {
  nickname: string
  level: string | null
  avatarUrl: string | null
  verifiedOrganization: string | null
  verifyStatus?: string | null
  uid?: string
}

async function fetchUserMenu(): Promise<UserMenuData> {
  const token = getAccessToken()
  if (!token) throw new Error('未登录')
  const uid = getUserUid()
  const path = uid ? `/user-profile/menu?uid=${encodeURIComponent(uid)}` : '/user-profile/menu'
  const raw = await getApi<Record<string, unknown>>(path)
  return {
    nickname: (typeof raw.nickname === 'string' ? raw.nickname : '用户').trim(),
    level: typeof raw.level === 'string' ? raw.level : null,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : null,
    verifiedOrganization: typeof raw.verifiedOrganization === 'string' ? raw.verifiedOrganization : null,
    verifyStatus: typeof raw.verifyStatus === 'string' ? raw.verifyStatus : (raw.verify_status as string) ?? null,
    uid: typeof raw.uid === 'string' ? raw.uid : undefined,
  }
}

export function useUserMenuData(enabled: boolean) {
  return useQuery({
    queryKey: ['user-menu'],
    queryFn: fetchUserMenu,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
