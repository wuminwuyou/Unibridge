import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EntityProfileApiError,
  createEntityTeam,
  deleteEntityTeam,
  updateEntityTeam,
  searchEntityProfileUsers,
} from '../../../../api/entityProfile'
import type { EntityCode } from '../../../../api/resourceUid'
import type { UserPublicPreviewDto } from '../../../../api/users/types'
import type { OrganizationTeamItem } from '../../variants/OrganizationView/types'

// 01）可编辑实验室项（EditableLabItem）
export interface EditableLabItem {
  teamUid: string
  name: string
  logoUrl: string
  /** tags 与 description 保留在上下文中，不在编辑表单显示 */
  tags: string[]
  description: string
  leaderUid: string
  leaderDisplayName: string
  memberCount: number
  isNew: boolean
  isEditing: boolean
}

// 02）管理实验室表单 Hook 参数（UseManageLabsFormOptions）
interface UseManageLabsFormOptions {
  entityCode: EntityCode
  initialLabs: OrganizationTeamItem[]
  onCancel: () => void
  onSaved: () => void
  onApiError: (message: string) => void
}

// 03）管理实验室表单 Hook 返回值（UseManageLabsFormResult）
export interface UseManageLabsFormResult {
  labs: EditableLabItem[]
  isSaving: boolean
  errorMessage: string | null
  /** 创建新实验室表单字段 */
  newLabName: string
  newLabLeaderQuery: string
  newLabLeaderUid: string
  newLabLeaderDisplayName: string
  isSearchingLeader: boolean
  leaderSuggestions: UserPublicPreviewDto[]
  showLeaderSuggestions: boolean
  setNewLabName: (value: string) => void
  setNewLabLeaderQuery: (value: string) => void
  selectLeader: (user: UserPublicPreviewDto) => void
  clearLeader: () => void
  closeLeaderSuggestions: () => void
  createLab: () => Promise<void>
  startEditingLab: (teamUid: string) => void
  cancelEditingLab: (teamUid: string) => void
  /** 当前编辑的实验室字段 setter */
  editingName: string
  editingLeaderQuery: string
  editingLeaderUid: string
  editingLeaderDisplayName: string
  editingLeaderSuggestions: UserPublicPreviewDto[]
  editingShowLeaderSuggestions: boolean
  isSearchingEditingLeader: boolean
  setEditingName: (value: string) => void
  setEditingLeaderQuery: (value: string) => void
  selectEditingLeader: (user: UserPublicPreviewDto) => void
  clearEditingLeader: () => void
  closeEditingLeaderSuggestions: () => void
  saveEditingLab: (teamUid: string) => void
  deleteLab: (teamUid: string) => void
  handleCancel: () => void
}

// 04）解析用户展示名称（resolveUserDisplayName）
function resolveUserDisplayName(user: UserPublicPreviewDto): string {
  const realName = user.realName?.trim()
  if (realName) {
    return realName
  }
  return user.nickname || user.uid
}

// 05）从初始实验室列表映射编辑项（mapInitialLabs）
function mapInitialLabs(labs: OrganizationTeamItem[]): EditableLabItem[] {
  return labs.map((lab) => ({
    teamUid: lab.teamUid,
    name: lab.name,
    logoUrl: lab.logoUrl ?? '',
    tags: [],
    description: lab.description ?? '',
    leaderUid: lab.leaderUid ?? '',
    leaderDisplayName: lab.leaderDisplayName ?? '',
    memberCount: lab.memberCount,
    isNew: false,
    isEditing: false,
  }))
}

// 06）管理实验室表单 Hook（useManageLabsForm）
/**
 * 函数名：useManageLabsForm
 * 功能：管理机构下属实验室的表单状态、增删改查与负责人搜索。
 * 实现方法：
 * - 已有实验室列表支持行内编辑（name、tags、description、leader）
 * - 创建新实验室表单独立于已有列表
 * - 负责人选择通过 searchEntityProfileUsers 实现模糊匹配下拉建议
 * - 标签通过逗号/回车分割输入
 * 输入：
 * - options：entityCode、initialLabs、回调函数
 * 输出：
 * - 返回值：UseManageLabsFormResult
 * - 副作用：发起网络请求
 */
