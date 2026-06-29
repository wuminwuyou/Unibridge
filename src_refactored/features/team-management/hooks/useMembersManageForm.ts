// 01）团队成员管理表单 Hook（useMembersManageForm）
import { useEffect, useMemo, useRef, useState } from 'react'
import { isUserResourceUid, type TeamResourceUid } from '@shared/api/resourceUid'
import {
  resolvePublicPreviewDisplayName,
} from '@entities/member/lib/memberDisplayUtils'
import type {
  ProfileMemberItem,
  TeamMemberRole,
} from '@entities/member/model'
import { getUserPublicPreview, UserApiError } from '@entities/user/api/userApi'
import { updateTeamProfileMembers, TeamProfileApiError } from '@entities/team/api/teamProfileApi'
import {
  buildTeamMembersUpdatePayload,
  type TeamMemberChangeSnapshot,
} from '../lib/buildTeamMembersUpdatePayload'

// 02）可编辑成员项（EditableMemberItem）
export interface EditableMemberItem {
  uid: string
  nickname: string
  realName: string | null
  role: TeamMemberRole
  career: string
  isOwner?: boolean
  isAdmin: boolean
  avatarUrl: string | null
}

// 03）Hook 入参（UseMembersManageFormOptions）
interface UseMembersManageFormOptions {
  teamUid: TeamResourceUid
  isLabSpace: boolean
  isLoggedIn: boolean
  isViewerTeamMember: boolean
  initialMembers: ProfileMemberItem[]
  onCancel: () => void
  onSaved: () => void
  onApiError: (message: string) => void
}

// 04）Hook 返回值（UseMembersManageFormResult）
export interface UseMembersManageFormResult {
  members: EditableMemberItem[]
  newMemberUid: string
  newMemberDisplayName: string
  newMemberRole: TeamMemberRole
  newMemberCareer: string
  isSaving: boolean
  isPreviewLoading: boolean
  errorMessage: string | null
  setNewMemberUid: (value: string) => void
  setNewMemberRole: (value: TeamMemberRole) => void
  setNewMemberCareer: (value: string) => void
  resolveMemberName: (member: EditableMemberItem) => string
  updateMemberCareer: (uid: string, career: string) => void
  toggleMemberAdmin: (uid: string) => void
  removeMember: (uid: string) => void
  lookupNewMemberPreview: () => Promise<void>
  addMember: () => void
  handleCancel: () => void
  handleSubmit: () => void
}

// 05）映射初始成员（mapInitialMembers）
function mapInitialMembers(members: ProfileMemberItem[]): EditableMemberItem[] {
  return members.map((member) => ({
    uid: member.uid,
    nickname: member.nickname,
    realName: member.realName?.trim() || null,
    role: member.role,
    career: member.career ?? '',
    isOwner: member.isOwner,
    isAdmin: member.isAdmin === true,
    avatarUrl: member.avatarUrl,
  }))
}

// 06）映射成员变更快照（mapMemberChangeSnapshot）
function mapMemberChangeSnapshot(member: EditableMemberItem): TeamMemberChangeSnapshot {
  return {
    uid: member.uid,
    role: member.role,
    career: member.career,
    isAdmin: member.isAdmin,
    isOwner: member.isOwner,
  }
}

// 07）团队成员管理表单 Hook（useMembersManageForm）
/**
 * 函数名：useMembersManageForm
 * 功能：管理空间成员表单的状态、UID 预览与 PUT /team-profile/members 提交。
 * 实现方法：
 * - role 只读；career / isAdmin 可编辑；非负责人可切换 isAdmin
 * - UID 失焦调用 entities/user/api getUserPublicPreview 回填姓名
 * - 保存时 diff 生成 updates / additions / removals 并提交至 entities/team/api
 * 输入：
 * - options：见 UseMembersManageFormOptions
 * 输出：
 * - 返回值：UseMembersManageFormResult
 * - 副作用：发起网络请求
 */
