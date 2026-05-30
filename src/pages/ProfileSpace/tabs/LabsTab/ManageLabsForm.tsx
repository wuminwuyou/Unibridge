import { useState } from 'react'
import InfoPromptModal from '../../../../components/common/InfoPromptModal'
import type { EntityCode } from '../../../../api/resourceUid'
import type { UserPublicPreviewDto } from '../../../../api/users/types'
import type { OrganizationTeamItem } from '../../variants/OrganizationView/types'
import { useManageLabsForm, type EditableLabItem } from './useManageLabsForm'
import './ManageLabsForm.css'

// 01）管理实验室表单 Props（ManageLabsFormProps）
interface ManageLabsFormProps {
  entityCode: EntityCode
  labs: OrganizationTeamItem[]
  onCancel: () => void
  onSaved: () => void
}

// 02）构建实验室头像占位地址（buildLabAvatarFallbackUrl）
function buildLabAvatarFallbackUrl(name: string): string {
  const seed = encodeURIComponent(name.trim().slice(0, 2) || 'L')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=cbd5e1&color=ffffff`
}

// 03）实验室负责人选择建议下拉（LeaderSuggestionDropdown）
interface LeaderSuggestionDropdownProps {
  suggestions: UserPublicPreviewDto[]
  isLoading: boolean
  onSelect: (user: UserPublicPreviewDto) => void
  onClose: () => void
}

function LeaderSuggestionDropdown({ suggestions, isLoading, onSelect, onClose }: LeaderSuggestionDropdownProps) {
  return (
    <div className="manage-labs-form__suggestions">
      <div className="manage-labs-form__suggestions-header">
        <span>选择用户</span>
        <button type="button" className="manage-labs-form__suggestions-close" onClick={onClose}>
          ✕
        </button>
      </div>
      {isLoading ? (
        <div className="manage-labs-form__suggestions-loading">搜索中…</div>
      ) : suggestions.length > 0 ? (
        <ul className="manage-labs-form__suggestions-list">
          {suggestions.map((user) => {
            const displayName = user.realName?.trim() || user.nickname
            return (
              <li key={user.uid}>
                <button
                  type="button"
                  className="manage-labs-form__suggestions-item"
                  onClick={() => onSelect(user)}
                >
                  <img
                    className="manage-labs-form__suggestions-avatar"
                    src={user.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName.slice(0, 1) || 'U')}`}
                    alt={displayName}
                  />
                  <div className="manage-labs-form__suggestions-info">
                    <span className="manage-labs-form__suggestions-name">{displayName}</span>
                    <span className="manage-labs-form__suggestions-uid">{user.uid}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="manage-labs-form__suggestions-empty">无匹配用户</div>
      )}
    </div>
  )
}

// 04）已选负责人标签（LeaderTag）
interface LeaderTagProps {
  uid: string
  displayName: string
  onClear: () => void
}

function LeaderTag({ uid, displayName, onClear }: LeaderTagProps) {
  if (!uid) {
    return null
  }
  return (
    <div className="manage-labs-form__leader-tag">
      <span className="manage-labs-form__leader-tag-text">{displayName}</span>
      <button
        type="button"
        className="manage-labs-form__leader-tag-clear"
        onClick={onClear}
        aria-label="清除负责人"
      >
        ✕
      </button>
    </div>
  )
}

// 05）实验室行展示模式（LabRowDisplay）
interface LabRowDisplayProps {
  lab: EditableLabItem
  onEdit: () => void
  onDelete: () => void
}

function LabRowDisplay({ lab, onEdit, onDelete }: LabRowDisplayProps) {
  const logoUrl = lab.logoUrl || buildLabAvatarFallbackUrl(lab.name)
  return (
    <tr>
      <td>
        <div className="manage-labs-form__lab-cell">
          <img className="manage-labs-form__logo" src={logoUrl} alt={`${lab.name} Logo`} />
          <span>{lab.name}</span>
        </div>
      </td>
      <td className="manage-labs-form__uid-cell">{lab.teamUid}</td>
      <td>
        {lab.leaderDisplayName || <span className="manage-labs-form__muted">未设置</span>}
      </td>
      <td>
        <div className="manage-labs-form__actions-cell">
          <button type="button" className="manage-labs-form__edit-btn" onClick={onEdit}>
            编辑
          </button>
          <button type="button" className="manage-labs-form__delete-btn" onClick={onDelete}>
            删除
          </button>
        </div>
      </td>
    </tr>
  )
}

