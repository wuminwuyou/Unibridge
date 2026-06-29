// 01）机构人员管理表单 Hook（useOrgMembersManageForm）
import { useCallback, useEffect, useState } from 'react'
import { isUserResourceUid, type EntityCode } from '@shared/api/resourceUid'
import { getUserPublicPreview, UserApiError } from '@entities/user/api/userApi'
import {
  EntityProfileApiError,
  addEntityProfileMember,
  removeEntityProfileMember,
} from '@entities/organization/api/entityProfileApi'
import type {
  OrgPublicMemberRole,
  ProfileOrgMemberItem,
} from '@entities/member/model'

// 02）可编辑机构人员项（EditableOrgMemberItem）
export interface EditableOrgMemberItem {
  uid: string
  displayName: string
  avatarUrl: string | null
  orgRole: OrgPublicMemberRole
}

// 03）Hook 入参（UseOrgMembersManageFormOptions）
interface UseOrgMembersManageFormOptions {
  entityCode: EntityCode
  initialMembers: ProfileOrgMemberItem[]
  entityType: 'UNIVERSITY' | 'ENTERPRISE'
  onCancel: () => void
  onSaved: () => void
  onApiError: (message: string) => void
}

// 04）Hook 返回值（UseOrgMembersManageFormResult）
export interface UseOrgMembersManageFormResult {
  members: EditableOrgMemberItem[]
  isSaving: boolean
  errorMessage: string | null
  newMemberUid: string
  newMemberDisplayName: string
  newMemberRole: OrgPublicMemberRole
  isPreviewLoading: boolean
  setNewMemberUid: (value: string) => void
  setNewMemberRole: (value: OrgPublicMemberRole) => void
  lookupNewMemberPreview: () => Promise<void>
  addMember: () => void
  removeMember: (uid: string) => void
  resolveRoleLabel: (orgRole: OrgPublicMemberRole) => string
  roleOptions: { value: OrgPublicMemberRole; label: string }[]
  handleCancel: () => void
}

// 05）解析展示名称（resolveOrgMemberDisplayName）
function resolveOrgMemberDisplayName(member: ProfileOrgMemberItem): string {
  return member.realName?.trim() || member.nickname || member.uid
}

// 06）映射初始成员（mapInitialOrgMembers）
function mapInitialOrgMembers(members: ProfileOrgMemberItem[]): EditableOrgMemberItem[] {
  return members.map((member) => ({
    uid: member.uid,
    displayName: resolveOrgMemberDisplayName(member),
    avatarUrl: member.avatarUrl,
    orgRole: member.orgRole,
  }))
}

// 07）机构人员管理 Hook（useOrgMembersManageForm）
/**
 * 函数名：useOrgMembersManageForm
 * 功能：管理机构关联人员的增删操作；新成员 role 由后台根据 user_auth_link 自动判定。
 * 实现方法：
 * - UID 失焦时调用 entities/user/api getUserPublicPreview 回填姓名
 * - 添加 / 移除 调用 entities/organization/api 的 addEntityProfileMember / removeEntityProfileMember
 * 输入：
 * - options：entityCode、initialMembers、回调
 * 输出：
 * - 返回值：UseOrgMembersManageFormResult
 * - 副作用：发起网络请求
 */
