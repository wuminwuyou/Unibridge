import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import ListTableCard from '../components/ListTableCard';
import { Building2, Plus, Edit, Trash2, Wallet } from 'lucide-react';
import {
    createEntityAPI,
    deleteEntityAPI,
    getEntityListAPI,
    updateEntityAPI,
    type EntityListItemResponse,
} from '../api/entitiesAPI';

// 01）主体列表项类型（Entity）
interface Entity {
    id: number;
    name: string;
    type: 'ENTERPRISE' | 'UNIVERSITY';
    balance: number;
    intro: string | null;
    created_at: string;
    last_login_at: string | null;
    updated_at: string;
    auditor_name: string;
    audited_at: string | null;
}

// 02）主体列表本地缓存配置（ENTITY_LIST_CACHE_KEY / ENTITY_LIST_CACHE_TTL_MS）
const ENTITY_LIST_CACHE_KEY = 'web-admin:entities:list-cache:v1';
const ENTITY_LIST_CACHE_TTL_MS = 3 * 60 * 1000;

// 03）主体列表缓存条目类型（EntityListCacheEntry）
interface EntityListCacheEntry {
    timestamp: number;
    entities: Entity[];
}

// 04）主体列表缓存映射类型（EntityListCacheMap）
type EntityListCacheMap = Record<string, EntityListCacheEntry>;

// 05）标准化缓存关键词（normalizeEntityCacheKeyword）
function normalizeEntityCacheKeyword(keyword?: string): string {
    return (keyword ?? '').trim();
}

// 06）读取主体列表缓存（readEntityListCache）
function readEntityListCache(): EntityListCacheMap {
    try {
        const raw = localStorage.getItem(ENTITY_LIST_CACHE_KEY);
        if (!raw) {
            return {};
        }
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return {};
        }
        return parsed as EntityListCacheMap;
    } catch {
        return {};
    }
}

// 07）写入主体列表缓存（writeEntityListCache）
function writeEntityListCache(cacheMap: EntityListCacheMap): void {
    try {
        localStorage.setItem(ENTITY_LIST_CACHE_KEY, JSON.stringify(cacheMap));
    } catch {
        // ignore
    }
}

// 08）主体新增表单字段配置（entityCreateFields）
const entityCreateFields: CreateFormField[] = [
    { key: 'name', label: '主体名称', required: true, placeholder: '请输入主体名称' },
    {
        key: 'type',
        label: '主体类型',
        required: true,
        type: 'select',
        options: [
            { label: '高校（UNIVERSITY）', value: 'UNIVERSITY' },
            { label: '企业（ENTERPRISE）', value: 'ENTERPRISE' },
        ],
    },
    { key: 'intro', label: '主体简介（可选）', type: 'textarea', placeholder: '请输入主体简介' },
];

// 09）主体修改表单字段配置（entityEditFields）
const entityEditFields: CreateFormField[] = [
    { key: 'name', label: '主体名称', required: true, placeholder: '请输入主体名称' },
    {
        key: 'type',
        label: '主体类型',
        required: true,
        type: 'select',
        options: [
            { label: '高校（UNIVERSITY）', value: 'UNIVERSITY' },
            { label: '企业（ENTERPRISE）', value: 'ENTERPRISE' },
        ],
    },
    { key: 'intro', label: '主体简介（可选）', type: 'textarea', placeholder: '请输入主体简介' },
];

// 10）主体列表表头配置（entityTableHeaders）
const entityTableHeaders = [
    'ID',
    '机构名称',
    '类型',
    '钱包余额',
    '创建时间',
    '上次登录',
    '更新时间',
    '审核人员',
    '操作',
];

