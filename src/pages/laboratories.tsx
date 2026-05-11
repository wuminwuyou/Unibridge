import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField, type DetailModalMemberRow } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import { FlaskConical, GraduationCap, Building, Search, Plus, Edit, Trash2 } from 'lucide-react';

// 01）实验室列表数据模型（laboratory + 关联展示字段）
interface LabDetail {
    id: number;
    lab_name: string;
    entity_id: number;
    entity_name: string;
    mentor_id: number | null;
    mentor_name: string | null;
    tag: string[];
    intro: string;
    created_at: string;
    updated_at: string;
    members: DetailModalMemberRow[];
}

// 03）实验室新增表单字段配置（labCreateFields）
const labCreateFields: CreateFormField[] = [
    { key: 'entity_name', label: '所属主体名称', required: true, placeholder: '请输入主体名称' },
    { key: 'mentor_name', label: '导师名称', required: true, placeholder: '请输入导师名称' },
    { key: 'lab_name', label: '实验室名称', required: true, placeholder: '请输入实验室名称' },
    { key: 'tag', label: '技能标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'intro', label: '实验室简介（可选）', type: 'textarea', placeholder: '请输入实验室简介' },
];

// 04）实验室修改表单字段配置（labEditFields）
const labEditFields: CreateFormField[] = [
    { key: 'entity_name', label: '所属主体名称', required: true, placeholder: '请输入主体名称' },
    { key: 'mentor_name', label: '导师名称（可选）', placeholder: '请输入导师名称' },
    { key: 'lab_name', label: '实验室名称', required: true, placeholder: '请输入实验室名称' },
    { key: 'tag', label: '技能标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'intro', label: '实验室简介（可选）', type: 'textarea', placeholder: '请输入实验室简介' },
];

// 04）实验室成员新增表单字段配置（labMemberCreateFields）
const labMemberCreateFields: CreateFormField[] = [
    { key: 'real_name', label: '成员姓名', required: true, placeholder: '请输入成员姓名' },
    { key: 'phone', label: '手机号', required: true, placeholder: '请输入手机号' },
    { key: 'current_entity_name', label: '所属主体（可选）', placeholder: '请输入主体名称' },
    { key: 'career_data', label: '职业/学籍背景（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'bio_data', label: '档案标签（可选）', placeholder: '多个值用逗号分隔' },
];

// 05）实验室成员修改表单字段配置（labMemberEditFields）
const labMemberEditFields: CreateFormField[] = [
    { key: 'real_name', label: '成员姓名', required: true, placeholder: '请输入成员姓名' },
    { key: 'phone', label: '手机号', required: true, placeholder: '请输入手机号' },
    { key: 'current_entity_name', label: '所属主体（可选）', placeholder: '请输入主体名称' },
    { key: 'career_data', label: '职业/学籍背景（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'bio_data', label: '档案标签（可选）', placeholder: '多个值用逗号分隔' },
];

// 02）实验室管理页面（Laboratories）
const Laboratories: React.FC = () => {
    const [labs, setLabs] = useState<LabDetail[]>([
        {
            id: 1,
            lab_name: 'AI 视觉实验室',
            entity_id: 1,
            entity_name: '浙江大学',
            mentor_id: 10001,
            mentor_name: '王教授',
            tag: ['计算机视觉', '深度学习', 'MLOps'],
            intro: '聚焦视觉智能模型研发与产业落地，支持算法训练、推理优化和工程部署。',
            created_at: '2026-01-15 10:00:00',
            updated_at: '2026-04-18 09:00:00',
            members: [
                { id: 10001, real_name: '王教授（导师）', phone: '13866668888', current_entity_name: '浙江大学', career_data: ['导师'], bio_data: ['计算机视觉', '深度学习'] },
                { id: 1002, real_name: '张三', phone: '13800138000', current_entity_name: '浙江大学', career_data: ['大三'], bio_data: ['React', 'Node.js'] },
                { id: 1003, real_name: '李四', phone: '13912345678', current_entity_name: '浙江大学', career_data: ['研一'], bio_data: ['MLOps', 'Python'] },
            ],
        },
        {
            id: 2,
            lab_name: '区块链研究中心',
            entity_id: 3,
            entity_name: '清华大学',
            mentor_id: 10002,
            mentor_name: '张专家',
            tag: ['区块链', '智能合约', '密码学'],
            intro: '负责分布式账本、可信存证与合约安全方向的研究与项目孵化。',
            created_at: '2026-02-20 14:30:00',
            updated_at: '2026-04-17 17:20:00',
            members: [
                { id: 10002, real_name: '张专家（导师）', phone: '13622223333', current_entity_name: '清华大学', career_data: ['导师'], bio_data: ['区块链', '智能合约'] },
                { id: 1008, real_name: '王明', phone: '13611112222', current_entity_name: '清华大学', career_data: ['大二'], bio_data: ['密码学'] },
            ],
        },
        {
            id: 3,
            lab_name: '未来操作系统 Lab',
            entity_id: 1,
            entity_name: '浙江大学',
            mentor_id: null,
            mentor_name: null,
            tag: ['操作系统', '编译优化', '系统安全'],
            intro: '探索新型系统架构和底层性能优化，面向高并发与高可靠场景构建基础能力。',
            created_at: '2026-03-05 09:10:00',
            updated_at: '2026-04-16 11:05:00',
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
    const [editingLabId, setEditingLabId] = useState<number | null>(null);
    const [deletingLabId, setDeletingLabId] = useState<number | null>(null);
    const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
    const editingLab = labs.find((lab) => lab.id === editingLabId) ?? null;
    const selectedLab = labs.find((lab) => lab.id === selectedLabId) ?? null;
    const editingMember = selectedLab?.members.find((member) => member.id === editingMemberId) ?? null;
    const selectedLabFields: DetailModalField[] = selectedLab ? [
        { label: 'ID', value: selectedLab.id },
        { label: '实验室名称', value: selectedLab.lab_name },
        { label: '所属主体', value: `#${selectedLab.entity_id}，${selectedLab.entity_name}` },
        { label: '负责导师', value: selectedLab.mentor_id == null ? '暂未指派' : `#${selectedLab.mentor_id}，${selectedLab.mentor_name ?? '未知用户'}` },
        { label: '创建时间', value: selectedLab.created_at },
        { label: '更新时间', value: selectedLab.updated_at },
    ] : [];

    // 05）实验室新增提交处理（handleCreateLabSubmit）
    /**
     * 函数名：handleCreateLabSubmit
     * 功能：处理实验室新增表单提交并在页面中预览新增结果。
     * 实现方法：
     * - 读取通用新增弹窗字段值并组装实验室数据结构
     * - 将标签字符串按逗号拆分为数组
     * - 插入列表顶部并关闭弹窗
     * 输入：
     * - values：新增实验室表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 labs/createModalOpen/createSubmitting 状态
     */
    const handleCreateLabSubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const tags = (values.tag ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const nextLab: LabDetail = {
                id: Date.now(),
                lab_name: (values.lab_name ?? '').trim(),
                entity_id: 0,
                entity_name: (values.entity_name ?? '').trim(),
                mentor_id: null,
                mentor_name: (values.mentor_name ?? '').trim() || null,
                tag: tags,
                intro: (values.intro ?? '').trim(),
                created_at: now,
                updated_at: now,
                members: [],
            };
            setLabs((prev) => [nextLab, ...prev]);
            setCreateModalOpen(false);
        } finally {
            setCreateSubmitting(false);
        }
    };

    // 06）实验室详情成员新增提交处理（handleCreateLabMemberSubmit）
    /**
     * 函数名：handleCreateLabMemberSubmit
     * 功能：处理实验室详情弹窗中新增成员表单提交并更新当前实验室成员列表。
     * 实现方法：
     * - 将逗号分隔的背景与标签字段拆分为数组
     * - 仅更新当前选中实验室的 members 数组
     * - 提交成功后关闭新增成员弹窗
     * 输入：
     * - values：新增成员表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 labs/memberCreateModalOpen/memberCreateSubmitting 状态
     */
    const handleCreateLabMemberSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedLabId == null) {
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
            setLabs((prev) =>
                prev.map((lab) =>
                    lab.id === selectedLabId
                        ? { ...lab, members: [...lab.members, nextMember] }
                        : lab,
                ),
            );
            setMemberCreateModalOpen(false);
        } finally {
            setMemberCreateSubmitting(false);
        }
    };

    // 07）模拟实验室更新 API（mockUpdateLabAPI）
    const mockUpdateLabAPI = async (id: number, payload: Partial<LabDetail>): Promise<Partial<LabDetail>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 260 + (id % 3) * 30);
        });

    // 08）模拟实验室删除 API（mockDeleteLabAPI）
    const mockDeleteLabAPI = async (id: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 200 + (id % 5) * 20);
        });

    // 09）打开实验室修改弹窗（handleOpenLabEditModal）
    const handleOpenLabEditModal = (lab: LabDetail): void => {
        setEditingLabId(lab.id);
        setEditModalOpen(true);
    };

    // 10）实验室修改提交处理（handleEditLabSubmit）
    const handleEditLabSubmit = async (values: CreateFormValues): Promise<void> => {
        if (editingLabId == null) {
            return;
        }
        try {
            setEditSubmitting(true);
            const now = new Date().toLocaleString();
            const tags = (values.tag ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const payload: Partial<LabDetail> = {
                lab_name: (values.lab_name ?? '').trim(),
                entity_name: (values.entity_name ?? '').trim(),
                mentor_name: (values.mentor_name ?? '').trim() || null,
                tag: tags,
                intro: (values.intro ?? '').trim(),
                updated_at: now,
            };
            const updated = await mockUpdateLabAPI(editingLabId, payload);
            setLabs((prev) => prev.map((lab) => (lab.id === editingLabId ? { ...lab, ...updated } : lab)));
            setEditModalOpen(false);
            setEditingLabId(null);
        } finally {
            setEditSubmitting(false);
        }
    };

    // 11）实验室删除处理（handleDeleteLab）
    const handleDeleteLab = async (id: number): Promise<void> => {
        if (!window.confirm('确定要删除该实验室吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingLabId(id);
            await mockDeleteLabAPI(id);
            setLabs((prev) => prev.filter((lab) => lab.id !== id));
            setSelectedLabId((prev) => (prev === id ? null : prev));
        } finally {
            setDeletingLabId(null);
        }
    };

    // 12）模拟实验室成员更新 API（mockUpdateLabMemberAPI）
    const mockUpdateLabMemberAPI = async (
        memberId: number,
        payload: Partial<DetailModalMemberRow>,
    ): Promise<Partial<DetailModalMemberRow>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 240 + (memberId % 3) * 30);
        });

    // 13）模拟实验室成员删除 API（mockDeleteLabMemberAPI）
    const mockDeleteLabMemberAPI = async (memberId: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 180 + (memberId % 5) * 20);
        });

    // 14）打开实验室成员修改弹窗（handleOpenLabMemberEditModal）
    const handleOpenLabMemberEditModal = (memberId: number): void => {
        setEditingMemberId(memberId);
        setMemberEditModalOpen(true);
    };

    // 15）实验室成员修改提交处理（handleEditLabMemberSubmit）
    const handleEditLabMemberSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedLabId == null || editingMemberId == null) {
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
            const updated = await mockUpdateLabMemberAPI(editingMemberId, payload);
            setLabs((prev) =>
                prev.map((lab) =>
                    lab.id === selectedLabId
                        ? {
                            ...lab,
                            members: lab.members.map((member) =>
                                member.id === editingMemberId ? { ...member, ...updated } : member,
                            ),
                        }
                        : lab,
                ),
            );
            setMemberEditModalOpen(false);
            setEditingMemberId(null);
        } finally {
            setMemberEditSubmitting(false);
        }
    };

    // 16）实验室成员删除处理（handleDeleteLabMember）
    const handleDeleteLabMember = async (memberId: number): Promise<void> => {
        if (selectedLabId == null) {
            return;
        }
        if (!window.confirm('确定要删除该实验室成员吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingMemberId(memberId);
            await mockDeleteLabMemberAPI(memberId);
            setLabs((prev) =>
                prev.map((lab) =>
                    lab.id === selectedLabId
                        ? { ...lab, members: lab.members.filter((member) => member.id !== memberId) }
                        : lab,
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
                    <h1>实验室管理</h1>
                    <p>维护各高校主体下的实验室及其负责导师</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <Plus size={18} /> 创建实验室
                </button>
            </div>

            <div className="card table-container">
                {/* 工具栏：样式完全对齐 Entities/Users */}
                <div className="table-toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="搜索实验室名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* 数据表格：结构完全对齐 */}
                <table className="standard-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>实验室信息</th>
                            <th>所属主体（ID / 名称）</th>
                            <th>负责导师（ID / 名称）</th>
                            <th>创建时间</th>
                            <th>更新时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labs.filter(l => l.lab_name.includes(searchTerm)).map((lab) => (
                            <tr key={lab.id}>
                                <td>{lab.id}</td>
                                <td>
                                    <div className="name-cell">
                                        <FlaskConical size={16} />
                                        <button
                                            type="button"
                                            className="detail-name-btn"
                                            onClick={() => setSelectedLabId(lab.id)}
                                            title="点击查看实验室详情"
                                        >
                                            {lab.lab_name}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <div className="info-with-icon">
                                        <Building size={14} />
                                        <span>
                                            <span className="project-id-tag">#{lab.entity_id}</span>
                                            <span>，{lab.entity_name}</span>
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="info-with-icon">
                                        <GraduationCap size={14} />
                                        {lab.mentor_id == null ? (
                                            <span className="unassigned">暂未指派</span>
                                        ) : (
                                            <span>
                                                <span className="project-id-tag">#{lab.mentor_id}</span>
                                                <span>，{lab.mentor_name ?? '未知用户'}</span>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>{lab.created_at}</td>
                                <td>{lab.updated_at}</td>
                                <td className="action-btns">
                                    <button
                                        className="btn-icon edit"
                                        title="编辑"
                                        onClick={() => handleOpenLabEditModal(lab)}
                                        disabled={editSubmitting || deletingLabId === lab.id}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        title="删除"
                                        onClick={() => { void handleDeleteLab(lab.id); }}
                                        disabled={editSubmitting || deletingLabId === lab.id}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 03）实验室详情弹窗：使用通用详情组件渲染 */}
            <DetailModal
                open={Boolean(selectedLab)}
                title="实验室详情"
                fields={selectedLabFields}
                tags={selectedLab?.tag}
                tagsLabel="技能标签"
                intro={selectedLab?.intro}
                introLabel="实验室简介"
                memberList={selectedLab?.members}
                memberListTitle="实验室成员列表（含导师）"
                onAddMember={() => setMemberCreateModalOpen(true)}
                onEditMember={handleOpenLabMemberEditModal}
                onDeleteMember={(memberId) => { void handleDeleteLabMember(memberId); }}
                onClose={() => setSelectedLabId(null)}
            />

            <CreateFormModal
                open={createModalOpen}
                title="新增实验室"
                fields={labCreateFields}
                submitText="确认新增"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateLabSubmit}
            />

            <CreateFormModal
                open={memberCreateModalOpen}
                title="新增实验室成员"
                fields={labMemberCreateFields}
                submitText="确认新增成员"
                submitting={memberCreateSubmitting}
                onClose={() => setMemberCreateModalOpen(false)}
                onSubmit={handleCreateLabMemberSubmit}
            />

            <EditFormModal
                open={editModalOpen}
                title="修改实验室"
                fields={labEditFields}
                initialValues={{
                    entity_name: editingLab?.entity_name ?? '',
                    mentor_name: editingLab?.mentor_name ?? '',
                    lab_name: editingLab?.lab_name ?? '',
                    tag: editingLab?.tag.join(', ') ?? '',
                    intro: editingLab?.intro ?? '',
                }}
                submitText="确认修改"
                submitting={editSubmitting}
                onClose={() => {
                    if (editSubmitting) {
                        return;
                    }
                    setEditModalOpen(false);
                    setEditingLabId(null);
                }}
                onSubmit={handleEditLabSubmit}
            />

            <EditFormModal
                open={memberEditModalOpen}
                title="修改实验室成员"
                fields={labMemberEditFields}
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
                onSubmit={handleEditLabMemberSubmit}
            />
        </AdminLayout>
    );
};

export default Laboratories;