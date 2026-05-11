import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField, type DetailModalMilestoneRow } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import { Briefcase, Search, Plus, Edit, Trash2, DollarSign, Award } from 'lucide-react';

// 01）商业项目列表数据模型（commercial_project + 关联展示字段）
interface CommercialProject {
    id: number;
    title: string;
    project_pm_id: number;
    project_pm_name: string;
    executor_lab_id: number | null;
    executor_lab_name: string | null;
    executor_team_id: number | null;
    executor_team_name: string | null;
    preview: string;
    tags: string[];
    total_budget: number;
    level: 'N' | 'R' | 'SR' | 'SSR' | 'UR';
    status: string;
    expected_at: string;
    published_at: string;
    created_at: string;
    updated_at: string;
    milestones: DetailModalMilestoneRow[];
}

// 03）商业项目新增表单字段配置（commercialProjectCreateFields）
const commercialProjectCreateFields: CreateFormField[] = [
    { key: 'project_pm_id', label: '发布者ID', required: true, type: 'number', placeholder: '请输入发布者ID' },
    { key: 'title', label: '项目标题', required: true, placeholder: '请输入项目标题' },
    { key: 'preview', label: '项目简述', required: true, type: 'textarea', placeholder: '请输入项目简述' },
    { key: 'total_budget', label: '预算金额', required: true, type: 'number', placeholder: '请输入预算金额' },
    { key: 'executor_lab_id', label: '承接实验室ID（可选）', type: 'number', placeholder: '请输入实验室ID' },
    { key: 'executor_team_id', label: '承接团队ID（可选）', type: 'number', placeholder: '请输入团队ID' },
    { key: 'tags', label: '标签（可选）', placeholder: '多个值用逗号分隔' },
    {
        key: 'level',
        label: '项目等级（可选）',
        type: 'select',
        options: [
            { label: 'N', value: 'N' },
            { label: 'R', value: 'R' },
            { label: 'SR', value: 'SR' },
            { label: 'SSR', value: 'SSR' },
            { label: 'UR', value: 'UR' },
        ],
    },
    {
        key: 'status',
        label: '项目状态（可选）',
        type: 'select',
        options: [
            { label: '招募中', value: 'RECRUITING' },
            { label: '开发中', value: 'IN_DEVELOPMENT' },
            { label: '调解中', value: 'MEDIATION' },
            { label: '已结项', value: 'COMPLETED' },
            { label: '已取消', value: 'CLOSED' },
            { label: '已暂停', value: 'PAUSED' },
        ],
    },
];

// 04）商业项目修改表单字段配置（commercialProjectEditFields）
const commercialProjectEditFields: CreateFormField[] = [
    { key: 'project_pm_id', label: '发布者ID', required: true, type: 'number', placeholder: '请输入发布者ID' },
    { key: 'title', label: '项目标题', required: true, placeholder: '请输入项目标题' },
    { key: 'preview', label: '项目简述', required: true, type: 'textarea', placeholder: '请输入项目简述' },
    { key: 'total_budget', label: '预算金额', required: true, type: 'number', placeholder: '请输入预算金额' },
    { key: 'executor_lab_id', label: '承接实验室ID（可选）', type: 'number', placeholder: '请输入实验室ID' },
    { key: 'executor_team_id', label: '承接团队ID（可选）', type: 'number', placeholder: '请输入团队ID' },
    { key: 'tags', label: '标签（可选）', placeholder: '多个值用逗号分隔' },
    {
        key: 'level',
        label: '项目等级（可选）',
        type: 'select',
        options: [
            { label: 'N', value: 'N' },
            { label: 'R', value: 'R' },
            { label: 'SR', value: 'SR' },
            { label: 'SSR', value: 'SSR' },
            { label: 'UR', value: 'UR' },
        ],
    },
    {
        key: 'status',
        label: '项目状态（可选）',
        type: 'select',
        options: [
            { label: '招募中', value: 'RECRUITING' },
            { label: '开发中', value: 'DEVELOPING' },
            { label: '调解中', value: 'MEDIATION' },
            { label: '已结项', value: 'COMPLETED' },
            { label: '已取消', value: 'CLOSED' },
            { label: '已暂停', value: 'PAUSED' },
            { label: '待处理', value: 'PENDING' },
        ],
    },
];

