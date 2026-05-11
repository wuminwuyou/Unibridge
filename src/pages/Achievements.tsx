import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import { Search, ExternalLink, Plus, Edit, Trash2 } from 'lucide-react';

// 01）成就归档列表数据模型（achievement_archive + 关联展示字段）
interface Achievement {
    id: number;
    user_id: number;
    user_name: string;
    source_project_id: number | null;
    source_project_title: string | null;
    masked_project_name: string;
    technical_tags: string[];
    completed_at: string;
    updated_at: string;
}

// 03）成就归档新增表单字段配置（achievementCreateFields）
const achievementCreateFields: CreateFormField[] = [
    { key: 'user_id', label: '贡献用户ID', required: true, type: 'number', placeholder: '请输入用户ID' },
    { key: 'masked_project_name', label: '脱敏项目名称', required: true, placeholder: '请输入脱敏项目名称' },
    { key: 'source_project_id', label: '原项目ID（可选）', type: 'number', placeholder: '请输入原项目ID' },
    { key: 'task_description', label: '任务描述（可选）', type: 'textarea', placeholder: '请输入任务描述' },
    { key: 'technical_tags', label: '技术标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'completed_at', label: '归档时间（可选）', type: 'datetime-local' },
];

// 04）成就归档修改表单字段配置（achievementEditFields）
const achievementEditFields: CreateFormField[] = [
    { key: 'user_id', label: '贡献用户ID', required: true, type: 'number', placeholder: '请输入用户ID' },
    { key: 'masked_project_name', label: '脱敏项目名称', required: true, placeholder: '请输入脱敏项目名称' },
    { key: 'source_project_id', label: '原项目ID（可选）', type: 'number', placeholder: '请输入原项目ID' },
    { key: 'technical_tags', label: '技术标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'completed_at', label: '归档时间（可选）', type: 'datetime-local' },
];

// 02）成就归档库页面（Achievements）
const Achievements: React.FC = () => {
    const [archives, setArchives] = useState<Achievement[]>([
        { id: 1, user_id: 5, user_name: '张三', source_project_id: 1, source_project_title: '企业级大模型私有化部署', masked_project_name: '某大型分布式电商系统', technical_tags: ['Redis', 'SpringCloud'], completed_at: '2026-03-20 18:00:00', updated_at: '2026-03-21 09:30:00' },
    ]);
    // 03）成就详情弹窗状态
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editingArchiveId, setEditingArchiveId] = useState<number | null>(null);
    const [deletingArchiveId, setDeletingArchiveId] = useState<number | null>(null);
    const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(null);
    const editingArchive = archives.find((archive) => archive.id === editingArchiveId) ?? null;
    const selectedArchive = archives.find((archive) => archive.id === selectedArchiveId) ?? null;
    const selectedArchiveFields: DetailModalField[] = selectedArchive ? [
        { label: '归档ID', value: selectedArchive.id },
        { label: '脱敏项目名称', value: selectedArchive.masked_project_name },
        { label: '贡献用户', value: `#${selectedArchive.user_id}，${selectedArchive.user_name}` },
        { label: '原项目溯源', value: selectedArchive.source_project_id == null ? '—' : `#${selectedArchive.source_project_id}，${selectedArchive.source_project_title ?? '未知项目'}` },
        { label: '归档日期', value: selectedArchive.completed_at },
        { label: '更新时间', value: selectedArchive.updated_at },
    ] : [];

    // 04）成就归档新增提交处理（handleCreateAchievementSubmit）
    /**
     * 函数名：handleCreateAchievementSubmit
     * 功能：处理成就归档新增表单提交并在列表中预览新增结果。
     * 实现方法：
     * - 读取新增表单字段并做必要类型转换
     * - 标签字段拆分为数组
     * - 新增记录插入列表顶部并关闭弹窗
     * 输入：
     * - values：新增成就归档表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 archives/createModalOpen/createSubmitting 状态
     */
    const handleCreateAchievementSubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const tags = (values.technical_tags ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const nextAchievement: Achievement = {
                id: Date.now(),
                user_id: Number(values.user_id) || 0,
                user_name: `用户#${values.user_id || '-'}`,
                source_project_id: values.source_project_id ? Number(values.source_project_id) : null,
                source_project_title: values.source_project_id ? `项目#${values.source_project_id}` : null,
                masked_project_name: (values.masked_project_name ?? '').trim(),
                technical_tags: tags,
                completed_at: (values.completed_at ?? '').trim() || now,
                updated_at: now,
            };
            setArchives((prev) => [nextAchievement, ...prev]);
            setCreateModalOpen(false);
        } finally {
            setCreateSubmitting(false);
        }
    };

    // 05）模拟成就归档更新 API（mockUpdateAchievementAPI）
    const mockUpdateAchievementAPI = async (id: number, payload: Partial<Achievement>): Promise<Partial<Achievement>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 260 + (id % 3) * 30);
        });

    // 06）模拟成就归档删除 API（mockDeleteAchievementAPI）
    const mockDeleteAchievementAPI = async (id: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 200 + (id % 5) * 20);
        });

    // 07）打开成就修改弹窗（handleOpenAchievementEditModal）
    const handleOpenAchievementEditModal = (achievement: Achievement): void => {
        setEditingArchiveId(achievement.id);
        setEditModalOpen(true);
    };

    // 08）成就修改提交处理（handleEditAchievementSubmit）
    const handleEditAchievementSubmit = async (values: CreateFormValues): Promise<void> => {
        if (editingArchiveId == null) {
            return;
        }
        try {
            setEditSubmitting(true);
            const now = new Date().toLocaleString();
            const tags = (values.technical_tags ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const payload: Partial<Achievement> = {
                user_id: Number(values.user_id) || 0,
                user_name: `用户#${values.user_id || '-'}`,
                source_project_id: values.source_project_id ? Number(values.source_project_id) : null,
                source_project_title: values.source_project_id ? `项目#${values.source_project_id}` : null,
                masked_project_name: (values.masked_project_name ?? '').trim(),
                technical_tags: tags,
                completed_at: (values.completed_at ?? '').trim() || now,
                updated_at: now,
            };
            const updated = await mockUpdateAchievementAPI(editingArchiveId, payload);
            setArchives((prev) => prev.map((archive) => (archive.id === editingArchiveId ? { ...archive, ...updated } : archive)));
            setEditModalOpen(false);
            setEditingArchiveId(null);
        } finally {
            setEditSubmitting(false);
        }
    };

    // 09）成就删除处理（handleDeleteAchievement）
    const handleDeleteAchievement = async (id: number): Promise<void> => {
        if (!window.confirm('确定要删除该成就归档吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingArchiveId(id);
            await mockDeleteAchievementAPI(id);
            setArchives((prev) => prev.filter((archive) => archive.id !== id));
            setSelectedArchiveId((prev) => (prev === id ? null : prev));
        } finally {
            setDeletingArchiveId(null);
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <div>
                    <h1>成就归档库</h1>
                    <p>脱敏后的项目成果沉淀，用于构建用户能力画像</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <Plus size={18} /> 新增归档
                </button>
            </div>

            <div className="card table-container">
                <div className="table-toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="搜索项目名或技术栈..." />
                    </div>
                </div>

                <table className="standard-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>脱敏项目名称</th>
                            <th>贡献用户（ID / 名称）</th>
                            <th>原项目溯源（ID / 标题）</th>
                            <th>技术标签</th>
                            <th>归档日期</th>
                            <th>更新时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {archives.map((a) => (
                            <tr key={a.id}>
                                <td>{a.id}</td>
                                <td>
                                    <button
                                        type="button"
                                        className="detail-name-btn"
                                        onClick={() => setSelectedArchiveId(a.id)}
                                        title="点击查看归档详情"
                                    >
                                        {a.masked_project_name}
                                    </button>
                                </td>
                                <td>
                                    <span className="project-id-tag">#{a.user_id}</span>
                                    <span>，{a.user_name}</span>
                                </td>
                                <td>
                                    {a.source_project_id == null ? (
                                        <span className="unassigned">—</span>
                                    ) : (
                                        <span>
                                            <span className="project-id-tag">#{a.source_project_id}</span>
                                            <span>，{a.source_project_title ?? '未知项目'}</span>
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div className="tag-list">
                                        {a.technical_tags.map(tag => <span key={tag} className="bio-tag">{tag}</span>)}
                                    </div>
                                </td>
                                <td>{a.completed_at}</td>
                                <td>{a.updated_at}</td>
                                <td className="action-btns">
                                    <button
                                        className="btn-icon"
                                        title="查看详情"
                                        onClick={() => setSelectedArchiveId(a.id)}
                                        disabled={editSubmitting || deletingArchiveId === a.id}
                                    >
                                        <ExternalLink size={16} style={{ color: '#9ca3af' }} />
                                    </button>
                                    <button
                                        className="btn-icon edit"
                                        title="编辑归档"
                                        onClick={() => handleOpenAchievementEditModal(a)}
                                        disabled={editSubmitting || deletingArchiveId === a.id}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        title="删除归档"
                                        onClick={() => { void handleDeleteAchievement(a.id); }}
                                        disabled={editSubmitting || deletingArchiveId === a.id}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <DetailModal
                open={Boolean(selectedArchive)}
                title="成就归档详情"
                fields={selectedArchiveFields}
                tags={selectedArchive?.technical_tags}
                tagsLabel="技术标签"
                onClose={() => setSelectedArchiveId(null)}
            />

            <CreateFormModal
                open={createModalOpen}
                title="新增成就归档"
                fields={achievementCreateFields}
                submitText="确认新增"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateAchievementSubmit}
            />

            <EditFormModal
                open={editModalOpen}
                title="修改成就归档"
                fields={achievementEditFields}
                initialValues={{
                    user_id: String(editingArchive?.user_id ?? ''),
                    masked_project_name: editingArchive?.masked_project_name ?? '',
                    source_project_id: editingArchive?.source_project_id == null ? '' : String(editingArchive.source_project_id),
                    technical_tags: editingArchive?.technical_tags.join(', ') ?? '',
                    completed_at: editingArchive?.completed_at ?? '',
                }}
                submitText="确认修改"
                submitting={editSubmitting}
                onClose={() => {
                    if (editSubmitting) {
                        return;
                    }
                    setEditModalOpen(false);
                    setEditingArchiveId(null);
                }}
                onSubmit={handleEditAchievementSubmit}
            />
        </AdminLayout>
    );
};

export default Achievements;