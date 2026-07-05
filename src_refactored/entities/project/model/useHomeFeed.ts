// 01）首页 Feed 数据 Hook（useHomeFeedData）
import { useEffect, useState } from 'react'
import { getHomeFeed, FeedApiError } from '../api/projectFeedApi'
import type { FeedLoadState } from '../model/feedTypes'
import type { ProjectItem } from '../../../shared/types/project'
import { mapFeedNoteToProfileNoteItem } from '../../note/lib/noteFeedMappers'
import type { ProfileNoteItem } from '../../note/model/profileNoteItem'

export interface UseHomeFeedDataResult {
  loadState: FeedLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  notes: ProfileNoteItem[]
}

export function useHomeFeedData(): UseHomeFeedDataResult {
  const [loadState, setLoadState] = useState<FeedLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])

  useEffect(() => {
    let isCancelled = false
    async function load(): Promise<void> {
      setLoadState('loading'); setErrorMessage(null)
      try {
        const data = await getHomeFeed()
        if (isCancelled) return
        const pItems = (data as any).projects ?? []
        const nItems = (data as any).notes ?? []
        setProjects(Array.isArray(pItems) ? pItems.map((p: any) => ({ uid: p.uid, title: p.title ?? '', preview: p.preview ?? p.summary ?? '', tags: p.tags ?? [], category: p.projectCategory ?? 'COMMERCIAL', ownerOrganization: p.ownerOrganization ?? '', publishTime: p.publishTime ?? '', level: p.level ?? 'N', logoSvgUrl: p.logoSvgUrl ?? null, teamSize: p.teamSize ?? null, duration: p.duration ?? null })) : [])
        setNotes(Array.isArray(nItems) ? nItems.map(mapFeedNoteToProfileNoteItem) : [])
        setLoadState('ready')
      } catch (e) {
        if (isCancelled) return
        setErrorMessage(e instanceof FeedApiError ? e.message : '加载失败')
        setLoadState('error')
      }
    }
    void load()
    return () => { isCancelled = true }
  }, [])

  return { loadState, errorMessage, projects, notes }
}
