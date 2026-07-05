// 01）首页流 Widget 数据 Hook（useHomeFeedWidget）
import { useEffect, useState } from 'react'
import { getHomeFeed, FeedApiError } from '../../../entities/project/api/projectFeedApi'
import type { FeedLoadState } from '../../../entities/project/model/feedTypes'
import type { ProjectItem } from '../../../shared/types/project'
import type { ProfileNoteItem } from '../../../entities/note/model/profileNoteItem'
import { resolveNoteAuthorNickname } from '../../../entities/note/lib/resolveNoteAuthorNickname'

export interface UseHomeFeedWidgetResult {
  loadState: FeedLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  notes: ProfileNoteItem[]
}

export function useHomeFeedWidget(): UseHomeFeedWidgetResult {
  const [loadState, setLoadState] = useState<FeedLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      setLoadState('loading'); setErrorMessage(null)
      try {
        const data = await getHomeFeed()
        if (cancelled) return
        const pItems = (data as any).projects ?? []
        const nItems = (data as any).notes ?? []
        setProjects(Array.isArray(pItems) ? pItems.map((p: any) => ({ uid: p.uid, title: p.title ?? '', preview: p.preview ?? p.summary ?? '', tags: p.tags ?? [], category: p.projectCategory ?? 'COMMERCIAL', ownerOrganization: p.ownerOrganization ?? '', publishTime: p.publishTime ?? '', level: p.level ?? 'N', logoSvgUrl: p.logoSvgUrl ?? null, teamSize: p.teamSize ?? null, duration: p.duration ?? null })) : [])
        setNotes(Array.isArray(nItems) ? nItems.map((n: any) => ({ uid: n.uid, title: n.title ?? '', summary: n.summary ?? n.preview ?? '', contentType: n.noteType === 'VIDEO' ? '视频' : '图文', tags: Array.isArray(n.tags) ? (typeof n.tags[0] === 'string' ? n.tags : n.tags.map((t: any) => t.label ?? '')) : [], publishTime: n.publishTime ?? '', updateTime: n.publishTime ?? '', views: n.views ?? 0, comments: n.comments ?? 0, favorites: n.favorites ?? 0, cover: n.coverUrl ?? '', authorNickname: resolveNoteAuthorNickname(n), authorOrganization: n.authorOrganization, authorAvatar: n.authorAvatar, videoDuration: n.videoDuration })) : [])
        setLoadState('ready')
      } catch (e) {
        if (cancelled) return
        setErrorMessage(e instanceof FeedApiError ? e.message : '加载首页推荐失败')
        setLoadState('error')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return { loadState, errorMessage, projects, notes }
}