export function useMembersManageForm(options: UseMembersManageFormOptions): UseMembersManageFormResult {
  const {
    teamUid, isLabSpace, isLoggedIn, isViewerTeamMember,
    initialMembers, onCancel, onSaved, onApiError,
  } = options

  const initialSnapshotRef = useRef<TeamMemberChangeSnapshot[]>([])

  const [members, setMembers] = useState<EditableMemberItem[]>(() => mapInitialMembers(initialMembers))
  const [newMemberUid, setNewMemberUidState] = useState('')
  const [newMemberPreviewNickname, setNewMemberPreviewNickname] = useState('')
  const [newMemberPreviewRealName, setNewMemberPreviewRealName] = useState<string | null>(null)
  const [newMemberDisplayName, setNewMemberDisplayName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<TeamMemberRole>('MEMBER')
  const [newMemberCareer, setNewMemberCareer] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const previewNameOptions = useMemo(
    () => ({
      context: 'manage' as const,
      isLabSpace,
      isLoggedIn,
      isViewerTeamMember,
    }),
    [isLabSpace, isLoggedIn, isViewerTeamMember],
  )

  useEffect(() => {
    const mappedMembers = mapInitialMembers(initialMembers)
    setMembers(mappedMembers)
    initialSnapshotRef.current = mappedMembers.map(mapMemberChangeSnapshot)
  }, [initialMembers])

  const resolveMemberName = (member: EditableMemberItem): string => {
    return resolvePublicPreviewDisplayName(
      { nickname: member.nickname, realName: member.realName },
      previewNameOptions,
    )
  }

  const setNewMemberUid = (value: string): void => {
    setNewMemberUidState(value)
    setNewMemberPreviewNickname('')
    setNewMemberPreviewRealName(null)
    setNewMemberDisplayName('')
    setErrorMessage(null)
  }

  const lookupNewMemberPreview = async (): Promise<void> => {
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
      setNewMemberDisplayName(
        resolvePublicPreviewDisplayName(preview, { ...previewNameOptions, isLabSpace }),
      )
    } catch (error) {
      setNewMemberPreviewNickname('')
      setNewMemberPreviewRealName(null)
      setNewMemberDisplayName('')
      const message = error instanceof UserApiError ? error.message : '未找到该用户，请检查 UID 是否正确'
      onApiError(message)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const updateMemberCareer = (uid: string, career: string): void => {
    setMembers((current) => current.map((m) => (m.uid === uid ? { ...m, career } : m)))
  }

  const toggleMemberAdmin = (uid: string): void => {
    setMembers((current) =>
      current.map((m) => {
        if (m.uid !== uid || m.isOwner) return m
        return { ...m, isAdmin: !m.isAdmin }
      }),
    )
    setErrorMessage(null)
  }

  const removeMember = (uid: string): void => {
    const target = members.find((m) => m.uid === uid)
    if (target?.isOwner) {
      setErrorMessage('无法移除团队负责人')
      return
    }
    setMembers((current) => current.filter((m) => m.uid !== uid))
    setErrorMessage(null)
  }

  const addMember = (): void => {
    const trimmedUid = newMemberUid.trim()
    const trimmedCareer = newMemberCareer.trim()

    if (!trimmedUid || !trimmedCareer) {
      setErrorMessage('请填写成员 UID 与团队定位')
      return
    }

    if (!newMemberDisplayName.trim()) {
      setErrorMessage('请先输入有效 UID 并等待姓名加载完成')
      return
    }

    if (members.some((m) => m.uid === trimmedUid)) {
      setErrorMessage('该成员 UID 已在列表中')
      return
    }

    setMembers((current) => [
      ...current,
      {
        uid: trimmedUid,
        nickname: newMemberPreviewNickname.trim() || newMemberDisplayName.trim(),
        realName: newMemberPreviewRealName,
        role: newMemberRole,
        career: trimmedCareer,
        isOwner: false,
        isAdmin: false,
        avatarUrl: null,
      },
    ])
    setNewMemberUid('')
    setNewMemberPreviewNickname('')
    setNewMemberPreviewRealName(null)
    setNewMemberDisplayName('')
    setNewMemberRole('MEMBER')
    setNewMemberCareer('')
    setErrorMessage(null)
  }

  const handleCancel = (): void => { onCancel() }

  const handleSubmit = async (): Promise<void> => {
    if (members.length === 0) {
      setErrorMessage('团队至少需要保留一名成员')
      return
    }

    const hasEmptyCareer = members.some((m) => !m.career.trim())
    if (hasEmptyCareer) {
      setErrorMessage('请为每位成员填写团队定位')
      return
    }

    const payload = buildTeamMembersUpdatePayload(
      initialSnapshotRef.current,
      members.map(mapMemberChangeSnapshot),
    )

    if (!payload) {
      setErrorMessage('没有需要保存的变更')
      return
    }

    setErrorMessage(null)
    setIsSaving(true)

    try {
      await updateTeamProfileMembers(teamUid, payload)
      onSaved()
    } catch (error) {
      const message = error instanceof TeamProfileApiError ? error.message : '保存成员变更失败，请稍后重试'
      onApiError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    members,
    newMemberUid,
    newMemberDisplayName,
    newMemberRole,
    newMemberCareer,
    isSaving,
    isPreviewLoading,
    errorMessage,
    setNewMemberUid,
    setNewMemberRole,
    setNewMemberCareer,
    resolveMemberName,
    updateMemberCareer,
    toggleMemberAdmin,
    removeMember,
    lookupNewMemberPreview,
    addMember,
    handleCancel,
    handleSubmit: () => { void handleSubmit() },
  }
}
