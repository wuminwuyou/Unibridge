import { useState } from 'react'
import InfoPromptModal from '../../../../components/common/InfoPromptModal'
import type { EntityCode } from '../../../../api/resourceUid'
import type { ProfileOrgMemberItem } from '../../components/types'
import { useOrgMembersManageForm, type EditableOrgMemberItem } from './useOrgMembersManageForm'
import './ManageMembersForm.css'

// 01）机构人员管理表单 Props（OrgMembersManageFormProps）
interface OrgMembersManageFormProps {
  entityCode: EntityCode
  members: ProfileOrgMemberItem[]
  onCancel: () => void
  onSaved: () => void
}

// 02）构建头像占位地址（buildAvatarFallbackUrl）
function buildAvatarFallbackUrl(displayName: string): string {
  const seed = encodeURIComponent(displayName.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0&color=334155`
}

// 03）人员行展示模式（OrgMemberRowDisplay）
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
      <td>
        <span className="team-manage-members-form__identity-text">{roleLabel}</span>
      </td>
      <td>
        <button type="button" className="team-manage-members-form__remove" onClick={onRemove}>
          移除
        </button>
      </td>
    </tr>
  )
}

// 04）机构人员管理表单（OrgMembersManageForm）
/**
 * 函数名：OrgMembersManageForm
 * 功能：提供机构关联人员的增删表单；表格展示人员列表 + 添加新人员入口。
 * 输入：
 * - entityCode：机构主体代码
 * - members：当前人员列表
 * - onCancel：取消并返回列表
 * - onSaved：保存成功后刷新列表
 * 输出：
 * - 返回值：React 节点
 * - 副作用：调用增删 API
 */
export function OrgMembersManageForm({
  entityCode,
  members: initialMembers,
  onCancel,
  onSaved,
}: OrgMembersManageFormProps) {
  const [apiPromptMessage, setApiPromptMessage] = useState<string | null>(null)

  const form = useOrgMembersManageForm({
    entityCode,
    initialMembers,
    onCancel,
    onSaved,
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
              onBlur={() => {
                void form.lookupNewMemberPreview()
              }}
              placeholder="成员 UID"
            />
            <input
              className="team-manage-members-form__input team-manage-members-form__input--readonly"
              value={form.isPreviewLoading ? '加载中…' : form.newMemberDisplayName}
              readOnly
              placeholder="姓名（输入 UID 后自动填充）"
              aria-busy={form.isPreviewLoading}
            />
            <button type="button" className="team-manage-members-form__add-button" onClick={form.addMember}>
              添加进机构
            </button>
          </div>
          <p className="team-manage-members-form__add-hint">
            输入 UID 后将自动校验用户并填充姓名；新成员身份由后台自动判定。
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
