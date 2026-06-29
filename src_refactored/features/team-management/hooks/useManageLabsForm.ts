// 01）实验室管理表单 Hook（useManageLabsForm）
import { useCallback, useEffect, useRef, useState } from 'react'
import type { EntityCode } from '@shared/api/resourceUid'
import type { EntityProfileTeamPreviewDto } from '@entities/organization/model/types'
import {
  EntityProfileApiError,
  createEntityTeam, deleteEntityTeam, updateEntityTeam, searchEntityProfileUsers,
} from '@entities/organization/api/entityProfileApi'

// 02）用户预览候选（LeaderSuggestionItem）
export interface LeaderSuggestionItem {
  uid: string
  nickname: string
  realName: string | null
  avatarUrl: string | null
}

// 03）可编辑实验室项（EditableLabItem）
export interface EditableLabItem {
  teamUid: string
  name: string
  logoUrl: string
  tags: string[]
  description: string
  leaderUid: string
  leaderDisplayName: string
  memberCount: number
  isNew: boolean
  isEditing: boolean
}

// 04）Hook 入参（UseManageLabsFormOptions）
interface UseManageLabsFormOptions {
  entityCode: EntityCode
  initialLabs: EntityProfileTeamPreviewDto[]
  onCancel: () => void
  onSaved: () => void
  onApiError: (message: string) => void
}

// 05）Hook 返回值（UseManageLabsFormResult）
export interface UseManageLabsFormResult {
  labs: EditableLabItem[]
  isSaving: boolean
  errorMessage: string | null
  newLabName: string
  newLabLeaderQuery: string
  newLabLeaderUid: string
  newLabLeaderDisplayName: string
  isSearchingLeader: boolean
  leaderSuggestions: LeaderSuggestionItem[]
  showLeaderSuggestions: boolean
  setNewLabName: (value: string) => void
  setNewLabLeaderQuery: (value: string) => void
  selectLeader: (user: LeaderSuggestionItem) => void
  clearLeader: () => void
  closeLeaderSuggestions: () => void
  createLab: () => Promise<void>
  startEditingLab: (teamUid: string) => void
  cancelEditingLab: (teamUid: string) => void
  editingName: string
  editingLeaderQuery: string
  editingLeaderUid: string
  editingLeaderDisplayName: string
  editingLeaderSuggestions: LeaderSuggestionItem[]
  editingShowLeaderSuggestions: boolean
  isSearchingEditingLeader: boolean
  setEditingName: (value: string) => void
  setEditingLeaderQuery: (value: string) => void
  selectEditingLeader: (user: LeaderSuggestionItem) => void
  clearEditingLeader: () => void
  closeEditingLeaderSuggestions: () => void
  saveEditingLab: (teamUid: string) => void
  deleteLab: (teamUid: string) => void
  handleCancel: () => void
}

// 06）解析用户展示名称（resolveUserDisplayName）
function resolveUserDisplayName(user: LeaderSuggestionItem): string {
  const realName = user.realName?.trim()
  if (realName) return realName
  return user.nickname || user.uid
}

// 07）从初始列表映射可编辑项（mapInitialLabs）
function mapInitialLabs(labs: EntityProfileTeamPreviewDto[]): EditableLabItem[] {
  return labs.map((lab) => ({
    teamUid: lab.teamUid,
    name: lab.name,
    logoUrl: lab.logoUrl ?? '',
    tags: [],
    description: lab.description ?? '',
    leaderUid: lab.leaderUid ?? '',
    leaderDisplayName: lab.leaderDisplayName ?? '',
    memberCount: lab.memberCount ?? 0,
    isNew: false,
    isEditing: false,
  }))
}

// 08）实验室管理表单 Hook（useManageLabsForm）
/**
 * 函数名：useManageLabsForm
 * 功能：管理机构下属实验室的增删改查与负责人搜索表单状态。
 * 实现方法：
 * - 行内编辑（name、leader）+ 顶部创建表单
 * - 负责人候选通过 entities/organization/api/searchEntityProfileUsers 反抖动检索
 * 输入：
 * - options：见 UseManageLabsFormOptions
 * 输出：
 * - 返回值：UseManageLabsFormResult
 * - 副作用：发起网络请求
 */
