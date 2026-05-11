import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import { User, ShieldCheck, Search, Trash2, UserPlus, Edit } from 'lucide-react';
import { hashPassword } from '../utils/crypto';
import {
    createUserAPI,
    deleteUserAPI,
    getUserDetailAPI,
    getUserListAPI,
    updateUserAPI,
    type UserDetailResponse,
    type UserListItemResponse,
} from '../api/usersAPI';

// 结合 user 和 user_profile 表定义的接口
interface UserDetail {
    id: number;
    phone: string;
    real_name: string | null;
    current_entity_name: string | null;
    career_data: string[]; // 对应 user_profile.career_data(JSON) 中的职业/学籍背景（示例简化为 string[]）
    bio_data: string[]; // 对应 user_profile.bio_data(JSON) 中的技术栈/兴趣标签（示例简化为 string[]）
    intro: string | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

// 02）用户列表本地缓存配置（USER_LIST_CACHE_KEY / USER_LIST_CACHE_TTL_MS）
const USER_LIST_CACHE_KEY = 'web-admin:users:list-cache:v1';
const USER_LIST_CACHE_TTL_MS = 3 * 60 * 1000;

// 03）用户列表缓存条目类型（UserListCacheEntry）
interface UserListCacheEntry {
    timestamp: number;
    users: UserDetail[];
}

// 04）用户列表缓存映射类型（UserListCacheMap）
type UserListCacheMap = Record<string, UserListCacheEntry>;

// 05）标准化用户缓存关键词（normalizeUserCacheKeyword）
function normalizeUserCacheKeyword(keyword?: string): string {
    return (keyword ?? '').trim();
}

// 06）读取用户列表缓存（readUserListCache）
function readUserListCache(): UserListCacheMap {
    try {
        const raw = localStorage.getItem(USER_LIST_CACHE_KEY);
        if (!raw) {
            return {};
        }
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return {};
        }
        return parsed as UserListCacheMap;
    } catch {
        return {};
    }
}

// 07）写入用户列表缓存（writeUserListCache）
function writeUserListCache(cacheMap: UserListCacheMap): void {
    try {
        localStorage.setItem(USER_LIST_CACHE_KEY, JSON.stringify(cacheMap));
    } catch {
        // ignore
    }
}

// 02）用户新增表单字段配置（userCreateFields）
const userCreateFields: CreateFormField[] = [
    { key: 'phone', label: '手机号', required: true, placeholder: '请输入手机号' },
    { key: 'password', label: '密码', required: true, type: 'password', placeholder: '请输入密码' },
    { key: 'real_name', label: '实名信息（可选）', placeholder: '请输入真实姓名' },
    { key: 'current_entity_name', label: '所属主体（可选）', placeholder: '请输入主体名称' },
    { key: 'career_data', label: '职业/学籍背景（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'bio_data', label: '技能标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'intro', label: '用户简介（可选）', type: 'textarea', placeholder: '请输入用户简介' },
];

// 03）用户修改表单字段配置（userEditFields）
const userEditFields: CreateFormField[] = [
    { key: 'phone', label: '手机号', required: true, placeholder: '请输入手机号' },
    { key: 'real_name', label: '实名信息（可选）', placeholder: '请输入真实姓名' },
    { key: 'current_entity_name', label: '所属主体（可选）', placeholder: '请输入主体名称' },
    { key: 'career_data', label: '职业/学籍背景（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'bio_data', label: '技能标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'intro', label: '用户简介（可选）', type: 'textarea', placeholder: '请输入用户简介' },
];

// 04）提取用户列表记录（extractUserListRecords）
const extractUserListRecords = (response: Awaited<ReturnType<typeof getUserListAPI>>): UserListItemResponse[] => {
    if (Array.isArray(response.data?.records)) {
        return response.data.records;
    }
    if (Array.isArray(response.data?.list)) {
        return response.data.list;
    }
    return [];
};