// 06）实验室行编辑模式（LabRowEdit）
interface LabRowEditProps {
  lab: EditableLabItem
  editingName: string
  editingLeaderQuery: string
  editingLeaderUid: string
  editingLeaderDisplayName: string
  editingLeaderSuggestions: UserPublicPreviewDto[]
  editingShowLeaderSuggestions: boolean
  isSearchingEditingLeader: boolean
  onNameChange: (value: string) => void
  onLeaderQueryChange: (value: string) => void
  onSelectLeader: (user: UserPublicPreviewDto) => void
  onClearLeader: () => void
  onCloseLeaderSuggestions: () => void
  onSave: () => void
  onCancel: () => void
}

function LabRowEdit({
  lab,
  editingName,
  editingLeaderQuery,
  editingLeaderUid,
  editingLeaderDisplayName,
  editingLeaderSuggestions,
  editingShowLeaderSuggestions,
  isSearchingEditingLeader,
  onNameChange,
  onLeaderQueryChange,
  onSelectLeader,
  onClearLeader,
  onCloseLeaderSuggestions,
  onSave,
  onCancel,
}: LabRowEditProps) {
  const logoUrl = lab.logoUrl || buildLabAvatarFallbackUrl(lab.name)
  return (
    <tr className="manage-labs-form__row--editing">
      <td>
        <div className="manage-labs-form__lab-cell">
          <img className="manage-labs-form__logo" src={logoUrl} alt={`${lab.name} Logo`} />
          <input
            className="manage-labs-form__input"
            value={editingName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="实验室名称"
          />
        </div>
      </td>
      <td className="manage-labs-form__uid-cell">{lab.teamUid}</td>
      <td>
        <div className="manage-labs-form__leader-field">
          {editingLeaderUid ? (
            <LeaderTag uid={editingLeaderUid} displayName={editingLeaderDisplayName} onClear={onClearLeader} />
          ) : (
            <input
              className="manage-labs-form__input"
              value={editingLeaderQuery}
              onChange={(e) => onLeaderQueryChange(e.target.value)}
              placeholder="搜索负责人（UID/姓名）"
            />
          )}
          {editingShowLeaderSuggestions && (
            <LeaderSuggestionDropdown
              suggestions={editingLeaderSuggestions}
              isLoading={isSearchingEditingLeader}
              onSelect={onSelectLeader}
              onClose={onCloseLeaderSuggestions}
            />
          )}
        </div>
      </td>
      <td>
        <div className="manage-labs-form__actions-cell">
          <button type="button" className="manage-labs-form__save-btn" onClick={onSave}>
            保存
          </button>
          <button type="button" className="manage-labs-form__edit-btn" onClick={onCancel}>
            取消
          </button>
        </div>
      </td>
    </tr>
  )
}

// 07）管理实验室表单（ManageLabsForm）
/**
 * 函数名：ManageLabsForm
 * 功能：提供组织机构下属实验室的增删改表单；包含表格列表与新建实验室表单。
 * 输入：
 * - entityCode：机构主体代码
 * - labs：当前实验室列表
 * - onCancel：取消并返回列表
 * - onSaved：保存成功后刷新列表
 * 输出：
 * - 返回值：React 节点
 * - 副作用：保存时调用创建/更新/删除 API
 */
export function ManageLabsForm({
  entityCode,
  labs: initialLabs,
  onCancel,
  onSaved,
}: ManageLabsFormProps) {
  const [apiPromptMessage, setApiPromptMessage] = useState<string | null>(null)

  const form = useManageLabsForm({
    entityCode,
    initialLabs,
    onCancel,
    onSaved,
    onApiError: (message) => setApiPromptMessage(message),
  })

  return (
    <>
      <article className="profile-section-card manage-labs-form">
        <header className="manage-labs-form__head">
          <h2>管理实验室</h2>
          <button type="button" className="manage-labs-form__back" onClick={form.handleCancel}>
            返回实验室列表
          </button>
        </header>

        {form.errorMessage ? (
          <p className="manage-labs-form__message manage-labs-form__message--error" role="alert">
            {form.errorMessage}
          </p>
        ) : (
          <p className="manage-labs-form__message">
            编辑已有实验室信息，或在下方创建新的下属实验室。负责人通过输入 UID 或姓名搜索选择。
          </p>
        )}

        <section className="manage-labs-form__section">
          <h3 className="manage-labs-form__section-title">现有实验室</h3>
          {form.labs.length > 0 ? (
            <table className="manage-labs-form__table">
              <thead>
                <tr>
                  <th scope="col">实验室</th>
                  <th scope="col">UID</th>
                  <th scope="col">负责人</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {form.labs.map((lab) => {
                  if (lab.isEditing) {
                    return (
                      <LabRowEdit
                        key={lab.teamUid}
                        lab={lab}
                        editingName={form.editingName}
                        editingLeaderQuery={form.editingLeaderQuery}
                        editingLeaderUid={form.editingLeaderUid}
                        editingLeaderDisplayName={form.editingLeaderDisplayName}
                        editingLeaderSuggestions={form.editingLeaderSuggestions}
                        editingShowLeaderSuggestions={form.editingShowLeaderSuggestions}
                        isSearchingEditingLeader={form.isSearchingEditingLeader}
                        onNameChange={form.setEditingName}
                        onLeaderQueryChange={form.setEditingLeaderQuery}
                        onSelectLeader={form.selectEditingLeader}
                        onClearLeader={form.clearEditingLeader}
                        onCloseLeaderSuggestions={form.closeEditingLeaderSuggestions}
                        onSave={() => form.saveEditingLab(lab.teamUid)}
                        onCancel={() => form.cancelEditingLab(lab.teamUid)}
                      />
                    )
                  }

                  return (
                    <LabRowDisplay
                      key={lab.teamUid}
                      lab={lab}
                      onEdit={() => form.startEditingLab(lab.teamUid)}
                      onDelete={() => form.deleteLab(lab.teamUid)}
                    />
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="profile-tab-empty">暂无下属实验室，请先创建</p>
          )}
        </section>

        <section className="manage-labs-form__section">
          <h3 className="manage-labs-form__section-title">创建新实验室</h3>
          <div className="manage-labs-form__add-grid">
            <div className="manage-labs-form__add-field">
              <input
                className="manage-labs-form__input"
                value={form.newLabName}
                onChange={(e) => form.setNewLabName(e.target.value)}
                placeholder="实验室名称 *"
              />
            </div>
            <div className="manage-labs-form__add-field">
              <div className="manage-labs-form__leader-field">
                {form.newLabLeaderUid ? (
                  <LeaderTag
                    uid={form.newLabLeaderUid}
                    displayName={form.newLabLeaderDisplayName}
                    onClear={form.clearLeader}
                  />
                ) : (
                  <input
                    className="manage-labs-form__input"
                    value={form.newLabLeaderQuery}
                    onChange={(e) => form.setNewLabLeaderQuery(e.target.value)}
                    placeholder="搜索负责人（UID/姓名）"
                  />
                )}
                {form.showLeaderSuggestions && (
                  <LeaderSuggestionDropdown
                    suggestions={form.leaderSuggestions}
                    isLoading={form.isSearchingLeader}
                    onSelect={form.selectLeader}
                    onClose={form.closeLeaderSuggestions}
                  />
                )}
              </div>
            </div>
            <div className="manage-labs-form__add-field manage-labs-form__add-field--action">
              <button
                type="button"
                className="manage-labs-form__create-btn"
                disabled={form.isSaving}
                onClick={() => { void form.createLab() }}
              >
                {form.isSaving ? '创建中…' : '创建实验室'}
              </button>
            </div>
          </div>
          <p className="manage-labs-form__add-hint">
            填写名称（必填）和负责人（可选），点击"创建实验室"保存。
          </p>
        </section>

        <footer className="manage-labs-form__footer">
          <button type="button" className="manage-labs-form__cancel-btn" onClick={form.handleCancel}>
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