export function useManageLabsForm(options: UseManageLabsFormOptions): UseManageLabsFormResult {
  const { entityCode, initialLabs, onCancel, onSaved } = options

  const [labs, setLabs] = useState<EditableLabItem[]>(() => mapInitialLabs(initialLabs))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 创建表单
  const [newLabName, setNewLabName] = useState('')
  const [newLabLeaderQuery, setNewLabLeaderQuery] = useState('')
  const [newLabLeaderUid, setNewLabLeaderUid] = useState('')
  const [newLabLeaderDisplayName, setNewLabLeaderDisplayName] = useState('')
  const [leaderSuggestions, setLeaderSuggestions] = useState<LeaderSuggestionItem[]>([])
  const [showLeaderSuggestions, setShowLeaderSuggestions] = useState(false)
  const [isSearchingLeader, setIsSearchingLeader] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(0)

  // 编辑表单
  const [editingTeamUid, setEditingTeamUid] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingLeaderQuery, setEditingLeaderQuery] = useState('')
  const [editingLeaderUid, setEditingLeaderUid] = useState('')
  const [editingLeaderDisplayName, setEditingLeaderDisplayName] = useState('')
  const [editingLeaderSuggestions, setEditingLeaderSuggestions] = useState<LeaderSuggestionItem[]>([])
  const [editingShowLeaderSuggestions, setEditingShowLeaderSuggestions] = useState(false)
  const [isSearchingEditingLeader, setIsSearchingEditingLeader] = useState(false)
  const editingSearchTimerRef = useRef<ReturnType<typeof setTimeout>>(0)

  useEffect(() => { setLabs(mapInitialLabs(initialLabs)) }, [initialLabs])

  const debounceSearchUsers = useCallback(
    (keyword: string, mode: 'create' | 'edit') => {
      const setSuggestions = mode === 'create' ? setLeaderSuggestions : setEditingLeaderSuggestions
      const setShow = mode === 'create' ? setShowLeaderSuggestions : setEditingShowLeaderSuggestions
      const setIsSearching = mode === 'create' ? setIsSearchingLeader : setIsSearchingEditingLeader

      const trimmed = keyword.trim()
      if (!trimmed || trimmed.length < 1) {
        setSuggestions([])
        setShow(false)
        return
      }

      setIsSearching(true)
      void searchEntityProfileUsers(trimmed)
        .then((users) => {
          setSuggestions(users)
          setShow(users.length > 0)
        })
        .catch(() => {
          setSuggestions([])
          setShow(false)
        })
        .finally(() => { setIsSearching(false) })
    },
    [],
  )

  const triggerLeaderSearch = useCallback((value: string) => {
    setNewLabLeaderQuery(value)
    setNewLabLeaderUid('')
    setNewLabLeaderDisplayName('')
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => { debounceSearchUsers(value, 'create') }, 300)
  }, [debounceSearchUsers])

  const selectLeader = useCallback((user: LeaderSuggestionItem) => {
    setNewLabLeaderUid(user.uid)
    setNewLabLeaderDisplayName(resolveUserDisplayName(user))
    setNewLabLeaderQuery(resolveUserDisplayName(user))
    setShowLeaderSuggestions(false)
  }, [])

  const clearLeader = useCallback(() => {
    setNewLabLeaderUid('')
    setNewLabLeaderDisplayName('')
    setNewLabLeaderQuery('')
    setShowLeaderSuggestions(false)
  }, [])

  const closeLeaderSuggestions = useCallback(() => { setShowLeaderSuggestions(false) }, [])

  const triggerEditingLeaderSearch = useCallback((value: string) => {
    setEditingLeaderQuery(value)
    setEditingLeaderUid('')
    setEditingLeaderDisplayName('')
    clearTimeout(editingSearchTimerRef.current)
    editingSearchTimerRef.current = setTimeout(() => { debounceSearchUsers(value, 'edit') }, 300)
  }, [debounceSearchUsers])

  const selectEditingLeader = useCallback((user: LeaderSuggestionItem) => {
    setEditingLeaderUid(user.uid)
    setEditingLeaderDisplayName(resolveUserDisplayName(user))
    setEditingLeaderQuery(resolveUserDisplayName(user))
    setEditingShowLeaderSuggestions(false)
  }, [])

  const clearEditingLeader = useCallback(() => {
    setEditingLeaderUid('')
    setEditingLeaderDisplayName('')
    setEditingLeaderQuery('')
    setEditingShowLeaderSuggestions(false)
  }, [])

  const closeEditingLeaderSuggestions = useCallback(() => {
    setEditingShowLeaderSuggestions(false)
  }, [])

  const createLab = useCallback(async (): Promise<void> => {
    const trimmedName = newLabName.trim()
    if (!trimmedName) { setErrorMessage('请输入实验室名称'); return }

    setErrorMessage(null)
    setIsSaving(true)

    try {
      await createEntityTeam({
        entityCode,
        name: trimmedName,
        leaderUid: newLabLeaderUid || undefined,
      })
      setNewLabName('')
      setNewLabLeaderQuery('')
      setNewLabLeaderUid('')
      setNewLabLeaderDisplayName('')
      setShowLeaderSuggestions(false)
      onSaved()
    } catch (error) {
      const message = error instanceof EntityProfileApiError ? error.message : '创建实验室失败，请稍后重试'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }, [entityCode, newLabName, newLabLeaderUid, onSaved])

  const startEditingLab = useCallback((teamUid: string) => {
    setLabs((current) =>
      current.map((lab) => ({ ...lab, isEditing: lab.teamUid === teamUid })),
    )
    const target = labs.find((l) => l.teamUid === teamUid)
    if (target) {
      setEditingTeamUid(teamUid)
      setEditingName(target.name)
      setEditingLeaderUid(target.leaderUid)
      setEditingLeaderDisplayName(target.leaderDisplayName)
      setEditingLeaderQuery(target.leaderDisplayName)
    }
  }, [labs])

  const cancelEditingLab = useCallback((teamUid: string) => {
    setLabs((current) =>
      current.map((lab) => (lab.teamUid === teamUid ? { ...lab, isEditing: false } : lab)),
    )
    setEditingTeamUid(null)
    setEditingLeaderSuggestions([])
    setEditingShowLeaderSuggestions(false)
  }, [])

  const saveEditingLab = useCallback(async (teamUid: string): Promise<void> => {
    const trimmedName = editingName.trim()
    if (!trimmedName) { setErrorMessage('请填写实验室名称'); return }

    const updateBody: Record<string, unknown> = {
      name: trimmedName,
      leaderUid: editingLeaderUid || null,
      entityCode,
    }

    setErrorMessage(null)
    setIsSaving(true)

    try {
      await updateEntityTeam(teamUid, updateBody as Parameters<typeof updateEntityTeam>[1])
      setLabs((current) =>
        current.map((lab) => {
          if (lab.teamUid !== teamUid) return lab
          return {
            ...lab,
            name: trimmedName,
            leaderUid: editingLeaderUid,
            leaderDisplayName: editingLeaderDisplayName,
            isEditing: false,
          }
        }),
      )
      setEditingTeamUid(null)
      setEditingLeaderSuggestions([])
      setEditingShowLeaderSuggestions(false)
      onSaved()
    } catch (error) {
      const message = error instanceof EntityProfileApiError ? error.message : '更新实验室失败，请稍后重试'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }, [editingName, editingLeaderUid, editingLeaderDisplayName, entityCode, onSaved])

  const deleteLab = useCallback(async (teamUid: string): Promise<void> => {
    setErrorMessage(null)
    setIsSaving(true)
    try {
      await deleteEntityTeam(teamUid)
      setLabs((current) => current.filter((lab) => lab.teamUid !== teamUid))
      if (editingTeamUid === teamUid) {
        setEditingTeamUid(null)
        setEditingLeaderSuggestions([])
        setEditingShowLeaderSuggestions(false)
      }
      onSaved()
    } catch (error) {
      const message = error instanceof EntityProfileApiError ? error.message : '删除实验室失败，请稍后重试'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }, [editingTeamUid, onSaved])

  const handleCancel = useCallback(() => { onCancel() }, [onCancel])

  return {
    labs,
    isSaving,
    errorMessage,
    newLabName,
    newLabLeaderQuery,
    newLabLeaderUid,
    newLabLeaderDisplayName,
    isSearchingLeader,
    leaderSuggestions,
    showLeaderSuggestions,
    setNewLabName,
    setNewLabLeaderQuery: triggerLeaderSearch,
    selectLeader,
    clearLeader,
    closeLeaderSuggestions,
    createLab,
    startEditingLab,
    cancelEditingLab,
    editingName,
    editingLeaderQuery,
    editingLeaderUid,
    editingLeaderDisplayName,
    editingLeaderSuggestions,
    editingShowLeaderSuggestions,
    isSearchingEditingLeader,
    setEditingName,
    setEditingLeaderQuery: triggerEditingLeaderSearch,
    selectEditingLeader,
    clearEditingLeader,
    closeEditingLeaderSuggestions,
    saveEditingLab: (uid) => { void saveEditingLab(uid) },
    deleteLab: (uid) => { void deleteLab(uid) },
    handleCancel,
  }
}