export function useManageLabsForm(options: UseManageLabsFormOptions): UseManageLabsFormResult {
  const { entityCode, initialLabs, onCancel, onSaved } = options

  const [labs, setLabs] = useState<EditableLabItem[]>(() => mapInitialLabs(initialLabs))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 创建新实验室表单状态
  const [newLabName, setNewLabName] = useState('')
  const [newLabLeaderQuery, setNewLabLeaderQuery] = useState('')
  const [newLabLeaderUid, setNewLabLeaderUid] = useState('')
  const [newLabLeaderDisplayName, setNewLabLeaderDisplayName] = useState('')

  // 创建表单的负责人搜索
  const [leaderSuggestions, setLeaderSuggestions] = useState<UserPublicPreviewDto[]>([])
  const [showLeaderSuggestions, setShowLeaderSuggestions] = useState(false)
  const [isSearchingLeader, setIsSearchingLeader] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(0)

  // 编辑表单状态（当前正在编辑的实验室）
  const [editingTeamUid, setEditingTeamUid] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingLeaderQuery, setEditingLeaderQuery] = useState('')
  const [editingLeaderUid, setEditingLeaderUid] = useState('')
  const [editingLeaderDisplayName, setEditingLeaderDisplayName] = useState('')
  const [editingLeaderSuggestions, setEditingLeaderSuggestions] = useState<UserPublicPreviewDto[]>([])
  const [editingShowLeaderSuggestions, setEditingShowLeaderSuggestions] = useState(false)
  const [isSearchingEditingLeader, setIsSearchingEditingLeader] = useState(false)
  const editingSearchTimerRef = useRef<ReturnType<typeof setTimeout>>(0)

  useEffect(() => {
    setLabs(mapInitialLabs(initialLabs))
  }, [initialLabs])

  // 07）反抖动搜索用户（debounceSearchUsers）
  const debounceSearchUsers = useCallback(
    (keyword: string, mode: 'create' | 'edit') => {
      const setSuggestions = mode === 'create' ? setLeaderSuggestions : setEditingLeaderSuggestions
      const setShow = mode === 'create' ? setShowLeaderSuggestions : setEditingShowLeaderSuggestions
      const setIsSearching = mode === 'create' ? setIsSearchingLeader : setIsSearchingEditingLeader

      const trimmedKeyword = keyword.trim()
      if (!trimmedKeyword || trimmedKeyword.length < 1) {
        setSuggestions([])
        setShow(false)
        return
      }

      setIsSearching(true)

      void searchEntityProfileUsers(trimmedKeyword)
        .then((users) => {
          setSuggestions(users)
          setShow(users.length > 0)
        })
        .catch(() => {
          setSuggestions([])
          setShow(false)
        })
        .finally(() => {
          setIsSearching(false)
        })
    },
    [],
  )

  // 08）触发创建表单负责人搜索（triggerLeaderSearch）
  const triggerLeaderSearch = useCallback(
    (value: string) => {
      setNewLabLeaderQuery(value)
      setNewLabLeaderUid('')
      setNewLabLeaderDisplayName('')

      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = setTimeout(() => {
        debounceSearchUsers(value, 'create')
      }, 300)
    },
    [debounceSearchUsers],
  )

  // 09）选择创建表单负责人（selectLeader）
  const selectLeader = useCallback((user: UserPublicPreviewDto) => {
    setNewLabLeaderUid(user.uid)
    setNewLabLeaderDisplayName(resolveUserDisplayName(user))
    setNewLabLeaderQuery(resolveUserDisplayName(user))
    setShowLeaderSuggestions(false)
  }, [])

  // 10）清除创建表单负责人（clearLeader）
  const clearLeader = useCallback(() => {
    setNewLabLeaderUid('')
    setNewLabLeaderDisplayName('')
    setNewLabLeaderQuery('')
    setShowLeaderSuggestions(false)
  }, [])

  // 11）关闭创建表单负责人建议（closeLeaderSuggestions）
  const closeLeaderSuggestions = useCallback(() => {
    setShowLeaderSuggestions(false)
  }, [])

  // 12）触发编辑表单负责人搜索（triggerEditingLeaderSearch）
  const triggerEditingLeaderSearch = useCallback(
    (value: string) => {
      setEditingLeaderQuery(value)
      setEditingLeaderUid('')
      setEditingLeaderDisplayName('')

      clearTimeout(editingSearchTimerRef.current)
      editingSearchTimerRef.current = setTimeout(() => {
        debounceSearchUsers(value, 'edit')
      }, 300)
    },
    [debounceSearchUsers],
  )

  // 13）选择编辑表单负责人（selectEditingLeader）
  const selectEditingLeader = useCallback((user: UserPublicPreviewDto) => {
    setEditingLeaderUid(user.uid)
    setEditingLeaderDisplayName(resolveUserDisplayName(user))
    setEditingLeaderQuery(resolveUserDisplayName(user))
    setEditingShowLeaderSuggestions(false)
  }, [])

  // 14）清除编辑表单负责人（clearEditingLeader）
  const clearEditingLeader = useCallback(() => {
    setEditingLeaderUid('')
    setEditingLeaderDisplayName('')
    setEditingLeaderQuery('')
    setEditingShowLeaderSuggestions(false)
  }, [])

  // 15）关闭编辑表单负责人建议（closeEditingLeaderSuggestions）
  const closeEditingLeaderSuggestions = useCallback(() => {
    setEditingShowLeaderSuggestions(false)
  }, [])

  // 16）创建新实验室（createLab）
  const createLab = useCallback(async (): Promise<void> => {
    const trimmedName = newLabName.trim()
    if (!trimmedName) {
      setErrorMessage('请输入实验室名称')
      return
    }

    setErrorMessage(null)
    setIsSaving(true)

    try {
      await createEntityTeam({
        entityCode,
        name: trimmedName,
        leaderUid: newLabLeaderUid || undefined,
      })

      // 清空表单
      setNewLabName('')
      setNewLabLeaderQuery('')
      setNewLabLeaderUid('')
      setNewLabLeaderDisplayName('')
      setShowLeaderSuggestions(false)

      onSaved()
    } catch (error) {
      const message =
        error instanceof EntityProfileApiError ? error.message : '创建实验室失败，请稍后重试'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }, [
    entityCode,
    newLabName,
    newLabLeaderUid,
    onSaved,
  ])

  // 17）开始编辑实验室（startEditingLab）
  const startEditingLab = useCallback((teamUid: string) => {
    setLabs((currentLabs) =>
      currentLabs.map((lab) => {
        if (lab.teamUid !== teamUid) {
          return { ...lab, isEditing: false }
        }
        return { ...lab, isEditing: true }
      }),
    )

    const targetLab = labs.find((lab) => lab.teamUid === teamUid)
    if (targetLab) {
      setEditingTeamUid(teamUid)
      setEditingName(targetLab.name)
      setEditingLeaderUid(targetLab.leaderUid)
      setEditingLeaderDisplayName(targetLab.leaderDisplayName)
      setEditingLeaderQuery(targetLab.leaderDisplayName)
    }
  }, [labs])

  // 18）取消编辑实验室（cancelEditingLab）
  const cancelEditingLab = useCallback((teamUid: string) => {
    setLabs((currentLabs) =>
      currentLabs.map((lab) =>
        lab.teamUid === teamUid ? { ...lab, isEditing: false } : lab,
      ),
    )
    setEditingTeamUid(null)
    setEditingLeaderSuggestions([])
    setEditingShowLeaderSuggestions(false)
  }, [])

  // 19）保存编辑实验室（saveEditingLab）
  const saveEditingLab = useCallback(async (teamUid: string): Promise<void> => {
    const trimmedName = editingName.trim()
    if (!trimmedName) {
      setErrorMessage('请填写实验室名称')
      return
    }

    const updateBody: Record<string, unknown> = {}
    if (trimmedName) updateBody.name = trimmedName
    // 总是携带 leaderUid：有值 → uid 字符串，无值 → null（清除负责人）
    updateBody.leaderUid = editingLeaderUid || null
    updateBody.entityCode = entityCode

    setErrorMessage(null)
    setIsSaving(true)

    try {
      await updateEntityTeam(teamUid, updateBody as Parameters<typeof updateEntityTeam>[1])

      setLabs((currentLabs) =>
        currentLabs.map((lab) => {
          if (lab.teamUid !== teamUid) {
            return lab
          }
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
      const message =
        error instanceof EntityProfileApiError ? error.message : '更新实验室失败，请稍后重试'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }, [editingName, editingLeaderUid, editingLeaderDisplayName, entityCode, onSaved])

  // 20）删除实验室（deleteLab）
  const deleteLab = useCallback(async (teamUid: string): Promise<void> => {
    setErrorMessage(null)
    setIsSaving(true)

    try {
      await deleteEntityTeam(teamUid)

      setLabs((currentLabs) => currentLabs.filter((lab) => lab.teamUid !== teamUid))
      if (editingTeamUid === teamUid) {
        setEditingTeamUid(null)
        setEditingLeaderSuggestions([])
        setEditingShowLeaderSuggestions(false)
      }

      onSaved()
    } catch (error) {
      const message =
        error instanceof EntityProfileApiError ? error.message : '删除实验室失败，请稍后重试'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }, [editingTeamUid, onSaved])

  // 21）取消管理表单（handleCancel）
  const handleCancel = useCallback(() => {
    onCancel()
  }, [onCancel])

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