// 04）商业项目里程碑新增表单字段配置（commercialMilestoneCreateFields）
const commercialMilestoneCreateFields: CreateFormField[] = [
    { key: 'title', label: '里程碑标题', required: true, placeholder: '请输入里程碑标题' },
    { key: 'payment_pct', label: '拨款占比', required: true, type: 'number', placeholder: '请输入拨款占比' },
    { key: 'deadline_at', label: '截止时间', required: true, type: 'datetime-local' },
    { key: 'status', label: '状态（可选）', placeholder: '如 PENDING / APPROVED / CLOSED' },
];

// 06）商业项目里程碑修改表单字段配置（commercialMilestoneEditFields）
const commercialMilestoneEditFields: CreateFormField[] = [
    { key: 'title', label: '里程碑标题', required: true, placeholder: '请输入里程碑标题' },
    { key: 'payment_pct', label: '拨款占比', required: true, type: 'number', placeholder: '请输入拨款占比' },
    { key: 'deadline_at', label: '截止时间', required: true, type: 'datetime-local' },
    { key: 'status', label: '状态（可选）', placeholder: '如 PENDING / APPROVED / CLOSED' },
];

// 05）商业项目任务卡片新增表单字段配置（commercialTaskCreateFields）
const commercialTaskCreateFields: CreateFormField[] = [
    { key: 'title', label: '任务标题', required: true, placeholder: '请输入任务标题' },
    { key: 'content', label: '任务内容（可选）', type: 'textarea', placeholder: '请输入任务内容' },
    { key: 'assignee_id', label: '执行人ID（可选）', type: 'number', placeholder: '请输入执行人ID' },
    {
        key: 'status',
        label: '任务状态（可选）',
        type: 'select',
        options: [
            { label: 'TODO', value: 'TODO' },
            { label: 'DONE', value: 'DONE' },
        ],
    },
];

// 07）商业项目任务卡片修改表单字段配置（commercialTaskEditFields）
const commercialTaskEditFields: CreateFormField[] = [
    { key: 'title', label: '任务标题', required: true, placeholder: '请输入任务标题' },
    { key: 'content', label: '任务内容（可选）', type: 'textarea', placeholder: '请输入任务内容' },
    { key: 'assignee_id', label: '执行人ID（可选）', type: 'number', placeholder: '请输入执行人ID' },
    {
        key: 'status',
        label: '任务状态（可选）',
        type: 'select',
        options: [
            { label: 'TODO', value: 'TODO' },
            { label: 'DONE', value: 'DONE' },
        ],
    },
];

