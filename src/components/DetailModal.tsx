import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import CollapsibleMilestoneTable, { type CollapsibleMilestoneRow } from './DetailCollapsibleTable';

// 01）详情弹窗字段类型（DetailModalField）
export interface DetailModalField {
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
}

// 02）详情弹窗成员行类型（DetailModalMemberRow）
export interface DetailModalMemberRow {
    id: number;
    real_name: string;
    phone: string;
    current_entity_name: string | null;
    career_data: string[];
    bio_data: string[];
}

// 03）详情弹窗里程碑行类型（DetailModalMilestoneRow）
export type DetailModalMilestoneRow = CollapsibleMilestoneRow;

// 04）详情弹窗组件参数类型（DetailModalProps）
interface DetailModalProps {
    open: boolean;
    title: string;
    fields: DetailModalField[];
    tags?: string[];
    tagsLabel?: string;
    intro?: string | null;
    introLabel?: string;
    memberList?: DetailModalMemberRow[];
    memberListTitle?: string;
    onAddMember?: () => void;
    onEditMember?: (memberId: number) => void;
    onDeleteMember?: (memberId: number) => void;
    milestoneList?: DetailModalMilestoneRow[];
    milestoneListTitle?: string;
    onAddMilestone?: () => void;
    onAddTask?: (milestoneId: number) => void;
    onEditMilestone?: (milestoneId: number) => void;
    onDeleteMilestone?: (milestoneId: number) => void;
    onEditTask?: (milestoneId: number, taskId: number) => void;
    onDeleteTask?: (milestoneId: number, taskId: number) => void;
    onClose: () => void;
}

// 05）通用详情弹窗组件（DetailModal）
/**
 * 函数名：DetailModal
 * 功能：在当前页面中展示统一样式的详情弹窗，用于查看实验室、团队、主体、用户等实体详情。
 * 实现方法：
 * - 根据 open 控制弹窗显隐，关闭时不渲染任何节点
 * - 通过 fields 渲染表单样式的详情项，支持 fullWidth 跨列展示
 * - 可选渲染 tags、intro、成员表格、里程碑表格，复用统一视觉样式
 * - 支持点击遮罩或关闭按钮触发 onClose
 * 输入：
 * - props：详情弹窗参数，包含标题、字段列表、可选标签/简介/成员表格/里程碑表格、关闭回调
 * 输出：
 * - 返回值：ReactElement | null（关闭时为 null）
 * - 副作用：无（仅触发外部传入的 onClose 回调）
 */
const DetailModal: React.FC<DetailModalProps> = ({
    open,
    title,
    fields,
    tags,
    tagsLabel = '技能标签',
    intro,
    introLabel = '简介',
    memberList,
    memberListTitle = '成员列表',
    onAddMember,
    onEditMember,
    onDeleteMember,
    milestoneList,
    milestoneListTitle = '里程碑列表',
    onAddMilestone,
    onAddTask,
    onEditMilestone,
    onDeleteMilestone,
    onEditTask,
    onDeleteTask,
    onClose,
}) => {
    if (!open) {
        return null;
    }

    return (
        <div
            className="detail-modal-overlay"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="detail-modal" role="dialog" aria-modal="true" aria-label={title}>
                <div className="detail-modal__header">
                    <h3>{title}</h3>
                    <button
                        type="button"
                        className="detail-modal__close"
                        onClick={onClose}
                    >
                        关闭
                    </button>
                </div>

                <div className="detail-form-grid">
                    {fields.map((field) => (
                        <div
                            key={field.label}
                            className={`detail-form-item ${field.fullWidth ? 'detail-form-item--full' : ''}`.trim()}
                        >
                            <label>{field.label}</label>
                            <div className="detail-form-value">{field.value}</div>
                        </div>
                    ))}

                    {tags ? (
                        <div className="detail-form-item detail-form-item--full">
                            <label>{tagsLabel}</label>
                            <div className="tag-list detail-tag-list">
                                {tags.length > 0 ? (
                                    tags.map((tag) => <span key={tag} className="bio-tag">{tag}</span>)
                                ) : (
                                    <span className="detail-modal__empty">暂无标签</span>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {intro !== undefined ? (
                        <div className="detail-form-item detail-form-item--full">
                            <label>{introLabel}</label>
                            <div className="detail-intro-box">{intro || '暂无简介'}</div>
                        </div>
                    ) : null}
                </div>
                {memberList ? (
                    <div className="detail-member-section">
                        <div className="detail-table-section-header">
                            <h4>{memberListTitle}</h4>
                            <button type="button" className="btn-primary" onClick={onAddMember}>
                                <Plus size={18} /> 新增
                            </button>
                        </div>
                        <table className="standard-table detail-member-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>用户信息</th>
                                    <th>所属主体</th>
                                    <th>职业/学籍背景</th>
                                    <th>档案标签</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberList.length > 0 ? (
                                    memberList.map((member) => (
                                        <tr key={member.id}>
                                            <td>{member.id}</td>
                                            <td>
                                                <div className="user-info-cell">
                                                    <div className="avatar-placeholder">
                                                        {member.real_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="user-name">{member.real_name}</div>
                                                        <div className="user-phone">{member.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="entity-tag">{member.current_entity_name ?? '暂无归属'}</span>
                                            </td>
                                            <td>
                                                <div className="tag-list">
                                                    {member.career_data.length > 0 ? (
                                                        member.career_data.map((career) => <span key={career} className="bio-tag">{career}</span>)
                                                    ) : (
                                                        <span className="no-tags">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="tag-list">
                                                    {member.bio_data.length > 0 ? (
                                                        member.bio_data.map((tag) => <span key={tag} className="bio-tag">{tag}</span>)
                                                    ) : (
                                                        <span className="no-tags">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="action-btns">
                                                <button
                                                    className="btn-icon edit"
                                                    title="修改"
                                                    onClick={() => onEditMember?.(member.id)}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon delete"
                                                    title="删除"
                                                    onClick={() => onDeleteMember?.(member.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="detail-member-empty">暂无成员数据</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {milestoneList ? (
                    <CollapsibleMilestoneTable
                        title={milestoneListTitle}
                        milestones={milestoneList}
                        onAddMilestone={onAddMilestone}
                        onAddTask={onAddTask}
                        onEditMilestone={onEditMilestone}
                        onDeleteMilestone={onDeleteMilestone}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default DetailModal;
