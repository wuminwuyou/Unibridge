import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Clock, Edit, Plus, Trash2 } from 'lucide-react';

// 01）任务卡片行数据类型（MilestoneTaskRow）
export interface MilestoneTaskRow {
    id: number;
    title: string;
    content: string;
    assignee_id: number | null;
    assignee_name: string | null;
    status: 'DONE' | 'TODO';
    created_at: string;
    updated_at: string;
}

// 02）里程碑折叠行数据类型（CollapsibleMilestoneRow）
export interface CollapsibleMilestoneRow {
    id: number;
    title: string;
    payment_pct: number;
    status: string;
    created_at: string;
    updated_at: string;
    deadline_at: string;
    tasks: MilestoneTaskRow[];
}

// 03）里程碑折叠表格组件参数类型（CollapsibleMilestoneTableProps）
interface CollapsibleMilestoneTableProps {
    title?: string;
    milestones: CollapsibleMilestoneRow[];
    onAddMilestone?: () => void;
    onAddTask?: (milestoneId: number) => void;
    onEditMilestone?: (milestoneId: number) => void;
    onDeleteMilestone?: (milestoneId: number) => void;
    onEditTask?: (milestoneId: number, taskId: number) => void;
    onDeleteTask?: (milestoneId: number, taskId: number) => void;
}

// 04）状态样式映射工具（mapMilestoneStatusStyle）
/**
 * 函数名：mapMilestoneStatusStyle
 * 功能：将里程碑状态值映射为统一的状态徽章样式与图标。
 * 实现方法：
 * - 将输入状态统一转为大写，减少大小写差异影响
 * - APPROVED/CLOSED 映射为通过样式与对勾图标
 * - REJECTED 映射为驳回样式与时钟图标
 * - 其他状态回退到待处理样式
 * 输入：
 * - status：里程碑状态字符串，来源于业务数据
 * 输出：
 * - 返回值：包含 className 和 icon 的对象，用于渲染状态徽章
 * - 副作用：无
 */
function mapMilestoneStatusStyle(status: string): { className: string; icon: React.ReactNode } {
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'APPROVED' || upperStatus === 'CLOSED') {
        return { className: 'st-approved', icon: <CheckCircle2 size={12} /> };
    }
    if (upperStatus === 'REJECTED') {
        return { className: 'st-rejected', icon: <Clock size={12} /> };
    }
    return { className: 'st-pending', icon: <Clock size={12} /> };
}

// 05）任务状态样式映射工具（mapTaskStatusStyle）
/**
 * 函数名：mapTaskStatusStyle
 * 功能：将任务卡片状态映射为统一的状态徽章样式类名。
 * 实现方法：
 * - DONE 映射为完成样式
 * - TODO 映射为待处理样式
 * 输入：
 * - status：任务状态（DONE | TODO）
 * 输出：
 * - 返回值：状态徽章类名字符串
 * - 副作用：无
 */
function mapTaskStatusStyle(status: MilestoneTaskRow['status']): string {
    return status === 'DONE' ? 'st-approved' : 'st-pending';
}

// 06）里程碑可折叠表格组件（CollapsibleMilestoneTable）
/**
 * 函数名：CollapsibleMilestoneTable
 * 功能：在弹窗中渲染可折叠里程碑表格，并在展开后显示任务卡片子表格。
 * 实现方法：
 * - 先按 `deadline_at` 对里程碑排序，确保按截止时间顺序展示
 * - 点击里程碑节点按钮切换展开/折叠状态
 * - 里程碑状态复用管理页状态徽章样式（st-approved/st-pending/st-rejected）
 * - 展开行以子表格展示任务卡片字段与操作按钮
 * 输入：
 * - title：里程碑区域标题，可选
 * - milestones：里程碑数组，包含任务卡片列表
 * 输出：
 * - 返回值：ReactElement（可折叠里程碑表格）
 * - 副作用：无（仅组件内部状态切换）
 */