const Users: React.FC = () => {
    const [users, setUsers] = useState<UserDetail[]>(() => {
        const cacheMap = readUserListCache();
        const cacheKey = normalizeUserCacheKeyword('');
        const entry = cacheMap[cacheKey];
        if (!entry) {
            return [];
        }
        const isExpired = Date.now() - entry.timestamp > USER_LIST_CACHE_TTL_MS;
        return isExpired ? [] : entry.users;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const editingUser = users.find((user) => user.id === editingUserId) ?? null;
    const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

    // 08）匹配当前搜索关键字（matchesCurrentKeyword）
    const matchesCurrentKeyword = (phone: string, realName: string | null): boolean => {
        const keyword = searchTerm.trim();
        if (!keyword) {
            return true;
        }
        return phone.includes(keyword) || (realName?.includes(keyword) ?? false);
    };

    // 05）开发期接口请求日志工具（logUserApiRequest）
    const logUserApiRequest = (action: string, requestInfo: unknown): void => {
        console.log(`[UsersAPI][${action}] Request`, requestInfo);
    };

    // 06）开发期接口响应日志工具（logUserApiResponse）
    const logUserApiResponse = (action: string, responseInfo: unknown): void => {
        console.log(`[UsersAPI][${action}] Response`, responseInfo);
    };

    // 07）开发期接口异常日志工具（logUserApiError）
    const logUserApiError = (action: string, error: unknown): void => {
        console.error(`[UsersAPI][${action}] Error`, {
            message: error instanceof Error ? error.message : String(error),
            error,
        });
    };

    // 08）解析档案数组字段（parseProfileArrayField）
    /**
     * 函数名：parseProfileArrayField
     * 功能：将后端返回的档案数组字段统一解析为 string[]。
     * 实现方法：
     * - 优先兼容后端直接返回数组的情况
     * - 对字符串值尝试按 JSON 数组解析
     * - 类型不匹配或解析失败时回退为空数组
     * 输入：
     * - value：后端返回的字段值
     * 输出：
     * - 返回值：string[]
     * - 副作用：无
     */
    const parseProfileArrayField = (value: unknown): string[] => {
        if (Array.isArray(value)) {
            return value.filter((entry): entry is string => typeof entry === 'string');
        }
        if (typeof value !== 'string') {
            return [];
        }
        try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed)
                ? parsed.filter((entry): entry is string => typeof entry === 'string')
                : [];
        } catch {
            return [];
        }
    };

    // 09）切分逗号分隔标签（splitProfileTags）
    const splitProfileTags = (raw: string): string[] =>
        raw.split(',').map((item) => item.trim()).filter(Boolean);

    // 10）用户列表映射工具（mapUserFromApi）
    const mapUserFromApi = (item: UserListItemResponse): UserDetail => ({
        id: item.id,
        phone: item.phone,
        real_name: item.realName ?? null,
        current_entity_name: item.currentEntityName ?? null,
        career_data: parseProfileArrayField(item.careerData),
        bio_data: parseProfileArrayField(item.bioData),
        intro: item.intro ?? null,
        last_login_at: item.lastLoginAt ?? null,
        created_at: item.createdAt ?? '—',
        updated_at: item.updatedAt ?? '—',
    });

    // 11）构建本地回填用户数据（buildLocalUserFromMutation）
    const buildLocalUserFromMutation = (
        payload: {
            id: number;
            phone: string;
            real_name: string | null;
            current_entity_name: string | null;
            career_data: string[];
            bio_data: string[];
            intro: string | null;
        },
        fallback?: Partial<UserDetailResponse>,
    ): UserDetail => {
        const now = new Date().toLocaleString();
        return {
            id: payload.id,
            phone: payload.phone,
            real_name: payload.real_name,
            current_entity_name: payload.current_entity_name,
            career_data: payload.career_data,
            bio_data: payload.bio_data,
            intro: payload.intro,
            last_login_at: fallback?.lastLoginAt ?? null,
            created_at: fallback?.createdAt ?? now,
            updated_at: fallback?.updatedAt ?? now,
        };
    };

    // 12）更新用户列表缓存（persistUserListCache）
    const persistUserListCache = (keyword: string, nextUsers: UserDetail[]): void => {
        const cacheMap = readUserListCache();
        const cacheKey = normalizeUserCacheKeyword(keyword);
        cacheMap[cacheKey] = {
            timestamp: Date.now(),
            users: nextUsers,
        };
        writeUserListCache(cacheMap);
    };

    // 13）清空用户列表缓存（clearUserListCache）
    const clearUserListCache = (): void => {
        writeUserListCache({});
    };

    // 14）用户详情映射工具（applyUserDetailToList）
    const applyUserDetailToList = (detail: UserDetailResponse): void => {
        setUsers((prev) => {
            const nextUsers = prev.map((user) =>
                user.id === detail.id
                    ? {
                        ...user,
                        phone: detail.phone,
                        real_name: detail.realName ?? null,
                        current_entity_name: detail.currentEntityName ?? null,
                        career_data: parseProfileArrayField(detail.careerData),
                        bio_data: parseProfileArrayField(detail.bioData),
                        intro: detail.intro ?? null,
                        last_login_at: detail.lastLoginAt ?? null,
                        created_at: detail.createdAt ?? user.created_at,
                        updated_at: detail.updatedAt ?? user.updated_at,
                    }
                    : user,
            );
            persistUserListCache(searchTerm, nextUsers);
            return nextUsers;
        });
    };

    // 15）拉取用户列表（fetchUserList）
    const fetchUserList = async (keyword?: string): Promise<void> => {
        const normalizedKeyword = normalizeUserCacheKeyword(keyword);
        const cacheMap = readUserListCache();
        const cacheEntry = cacheMap[normalizedKeyword];
        if (cacheEntry && Date.now() - cacheEntry.timestamp <= USER_LIST_CACHE_TTL_MS) {
            setErrorMsg(null);
            setUsers(cacheEntry.users);
            return;
        }
        const q = keyword && keyword.trim() ? keyword.trim() : undefined;
        try {
            setIsLoading(true);
            setErrorMsg(null);
            logUserApiRequest('LIST', {
                method: 'GET',
                url: '/users/list',
                params: { q },
            });
            const response = await getUserListAPI({ q });
            logUserApiResponse('LIST', response);
            const records = extractUserListRecords(response);
            const mappedUsers = records.map(mapUserFromApi);
            setUsers(mappedUsers);
            persistUserListCache(normalizedKeyword, mappedUsers);
        } catch (error) {
            logUserApiError('LIST', error);
            setErrorMsg(error instanceof Error ? error.message : '用户列表加载失败');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 16）关键词变更触发用户列表请求（searchByQWithDebounce）
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchUserList(searchTerm);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    // 17）用户详情弹窗触发详情接口（fetchUserDetailOnOpen）
    useEffect(() => {
        if (selectedUserId == null) {
            return;
        }
        const fetchDetail = async (): Promise<void> => {
            try {
                logUserApiRequest('DETAIL', {
                    method: 'GET',
                    url: `/users/${selectedUserId}`,
                });
                const response = await getUserDetailAPI(selectedUserId);
                logUserApiResponse('DETAIL', response);
                applyUserDetailToList(response.data);
            } catch (error) {
                logUserApiError('DETAIL', error);
                setErrorMsg(error instanceof Error ? error.message : '用户详情加载失败');
            }
        };
        void fetchDetail();
    }, [selectedUserId]);
    const selectedUserFields: DetailModalField[] = selectedUser ? [
        { label: 'ID', value: selectedUser.id },
        { label: '手机号', value: selectedUser.phone },
        { label: '实名信息', value: selectedUser.real_name ?? '未实名' },
        { label: '所属主体', value: selectedUser.current_entity_name ?? '暂无归属' },
        {
            label: '职业/学籍背景',
            value: selectedUser.career_data.length > 0 ? (
                <div className="tag-list detail-tag-list">
                    {selectedUser.career_data.map((tag) => <span key={tag} className="bio-tag">{tag}</span>)}
                </div>
            ) : '暂无',
            fullWidth: true
        },
        { label: '注册时间', value: selectedUser.created_at },
        { label: '上次登录', value: selectedUser.last_login_at ?? '未登录' },
        { label: '更新时间', value: selectedUser.updated_at },
    ] : [];

    // 18）用户新增提交处理（handleCreateUserSubmit）
    /**
     * 函数名：handleCreateUserSubmit
     * 功能：处理用户新增表单并调用后端用户新增接口。
     * 实现方法：
     * - 读取通用新增弹窗字段并转换为接口请求体
     * - 调用 `createUserAPI` 提交新增请求
     * - 成功后本地插入新增项并同步缓存
     * 输入：
     * - values：新增用户表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 users/createModalOpen/createSubmitting 状态
     */
    const handleCreateUserSubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const createPayload = {
                phone: (values.phone ?? '').trim(),
                passwordHash: hashPassword(values.password ?? ''),
                profile: {
                    realName: (values.real_name ?? '').trim() || undefined,
                    currentEntityName: (values.current_entity_name ?? '').trim() || undefined,
                    bioData: splitProfileTags(values.bio_data ?? ''),
                    careerData: splitProfileTags(values.career_data ?? ''),
                    intro: (values.intro ?? '').trim() || undefined,
                },
            };
            logUserApiRequest('CREATE', {
                method: 'POST',
                url: '/users',
                body: createPayload,
            });
            const response = await createUserAPI(createPayload);
            logUserApiResponse('CREATE', response);
            const responseData = response.data;
            const responseUser = responseData && typeof responseData === 'object'
                ? responseData as Partial<UserDetailResponse>
                : undefined;
            const createdId = typeof responseUser?.id === 'number' ? responseUser.id : Date.now();
            const nextUser = buildLocalUserFromMutation({
                id: createdId,
                phone: createPayload.phone,
                real_name: createPayload.profile.realName ?? null,
                current_entity_name: createPayload.profile.currentEntityName ?? null,
                career_data: createPayload.profile.careerData ?? [],
                bio_data: createPayload.profile.bioData ?? [],
                intro: createPayload.profile.intro ?? null,
            }, responseUser);
            clearUserListCache();
            setUsers((prev) => {
                const nextUsers = matchesCurrentKeyword(nextUser.phone, nextUser.real_name) ? [nextUser, ...prev] : prev;
                persistUserListCache(searchTerm, nextUsers);
                return nextUsers;
            });
            setCreateModalOpen(false);
            setErrorMsg(null);
        } catch (error) {
            logUserApiError('CREATE', error);
            setErrorMsg(error instanceof Error ? error.message : '新增用户失败');
        } finally {
            setCreateSubmitting(false);
        }
    };

    // 19）打开用户修改弹窗（handleOpenUserEditModal）
    const handleOpenUserEditModal = (user: UserDetail): void => {
        setEditingUserId(user.id);
        setEditModalOpen(true);
    };

    // 20）用户修改提交处理（handleEditUserSubmit）
    const handleEditUserSubmit = async (values: CreateFormValues): Promise<void> => {
        if (editingUserId == null) {
            return;
        }
        try {
            setEditSubmitting(true);
            const now = new Date().toLocaleString();
            const profile = {
                realName: (values.real_name ?? '').trim() || undefined,
                currentEntityName: (values.current_entity_name ?? '').trim() || undefined,
                careerData: splitProfileTags(values.career_data ?? ''),
                bioData: splitProfileTags(values.bio_data ?? ''),
                intro: (values.intro ?? '').trim() || undefined,
            };
            const payload = {
                phone: (values.phone ?? '').trim(),
                profile,
            };
            logUserApiRequest('UPDATE', {
                method: 'PUT',
                url: `/users/${editingUserId}`,
                body: payload,
            });
            const response = await updateUserAPI(editingUserId, payload);
            logUserApiResponse('UPDATE', response);
            clearUserListCache();
            setUsers((prev) => {
                const nextUsers = prev.flatMap((user) => {
                    if (user.id !== editingUserId) {
                        return [user];
                    }
                    const updatedUser: UserDetail = {
                        ...user,
                        phone: payload.phone,
                        real_name: profile.realName ?? null,
                        current_entity_name: profile.currentEntityName ?? null,
                        career_data: profile.careerData ?? [],
                        bio_data: profile.bioData ?? [],
                        intro: profile.intro ?? null,
                        updated_at: now,
                    };
                    return matchesCurrentKeyword(updatedUser.phone, updatedUser.real_name) ? [updatedUser] : [];
                });
                persistUserListCache(searchTerm, nextUsers);
                return nextUsers;
            });
            setEditModalOpen(false);
            setEditingUserId(null);
            setErrorMsg(null);
        } catch (error) {
            logUserApiError('UPDATE', error);
            setErrorMsg(error instanceof Error ? error.message : '修改用户失败');
        } finally {
            setEditSubmitting(false);
        }
    };

    // 21）用户删除处理（handleDeleteUser）
    const handleDeleteUser = async (id: number): Promise<void> => {
        if (!window.confirm('确定要删除该用户吗？')) {
            return;
        }
        try {
            setDeletingUserId(id);
            logUserApiRequest('DELETE', {
                method: 'DELETE',
                url: `/users/${id}`,
            });
            const response = await deleteUserAPI(id);
            logUserApiResponse('DELETE', response);
            clearUserListCache();
            setUsers((prev) => {
                const nextUsers = prev.filter((user) => user.id !== id);
                persistUserListCache(searchTerm, nextUsers);
                return nextUsers;
            });
            setSelectedUserId((prev) => (prev === id ? null : prev));
            setErrorMsg(null);
        } catch (error) {
            logUserApiError('DELETE', error);
            setErrorMsg(error instanceof Error ? error.message : '删除用户失败');
        } finally {
            setDeletingUserId(null);
        }
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <div>
                    <h1>用户/档案管理</h1>
                    <p>维护系统用户账号、实名档案及技术栈标签</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <UserPlus size={18} /> 手动同步用户
                </button>
            </div>

            <div className="card table-container">
                <div className="table-toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="搜索ID、手机号或姓名..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户信息</th>
                            <th>所属主体</th>
                            <th>职业/学籍背景</th>
                            <th>档案标签</th>
                            <th>注册时间</th>
                            <th>上次登录</th>
                            <th>更新时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={9} className="detail-member-empty">加载中...</td>
                            </tr>
                        ) : errorMsg ? (
                            <tr>
                                <td colSpan={9} className="detail-member-empty">{errorMsg}</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="detail-member-empty">暂无用户数据</td>
                            </tr>
                        ) : users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>
                                    <div className="user-info-cell">
                                        <div className="avatar-placeholder">
                                            {u.real_name ? u.real_name.charAt(0) : <User size={16} />}
                                        </div>
                                        <div>
                                            <div className="user-name">
                                                <button
                                                    type="button"
                                                    className="detail-name-btn"
                                                    onClick={() => setSelectedUserId(u.id)}
                                                    title="点击查看用户详情"
                                                >
                                                    {u.real_name ?? `用户#${u.id}`}
                                                </button>
                                                <span title="已实名" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                    <ShieldCheck size={14} className="verified-icon" />
                                                </span>
                                            </div>
                                            <div className="user-phone">{u.phone}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="entity-tag">{u.current_entity_name || '暂无归属'}</span>
                                </td>
                                <td>
                                    <div className="tag-list">
                                        {u.career_data.length > 0 ? u.career_data.map(tag => (
                                            <span key={tag} className="bio-tag">{tag}</span>
                                        )) : <span className="no-tags">-</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className="tag-list">
                                        {u.bio_data.length > 0 ? u.bio_data.map(tag => (
                                            <span key={tag} className="bio-tag">{tag}</span>
                                        )) : <span className="no-tags">-</span>}
                                    </div>
                                </td>
                                <td>{u.created_at}</td>
                                <td>{u.last_login_at ?? '未登录'}</td>
                                <td>{u.updated_at}</td>
                                <td className="action-btns">
                                    <button
                                        className="btn-icon edit"
                                        title="编辑"
                                        onClick={() => handleOpenUserEditModal(u)}
                                        disabled={editSubmitting || deletingUserId === u.id}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        title="删除"
                                        onClick={() => { void handleDeleteUser(u.id); }}
                                        disabled={editSubmitting || deletingUserId === u.id}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 03）用户详情弹窗：使用通用详情组件渲染 */}
            <DetailModal
                open={Boolean(selectedUser)}
                title="用户详情"
                fields={selectedUserFields}
                tags={selectedUser?.bio_data}
                tagsLabel="技能标签"
                intro={selectedUser?.intro}
                introLabel="用户简介"
                onClose={() => setSelectedUserId(null)}
            />

            <CreateFormModal
                open={createModalOpen}
                title="新增用户"
                fields={userCreateFields}
                submitText="确认新增"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateUserSubmit}
            />

            <EditFormModal
                open={editModalOpen}
                title="修改用户"
                fields={userEditFields}
                initialValues={{
                    phone: editingUser?.phone ?? '',
                    real_name: editingUser?.real_name ?? '',
                    current_entity_name: editingUser?.current_entity_name ?? '',
                    career_data: editingUser?.career_data.join(', ') ?? '',
                    bio_data: editingUser?.bio_data.join(', ') ?? '',
                    intro: editingUser?.intro ?? '',
                }}
                submitText="确认修改"
                submitting={editSubmitting}
                onClose={() => {
                    if (editSubmitting) {
                        return;
                    }
                    setEditModalOpen(false);
                    setEditingUserId(null);
                }}
                onSubmit={handleEditUserSubmit}
            />
        </AdminLayout>
    );
};

export default Users;