// 01）机构人员管理表单组件（OrgMembersManageForm）
import { useState } from 'react'
import InfoPromptModal from '@shared/ui/InfoPromptModal'
import type { EntityCode } from '@shared/api/resourceUid'
import type { ProfileOrgMemberItem, OrgPublicMemberRole } from '@entities/member/model'
import {
  useOrgMembersManageForm, type EditableOrgMemberItem,
} from '../hooks/useOrgMembersManageForm'
import './ManageMembersForm.css'

// 02）Props（OrgMembersManageFormProps）
interface OrgMembersManageFormProps {
  entityCode: EntityCode
  members: ProfileOrgMemberItem[]
  entityType: 'UNIVERSITY' | 'ENTERPRISE'
  onCancel: () => void
  onSaved: () => void
}

// 03）头像占位（buildAvatarFallbackUrl）
function buildAvatarFallbackUrl(displayName: string): string {
  const seed = encodeURIComponent(displayName.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0&color=334155`
}

// 04）人员行（OrgMemberRowDisplay）
interface OrgMemberRowDisplayProps {
  member: EditableOrgMemberItem
  roleLabel: string
  onRemove: () => void
}

function OrgMemberRowDisplay({ member, roleLabel, onRemove }: OrgMemberRowDisplayProps) {
  return (
    <tr>
      <td>
        <div className="team-manage-members-form__member-cell">
          <img
            className="team-manage-members-form__avatar"
            src={member.avatarUrl ?? buildAvatarFallbackUrl(member.displayName)}
            alt={`${member.displayName}头像`}
          />
          <span>{member.displayName}</span>
        </div>
      </td>
      <td>{member.uid}</td>
      <td><span className="team-manage-members-form__identity-text">{roleLabel}</span></td>
      <td>
        <button type="button" className="team-manage-members-form__remove" onClick={onRemove}>
          移除
        </button>
      </td>
    </tr>
  )
}

// 05）机构人员管理表单（OrgMembersManageForm）
/**
 * 函数名：OrgMembersManageForm
 * 功能：提供机构关联人员的增删表单；表格展示人员列表 + 添加新人员入口。
 * 实现方法：
 * - 调用 useOrgMembersManageForm 接管全部状态与 API 调用
 * - InfoPromptModal 反馈 API 错误
 * 输入：
 * - 见 OrgMembersManageFormProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：调用 entities/organization/api 增删 API
 */
export function OrgMembersManageForm({
  entityCode, members: initialMembers, entityType, onCancel, onSaved,
}: OrgMembersManageFormProps) {
  const [apiPromptMessage, setApiPromptMessage] = useState<string | null>(null)

  const form = useOrgMembersManageForm({
    entityCode, initialMembers, entityType, onCancel, onSaved,
    onApiError: (message) => setApiPromptMessage(message),
  })

  return (
    <>
      <article className="profile-section-card team-manage-members-form">
        <header className="team-manage-members-form__head">
          <h2>人员管理</h2>
          <button type="button" className="team-manage-members-form__back" onClick={form.handleCancel}>
            返回人员列表
          </button>
        </header>

        {form.errorMessage ? (
          <p className="team-manage-members-form__message team-manage-members-form__message--error" role="alert">
            {form.errorMessage}
          </p>
        ) : (
          <p className="team-manage-members-form__message">
            管理当前机构的关联人员。移除操作不可逆，请谨慎操作。新成员身份由系统根据 user_auth_link 自动判定。
          </p>
        )}

        <section className="team-manage-members-form__section">
          <h3 className="team-manage-members-form__section-title">当前人员</h3>
          {form.members.length > 0 ? (
            <table className="team-manage-members-form__table">
              <thead>
                <tr>
                  <th scope="col">人员</th>
                  <th scope="col">UID</th>
                  <th scope="col">身份</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {form.members.map((member) => (
                  <OrgMemberRowDisplay
                    key={member.uid}
                    member={member}
                    roleLabel={form.resolveRoleLabel(member.orgRole)}
                    onRemove={() => form.removeMember(member.uid)}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="profile-tab-empty">暂无关联人员，请先添加</p>
          )}
        </section>

        <section className="team-manage-members-form__section">
          <h3 className="team-manage-members-form__section-title">添加人员</h3>
          <div className="team-manage-members-form__add-row">
            <input
              className="team-manage-members-form__input"
              value={form.newMemberUid}
              onChange={(event) => form.setNewMemberUid(event.target.value)}
              onBlur={() => { void form.lookupNewMemberPreview() }}
              placeholder="成员 UID"
            />
            <input
              className="team-manage-members-form__input team-manage-members-form__input--readonly"
              value={form.isPreviewLoading ? '加载中…' : form.newMemberDisplayName}
              readOnly
              placeholder="姓名（输入 UID 后自动填充）"
              aria-busy={form.isPreviewLoading}
            />
            <select
              className="team-manage-members-form__input"
              value={form.newMemberRole}
              onChange={(event) => form.setNewMemberRole(event.target.value as OrgPublicMemberRole)}
            >
              {form.roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button type="button" className="team-manage-members-form__add-button" onClick={form.addMember}>
              添加进机构
            </button>
          </div>
          <p className="team-manage-members-form__add-hint">
            输入 UID 后将自动校验用户并填充姓名；选择身份后点击添加。
          </p>
        </section>

        <footer className="team-manage-members-form__actions">
          <button type="button" className="team-manage-members-form__cancel" onClick={form.handleCancel}>
            取消
          </button>
        </footer>
      </article>

      <InfoPromptModal
        open={apiPromptMessage != null}
        message={apiPromptMessage ?? ''}
        title="温馨提示"
        confirmText="我知道了"
        onClose={() => setApiPromptMessage(null)}
        onConfirm={() => setApiPromptMessage(null)}
      />
    </>
  )
}