const CollapsibleMilestoneTable: React.FC<CollapsibleMilestoneTableProps> = ({
    title = '里程碑列表（按截止时间排序）',
    milestones,
    onAddMilestone,
    onAddTask,
    onEditMilestone,
    onDeleteMilestone,
    onEditTask,
    onDeleteTask,
}) => {
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    // 07）截止时间排序结果（sortedMilestones）
    const sortedMilestones = useMemo(
        () => [...milestones].sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()),
        [milestones],
    );

    // 08）里程碑展开切换（toggleMilestone）
    const toggleMilestone = (id: number) => {
        setExpandedIds((prev) => (prev.includes(id) ? prev.filter((currentId) => currentId !== id) : [...prev, id]));
    };

    return (
        <div className="detail-member-section">
            <div className="detail-table-section-header">
                <h4>{title}</h4>
                <button type="button" className="btn-primary" onClick={onAddMilestone}>
                    <Plus size={18} /> 新增
                </button>
            </div>
            <table className="standard-table detail-member-table detail-milestone-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>里程碑节点</th>
                        <th>拨款占比</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>更新时间</th>
                        <th>截止时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedMilestones.length > 0 ? (
                        sortedMilestones.map((milestone) => {
                            const isExpanded = expandedIds.includes(milestone.id);
                            const statusStyle = mapMilestoneStatusStyle(milestone.status);
                            return (
                                <React.Fragment key={milestone.id}>
                                    <tr>
                                        <td>{milestone.id}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="detail-expand-btn"
                                                onClick={() => toggleMilestone(milestone.id)}
                                            >
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <span>{milestone.title}</span>
                                            </button>
                                        </td>
                                        <td>{milestone.payment_pct}%</td>
                                        <td>
                                            <span className={`status-badge ${statusStyle.className}`}>
                                                {statusStyle.icon}
                                                {milestone.status}
                                            </span>
                                        </td>
                                        <td>{milestone.created_at}</td>
                                        <td>{milestone.updated_at}</td>
                                        <td>{milestone.deadline_at}</td>
                                        <td className="action-btns">
                                            <button
                                                className="btn-icon insert"
                                                title="新增任务卡片"
                                                onClick={() => onAddTask?.(milestone.id)}
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                className="btn-icon edit"
                                                title="修改"
                                                onClick={() => onEditMilestone?.(milestone.id)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                title="删除"
                                                onClick={() => onDeleteMilestone?.(milestone.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded ? (
                                        <tr>
                                            <td colSpan={8} className="detail-collapse-cell">
                                                <table className="standard-table detail-task-table">
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>任务卡片标题/内容</th>
                                                            <th>执行人（ID/名称）</th>
                                                            <th>状态</th>
                                                            <th>创建时间</th>
                                                            <th>更新时间</th>
                                                            <th>操作</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {milestone.tasks.length > 0 ? (
                                                            milestone.tasks.map((task) => (
                                                                <tr key={task.id}>
                                                                    <td>{task.id}</td>
                                                                    <td>
                                                                        <div className="main-text">{task.title}</div>
                                                                        <div className="sub-text">{task.content}</div>
                                                                    </td>
                                                                    <td>{task.assignee_id == null ? '未指派' : `#${task.assignee_id}，${task.assignee_name ?? '未知用户'}`}</td>
                                                                    <td>
                                                                        <span className={`status-badge ${mapTaskStatusStyle(task.status)}`}>
                                                                            {task.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>{task.created_at}</td>
                                                                    <td>{task.updated_at}</td>
                                                                    <td className="action-btns">
                                                                        <button
                                                                            className="btn-icon edit"
                                                                            title="修改"
                                                                            onClick={() => onEditTask?.(milestone.id, task.id)}
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="btn-icon delete"
                                                                            title="删除"
                                                                            onClick={() => onDeleteTask?.(milestone.id, task.id)}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={7} className="detail-member-empty">暂无任务卡片</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    ) : null}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={8} className="detail-member-empty">暂无里程碑数据</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CollapsibleMilestoneTable;
