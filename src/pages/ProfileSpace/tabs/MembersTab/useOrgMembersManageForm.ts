import { useCallback, useEffect, useState } from 'react'
import {
  EntityProfileApiError,
  addEntityProfileMember,
  removeEntityProfileMember,
} from '../../../../api/entityProfile'
import type { EntityCode } from '../../../../api/resourceUid'
import { getUserPublicPreview, UserApiError } from '../../../../api/users'
import { isUserResourceUid } from '../../../../api/resourceUid'
import type { OrgPublicMemberRole, ProfileOrgMemberItem } from '../../components/types'

// 01）可编辑机构人员项（EditableOrgMemberItem）
export interface EditableOrgMemberItem {
  uid: string
  displayName: string
  avatarUrl: string | null
  orgRole: OrgPublicMemberRole
}

// 02）机构人员管理 Hook 参数（UseOrgMembersManageFormOptions）
interface UseOrgMembersManageFormOptions {
  entityCode: EntityCode
  initialMembers: ProfileOrgMemberItem[]
  onCancel: () => void
  onSaved: () => void
  onApiError: (message: string) => void
}

// 03）机构人员管理 Hook 返回值（UseOrgMembersManageFormResult）
export interface UseOrgMembersManageFormResult {
  members: EditableOrgMemberItem[]
  isSaving: boolean
  errorMessage: string | null
  /** 添加人员表单字段 */
  newMemberUid: string
  newMemberDisplayName: string
  isPreviewLoading: boolean
  setNewMemberUid: (value: string) => void
  lookupNewMemberPreview: () => Promise<void>
  addMember: () => void
  removeMember: (uid: string) => void
  resolveRoleLabel: (orgRole: OrgPublicMemberRole) => string
  handleCancel: () => void
}

// 04）解析机构人员展示名称（resolveOrgMemberDisplayName）
function resolveOrgMemberDisplayName(member: ProfileOrgMemberItem): string {
  return member.realName?.trim() || member.nickname || member.uid
}

// 05）映射初始成员列表（mapInitialOrgMembers）
function mapInitialOrgMembers(members: ProfileOrgMemberItem[]): EditableOrgMemberItem[] {
  return members.map((member) => ({
    uid: member.uid,
    displayName: resolveOrgMemberDisplayName(member),
    avatarUrl: member.avatarUrl,
    orgRole: member.orgRole,
  }))
}

// 06）机构人员管理 Hook（useOrgMembersManageForm）
/**
 * 函数名：useOrgMembersManageForm
 * 功能：管理机构关联人员的增删操作；新成员 role 由后台根据 user_auth_link 自动判定。
 * 实现方法：
 * - UID 失焦时调用 getUserPublicPreview 回填姓名
 * - 添加时调用 addEntityProfileMember
 * - 移除时调用 removeEntityProfileMember
 * 输入：
 * - options：entityCode、initialMembers、回调
 * 输出：
 * - 返回值：UseOrgMembersManageFormResult
 * - 副作用：发起网络请求
 */
export function useOrgMembersManageForm(
  options: UseOrgMembersManageFormOptions,
): UseOrgMembersManageFormResult {
  const { entityCode, initialMembers, onCancel, onSaved, onApiError } = options

  const [members, setMembers] = useState<EditableOrgMemberItem[]>(() =>
    mapInitialOrgMembers(initialMembers),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 添加人员表单
  const [newMemberUid, setNewMemberUidState] = useState('')
  const [newMemberPreviewNickname, setNewMemberPreviewNickname] = useState('')
  const [newMemberPreviewRealName, setNewMemberPreviewRealName] = useState<string | null>(null)
  const [newMemberDisplayName, setNewMemberDisplayName] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  useEffect(() => {
    setMembers(mapInitialOrgMembers(initialMembers))
  }, [initialMembers])

  // 08）设置新成员 UID（setNewMemberUid）
  const setNewMemberUid = useCallback((value: string) => {
    setNewMemberUidState(value)
    setNewMemberPreviewNickname('')
    setNewMemberPreviewRealName(null)
    setNewMemberDisplayName('')
    setErrorMessage(null)
  }, [])

  // 09）查询新成员预览（lookupNewMemberPreview）
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
      const message =
        error instanceof UserApiError ? error.message : '未找到该用户，请检查 UID 是否正确'
      onApiError(message)
    } finally {
      setIsPreviewLoading(false)
    }
  }, [newMemberUid, onApiError])

  // 10）添加成员（addMember）
  const addMember = useCallback((): void => {
    const trimmedUid = newMemberUid.trim()
    if (!trimmedUid) {
      setErrorMessage('请填写成员 UID')
      return
    }

    if (!newMemberDisplayName.trim()) {
      setErrorMessage('请先输入有效 UID 并等待姓名加载完成')
      return
    }

    if (members.some((member) => member.uid === trimmedUid)) {
      setErrorMessage('该成员 UID 已在列表中')
      return
    }

    setErrorMessage(null)
    setIsSaving(true)

    void addEntityProfileMember({ entityCode, uid: trimmedUid })
      .then((result) => {
        const resolvedRole: OrgPublicMemberRole =
          result.role === 'MENTOR' ? 'MENTOR' : 'PM'
        setMembers((current) => [
          ...current,
          {
            uid: trimmedUid,
            displayName: newMemberDisplayName.trim(),
            avatarUrl: null,
            orgRole: resolvedRole,
          },
        ])
        setNewMemberUid('')
        setNewMemberPreviewNickname('')
        setNewMemberPreviewRealName(null)
        setNewMemberDisplayName('')
        onSaved()
      })
      .catch((error: unknown) => {
        const message =
          error instanceof EntityProfileApiError ? error.message : '添加人员失败，请稍后重试'
        setErrorMessage(message)
      })
      .finally(() => {
        setIsSaving(false)
      })
  }, [entityCode, members, newMemberDisplayName, newMemberUid, onSaved])

  // 11）移除成员（removeMember）
  const removeMember = useCallback(
    (uid: string): void => {
      setErrorMessage(null)
      setIsSaving(true)

      void removeEntityProfileMember({ entityCode, uid })
        .then(() => {
          setMembers((current) => current.filter((member) => member.uid !== uid))
          onSaved()
        })
        .catch((error: unknown) => {
          const message =
            error instanceof EntityProfileApiError ? error.message : '移除人员失败，请稍后重试'
          setErrorMessage(message)
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [entityCode, onSaved],
  )

  // 12）取消管理表单（handleCancel）
  const handleCancel = useCallback(() => {
    onCancel()
  }, [onCancel])

  // 13）解析角色文案（resolveRoleLabel）
  const resolveRoleLabel = useCallback((orgRole: OrgPublicMemberRole): string => {
    return orgRole === 'PM' ? '员工' : '导师'
  }, [])

  return {
    members,
    isSaving,
    errorMessage,
    newMemberUid,
    newMemberDisplayName,
    isPreviewLoading,
    setNewMemberUid,
    lookupNewMemberPreview,
    addMember,
    removeMember,
    resolveRoleLabel,
    handleCancel,
  }
}