// 02）商业项目管理页面（CommercialProjects）
const CommercialProjects: React.FC = () => {
    const [projects, setProjects] = useState<CommercialProject[]>([
        {
            id: 1,
            title: '企业级大模型私有化部署',
            project_pm_id: 101,
            project_pm_name: '张三（PM）',
            executor_lab_id: 1,
            executor_lab_name: 'AI 视觉实验室',
            executor_team_id: null,
            executor_team_name: null,
            preview: '面向企业知识库问答与流程自动化，建设可私有化部署的大模型平台。',
            tags: ['LLM', 'MLOps'],
            total_budget: 50000.00,
            level: 'SSR',
            status: 'DEVELOPING',
            expected_at: '2026-05-15 18:00:00',
            published_at: '2026-04-01 10:00:00',
            created_at: '2026-04-01 09:58:12',
            updated_at: '2026-04-18 16:00:00',
            milestones: [
                {
                    id: 1,
                    title: '需求规格说明书评审',
                    payment_pct: 20,
                    status: 'APPROVED',
                    created_at: '2026-04-02 10:00:00',
                    updated_at: '2026-04-03 09:00:00',
                    deadline_at: '2026-04-10 18:00:00',
                    tasks: [
                        {
                            id: 10001,
                            title: '业务访谈纪要整理',
                            content: '完成3家试点企业访谈并输出需求优先级清单。',
                            assignee_id: 1201,
                            assignee_name: '陈一',
                            status: 'DONE',
                            created_at: '2026-04-02 11:10:00',
                            updated_at: '2026-04-03 08:40:00',
                        },
                        {
                            id: 10002,
                            title: 'PRD V1.0 评审',
                            content: '组织评审会议并记录待确认项。',
                            assignee_id: 1202,
                            assignee_name: '刘二',
                            status: 'DONE',
                            created_at: '2026-04-02 14:00:00',
                            updated_at: '2026-04-03 09:00:00',
                        },
                    ],
                },
                {
                    id: 2,
                    title: '架构设计初稿',
                    payment_pct: 30,
                    status: 'PENDING',
                    created_at: '2026-04-11 09:30:00',
                    updated_at: '2026-04-12 11:20:00',
                    deadline_at: '2026-04-20 18:00:00',
                    tasks: [
                        {
                            id: 10003,
                            title: '服务边界划分',
                            content: '拆分推理网关、知识检索、工作流编排三大模块。',
                            assignee_id: 1301,
                            assignee_name: '王三',
                            status: 'TODO',
                            created_at: '2026-04-11 10:00:00',
                            updated_at: '2026-04-12 10:30:00',
                        },
                        {
                            id: 10004,
                            title: '容量与成本评估',
                            content: '评估GPU配额与月度预算，形成初版成本模型。',
                            assignee_id: null,
                            assignee_name: null,
                            status: 'TODO',
                            created_at: '2026-04-11 15:20:00',
                            updated_at: '2026-04-12 11:20:00',
                        },
                    ],
                },
            ],
        },
        {
            id: 2,
            title: '智慧园区物联网监控系统',
            project_pm_id: 102,
            project_pm_name: '李四（PM）',
            executor_lab_id: 2,
            executor_lab_name: '区块链研究中心',
            executor_team_id: null,
            executor_team_name: null,
            preview: '构建园区设备实时监控与告警平台，支持多协议设备接入。',
            tags: ['IoT', 'Monitoring'],
            total_budget: 15000.00,
            level: 'SR',
            status: 'RECRUITING',
            expected_at: '2026-06-01 18:00:00',
            published_at: '2026-04-05 14:30:00',
            created_at: '2026-04-05 14:28:09',
            updated_at: '2026-04-17 13:20:00',
            milestones: [
                {
                    id: 3,
                    title: 'MVP版本交付',
                    payment_pct: 50,
                    status: 'PENDING',
                    created_at: '2026-04-15 14:00:00',
                    updated_at: '2026-04-16 16:00:00',
                    deadline_at: '2026-04-30 18:00:00',
                    tasks: [
                        {
                            id: 10005,
                            title: '设备接入协议联调',
                            content: '完成 MQTT/HTTP 双协议接入联调与异常重试验证。',
                            assignee_id: 1401,
                            assignee_name: '赵四',
                            status: 'TODO',
                            created_at: '2026-04-15 14:20:00',
                            updated_at: '2026-04-16 16:00:00',
                        },
                    ],
                },
            ],
        },
        {
            id: 3,
            title: '跨境电商物流追踪平台',
            project_pm_id: 103,
            project_pm_name: '王五（PM）',
            executor_lab_id: null,
            executor_lab_name: null,
            executor_team_id: 3,
            executor_team_name: '智能硬件开发营',
            preview: '实现跨境物流轨迹可视化与异常预警，提升供应链协同效率。',
            tags: ['Logistics', 'Realtime'],
            total_budget: 80000.00,
            level: 'UR',
            status: 'PENDING',
            expected_at: '2026-07-10 18:00:00',
            published_at: '2026-04-10 11:20:00',
            created_at: '2026-04-10 11:18:44',
            updated_at: '2026-04-16 10:10:00',
            milestones: [
                {
                    id: 4,
                    title: '物流轨迹数据接入',
                    payment_pct: 25,
                    status: 'PENDING',
                    created_at: '2026-04-10 12:00:00',
                    updated_at: '2026-04-12 09:30:00',
                    deadline_at: '2026-04-22 18:00:00',
                    tasks: [],
                },
            ],
        },
    ]);
    // 03）商业项目详情弹窗状态
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [milestoneCreateModalOpen, setMilestoneCreateModalOpen] = useState(false);
    const [milestoneCreateSubmitting, setMilestoneCreateSubmitting] = useState(false);
    const [taskCreateSubmitting, setTaskCreateSubmitting] = useState(false);
    const [taskCreateMilestoneId, setTaskCreateMilestoneId] = useState<number | null>(null);
    const [milestoneEditModalOpen, setMilestoneEditModalOpen] = useState(false);
    const [milestoneEditSubmitting, setMilestoneEditSubmitting] = useState(false);
    const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
    const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
    const [taskEditSubmitting, setTaskEditSubmitting] = useState(false);
    const [editingTaskContext, setEditingTaskContext] = useState<{ milestoneId: number; taskId: number } | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const editingProject = projects.find((project) => project.id === editingProjectId) ?? null;
    const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
    const editingMilestone = selectedProject?.milestones.find((milestone) => milestone.id === editingMilestoneId) ?? null;
    const editingTask = editingTaskContext
        ? selectedProject?.milestones
            .find((milestone) => milestone.id === editingTaskContext.milestoneId)
            ?.tasks.find((task) => task.id === editingTaskContext.taskId) ?? null
        : null;
    const selectedProjectFields: DetailModalField[] = selectedProject ? [
        { label: '项目ID', value: selectedProject.id },
        { label: '项目标题', value: selectedProject.title },
        { label: '发布者', value: `#${selectedProject.project_pm_id}，${selectedProject.project_pm_name}` },
        { label: '承接实验室', value: selectedProject.executor_lab_id == null ? '—' : `#${selectedProject.executor_lab_id}，${selectedProject.executor_lab_name ?? '未知实验室'}` },
        { label: '承接团队', value: selectedProject.executor_team_id == null ? '—' : `#${selectedProject.executor_team_id}，${selectedProject.executor_team_name ?? '未知团队'}` },
        { label: '预算金额', value: selectedProject.total_budget.toLocaleString() },
        { label: '项目等级', value: selectedProject.level },
        { label: '当前状态', value: selectedProject.status },
        { label: '预计时间', value: selectedProject.expected_at },
        { label: '创建时间', value: selectedProject.created_at },
        { label: '发布时间', value: selectedProject.published_at },
        { label: '更新时间', value: selectedProject.updated_at },
    ] : [];

    // 06）商业项目新增提交处理（handleCreateCommercialProjectSubmit）
    /**
     * 函数名：handleCreateCommercialProjectSubmit
     * 功能：处理商业项目新增表单提交并在列表中预览新增效果。
     * 实现方法：
     * - 从通用新增弹窗读取字段并做基础类型转换
     * - 构造页面所需的商业项目结构并插入列表顶部
     * - 提交完成后关闭弹窗
     * 输入：
     * - values：新增商业项目表单值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 projects/createModalOpen/createSubmitting 状态
     */
    const handleCreateCommercialProjectSubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const splitTags = (values.tags ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const nextProject: CommercialProject = {
                id: Date.now(),
                title: (values.title ?? '').trim(),
                project_pm_id: Number(values.project_pm_id) || 0,
                project_pm_name: `管理员#${values.project_pm_id || '-'}`,
                executor_lab_id: values.executor_lab_id ? Number(values.executor_lab_id) : null,
                executor_lab_name: values.executor_lab_id ? `实验室#${values.executor_lab_id}` : null,
                executor_team_id: values.executor_team_id ? Number(values.executor_team_id) : null,
                executor_team_name: values.executor_team_id ? `团队#${values.executor_team_id}` : null,
                preview: (values.preview ?? '').trim(),
                tags: splitTags,
                total_budget: Number(values.total_budget) || 0,
                level: (values.level as CommercialProject['level']) || 'N',
                status: (values.status ?? '').trim() || 'PENDING',
                expected_at: '待定',
                published_at: (values.published_at ?? '').trim() || now,
                created_at: now,
                updated_at: now,
                milestones: [],
            };
            setProjects((prev) => [nextProject, ...prev]);
            setCreateModalOpen(false);
        } finally {
            setCreateSubmitting(false);
        }
    };

    // 07）商业项目详情里程碑新增提交处理（handleCreateCommercialMilestoneSubmit）
    /**
     * 函数名：handleCreateCommercialMilestoneSubmit
     * 功能：处理商业项目详情弹窗中的里程碑新增提交并更新当前项目里程碑列表。
     * 实现方法：
     * - 将表单值转换为里程碑结构并设置默认任务列表
     * - 仅更新当前选中项目的 milestones 数组
     * - 提交后关闭里程碑新增弹窗
     * 输入：
     * - values：里程碑新增表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 projects/milestoneCreateModalOpen/milestoneCreateSubmitting 状态
     */
    const handleCreateCommercialMilestoneSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedProjectId == null) {
            return;
        }
        try {
            setMilestoneCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const nextMilestone: DetailModalMilestoneRow = {
                id: Date.now(),
                title: (values.title ?? '').trim(),
                payment_pct: Number(values.payment_pct) || 0,
                status: (values.status ?? '').trim() || 'PENDING',
                created_at: now,
                updated_at: now,
                deadline_at: (values.deadline_at ?? '').trim() || now,
                tasks: [],
            };
            setProjects((prev) =>
                prev.map((project) =>
                    project.id === selectedProjectId
                        ? { ...project, milestones: [...project.milestones, nextMilestone] }
                        : project,
                ),
            );
            setMilestoneCreateModalOpen(false);
        } finally {
            setMilestoneCreateSubmitting(false);
        }
    };

    // 08）商业项目详情任务卡片新增提交处理（handleCreateCommercialTaskSubmit）
    /**
     * 函数名：handleCreateCommercialTaskSubmit
     * 功能：处理商业项目详情弹窗中的任务卡片新增提交并更新目标里程碑任务列表。
     * 实现方法：
     * - 根据 taskCreateMilestoneId 定位目标里程碑
     * - 将表单值转换为任务卡片结构并追加到 tasks
     * - 提交后关闭任务新增弹窗
     * 输入：
     * - values：任务卡片新增表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 projects/taskCreateMilestoneId/taskCreateSubmitting 状态
     */
    const handleCreateCommercialTaskSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedProjectId == null || taskCreateMilestoneId == null) {
            return;
        }
        try {
            setTaskCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const assigneeId = values.assignee_id ? Number(values.assignee_id) : null;
            const nextTask = {
                id: Date.now(),
                title: (values.title ?? '').trim(),
                content: (values.content ?? '').trim(),
                assignee_id: assigneeId,
                assignee_name: assigneeId == null ? null : `用户#${assigneeId}`,
                status: ((values.status ?? 'TODO').trim() || 'TODO') as 'DONE' | 'TODO',
                created_at: now,
                updated_at: now,
            };
            setProjects((prev) =>
                prev.map((project) =>
                    project.id === selectedProjectId
                        ? {
                            ...project,
                            milestones: project.milestones.map((milestone) =>
                                milestone.id === taskCreateMilestoneId
                                    ? { ...milestone, tasks: [...milestone.tasks, nextTask] }
                                    : milestone,
                            ),
                        }
                        : project,
                ),
            );
            setTaskCreateMilestoneId(null);
        } finally {
            setTaskCreateSubmitting(false);
        }
    };

    // 09）模拟商业项目更新 API（mockUpdateCommercialProjectAPI）
    const mockUpdateCommercialProjectAPI = async (
        id: number,
        payload: Partial<CommercialProject>,
    ): Promise<Partial<CommercialProject>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 280 + (id % 4) * 30);
        });

    // 10）模拟商业项目删除 API（mockDeleteCommercialProjectAPI）
    const mockDeleteCommercialProjectAPI = async (id: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 220 + (id % 5) * 20);
        });

    // 11）打开项目修改弹窗（handleOpenCommercialEditModal）
    const handleOpenCommercialEditModal = (project: CommercialProject): void => {
        setEditingProjectId(project.id);
        setEditModalOpen(true);
    };

    // 12）商业项目修改提交处理（handleEditCommercialProjectSubmit）
    const handleEditCommercialProjectSubmit = async (values: CreateFormValues): Promise<void> => {
        if (editingProjectId == null) {
            return;
        }
        try {
            setEditSubmitting(true);
            const now = new Date().toLocaleString();
            const splitTags = (values.tags ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const payload: Partial<CommercialProject> = {
                title: (values.title ?? '').trim(),
                project_pm_id: Number(values.project_pm_id) || 0,
                project_pm_name: `管理员#${values.project_pm_id || '-'}`,
                executor_lab_id: values.executor_lab_id ? Number(values.executor_lab_id) : null,
                executor_lab_name: values.executor_lab_id ? `实验室#${values.executor_lab_id}` : null,
                executor_team_id: values.executor_team_id ? Number(values.executor_team_id) : null,
                executor_team_name: values.executor_team_id ? `团队#${values.executor_team_id}` : null,
                preview: (values.preview ?? '').trim(),
                tags: splitTags,
                total_budget: Number(values.total_budget) || 0,
                level: (values.level as CommercialProject['level']) || 'N',
                status: (values.status ?? '').trim() || 'PENDING',
                updated_at: now,
            };
            const updated = await mockUpdateCommercialProjectAPI(editingProjectId, payload);
            setProjects((prev) =>
                prev.map((project) => (project.id === editingProjectId ? { ...project, ...updated } : project)),
            );
            setEditModalOpen(false);
            setEditingProjectId(null);
        } finally {
            setEditSubmitting(false);
        }
    };

    // 13）商业项目删除处理（handleDeleteCommercialProject）
    const handleDeleteCommercialProject = async (id: number): Promise<void> => {
        if (!window.confirm('确定要删除该商业项目吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingProjectId(id);
            await mockDeleteCommercialProjectAPI(id);
            setProjects((prev) => prev.filter((project) => project.id !== id));
            setSelectedProjectId((prev) => (prev === id ? null : prev));
        } finally {
            setDeletingProjectId(null);
        }
    };

    // 14）模拟里程碑更新 API（mockUpdateCommercialMilestoneAPI）
    const mockUpdateCommercialMilestoneAPI = async (
        milestoneId: number,
        payload: Partial<DetailModalMilestoneRow>,
    ): Promise<Partial<DetailModalMilestoneRow>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 240 + (milestoneId % 3) * 30);
        });

    // 15）模拟里程碑删除 API（mockDeleteCommercialMilestoneAPI）
    const mockDeleteCommercialMilestoneAPI = async (milestoneId: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 180 + (milestoneId % 5) * 20);
        });

    // 16）模拟任务更新 API（mockUpdateCommercialTaskAPI）
    const mockUpdateCommercialTaskAPI = async (
        taskId: number,
        payload: Partial<DetailModalMilestoneRow['tasks'][number]>,
    ): Promise<Partial<DetailModalMilestoneRow['tasks'][number]>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 220 + (taskId % 3) * 20);
        });

    // 17）模拟任务删除 API（mockDeleteCommercialTaskAPI）
    const mockDeleteCommercialTaskAPI = async (taskId: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 160 + (taskId % 5) * 20);
        });

    // 18）打开里程碑修改弹窗（handleOpenCommercialMilestoneEditModal）
    const handleOpenCommercialMilestoneEditModal = (milestoneId: number): void => {
        setEditingMilestoneId(milestoneId);
        setMilestoneEditModalOpen(true);
    };

    // 19）里程碑修改提交处理（handleEditCommercialMilestoneSubmit）
    const handleEditCommercialMilestoneSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedProjectId == null || editingMilestoneId == null) {
            return;
        }
        try {
            setMilestoneEditSubmitting(true);
            const now = new Date().toLocaleString();
            const payload: Partial<DetailModalMilestoneRow> = {
                title: (values.title ?? '').trim(),
                payment_pct: Number(values.payment_pct) || 0,
                status: (values.status ?? '').trim() || 'PENDING',
                deadline_at: (values.deadline_at ?? '').trim() || now,
                updated_at: now,
            };
            const updated = await mockUpdateCommercialMilestoneAPI(editingMilestoneId, payload);
            setProjects((prev) =>
                prev.map((project) =>
                    project.id === selectedProjectId
                        ? {
                            ...project,
                            milestones: project.milestones.map((milestone) =>
                                milestone.id === editingMilestoneId ? { ...milestone, ...updated } : milestone,
                            ),
                        }
                        : project,
                ),
            );
            setMilestoneEditModalOpen(false);
            setEditingMilestoneId(null);
        } finally {
            setMilestoneEditSubmitting(false);
        }
    };

    // 20）里程碑删除处理（handleDeleteCommercialMilestone）
    const handleDeleteCommercialMilestone = async (milestoneId: number): Promise<void> => {
        if (selectedProjectId == null) {
            return;
        }
        if (!window.confirm('确定要删除该里程碑吗？此操作仅为本地静态模拟。')) {
            return;
        }
        await mockDeleteCommercialMilestoneAPI(milestoneId);
        setProjects((prev) =>
            prev.map((project) =>
                project.id === selectedProjectId
                    ? { ...project, milestones: project.milestones.filter((milestone) => milestone.id !== milestoneId) }
                    : project,
            ),
        );
    };

    // 21）打开任务修改弹窗（handleOpenCommercialTaskEditModal）
    const handleOpenCommercialTaskEditModal = (milestoneId: number, taskId: number): void => {
        setEditingTaskContext({ milestoneId, taskId });
        setTaskEditModalOpen(true);
    };

    // 22）任务修改提交处理（handleEditCommercialTaskSubmit）
    const handleEditCommercialTaskSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedProjectId == null || !editingTaskContext) {
            return;
        }
        try {
            setTaskEditSubmitting(true);
            const now = new Date().toLocaleString();
            const assigneeId = values.assignee_id ? Number(values.assignee_id) : null;
            const payload: Partial<DetailModalMilestoneRow['tasks'][number]> = {
                title: (values.title ?? '').trim(),
                content: (values.content ?? '').trim(),
                assignee_id: assigneeId,
                assignee_name: assigneeId == null ? null : `用户#${assigneeId}`,
                status: ((values.status ?? 'TODO').trim() || 'TODO') as 'DONE' | 'TODO',
                updated_at: now,
            };
            const updated = await mockUpdateCommercialTaskAPI(editingTaskContext.taskId, payload);
            setProjects((prev) =>
                prev.map((project) =>
                    project.id === selectedProjectId
                        ? {
                            ...project,
                            milestones: project.milestones.map((milestone) =>
                                milestone.id === editingTaskContext.milestoneId
                                    ? {
                                        ...milestone,
                                        tasks: milestone.tasks.map((task) =>
                                            task.id === editingTaskContext.taskId ? { ...task, ...updated } : task,
                                        ),
                                    }
                                    : milestone,
                            ),
                        }
                        : project,
                ),
            );
            setTaskEditModalOpen(false);
            setEditingTaskContext(null);
        } finally {
            setTaskEditSubmitting(false);
        }
    };

    // 23）任务删除处理（handleDeleteCommercialTask）
    const handleDeleteCommercialTask = async (milestoneId: number, taskId: number): Promise<void> => {
        if (selectedProjectId == null) {
            return;
        }
        if (!window.confirm('确定要删除该任务卡片吗？此操作仅为本地静态模拟。')) {
            return;
        }
        await mockDeleteCommercialTaskAPI(taskId);
        setProjects((prev) =>
            prev.map((project) =>
                project.id === selectedProjectId
                    ? {
                        ...project,
                        milestones: project.milestones.map((milestone) =>
                            milestone.id === milestoneId
                                ? { ...milestone, tasks: milestone.tasks.filter((task) => task.id !== taskId) }
                                : milestone,
                        ),
                    }
                    : project,
            ),
        );
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <div>
                    <h1>商业项目管理</h1>
                    <p>管理正式商业项目、预算分配及生命周期状态</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <Plus size={18} /> 发布新项目
                </button>
            </div>

            <div className="card table-container">
                <div className="table-toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="搜索项目标题..." />
                    </div>
                </div>

                <table className="standard-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>项目标题 / 发布者</th>
                            <th>预算金额</th>
                            <th>项目等级</th>
                            <th>当前状态</th>
                            <th>预计时间</th>
                            <th>发布时间</th>
                            <th>更新时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>
                                    <div className="name-cell">
                                        <Briefcase size={16} />
                                        <div>
                                            <div className="main-text">
                                                <button
                                                    type="button"
                                                    className="detail-name-btn"
                                                    onClick={() => setSelectedProjectId(p.id)}
                                                    title="点击查看项目详情"
                                                >
                                                    {p.title}
                                                </button>
                                            </div>
                                            <div className="sub-text">
                                                发布者（ID / 名称）：#{p.project_pm_id}，{p.project_pm_name}
                                            </div>
                                            <div className="sub-text">
                                                承接实验室（ID / 名称）：
                                                {p.executor_lab_id == null ? '—' : `#${p.executor_lab_id}，${p.executor_lab_name ?? '未知实验室'}`}
                                            </div>
                                            <div className="sub-text">
                                                承接团队（ID / 名称）：
                                                {p.executor_team_id == null ? '—' : `#${p.executor_team_id}，${p.executor_team_name ?? '未知团队'}`}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="budget-cell">
                                        <DollarSign size={14} /> {p.total_budget.toLocaleString()}
                                    </div>
                                </td>
                                <td>
                                    <span className={`level-tag lv-${p.level.toLowerCase()}`}>
                                        <Award size={12} /> {p.level}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge st-${p.status.toLowerCase()}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td>{p.expected_at}</td>
                                <td>{p.published_at}</td>
                                <td>{p.updated_at}</td>
                                <td className="action-btns">
                                    <button
                                        className="btn-icon edit"
                                        title="修改"
                                        onClick={() => handleOpenCommercialEditModal(p)}
                                        disabled={editSubmitting || deletingProjectId === p.id}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        title="删除"
                                        onClick={() => { void handleDeleteCommercialProject(p.id); }}
                                        disabled={editSubmitting || deletingProjectId === p.id}
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
                open={Boolean(selectedProject)}
                title="商业项目详情"
                fields={selectedProjectFields}
                tags={selectedProject?.tags}
                tagsLabel="算法标签"
                intro={selectedProject?.preview}
                introLabel="项目简略描述"
                milestoneList={selectedProject?.milestones}
                milestoneListTitle="里程碑列表（按截止时间排序）"
                onAddMilestone={() => setMilestoneCreateModalOpen(true)}
                onAddTask={(milestoneId) => setTaskCreateMilestoneId(milestoneId)}
                onEditMilestone={handleOpenCommercialMilestoneEditModal}
                onDeleteMilestone={(milestoneId) => { void handleDeleteCommercialMilestone(milestoneId); }}
                onEditTask={handleOpenCommercialTaskEditModal}
                onDeleteTask={(milestoneId, taskId) => { void handleDeleteCommercialTask(milestoneId, taskId); }}
                onClose={() => setSelectedProjectId(null)}
            />

            <CreateFormModal
                open={createModalOpen}
                title="新增商业项目"
                fields={commercialProjectCreateFields}
                submitText="确认发布"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateCommercialProjectSubmit}
            />

            <CreateFormModal
                open={milestoneCreateModalOpen}
                title="新增里程碑"
                fields={commercialMilestoneCreateFields}
                submitText="确认新增里程碑"
                submitting={milestoneCreateSubmitting}
                onClose={() => setMilestoneCreateModalOpen(false)}
                onSubmit={handleCreateCommercialMilestoneSubmit}
            />

            <CreateFormModal
                open={taskCreateMilestoneId != null}
                title="新增任务卡片"
                fields={commercialTaskCreateFields}
                submitText="确认新增任务"
                submitting={taskCreateSubmitting}
                onClose={() => setTaskCreateMilestoneId(null)}
                onSubmit={handleCreateCommercialTaskSubmit}
            />

            <EditFormModal
                open={editModalOpen}
                title="修改商业项目"
                fields={commercialProjectEditFields}
                initialValues={{
                    project_pm_id: String(editingProject?.project_pm_id ?? ''),
                    title: editingProject?.title ?? '',
                    preview: editingProject?.preview ?? '',
                    total_budget: String(editingProject?.total_budget ?? ''),
                    executor_lab_id: editingProject?.executor_lab_id == null ? '' : String(editingProject.executor_lab_id),
                    executor_team_id: editingProject?.executor_team_id == null ? '' : String(editingProject.executor_team_id),
                    tags: editingProject?.tags.join(', ') ?? '',
                    level: editingProject?.level ?? 'N',
                    status: editingProject?.status ?? 'PENDING',
                }}
                submitText="确认修改"
                submitting={editSubmitting}
                onClose={() => {
                    if (editSubmitting) {
                        return;
                    }
                    setEditModalOpen(false);
                    setEditingProjectId(null);
                }}
                onSubmit={handleEditCommercialProjectSubmit}
            />

            <EditFormModal
                open={milestoneEditModalOpen}
                title="修改里程碑"
                fields={commercialMilestoneEditFields}
                initialValues={{
                    title: editingMilestone?.title ?? '',
                    payment_pct: String(editingMilestone?.payment_pct ?? ''),
                    deadline_at: editingMilestone?.deadline_at ?? '',
                    status: editingMilestone?.status ?? 'PENDING',
                }}
                submitText="确认修改里程碑"
                submitting={milestoneEditSubmitting}
                onClose={() => {
                    if (milestoneEditSubmitting) {
                        return;
                    }
                    setMilestoneEditModalOpen(false);
                    setEditingMilestoneId(null);
                }}
                onSubmit={handleEditCommercialMilestoneSubmit}
            />

            <EditFormModal
                open={taskEditModalOpen}
                title="修改任务卡片"
                fields={commercialTaskEditFields}
                initialValues={{
                    title: editingTask?.title ?? '',
                    content: editingTask?.content ?? '',
                    assignee_id: editingTask?.assignee_id == null ? '' : String(editingTask.assignee_id),
                    status: editingTask?.status ?? 'TODO',
                }}
                submitText="确认修改任务"
                submitting={taskEditSubmitting}
                onClose={() => {
                    if (taskEditSubmitting) {
                        return;
                    }
                    setTaskEditModalOpen(false);
                    setEditingTaskContext(null);
                }}
                onSubmit={handleEditCommercialTaskSubmit}
            />
        </AdminLayout>
    );
};

export default CommercialProjects;