export function useOrgMembersManageForm(
  options: UseOrgMembersManageFormOptions,
): UseOrgMembersManageFormResult {
  const { entityCode, initialMembers, entityType, onCancel, onSaved, onApiError } = options

  const [members, setMembers] = useState<EditableOrgMemberItem[]>(() => mapInitialOrgMembers(initialMembers))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [newMemberUid, setNewMemberUidState] = useState('')
  const [, setNewMemberPreviewNickname] = useState('')
  const [, setNewMemberPreviewRealName] = useState<string | null>(null)
  const [newMemberDisplayName, setNewMemberDisplayName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<OrgPublicMemberRole>(
    entityType === 'UNIVERSITY' ? 'MENTOR' : 'PM',
  )
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const roleOptions: { value: OrgPublicMemberRole; label: string }[] =
    entityType === 'UNIVERSITY'
      ? [
          { value: 'MENTOR', label: '导师' },
          { value: 'COUNSELOR', label: '辅导员' },
        ]
      : [{ value: 'PM', label: '项目经理' }]

  useEffect(() => {
    setMembers(mapInitialOrgMembers(initialMembers))
  }, [initialMembers])

  const setNewMemberUid = useCallback((value: string) => {
    setNewMemberUidState(value)
    setNewMemberPreviewNickname('')
    setNewMemberPreviewRealName(null)
    setNewMemberDisplayName('')
    setErrorMessage(null)
  }, [])

  const lookupNewMemberPreview = useCallback(async (): Promise<void> => {
    const trimmedUid = newMemberUid.trim()
    if (!isUserResourceUid(trimmedUid)) {
      setNewMemberDisplayName('')
      return
    }

    setIsPreviewLoading(true)
    setErrorMessage(null)

    try {
      const preview = await getUserPublicPreview(trimmedUid)
      setNewMemberPreviewNickname(preview.nickname)
      setNewMemberPreviewRealName(preview.realName ?? null)
      const displayName = preview.realName?.trim() || preview.nickname || preview.uid
      setNewMemberDisplayName(displayName)
    } catch (error) {
      setNewMemberPreviewNickname('')
      setNewMemberPreviewRealName(null)
      setNewMemberDisplayName('')
      const message = error instanceof UserApiError ? error.message : '未找到该用户，请检查 UID 是否正确'
      onApiError(message)
    } finally {
      setIsPreviewLoading(false)
    }
  }, [newMemberUid, onApiError])

  const addMember = useCallback((): void => {
    const trimmedUid = newMemberUid.trim()
    if (!trimmedUid) { setErrorMessage('请填写成员 UID'); return }
    if (!newMemberDisplayName.trim()) { setErrorMessage('请先输入有效 UID 并等待姓名加载完成'); return }
    if (members.some((m) => m.uid === trimmedUid)) { setErrorMessage('该成员 UID 已在列表中'); return }

    setErrorMessage(null)
    setIsSaving(true)

    void addEntityProfileMember({ entityCode, uid: trimmedUid, role: newMemberRole })
      .then((result) => {
        const role = result.role?.trim().toUpperCase()
        const resolvedRole: OrgPublicMemberRole =
          role === 'MENTOR' ? 'MENTOR' : role === 'COUNSELOR' ? 'COUNSELOR' : 'PM'
        setMembers((current) => [
          ...current,
          { uid: trimmedUid, displayName: newMemberDisplayName.trim(), avatarUrl: null, orgRole: resolvedRole },
        ])
        setNewMemberUid('')
        setNewMemberPreviewNickname('')
        setNewMemberPreviewRealName(null)
        setNewMemberDisplayName('')
        onSaved()
      })
      .catch((error: unknown) => {
        const message = error instanceof EntityProfileApiError ? error.message : '添加人员失败，请稍后重试'
        setErrorMessage(message)
      })
      .finally(() => { setIsSaving(false) })
  }, [
    entityCode, members, newMemberDisplayName, newMemberRole, newMemberUid, onSaved, setNewMemberUid,
  ])

  const removeMember = useCallback((uid: string): void => {
    setErrorMessage(null)
    setIsSaving(true)
    void removeEntityProfileMember({ entityCode, uid })
      .then(() => {
        setMembers((current) => current.filter((m) => m.uid !== uid))
        onSaved()
      })
      .catch((error: unknown) => {
        const message = error instanceof EntityProfileApiError ? error.message : '移除人员失败，请稍后重试'
        setErrorMessage(message)
      })
      .finally(() => { setIsSaving(false) })
  }, [entityCode, onSaved])

  const handleCancel = useCallback(() => { onCancel() }, [onCancel])

  const resolveRoleLabel = useCallback((orgRole: OrgPublicMemberRole): string => {
    if (orgRole === 'PM') return '员工'
    if (orgRole === 'MENTOR') return '导师'
    return '辅导员'
  }, [])

  return {
    members,
    isSaving,
    errorMessage,
    newMemberUid,
    newMemberDisplayName,
    newMemberRole,
    isPreviewLoading,
    setNewMemberUid,
    setNewMemberRole,
    lookupNewMemberPreview,
    addMember,
    removeMember,
    resolveRoleLabel,
    roleOptions,
    handleCancel,
  }
}