// 11）主体列表页面组件（Entities）
const Entities: React.FC = () => {
    const [entities, setEntities] = useState<Entity[]>(() => {
        const cacheMap = readEntityListCache();
        const cacheKey = normalizeEntityCacheKeyword('');
        const entry = cacheMap[cacheKey];
        if (!entry) {
            return [];
        }
        const isExpired = Date.now() - entry.timestamp > ENTITY_LIST_CACHE_TTL_MS;
        return isExpired ? [] : entry.entities;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editingEntityId, setEditingEntityId] = useState<number | null>(null);
    const [deletingEntityId, setDeletingEntityId] = useState<number | null>(null);
    const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
    const selectedEntity = entities.find((entity) => entity.id === selectedEntityId) ?? null;
    const editingEntity = entities.find((entity) => entity.id === editingEntityId) ?? null;

    // 12）匹配当前搜索关键字（matchesCurrentKeyword）
    const matchesCurrentKeyword = (name: string): boolean => {
        const keyword = searchTerm.trim();
        if (!keyword) {
            return true;
        }
        return name.includes(keyword);
    };

    // 13）构建本地回填主体数据（buildLocalEntityFromMutation）
    const buildLocalEntityFromMutation = (
        payload: {
            id: number;
            name: string;
            type: 'ENTERPRISE' | 'UNIVERSITY';
            intro: string;
        },
        fallback?: Partial<EntityListItemResponse>,
    ): Entity => {
        const now = new Date().toLocaleString();
        const fallbackAuditorName =
            typeof fallback?.auditorName === 'string'
                ? fallback.auditorName
                : (fallback?.auditAdminId == null ? undefined : String(fallback.auditAdminId));
        return {
            id: payload.id,
            name: payload.name,
            type: payload.type,
            balance: Number(fallback?.balance ?? 0),
            intro: payload.intro || null,
            created_at: fallback?.createdAt ?? now,
            last_login_at: fallback?.lastLoginAt ?? null,
            updated_at: fallback?.updatedAt ?? now,
            auditor_name: fallbackAuditorName ?? '—',
            audited_at: fallback?.auditedAt ?? null,
        };
    };

    // 14）实体列表接口项映射工具（mapEntityFromApi）
    const mapEntityFromApi = (item: EntityListItemResponse): Entity => ({
        id: item.id,
        name: item.name,
        type: item.type,
        balance: Number(item.balance),
        intro: item.intro ?? null,
        created_at: item.createdAt ?? '—',
        last_login_at: item.lastLoginAt ?? null,
        updated_at: item.updatedAt ?? '—',
        auditor_name: item.auditorName ?? (item.auditAdminId == null ? '—' : String(item.auditAdminId)),
        audited_at: item.auditedAt ?? null,
    });

    // 15）提取主体列表记录（extractEntityRecords）
    const extractEntityRecords = (response: Awaited<ReturnType<typeof getEntityListAPI>>): EntityListItemResponse[] => {
        if (Array.isArray(response.data?.records)) {
            return response.data.records;
        }
        if (Array.isArray(response.data?.list)) {
            return response.data.list;
        }
        return [];
    };

    // 16）更新主体列表缓存（persistEntityListCache）
    const persistEntityListCache = (keyword: string, nextEntities: Entity[]): void => {
        const cacheMap = readEntityListCache();
        const cacheKey = normalizeEntityCacheKeyword(keyword);
        cacheMap[cacheKey] = {
            timestamp: Date.now(),
            entities: nextEntities,
        };
        writeEntityListCache(cacheMap);
    };

    // 17）清空主体列表缓存（clearEntityListCache）
    const clearEntityListCache = (): void => {
        writeEntityListCache({});
    };

    // 18）拉取主体列表（fetchEntityList）
    const fetchEntityList = async (keyword?: string): Promise<void> => {
        const normalizedKeyword = normalizeEntityCacheKeyword(keyword);
        const cacheMap = readEntityListCache();
        const cacheEntry = cacheMap[normalizedKeyword];
        if (cacheEntry && Date.now() - cacheEntry.timestamp <= ENTITY_LIST_CACHE_TTL_MS) {
            setErrorMsg(null);
            setEntities(cacheEntry.entities);
            return;
        }

        const requestParams = {
            q: keyword && keyword.trim() ? keyword.trim() : undefined,
        };
        try {
            setIsLoading(true);
            setErrorMsg(null);
            const response = await getEntityListAPI(requestParams);
            const apiList = extractEntityRecords(response);
            const mappedEntities = apiList.map(mapEntityFromApi);
            setEntities(mappedEntities);
            persistEntityListCache(normalizedKeyword, mappedEntities);
        } catch (error) {
            const nextMessage = error instanceof Error ? error.message : '主体列表加载失败';
            setErrorMsg(nextMessage);
            setEntities([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 19）关键词变更触发列表请求（searchByQWithDebounce）
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchEntityList(searchTerm);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    // 20）新增主体提交处理（handleCreateEntitySubmit）
    const handleCreateEntitySubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const name = (values.name ?? '').trim();
            const type: 'ENTERPRISE' | 'UNIVERSITY' = values.type === 'ENTERPRISE' ? 'ENTERPRISE' : 'UNIVERSITY';
            const intro = (values.intro ?? '').trim();
            const requestBody = {
                name,
                type,
                intro: intro || undefined,
            };
            const response = await createEntityAPI(requestBody);
            const responseData = response.data;
            const responseEntity = responseData && typeof responseData === 'object'
                ? responseData as Partial<EntityListItemResponse>
                : undefined;
            const createdId = typeof responseEntity?.id === 'number' ? responseEntity.id : Date.now();
            const nextEntity = buildLocalEntityFromMutation(
                { id: createdId, name, type, intro },
                responseEntity,
            );
            clearEntityListCache();
            setEntities((prev) => {
                const nextEntities = matchesCurrentKeyword(nextEntity.name) ? [nextEntity, ...prev] : prev;
                persistEntityListCache(searchTerm, nextEntities);
                return nextEntities;
            });

            setCreateModalOpen(false);
        } catch (error) {
            const nextMessage = error instanceof Error ? error.message : '新增主体失败';
            setErrorMsg(nextMessage);
        } finally {
            setCreateSubmitting(false);
        }
    };

    // 21）打开主体修改弹窗（handleOpenEditModal）
    const handleOpenEditModal = (entity: Entity): void => {
        setEditingEntityId(entity.id);
        setEditModalOpen(true);
    };

    // 22）修改主体提交处理（handleEditEntitySubmit）
    const handleEditEntitySubmit = async (values: CreateFormValues): Promise<void> => {
        if (!editingEntityId) {
            setErrorMsg('未找到待编辑主体');
            return;
        }
        try {
            setEditSubmitting(true);
            const name = (values.name ?? '').trim();
            const type: 'ENTERPRISE' | 'UNIVERSITY' = values.type === 'ENTERPRISE' ? 'ENTERPRISE' : 'UNIVERSITY';
            const intro = (values.intro ?? '').trim();
            const requestBody = {
                name,
                type,
                intro: intro || undefined,
            };
            await updateEntityAPI(editingEntityId, requestBody);
            const now = new Date().toLocaleString();
            clearEntityListCache();
            setEntities((prev) => {
                const nextEntities = prev.flatMap((entity) => {
                    if (entity.id !== editingEntityId) {
                        return [entity];
                    }
                    const updatedEntity: Entity = {
                        ...entity,
                        name,
                        type,
                        intro: intro || null,
                        updated_at: now,
                    };
                    return matchesCurrentKeyword(updatedEntity.name) ? [updatedEntity] : [];
                });
                persistEntityListCache(searchTerm, nextEntities);
                return nextEntities;
            });

            setEditModalOpen(false);
            setEditingEntityId(null);
        } catch (error) {
            const nextMessage = error instanceof Error ? error.message : '修改主体失败';
            setErrorMsg(nextMessage);
        } finally {
            setEditSubmitting(false);
        }
    };

    // 23）主体删除交互（handleDelete）
    const handleDelete = async (id: number): Promise<void> => {
        if (!window.confirm('确定要删除该机构吗？这将触发数据库的 RESTRICT 约束检查。')) {
            return;
        }
        try {
            setDeletingEntityId(id);
            await deleteEntityAPI(id);
            clearEntityListCache();
            setEntities((prev) => {
                const nextEntities = prev.filter((entity) => entity.id !== id);
                persistEntityListCache(searchTerm, nextEntities);
                return nextEntities;
            });
            setSelectedEntityId((prev) => (prev === id ? null : prev));
        } catch (error) {
            const nextMessage = error instanceof Error ? error.message : '删除主体失败';
            setErrorMsg(nextMessage);
        } finally {
            setDeletingEntityId(null);
        }
    };

    const selectedEntityFields: DetailModalField[] = selectedEntity ? [
        { label: 'ID', value: selectedEntity.id },
        { label: '主体名称', value: selectedEntity.name },
        { label: '主体类型', value: selectedEntity.type === 'UNIVERSITY' ? '高校' : '企业' },
        { label: '钱包余额', value: `¥${selectedEntity.balance.toLocaleString()}` },
        { label: '创建时间', value: selectedEntity.created_at },
        { label: '上次登录', value: selectedEntity.last_login_at ?? '未登录' },
        { label: '更新时间', value: selectedEntity.updated_at },
        { label: '审核人员', value: selectedEntity.auditor_name },
        { label: '审核时间', value: selectedEntity.audited_at ?? '—' },
    ] : [];

    return (
        <AdminLayout>
            <div className="page-header">
                <div>
                    <h1>机构/主体管理</h1>
                    <p>管理系统内的企业与高校实体及其账户余额</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <Plus size={18} /> 新增机构
                </button>
            </div>

            <ListTableCard
                headers={entityTableHeaders}
                tableClassName="entity-table"
                searchPlaceholder="搜索机构名称..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                isLoading={isLoading}
                errorMsg={errorMsg}
                isEmpty={entities.length === 0}
                emptyText="暂无主体数据"
            >
                {entities.map((entity) => (
                    <tr key={entity.id}>
                        <td>{entity.id}</td>
                        <td className="entity-name-cell">
                            <Building2 size={16} />
                            <button
                                type="button"
                                className="detail-name-btn"
                                onClick={() => setSelectedEntityId(entity.id)}
                                title="点击查看主体详情"
                            >
                                {entity.name}
                            </button>
                        </td>
                        <td className="entity-type-cell">
                            <span className={`type-tag ${entity.type.toLowerCase()}`}>
                                {entity.type === 'UNIVERSITY' ? '高校' : '企业'}
                            </span>
                        </td>
                        <td className="balance-cell">
                            <Wallet size={14} />
                            ¥{entity.balance.toLocaleString()}
                        </td>
                        <td>{entity.created_at}</td>
                        <td>{entity.last_login_at ?? '未登录'}</td>
                        <td>{entity.updated_at}</td>
                        <td>
                            <div className="audit-info-cell">
                                <div className="audit-name">{entity.auditor_name}</div>
                                <div className="audit-time">{entity.audited_at ?? '—'}</div>
                            </div>
                        </td>
                        <td className="action-btns">
                            <button
                                className="btn-icon edit"
                                title="编辑"
                                onClick={() => handleOpenEditModal(entity)}
                                disabled={editSubmitting || deletingEntityId === entity.id}
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                className="btn-icon delete"
                                title="删除"
                                onClick={() => { void handleDelete(entity.id); }}
                                disabled={editSubmitting || deletingEntityId === entity.id}
                            >
                                <Trash2 size={16} />
                            </button>
                        </td>
                    </tr>
                ))}
            </ListTableCard>

            {/* 24）页面局部样式：类型标签强制单行显示 */}
            <style>{`
                .entity-table .entity-type-cell .type-tag {
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                }
            `}</style>

            {/* 25）主体详情弹窗：使用通用详情组件渲染 */}
            <DetailModal
                open={Boolean(selectedEntity)}
                title="主体详情"
                fields={selectedEntityFields}
                intro={selectedEntity?.intro}
                introLabel="主体简介"
                onClose={() => setSelectedEntityId(null)}
            />

            {/* 26）主体新增弹窗：使用通用新增表单弹窗组件 */}
            <CreateFormModal
                open={createModalOpen}
                title="新增主体"
                fields={entityCreateFields}
                submitText="确认新增"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateEntitySubmit}
            />

            {/* 27）主体修改弹窗：使用通用修改表单弹窗组件 */}
            <EditFormModal
                open={editModalOpen}
                title="修改主体"
                fields={entityEditFields}
                initialValues={{
                    name: editingEntity?.name ?? '',
                    type: editingEntity?.type ?? 'UNIVERSITY',
                    intro: editingEntity?.intro ?? '',
                }}
                submitText="确认修改"
                submitting={editSubmitting}
                onClose={() => {
                    if (editSubmitting) {
                        return;
                    }
                    setEditModalOpen(false);
                    setEditingEntityId(null);
                }}
                onSubmit={handleEditEntitySubmit}
            />
        </AdminLayout>
    );
};

export default Entities;