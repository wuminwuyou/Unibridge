// 01）团队成员管理表单组件（ManageMembersForm）
import { useState } from 'react'
import InfoPromptModal from '@shared/ui/InfoPromptModal'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileMemberItem, TeamMemberRole } from '@entities/member/model'
import {
  buildMemberMetaSegments, shouldShowMemberMetaSeparator,
} from '@entities/member/lib/memberCardUtils'
import { useMembersManageForm, type EditableMemberItem } from '../hooks/useMembersManageForm'
import './ManageMembersForm.css'

// 02）Props（ManageMembersFormProps）
interface ManageMembersFormProps {
  teamUid: TeamResourceUid
  isLabSpace: boolean
  isLoggedIn: boolean
  isViewerTeamMember: boolean
  members: ProfileMemberItem[]
  onCancel: () => void
  onSaved: () => void
}

// 03）头像占位（buildMemberAvatarFallbackUrl）
function buildMemberAvatarFallbackUrl(displayName: string): string {
  const seed = encodeURIComponent(displayName.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0&color=334155`
}

// 04）身份只读单元格（ManageMemberIdentityCell）
interface ManageMemberIdentityCellProps { member: EditableMemberItem }

/**
 * 函数名：ManageMemberIdentityCell
 * 功能：在管理表单中只读展示成员身份（负责人 · 管理员 · 导师/学生）。
 * 输入：
 * - member：可编辑成员项
 * 输出：
 * - 返回值：React 节点
 */
function ManageMemberIdentityCell({ member }: ManageMemberIdentityCellProps) {
  const segments = buildMemberMetaSegments({
    uid: member.uid,
    nickname: member.nickname,
    realName: member.realName,
    role: member.role,
    career: null,
    isOwner: member.isOwner,
    isAdmin: member.isAdmin,
    avatarUrl: member.avatarUrl,
    level: null,
  }).filter((segment) => segment.kind !== 'career')

  return (
    <div className="team-manage-members-form__identity">
      {segments.map((segment, index) => (
        <span key={`${segment.kind}-${segment.label}`} className="team-manage-members-form__identity-item">
          {shouldShowMemberMetaSeparator(segments, index) ? (
            <span className="team-manage-members-form__identity-separator" aria-hidden="true">·</span>
          ) : null}
          {segment.kind === 'owner' ? (
            <span className="team-manage-members-form__owner-badge">{segment.label}</span>
          ) : segment.kind === 'admin' ? (
            <span className="team-manage-members-form__admin-badge">{segment.label}</span>
          ) : (
            <span className="team-manage-members-form__identity-text">{segment.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}

// 05）团队成员管理表单（ManageMembersForm）
/**
 * 函数名：ManageMembersForm
 * 功能：提供空间成员管理表单；身份只读，团队定位（career）可编辑，非负责人可切换 isAdmin。
 * 实现方法：
 * - 调用 useMembersManageForm Hook 接管全部状态与 API 调用
 * - 通过 InfoPromptModal 反馈 API 错误
 * 输入：
 * - 见 ManageMembersFormProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：保存时调用 PUT /team-profile/members
 */
export function ManageMembersForm({
  teamUid, isLabSpace, isLoggedIn, isViewerTeamMember, members, onCancel, onSaved,
}: ManageMembersFormProps) {
  const [apiPromptMessage, setApiPromptMessage] = useState<string | null>(null)

  const form = useMembersManageForm({
    teamUid, isLabSpace, isLoggedIn, isViewerTeamMember,
    initialMembers: members, onCancel, onSaved,
    onApiError: (message) => setApiPromptMessage(message),
  })

  return (
    <>
      <article className="profile-section-card team-manage-members-form">
        <header className="team-manage-members-form__head">
          <h2>管理成员</h2>
          <button type="button" className="team-manage-members-form__back" onClick={form.handleCancel}>
            返回成员列表
          </button>
        </header>

        {form.errorMessage ? (
          <p className="team-manage-members-form__message team-manage-members-form__message--error" role="alert">
            {form.errorMessage}
          </p>
        ) : (
          <p className="team-manage-members-form__message">
            调整成员团队定位、设置协助管理员或添加新成员，保存后生效。负责人不可变更。
          </p>
        )}

        <section className="team-manage-members-form__section">
          <h3 className="team-manage-members-form__section-title">当前成员</h3>
          {form.members.length > 0 ? (
            <table className="team-manage-members-form__table">
              <thead>
                <tr>
                  <th scope="col">成员</th>
                  <th scope="col">UID</th>
                  <th scope="col">身份</th>
                  <th scope="col">团队定位</th>
                  <th scope="col">管理员</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {form.members.map((member) => {
                  const displayName = form.resolveMemberName(member)
                  return (
                    <tr key={member.uid}>
                      <td>
                        <div className="team-manage-members-form__member-cell">
                          <img
                            className="team-manage-members-form__avatar"
                            src={member.avatarUrl ?? buildMemberAvatarFallbackUrl(displayName)}
                            alt={`${displayName}头像`}
                          />
                          <span>{displayName}</span>
                        </div>
                      </td>
                      <td>{member.uid}</td>
                      <td><ManageMemberIdentityCell member={member} /></td>
                      <td>
                        <input
                          className="team-manage-members-form__input"
                          value={member.career}
                          onChange={(event) => form.updateMemberCareer(member.uid, event.target.value)}
                          placeholder="如：人工智能、前端开发"
                        />
                      </td>
                      <td>
                        {member.isOwner ? (
                          <span className="team-manage-members-form__admin-placeholder">—</span>
                        ) : (
                          <button
                            type="button"
                            className={
                              member.isAdmin
                                ? 'team-manage-members-form__set-admin team-manage-members-form__set-admin--active'
                                : 'team-manage-members-form__set-admin'
                            }
                            onClick={() => form.toggleMemberAdmin(member.uid)}
                          >
                            {member.isAdmin ? '取消管理员' : '设置为管理员'}
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="team-manage-members-form__remove"
                          disabled={member.isOwner}
                          onClick={() => form.removeMember(member.uid)}
                        >
                          移除
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="profile-tab-empty">暂无成员，请先添加成员</p>
          )}
        </section>

        <section className="team-manage-members-form__section">
          <h3 className="team-manage-members-form__section-title">添加成员</h3>
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
              className="team-manage-members-form__select"
              value={form.newMemberRole}
              onChange={(event) => form.setNewMemberRole(event.target.value as TeamMemberRole)}
              aria-label="成员身份"
            >
              <option value="MEMBER">学生</option>
              <option value="MENTOR">导师</option>
            </select>
            <input
              className="team-manage-members-form__input"
              value={form.newMemberCareer}
              onChange={(event) => form.setNewMemberCareer(event.target.value)}
              placeholder="团队定位"
            />
            <button type="button" className="team-manage-members-form__add-button" onClick={form.addMember}>
              添加进团队
            </button>
          </div>
          <p className="team-manage-members-form__add-hint">
            输入 UID 后将自动校验用户并填充姓名；新成员身份选定后不可修改。
          </p>
        </section>

        <footer className="team-manage-members-form__actions">
          <button type="button" className="team-manage-members-form__cancel" onClick={form.handleCancel}>
            取消
          </button>
          <button
            type="button"
            className="team-manage-members-form__submit"
            disabled={form.isSaving}
            onClick={form.handleSubmit}
          >
            {form.isSaving ? '保存中…' : '保存'}
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
