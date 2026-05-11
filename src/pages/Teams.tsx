import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField, type DetailModalMemberRow } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import { Users2, Search, Shield, UserPlus, Trash2, Edit } from 'lucide-react';

// 01）团队列表数据模型（team + 关联展示字段）
interface TeamDetail {
    id: number;
    team_name: string;
    leader_id: number | null;
    leader_name: string | null;
    tag: string[];
    intro: string;
    status: 'ACTIVE' | 'DISBANDED';
    created_at: string;
    updated_at: string;
    members: DetailModalMemberRow[];
}

// 03）团队新增表单字段配置（teamCreateFields）
const teamCreateFields: CreateFormField[] = [
    { key: 'team_name', label: '团队名称', required: true, placeholder: '请输入团队名称' },
    { key: 'leader_name', label: '队长名称', required: true, placeholder: '请输入队长名称' },
    { key: 'tag', label: '技能标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'intro', label: '团队简介（可选）', type: 'textarea', placeholder: '请输入团队简介' },
];

// 04）团队修改表单字段配置（teamEditFields）
const teamEditFields: CreateFormField[] = [
    { key: 'team_name', label: '团队名称', required: true, placeholder: '请输入团队名称' },
    { key: 'leader_name', label: '队长名称（可选）', placeholder: '请输入队长名称' },
    { key: 'tag', label: '技能标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'intro', label: '团队简介（可选）', type: 'textarea', placeholder: '请输入团队简介' },
    {
        key: 'status',
        label: '团队状态',
        required: true,
        type: 'select',
        options: [
            { label: 'ACTIVE', value: 'ACTIVE' },
            { label: 'DISBANDED', value: 'DISBANDED' },
        ],
    },
];

// 04）团队成员新增表单字段配置（teamMemberCreateFields）
const teamMemberCreateFields: CreateFormField[] = [
    { key: 'real_name', label: '成员姓名', required: true, placeholder: '请输入成员姓名' },
    { key: 'phone', label: '手机号', required: true, placeholder: '请输入手机号' },
    { key: 'current_entity_name', label: '所属主体（可选）', placeholder: '请输入主体名称' },
    { key: 'career_data', label: '职业/学籍背景（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'bio_data', label: '档案标签（可选）', placeholder: '多个值用逗号分隔' },
];

// 05）团队成员修改表单字段配置（teamMemberEditFields）
const teamMemberEditFields: CreateFormField[] = [
    { key: 'real_name', label: '成员姓名', required: true, placeholder: '请输入成员姓名' },
    { key: 'phone', label: '手机号', required: true, placeholder: '请输入手机号' },
    { key: 'current_entity_name', label: '所属主体（可选）', placeholder: '请输入主体名称' },
    { key: 'career_data', label: '职业/学籍背景（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'bio_data', label: '档案标签（可选）', placeholder: '多个值用逗号分隔' },
];

// 02）团队管理页面（Teams）
const Teams: React.FC = () => {
    // 模拟静态数据
    const [teams, setTeams] = useState<TeamDetail[]>([
        {
            id: 1,
            team_name: 'AI 图像算法组',
            leader_id: 1001,
            leader_name: '队长 A',
            tag: ['PyTorch', '模型部署', 'A/B 测试'],
            intro: '负责图像算法研发、服务化部署与线上效果持续优化。',
            status: 'ACTIVE',
            created_at: '2026-03-20 10:00:00',
            updated_at: '2026-04-18 10:20:00',
            members: [
                { id: 1001, real_name: '队长 A（队长）', phone: '13900001234', current_entity_name: '浙江大学', career_data: ['队长'], bio_data: ['PyTorch', '模型部署'] },
                { id: 1002, real_name: '张三', phone: '13800138000', current_entity_name: '浙江大学', career_data: ['大三'], bio_data: ['A/B 测试', 'Python'] },
                { id: 1003, real_name: '李四', phone: '13912345678', current_entity_name: '浙江大学', career_data: ['研一'], bio_data: ['后端开发', 'MLOps'] },
            ],
        },
        {
            id: 2,
            team_name: '前端基建小分队',
            leader_id: 1005,
            leader_name: '队长 B',
            tag: ['React', '工程化', '性能优化'],
            intro: '聚焦前端脚手架、组件规范与构建链路治理，支撑多项目协同开发。',
            status: 'ACTIVE',
            created_at: '2026-04-01 09:30:00',
            updated_at: '2026-04-17 15:00:00',
            members: [
                { id: 1005, real_name: '队长 B（队长）', phone: '13766667777', current_entity_name: '阿里巴巴', career_data: ['队长'], bio_data: ['React', '工程化'] },
                { id: 1011, real_name: '赵云', phone: '13700001111', current_entity_name: '阿里巴巴', career_data: ['大二'], bio_data: ['性能优化'] },
            ],
        },
        {
            id: 3,
            team_name: '智能硬件开发营',
            leader_id: 1012,
            leader_name: '队长 C',
            tag: ['嵌入式', '物联网', '边缘计算'],
            intro: '承担硬件驱动、设备接入和边缘端联调任务，支撑智能设备项目交付。',
            status: 'DISBANDED',
            created_at: '2026-04-10 18:20:00',
            updated_at: '2026-04-12 19:30:00',
            members: [],
        },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [memberCreateModalOpen, setMemberCreateModalOpen] = useState(false);
    const [memberCreateSubmitting, setMemberCreateSubmitting] = useState(false);
    const [memberEditModalOpen, setMemberEditModalOpen] = useState(false);
    const [memberEditSubmitting, setMemberEditSubmitting] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
    const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const editingTeam = teams.find((team) => team.id === editingTeamId) ?? null;
    const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;
    const editingMember = selectedTeam?.members.find((member) => member.id === editingMemberId) ?? null;
    const selectedTeamFields: DetailModalField[] = selectedTeam ? [
        { label: 'ID', value: selectedTeam.id },
        { label: '团队名称', value: selectedTeam.team_name },
        { label: '队长', value: selectedTeam.leader_id == null ? '未指派' : `#${selectedTeam.leader_id}，${selectedTeam.leader_name ?? '未知用户'}` },
        { label: '状态', value: selectedTeam.status },
        { label: '创建时间', value: selectedTeam.created_at },
        { label: '更新时间', value: selectedTeam.updated_at },
    ] : [];

    // 05）团队新增提交处理（handleCreateTeamSubmit）
    /**
     * 函数名：handleCreateTeamSubmit
     * 功能：处理团队新增表单提交并在页面中预览新增结果。
     * 实现方法：
     * - 读取通用新增弹窗字段值并组装团队数据
     * - 标签字段按逗号拆分为数组
     * - 新数据插入列表顶部并关闭弹窗
     * 输入：
     * - values：新增团队表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 teams/createModalOpen/createSubmitting 状态
     */
    const handleCreateTeamSubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const tags = (values.tag ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const nextTeam: TeamDetail = {
                id: Date.now(),
                team_name: (values.team_name ?? '').trim(),
                leader_id: null,
                leader_name: (values.leader_name ?? '').trim() || null,
                tag: tags,
                intro: (values.intro ?? '').trim(),
                status: 'ACTIVE',
                created_at: now,
                updated_at: now,
                members: [],
            };
            setTeams((prev) => [nextTeam, ...prev]);
            setCreateModalOpen(false);
        } finally {
            setCreateSubmitting(false);
        }
    };

    // 06）团队详情成员新增提交处理（handleCreateTeamMemberSubmit）
    /**
     * 函数名：handleCreateTeamMemberSubmit
     * 功能：处理团队详情弹窗中的新增成员提交并更新当前团队成员列表。
     * 实现方法：
     * - 将逗号分隔的背景与标签字段拆分为数组
     * - 仅更新当前选中团队的 members 数组
     * - 提交后关闭新增成员弹窗
     * 输入：
     * - values：新增成员表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 teams/memberCreateModalOpen/memberCreateSubmitting 状态
     */
    const handleCreateTeamMemberSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedTeamId == null) {
            return;
        }
        try {
            setMemberCreateSubmitting(true);
            const splitList = (raw: string): string[] =>
                raw.split(',').map((item) => item.trim()).filter(Boolean);
            const nextMember: DetailModalMemberRow = {
                id: Date.now(),
                real_name: (values.real_name ?? '').trim(),
                phone: (values.phone ?? '').trim(),
                current_entity_name: (values.current_entity_name ?? '').trim() || null,
                career_data: splitList(values.career_data ?? ''),
                bio_data: splitList(values.bio_data ?? ''),
            };
            setTeams((prev) =>
                prev.map((team) =>
                    team.id === selectedTeamId
                        ? { ...team, members: [...team.members, nextMember] }
                        : team,
                ),
            );
            setMemberCreateModalOpen(false);
        } finally {
            setMemberCreateSubmitting(false);
        }
    };

    // 07）模拟团队更新 API（mockUpdateTeamAPI）
    const mockUpdateTeamAPI = async (id: number, payload: Partial<TeamDetail>): Promise<Partial<TeamDetail>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 260 + (id % 3) * 30);
        });

    // 08）模拟团队删除 API（mockDeleteTeamAPI）
    const mockDeleteTeamAPI = async (id: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 200 + (id % 5) * 20);
        });

    // 09）打开团队修改弹窗（handleOpenTeamEditModal）
    const handleOpenTeamEditModal = (team: TeamDetail): void => {
        setEditingTeamId(team.id);
        setEditModalOpen(true);
    };

    // 10）团队修改提交处理（handleEditTeamSubmit）
    const handleEditTeamSubmit = async (values: CreateFormValues): Promise<void> => {
        if (editingTeamId == null) {
            return;
        }
        try {
            setEditSubmitting(true);
            const now = new Date().toLocaleString();
            const tags = (values.tag ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const payload: Partial<TeamDetail> = {
                team_name: (values.team_name ?? '').trim(),
                leader_name: (values.leader_name ?? '').trim() || null,
                tag: tags,
                intro: (values.intro ?? '').trim(),
                status: (values.status as TeamDetail['status']) || 'ACTIVE',
                updated_at: now,
            };
            const updated = await mockUpdateTeamAPI(editingTeamId, payload);
            setTeams((prev) => prev.map((team) => (team.id === editingTeamId ? { ...team, ...updated } : team)));
            setEditModalOpen(false);
            setEditingTeamId(null);
        } finally {
            setEditSubmitting(false);
        }
    };

    // 11）团队删除处理（handleDeleteTeam）
    const handleDeleteTeam = async (id: number): Promise<void> => {
        if (!window.confirm('确定要删除该团队吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingTeamId(id);
            await mockDeleteTeamAPI(id);
            setTeams((prev) => prev.filter((team) => team.id !== id));
            setSelectedTeamId((prev) => (prev === id ? null : prev));
        } finally {
            setDeletingTeamId(null);
        }
    };

    // 12）模拟团队成员更新 API（mockUpdateTeamMemberAPI）
    const mockUpdateTeamMemberAPI = async (
        memberId: number,
        payload: Partial<DetailModalMemberRow>,
    ): Promise<Partial<DetailModalMemberRow>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 240 + (memberId % 3) * 30);
        });

    // 13）模拟团队成员删除 API（mockDeleteTeamMemberAPI）
    const mockDeleteTeamMemberAPI = async (memberId: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 180 + (memberId % 5) * 20);
        });

    // 14）打开团队成员修改弹窗（handleOpenTeamMemberEditModal）
    const handleOpenTeamMemberEditModal = (memberId: number): void => {
        setEditingMemberId(memberId);
        setMemberEditModalOpen(true);
    };

    // 15）团队成员修改提交处理（handleEditTeamMemberSubmit）
    const handleEditTeamMemberSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedTeamId == null || editingMemberId == null) {
            return;
        }
        try {
            setMemberEditSubmitting(true);
            const splitList = (raw: string): string[] =>
                raw.split(',').map((item) => item.trim()).filter(Boolean);
            const payload: Partial<DetailModalMemberRow> = {
                real_name: (values.real_name ?? '').trim(),
                phone: (values.phone ?? '').trim(),
                current_entity_name: (values.current_entity_name ?? '').trim() || null,
                career_data: splitList(values.career_data ?? ''),
                bio_data: splitList(values.bio_data ?? ''),
            };
            const updated = await mockUpdateTeamMemberAPI(editingMemberId, payload);
            setTeams((prev) =>
                prev.map((team) =>
                    team.id === selectedTeamId
                        ? {
                            ...team,
                            members: team.members.map((member) =>
                                member.id === editingMemberId ? { ...member, ...updated } : member,
                            ),
                        }
                        : team,
                ),
            );
            setMemberEditModalOpen(false);
            setEditingMemberId(null);
        } finally {
            setMemberEditSubmitting(false);
        }
    };

    // 16）团队成员删除处理（handleDeleteTeamMember）
    const handleDeleteTeamMember = async (memberId: number): Promise<void> => {
        if (selectedTeamId == null) {
            return;
        }
        if (!window.confirm('确定要删除该团队成员吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingMemberId(memberId);
            await mockDeleteTeamMemberAPI(memberId);
            setTeams((prev) =>
                prev.map((team) =>
                    team.id === selectedTeamId
                        ? { ...team, members: team.members.filter((member) => member.id !== memberId) }
                        : team,
                ),
            );
        } finally {
            setDeletingMemberId(null);
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <div>
                    <h1>团队/成员管理</h1>
                    <p>监控全平台活跃团队、队长指派及项目归属情况</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <UserPlus size={18} /> 手动组建团队
                </button>
            </div>

            <div className="card table-container">
                <div className="table-toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="搜索团队名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="standard-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>团队名称</th>
                            <th>队长（ID / 名称）</th>
                            <th>团队状态</th>
                            <th>创建时间</th>
                            <th>更新时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.filter(t => t.team_name.includes(searchTerm)).map((t) => (
                            <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>
                                    <div className="name-cell">
                                        <Users2 size={16} />
                                        <button
                                            type="button"
                                            className="detail-name-btn"
                                            onClick={() => setSelectedTeamId(t.id)}
                                            title="点击查看团队详情"
                                        >
                                            {t.team_name}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <div className="info-with-icon">
                                        <Shield size={14} style={{ color: '#f59e0b' }} />
                                        {t.leader_id == null ? (
                                            <span className="unassigned">未指派</span>
                                        ) : (
                                            <span>
                                                <span className="project-id-tag">#{t.leader_id}</span>
                                                <span>，{t.leader_name ?? '未知用户'}</span>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${t.status === 'ACTIVE' ? 'st-approved' : 'st-rejected'}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td>{t.created_at}</td>
                                <td>{t.updated_at}</td>
                                <td className="action-btns">
                                    <button
                                        className="btn-icon edit"
                                        title="编辑团队"
                                        onClick={() => handleOpenTeamEditModal(t)}
                                        disabled={editSubmitting || deletingTeamId === t.id}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        title="解散团队"
                                        onClick={() => { void handleDeleteTeam(t.id); }}
                                        disabled={editSubmitting || deletingTeamId === t.id}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 03）团队详情弹窗：使用通用详情组件渲染 */}
            <DetailModal
                open={Boolean(selectedTeam)}
                title="团队详情"
                fields={selectedTeamFields}
                tags={selectedTeam?.tag}
                tagsLabel="技能标签"
                intro={selectedTeam?.intro}
                introLabel="团队简介"
                memberList={selectedTeam?.members}
                memberListTitle="团队成员列表（含队长）"
                onAddMember={() => setMemberCreateModalOpen(true)}
                onEditMember={handleOpenTeamMemberEditModal}
                onDeleteMember={(memberId) => { void handleDeleteTeamMember(memberId); }}
                onClose={() => setSelectedTeamId(null)}
            />

            <CreateFormModal
                open={createModalOpen}
                title="新增团队"
                fields={teamCreateFields}
                submitText="确认新增"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateTeamSubmit}
            />

            <CreateFormModal
                open={memberCreateModalOpen}
                title="新增团队成员"
                fields={teamMemberCreateFields}
                submitText="确认新增成员"
                submitting={memberCreateSubmitting}
                onClose={() => setMemberCreateModalOpen(false)}
                onSubmit={handleCreateTeamMemberSubmit}
            />

            <EditFormModal
                open={editModalOpen}
                title="修改团队"
                fields={teamEditFields}
                initialValues={{
                    team_name: editingTeam?.team_name ?? '',
                    leader_name: editingTeam?.leader_name ?? '',
                    tag: editingTeam?.tag.join(', ') ?? '',
                    intro: editingTeam?.intro ?? '',
                    status: editingTeam?.status ?? 'ACTIVE',
                }}
                submitText="确认修改"
                submitting={editSubmitting}
                onClose={() => {
                    if (editSubmitting) {
                        return;
                    }
                    setEditModalOpen(false);
                    setEditingTeamId(null);
                }}
                onSubmit={handleEditTeamSubmit}
            />

            <EditFormModal
                open={memberEditModalOpen}
                title="修改团队成员"
                fields={teamMemberEditFields}
                initialValues={{
                    real_name: editingMember?.real_name ?? '',
                    phone: editingMember?.phone ?? '',
                    current_entity_name: editingMember?.current_entity_name ?? '',
                    career_data: editingMember?.career_data.join(', ') ?? '',
                    bio_data: editingMember?.bio_data.join(', ') ?? '',
                }}
                submitText="确认修改成员"
                submitting={memberEditSubmitting || deletingMemberId === editingMemberId}
                onClose={() => {
                    if (memberEditSubmitting) {
                        return;
                    }
                    setMemberEditModalOpen(false);
                    setEditingMemberId(null);
                }}
                onSubmit={handleEditTeamMemberSubmit}
            />
        </AdminLayout>
    );
};

export default Teams;