// 01）团队/实验室管理 Feature 公开接口
export { ManageMembersForm } from './components/ManageMembersForm'
export { OrgMembersManageForm } from './components/OrgMembersManageForm'
export { ManageLabsForm } from './components/ManageLabsForm'
export { CreateTeamModal } from './components/CreateTeamModal'

// 02）Hook 公开导出（供 widgets/profile-space 与子区块使用）
export { useMembersManageForm, type EditableMemberItem } from './hooks/useMembersManageForm'
export { useOrgMembersManageForm, type EditableOrgMemberItem } from './hooks/useOrgMembersManageForm'
export {
  useManageLabsForm,
  type EditableLabItem,
  type LeaderSuggestionItem,
} from './hooks/useManageLabsForm'

// 03）Lib 公开导出
export {
  buildTeamMembersUpdatePayload,
  type TeamMemberChangeSnapshot,
} from './lib/buildTeamMembersUpdatePayload'
