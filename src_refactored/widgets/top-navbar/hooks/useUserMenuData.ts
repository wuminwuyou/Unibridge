// 01）用户菜单面板数据 Hook（useUserMenuData）—— hover 时懒加载完整 menu
import { useQuery } from '@tanstack/react-query'
import { getApi } from '../../../shared/api/http'
import { getAccessToken, getUserUid, setMenuCache } from '../../../shared/lib/tokenStorage'
import type { MenuCacheData } from '../../../shared/lib/tokenStorage'

// 02）拉取用户菜单面板数据（fetchUserMenu）
async function fetchUserMenu(): Promise<MenuCacheData> {
  const token = getAccessToken()
  if (!token) throw new Error('未登录')
  const uid = getUserUid()
  const path = uid ? `/user-profile/menu?uid=${encodeURIComponent(uid)}` : '/user-profile/menu'
  const raw = await getApi<Record<string, unknown>>(path)
  const result: MenuCacheData = {
    uid: typeof raw.uid === 'string' ? raw.uid : (uid ?? ''),
    nickname: (typeof raw.nickname === 'string' ? raw.nickname : '用户').trim(),
    level: typeof raw.level === 'string' ? raw.level : null,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl.trim() || null : null,
    verifiedOrganization: typeof raw.verifiedOrganization === 'string' ? raw.verifiedOrganization : null,
    verifyStatus: typeof raw.verifyStatus === 'string' ? raw.verifyStatus : (raw.verify_status as string) ?? null,
    subtitle: null,
    entityCode: typeof raw.entityCode === 'string' ? raw.entityCode : undefined,
  }
  setMenuCache(result)
  return result
}

// 03）用户菜单面板数据 Hook（useUserMenuData）
export function useUserMenuData(enabled: boolean) {
  return useQuery({
    queryKey: ['user-menu'],
    queryFn: fetchUserMenu,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
