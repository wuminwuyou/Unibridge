import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import { ShieldCheck, Search, UserPlus, Key, Trash2, ShieldAlert, Shield, Clock, Edit } from 'lucide-react';

interface SystemAdmin {
    id: string; // 对应数据库中的 id (账号)
    auth_level: 1 | 2 | 3; // 1-普通审计, 2-高级管理, 3-超级管理员
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

// 01）管理员新增表单字段配置（adminCreateFields）
const adminCreateFields: CreateFormField[] = [
    { key: 'id', label: '管理账号', required: true, placeholder: '请输入管理账号' },
    { key: 'password_hash', label: '密码哈希', required: true, placeholder: '请输入哈希后的密码' },
    {
        key: 'auth_level',
        label: '权限等级（可选）',
        type: 'select',
        options: [
            { label: '1（普通审计）', value: '1' },
            { label: '2（高级管理）', value: '2' },
            { label: '3（超级管理员）', value: '3' },
        ],
    },
];

// 02）管理员修改表单字段配置（adminEditFields）
const adminEditFields: CreateFormField[] = [
    { key: 'id', label: '管理账号', required: true, placeholder: '请输入管理账号' },
    {
        key: 'auth_level',
        label: '权限等级',
        required: true,
        type: 'select',
        options: [
            { label: '1（普通审计）', value: '1' },
            { label: '2（高级管理）', value: '2' },
            { label: '3（超级管理员）', value: '3' },
        ],
    },
];

const Admins: React.FC = () => {
    // 模拟管理员数据
    const [admins, setAdmins] = useState<SystemAdmin[]>([
        { id: 'admin_master', auth_level: 3, last_login_at: '2026-04-18 10:20', created_at: '2026-01-01', updated_at: '2026-04-18 10:20' },
        { id: 'audit_manager_01', auth_level: 2, last_login_at: '2026-04-17 15:30', created_at: '2026-02-15', updated_at: '2026-04-17 15:30' },
        { id: 'visitor_auditor', auth_level: 1, last_login_at: null, created_at: '2026-04-10', updated_at: '2026-04-10 08:00' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
    const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
    // 01）管理员详情弹窗状态
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
    const editingAdmin = admins.find((admin) => admin.id === editingAdminId) ?? null;
    const selectedAdmin = admins.find((admin) => admin.id === selectedAdminId) ?? null;
    const selectedAdminFields: DetailModalField[] = selectedAdmin ? [
        { label: '管理账号', value: selectedAdmin.id },
        { label: '权限等级', value: selectedAdmin.auth_level },
        { label: '上次登录时间', value: selectedAdmin.last_login_at ?? '未激活' },
        { label: '创建日期', value: selectedAdmin.created_at },
        { label: '更新时间', value: selectedAdmin.updated_at },
    ] : [];

    // 权限等级渲染函数
    const renderAuthBadge = (level: number) => {
        switch (level) {
            case 3:
                return <span className="auth-badge super"><ShieldAlert size={12} /> 超级管理员</span>;
            case 2:
                return <span className="auth-badge senior"><ShieldCheck size={12} /> 高级管理</span>;
            default:
                return <span className="auth-badge staff"><Shield size={12} /> 普通审计</span>;
        }
    };

    // 02）管理员新增提交处理（handleCreateAdminSubmit）
    /**
     * 函数名：handleCreateAdminSubmit
     * 功能：处理管理员新增表单提交并在列表中预览新增结果。
     * 实现方法：
     * - 读取新增表单字段值并转换 auth_level 类型
     * - 组装新的管理员记录并插入列表顶部
     * - 提交完成后关闭弹窗
     * 输入：
     * - values：新增管理员表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 admins/createModalOpen/createSubmitting 状态
     */
    const handleCreateAdminSubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const authLevelValue = Number(values.auth_level);
            const authLevel: 1 | 2 | 3 = authLevelValue === 2 ? 2 : authLevelValue === 3 ? 3 : 1;
            const nextAdmin: SystemAdmin = {
                id: (values.id ?? '').trim(),
                auth_level: authLevel,
                last_login_at: null,
                created_at: now,
                updated_at: now,
            };
            setAdmins((prev) => [nextAdmin, ...prev]);
            setCreateModalOpen(false);
        } finally {
            setCreateSubmitting(false);
        }
    };

    // 03）模拟管理员更新 API（mockUpdateAdminAPI）
    const mockUpdateAdminAPI = async (
        id: string,
        payload: Partial<SystemAdmin> & { nextId?: string },
    ): Promise<Partial<SystemAdmin> & { nextId?: string }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 260 + (id.length % 3) * 30);
        });

    // 04）模拟管理员删除 API（mockDeleteAdminAPI）
    const mockDeleteAdminAPI = async (id: string): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 200 + (id.length % 5) * 20);
        });

    // 05）打开管理员修改弹窗（handleOpenAdminEditModal）
    const handleOpenAdminEditModal = (admin: SystemAdmin): void => {
        setEditingAdminId(admin.id);
        setEditModalOpen(true);
    };

    // 06）管理员修改提交处理（handleEditAdminSubmit）
    const handleEditAdminSubmit = async (values: CreateFormValues): Promise<void> => {
        if (!editingAdminId) {
            return;
        }
        try {
            setEditSubmitting(true);
            const now = new Date().toLocaleString();
            const authLevelValue = Number(values.auth_level);
            const authLevel: 1 | 2 | 3 = authLevelValue === 2 ? 2 : authLevelValue === 3 ? 3 : 1;
            const nextId = (values.id ?? '').trim();
            const payload: Partial<SystemAdmin> & { nextId?: string } = {
                auth_level: authLevel,
                updated_at: now,
                nextId,
            };
            const updated = await mockUpdateAdminAPI(editingAdminId, payload);
            setAdmins((prev) =>
                prev.map((admin) => {
                    if (admin.id !== editingAdminId) {
                        return admin;
                    }
                    const finalId = (updated.nextId ?? admin.id).trim() || admin.id;
                    return {
                        ...admin,
                        id: finalId,
                        auth_level: updated.auth_level ?? admin.auth_level,
                        updated_at: updated.updated_at ?? admin.updated_at,
                    };
                }),
            );
            if (selectedAdminId === editingAdminId) {
                setSelectedAdminId((updated.nextId ?? editingAdminId).trim() || editingAdminId);
            }
            setEditModalOpen(false);
            setEditingAdminId(null);
        } finally {
            setEditSubmitting(false);
        }
    };

    // 07）管理员删除处理（handleDeleteAdmin）
    const handleDeleteAdmin = async (id: string): Promise<void> => {
        if (!window.confirm('确定要撤销该管理账号吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingAdminId(id);
            await mockDeleteAdminAPI(id);
            setAdmins((prev) => prev.filter((admin) => admin.id !== id));
            setSelectedAdminId((prev) => (prev === id ? null : prev));
        } finally {
            setDeletingAdminId(null);
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <div>
                    <h1>管理员中心</h1>
                    <p>维护系统后台访问账号，监控权限分发与登录审计</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <UserPlus size={18} /> 创建管理账号
                </button>
            </div>

            <div className="card table-container">
                <div className="table-toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="搜索管理员账号..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="standard-table">
                    <thead>
                        <tr>
                            <th>管理账号</th>
                            <th>权限权重</th>
                            <th>上次登录时间</th>
                            <th>创建日期</th>
                            <th>更新时间</th>
                            <th>系统操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.filter(a => a.id.includes(searchTerm)).map((admin) => (
                            <tr key={admin.id}>
                                <td>
                                    <div className="name-cell">
                                        <div className="admin-avatar">{admin.id.charAt(0).toUpperCase()}</div>
                                        <button
                                            type="button"
                                            className="detail-name-btn"
                                            onClick={() => setSelectedAdminId(admin.id)}
                                            title="点击查看管理员详情"
                                        >
                                            {admin.id}
                                        </button>
                                    </div>
                                </td>
                                <td>{renderAuthBadge(admin.auth_level)}</td>
                                <td>
                                    <div className="info-with-icon">
                                        <Clock size={14} />
                                        {admin.last_login_at || <span className="unassigned">未激活</span>}
                                    </div>
                                </td>
                                <td>{admin.created_at}</td>
                                <td>{admin.updated_at}</td>
                                <td className="action-btns">
                                    <button
                                        className="btn-icon edit"
                                        title="编辑账号"
                                        onClick={() => handleOpenAdminEditModal(admin)}
                                        disabled={editSubmitting || deletingAdminId === admin.id}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn-icon" title="重置密钥"><Key size={16} /></button>
                                    {/* 超级管理员不允许在列表直接删除，增加安全性 */}
                                    {admin.auth_level < 3 && (
                                        <button
                                            className="btn-icon delete"
                                            title="撤销权限"
                                            onClick={() => { void handleDeleteAdmin(admin.id); }}
                                            disabled={editSubmitting || deletingAdminId === admin.id}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <DetailModal
                open={Boolean(selectedAdmin)}
                title="管理员详情"
                fields={selectedAdminFields}
                onClose={() => setSelectedAdminId(null)}
            />

            <CreateFormModal
                open={createModalOpen}
                title="新增管理员账号"
                fields={adminCreateFields}
                submitText="确认创建"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateAdminSubmit}
            />

            <EditFormModal
                open={editModalOpen}
                title="修改管理员账号"
                fields={adminEditFields}
                initialValues={{
                    id: editingAdmin?.id ?? '',
                    auth_level: String(editingAdmin?.auth_level ?? 1),
                }}
                submitText="确认修改"
                submitting={editSubmitting}
                onClose={() => {
                    if (editSubmitting) {
                        return;
                    }
                    setEditModalOpen(false);
                    setEditingAdminId(null);
                }}
                onSubmit={handleEditAdminSubmit}
            />
        </AdminLayout>
    );
};

export default Admins;