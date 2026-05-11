import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DetailModal, { type DetailModalField, type DetailModalMilestoneRow } from '../components/DetailModal';
import CreateFormModal, { type CreateFormField, type CreateFormValues } from '../components/CreateFormModal';
import EditFormModal from '../components/EditFormModal';
import { Rocket, Search, Plus, Edit, Trash2 } from 'lucide-react';

// 01）招募/实践项目列表数据模型（recruitment_project + 关联展示字段）
interface RecruitmentProject {
    id: number;
    type: 'LAB_RECRUIT' | 'TEAM_RECRUIT' | 'CAMPUS_PRACTICE';
    title: string;
    creator_id: number;
    creator_name: string;
    source_lab_id: number | null;
    source_lab_name: string | null;
    source_team_id: number | null;
    source_team_name: string | null;
    tags: string[];
    preview: string;
    status: 'OPEN' | 'CLOSED';
    expected_at: string | null;
    published_at: string;
    created_at: string;
    updated_at: string;
    milestones: DetailModalMilestoneRow[];
}

// 03）招募/实践项目新增表单字段配置（recruitmentProjectCreateFields）
const recruitmentProjectCreateFields: CreateFormField[] = [
    { key: 'creator_id', label: '发起人ID', required: true, type: 'number', placeholder: '请输入发起人ID' },
    {
        key: 'type',
        label: '项目类型',
        required: true,
        type: 'select',
        options: [
            { label: '实验室招募（LAB_RECRUIT）', value: 'LAB_RECRUIT' },
            { label: '团队招募（TEAM_RECRUIT）', value: 'TEAM_RECRUIT' },
            { label: '校园实践（CAMPUS_PRACTICE）', value: 'CAMPUS_PRACTICE' },
        ],
    },
    { key: 'title', label: '项目标题', required: true, placeholder: '请输入项目标题' },
    { key: 'preview', label: '项目简述', required: true, type: 'textarea', placeholder: '请输入项目简述' },
    { key: 'source_lab_id', label: '关联实验室ID（可选）', type: 'number', placeholder: '请输入实验室ID' },
    { key: 'source_team_id', label: '关联团队ID（可选）', type: 'number', placeholder: '请输入团队ID' },
    { key: 'tags', label: '标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'expected_at', label: '预计时间（可选）', type: 'datetime-local' },
    {
        key: 'status',
        label: '项目状态（可选）',
        type: 'select',
        options: [
            { label: 'OPEN', value: 'OPEN' },
            { label: 'CLOSED', value: 'CLOSED' },
        ],
    },
    { key: 'published_at', label: '发布时间（可选）', type: 'datetime-local' },
];

// 04）招募/实践项目修改表单字段配置（recruitmentProjectEditFields）
const recruitmentProjectEditFields: CreateFormField[] = [
    { key: 'creator_id', label: '发起人ID', required: true, type: 'number', placeholder: '请输入发起人ID' },
    {
        key: 'type',
        label: '项目类型',
        required: true,
        type: 'select',
        options: [
            { label: '实验室招募（LAB_RECRUIT）', value: 'LAB_RECRUIT' },
            { label: '团队招募（TEAM_RECRUIT）', value: 'TEAM_RECRUIT' },
            { label: '校园实践（CAMPUS_PRACTICE）', value: 'CAMPUS_PRACTICE' },
        ],
    },
    { key: 'title', label: '项目标题', required: true, placeholder: '请输入项目标题' },
    { key: 'preview', label: '项目简述', required: true, type: 'textarea', placeholder: '请输入项目简述' },
    { key: 'source_lab_id', label: '关联实验室ID（可选）', type: 'number', placeholder: '请输入实验室ID' },
    { key: 'source_team_id', label: '关联团队ID（可选）', type: 'number', placeholder: '请输入团队ID' },
    { key: 'tags', label: '标签（可选）', placeholder: '多个值用逗号分隔' },
    { key: 'expected_at', label: '预计时间（可选）', type: 'datetime-local' },
    {
        key: 'status',
        label: '项目状态（可选）',
        type: 'select',
        options: [
            { label: 'OPEN', value: 'OPEN' },
            { label: 'CLOSED', value: 'CLOSED' },
        ],
    },
    { key: 'published_at', label: '发布时间（可选）', type: 'datetime-local' },
];

// 04）招募/实践项目里程碑新增表单字段配置（recruitmentMilestoneCreateFields）
const recruitmentMilestoneCreateFields: CreateFormField[] = [
    { key: 'title', label: '里程碑标题', required: true, placeholder: '请输入里程碑标题' },
    { key: 'payment_pct', label: '拨款占比', required: true, type: 'number', placeholder: '请输入拨款占比' },
    { key: 'deadline_at', label: '截止时间', required: true, type: 'datetime-local' },
    { key: 'status', label: '状态（可选）', placeholder: '如 OPEN / CLOSED / PENDING' },
];

// 06）招募/实践项目里程碑修改表单字段配置（recruitmentMilestoneEditFields）
const recruitmentMilestoneEditFields: CreateFormField[] = [
    { key: 'title', label: '里程碑标题', required: true, placeholder: '请输入里程碑标题' },
    { key: 'payment_pct', label: '拨款占比', required: true, type: 'number', placeholder: '请输入拨款占比' },
    { key: 'deadline_at', label: '截止时间', required: true, type: 'datetime-local' },
    { key: 'status', label: '状态（可选）', placeholder: '如 OPEN / CLOSED / PENDING' },
];

// 05）招募/实践项目任务卡片新增表单字段配置（recruitmentTaskCreateFields）
const recruitmentTaskCreateFields: CreateFormField[] = [
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

// 07）招募/实践项目任务卡片修改表单字段配置（recruitmentTaskEditFields）
const recruitmentTaskEditFields: CreateFormField[] = [
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

// 02）招募/实践项目管理页面（RecruitmentProjects）
const RecruitmentProjects: React.FC = () => {
    const [projects, setProjects] = useState<RecruitmentProject[]>([
        {
            id: 1,
            type: 'CAMPUS_PRACTICE',
            title: '校园二手交易平台开发',
            creator_id: 201,
            creator_name: '赵六',
            source_lab_id: 1,
            source_lab_name: 'AI 视觉实验室',
            source_team_id: null,
            source_team_name: null,
            tags: ['Web', '校园'],
            preview: '聚焦校园场景的二手交易闭环，覆盖发布、检索、沟通与履约流程。',
            status: 'OPEN',
            expected_at: '2026-05-20 18:00:00',
            published_at: '2026-04-12 09:00:00',
            created_at: '2026-04-12 08:58:11',
            updated_at: '2026-04-18 10:15:00',
            milestones: [
                {
                    id: 101,
                    title: '需求拆解与原型评审',
                    payment_pct: 20,
                    status: 'OPEN',
                    created_at: '2026-04-13 10:00:00',
                    updated_at: '2026-04-14 11:30:00',
                    deadline_at: '2026-04-20 18:00:00',
                    tasks: [
                        {
                            id: 21001,
                            title: '用户访谈与画像',
                            content: '完成10位学生访谈并产出画像文档。',
                            assignee_id: 2001,
                            assignee_name: '林一',
                            status: 'DONE',
                            created_at: '2026-04-13 10:20:00',
                            updated_at: '2026-04-14 10:00:00',
                        },
                        {
                            id: 21002,
                            title: '原型交互评审',
                            content: '针对发布、检索、沟通流程完成交互审查。',
                            assignee_id: 2002,
                            assignee_name: '吴二',
                            status: 'TODO',
                            created_at: '2026-04-13 15:10:00',
                            updated_at: '2026-04-14 11:30:00',
                        },
                    ],
                },
                {
                    id: 102,
                    title: '核心模块开发',
                    payment_pct: 40,
                    status: 'OPEN',
                    created_at: '2026-04-15 09:00:00',
                    updated_at: '2026-04-16 15:20:00',
                    deadline_at: '2026-04-28 18:00:00',
                    tasks: [
                        {
                            id: 21003,
                            title: '订单与聊天模块联调',
                            content: '打通交易状态变更与即时消息提醒链路。',
                            assignee_id: null,
                            assignee_name: null,
                            status: 'TODO',
                            created_at: '2026-04-15 11:30:00',
                            updated_at: '2026-04-16 15:20:00',
                        },
                    ],
                },
            ],
        },
        {
            id: 2,
            type: 'TEAM_RECRUIT',
            title: '数学建模竞赛组队',
            creator_id: 205,
            creator_name: '钱七',
            source_lab_id: null,
            source_lab_name: null,
            source_team_id: 2,
            source_team_name: '前端基建小分队',
            tags: ['建模', '竞赛'],
            preview: '面向竞赛组队场景，完成成员匹配、任务分工与阶段打卡管理。',
            status: 'CLOSED',
            expected_at: null,
            published_at: '2026-04-14 13:30:00',
            created_at: '2026-04-14 13:28:45',
            updated_at: '2026-04-16 16:40:00',
            milestones: [
                {
                    id: 201,
                    title: '组队完成',
                    payment_pct: 30,
                    status: 'CLOSED',
                    created_at: '2026-04-14 14:00:00',
                    updated_at: '2026-04-15 12:00:00',
                    deadline_at: '2026-04-18 18:00:00',
                    tasks: [
                        {
                            id: 22001,
                            title: '队员角色分配',
                            content: '确定建模、论文、答辩三类角色负责人。',
                            assignee_id: 205,
                            assignee_name: '钱七',
                            status: 'DONE',
                            created_at: '2026-04-14 15:00:00',
                            updated_at: '2026-04-15 12:00:00',
                        },
                    ],
                },
            ],
        },
    ]);
    // 03）招募项目详情弹窗状态
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
        { label: '项目类型', value: selectedProject.type },
        { label: '发起人ID', value: selectedProject.creator_id },
        { label: '发起人', value: `#${selectedProject.creator_id}，${selectedProject.creator_name}` },
        { label: '关联实验室ID', value: selectedProject.source_lab_id ?? '—' },
        { label: '关联实验室', value: selectedProject.source_lab_id == null ? '—' : `#${selectedProject.source_lab_id}，${selectedProject.source_lab_name ?? '未知实验室'}` },
        { label: '关联团队ID', value: selectedProject.source_team_id ?? '—' },
        { label: '关联团队', value: selectedProject.source_team_id == null ? '—' : `#${selectedProject.source_team_id}，${selectedProject.source_team_name ?? '未知团队'}` },
        { label: '当前状态', value: selectedProject.status },
        { label: '预计时间', value: selectedProject.expected_at ?? '—' },
        { label: '创建时间', value: selectedProject.created_at },
        { label: '发布时间', value: selectedProject.published_at },
        { label: '更新时间', value: selectedProject.updated_at },
    ] : [];

    // 06）招募/实践项目新增提交处理（handleCreateRecruitmentProjectSubmit）
    /**
     * 函数名：handleCreateRecruitmentProjectSubmit
     * 功能：处理招募/实践项目新增表单提交并在列表中预览新增效果。
     * 实现方法：
     * - 解析通用新增弹窗字段值并做基础类型转换
     * - 构造页面展示所需项目结构并插入列表顶部
     * - 提交后关闭弹窗
     * 输入：
     * - values：新增招募/实践项目表单值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 projects/createModalOpen/createSubmitting 状态
     */
    const handleCreateRecruitmentProjectSubmit = async (values: CreateFormValues): Promise<void> => {
        try {
            setCreateSubmitting(true);
            const now = new Date().toLocaleString();
            const splitTags = (values.tags ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const nextProject: RecruitmentProject = {
                id: Date.now(),
                type: (values.type as RecruitmentProject['type']) || 'CAMPUS_PRACTICE',
                title: (values.title ?? '').trim(),
                creator_id: Number(values.creator_id) || 0,
                creator_name: `用户#${values.creator_id || '-'}`,
                source_lab_id: values.source_lab_id ? Number(values.source_lab_id) : null,
                source_lab_name: values.source_lab_id ? `实验室#${values.source_lab_id}` : null,
                source_team_id: values.source_team_id ? Number(values.source_team_id) : null,
                source_team_name: values.source_team_id ? `团队#${values.source_team_id}` : null,
                tags: splitTags,
                preview: (values.preview ?? '').trim(),
                status: (values.status as RecruitmentProject['status']) || 'OPEN',
                expected_at: (values.expected_at ?? '').trim() || null,
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

    // 07）招募/实践项目详情里程碑新增提交处理（handleCreateRecruitmentMilestoneSubmit）
    /**
     * 函数名：handleCreateRecruitmentMilestoneSubmit
     * 功能：处理招募/实践项目详情弹窗中的里程碑新增提交并更新当前项目里程碑列表。
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
    const handleCreateRecruitmentMilestoneSubmit = async (values: CreateFormValues): Promise<void> => {
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
                status: (values.status ?? '').trim() || 'OPEN',
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

    // 08）招募/实践项目详情任务卡片新增提交处理（handleCreateRecruitmentTaskSubmit）
    /**
     * 函数名：handleCreateRecruitmentTaskSubmit
     * 功能：处理招募/实践项目详情弹窗中的任务卡片新增提交并更新目标里程碑任务列表。
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
    const handleCreateRecruitmentTaskSubmit = async (values: CreateFormValues): Promise<void> => {
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

    // 09）模拟招募项目更新 API（mockUpdateRecruitmentProjectAPI）
    /**
     * 函数名：mockUpdateRecruitmentProjectAPI
     * 功能：模拟本地静态的招募/实践项目更新接口调用。
     * 实现方法：
     * - 接收项目 ID 与更新载荷
     * - 使用短延时 Promise 模拟网络请求
     * - 原样返回更新载荷供页面落地
     * 输入：
     * - id：项目 ID
     * - payload：更新请求载荷
     * 输出：
     * - 返回值：Promise<typeof payload>
     * - 副作用：无
     */
    const mockUpdateRecruitmentProjectAPI = async (
        id: number,
        payload: Partial<RecruitmentProject>,
    ): Promise<Partial<RecruitmentProject>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 280 + (id % 3) * 40);
        });

    // 10）模拟招募项目删除 API（mockDeleteRecruitmentProjectAPI）
    /**
     * 函数名：mockDeleteRecruitmentProjectAPI
     * 功能：模拟本地静态的招募/实践项目删除接口调用。
     * 实现方法：
     * - 接收待删除项目 ID
     * - 使用短延时 Promise 模拟网络删除请求
     * - 返回调用成功标记
     * 输入：
     * - id：项目 ID
     * 输出：
     * - 返回值：Promise<{ success: true }>
     * - 副作用：无
     */
    const mockDeleteRecruitmentProjectAPI = async (id: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 220 + (id % 5) * 20);
        });

    // 11）打开项目修改弹窗（handleOpenEditModal）
    const handleOpenEditModal = (project: RecruitmentProject): void => {
        setEditingProjectId(project.id);
        setEditModalOpen(true);
    };

    // 12）项目修改提交处理（handleEditRecruitmentProjectSubmit）
    /**
     * 函数名：handleEditRecruitmentProjectSubmit
     * 功能：处理招募/实践项目修改提交并调用本地模拟更新 API。
     * 实现方法：
     * - 解析弹窗字段并组装更新载荷
     * - 调用 mockUpdateRecruitmentProjectAPI 模拟接口
     * - 将更新结果合并回当前列表
     * 输入：
     * - values：修改表单字段值
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 projects/editModalOpen/editSubmitting 状态
     */
    const handleEditRecruitmentProjectSubmit = async (values: CreateFormValues): Promise<void> => {
        if (editingProjectId == null) {
            return;
        }
        try {
            setEditSubmitting(true);
            const now = new Date().toLocaleString();
            const splitTags = (values.tags ?? '').split(',').map((item) => item.trim()).filter(Boolean);
            const payload: Partial<RecruitmentProject> = {
                creator_id: Number(values.creator_id) || 0,
                creator_name: `用户#${values.creator_id || '-'}`,
                type: (values.type as RecruitmentProject['type']) || 'CAMPUS_PRACTICE',
                title: (values.title ?? '').trim(),
                preview: (values.preview ?? '').trim(),
                source_lab_id: values.source_lab_id ? Number(values.source_lab_id) : null,
                source_lab_name: values.source_lab_id ? `实验室#${values.source_lab_id}` : null,
                source_team_id: values.source_team_id ? Number(values.source_team_id) : null,
                source_team_name: values.source_team_id ? `团队#${values.source_team_id}` : null,
                tags: splitTags,
                expected_at: (values.expected_at ?? '').trim() || null,
                status: (values.status as RecruitmentProject['status']) || 'OPEN',
                published_at: (values.published_at ?? '').trim() || now,
                updated_at: now,
            };
            const updated = await mockUpdateRecruitmentProjectAPI(editingProjectId, payload);
            setProjects((prev) =>
                prev.map((project) =>
                    project.id === editingProjectId
                        ? { ...project, ...updated }
                        : project,
                ),
            );
            setEditModalOpen(false);
            setEditingProjectId(null);
        } finally {
            setEditSubmitting(false);
        }
    };

    // 13）项目删除处理（handleDeleteRecruitmentProject）
    /**
     * 函数名：handleDeleteRecruitmentProject
     * 功能：处理招募/实践项目删除并调用本地模拟删除 API。
     * 实现方法：
     * - 先进行删除确认
     * - 调用 mockDeleteRecruitmentProjectAPI 模拟删除请求
     * - 从本地列表移除记录并同步关闭详情弹窗
     * 输入：
     * - id：项目 ID
     * 输出：
     * - 返回值：Promise<void>
     * - 副作用：更新 projects/selectedProjectId/deletingProjectId 状态
     */
    const handleDeleteRecruitmentProject = async (id: number): Promise<void> => {
        if (!window.confirm('确定要删除该招募项目吗？此操作仅为本地静态模拟。')) {
            return;
        }
        try {
            setDeletingProjectId(id);
            await mockDeleteRecruitmentProjectAPI(id);
            setProjects((prev) => prev.filter((project) => project.id !== id));
            setSelectedProjectId((prev) => (prev === id ? null : prev));
        } finally {
            setDeletingProjectId(null);
        }
    };

    // 14）模拟里程碑更新 API（mockUpdateRecruitmentMilestoneAPI）
    const mockUpdateRecruitmentMilestoneAPI = async (
        milestoneId: number,
        payload: Partial<DetailModalMilestoneRow>,
    ): Promise<Partial<DetailModalMilestoneRow>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 240 + (milestoneId % 3) * 30);
        });

    // 15）模拟里程碑删除 API（mockDeleteRecruitmentMilestoneAPI）
    const mockDeleteRecruitmentMilestoneAPI = async (milestoneId: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 180 + (milestoneId % 5) * 20);
        });

    // 16）模拟任务更新 API（mockUpdateRecruitmentTaskAPI）
    const mockUpdateRecruitmentTaskAPI = async (
        taskId: number,
        payload: Partial<DetailModalMilestoneRow['tasks'][number]>,
    ): Promise<Partial<DetailModalMilestoneRow['tasks'][number]>> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve(payload);
            }, 220 + (taskId % 3) * 20);
        });

    // 17）模拟任务删除 API（mockDeleteRecruitmentTaskAPI）
    const mockDeleteRecruitmentTaskAPI = async (taskId: number): Promise<{ success: true }> =>
        new Promise((resolve) => {
            window.setTimeout(() => {
                resolve({ success: true });
            }, 160 + (taskId % 5) * 20);
        });

    // 18）打开里程碑修改弹窗（handleOpenMilestoneEditModal）
    const handleOpenMilestoneEditModal = (milestoneId: number): void => {
        setEditingMilestoneId(milestoneId);
        setMilestoneEditModalOpen(true);
    };

    // 19）里程碑修改提交处理（handleEditRecruitmentMilestoneSubmit）
    const handleEditRecruitmentMilestoneSubmit = async (values: CreateFormValues): Promise<void> => {
        if (selectedProjectId == null || editingMilestoneId == null) {
            return;
        }
        try {
            setMilestoneEditSubmitting(true);
            const now = new Date().toLocaleString();
            const payload: Partial<DetailModalMilestoneRow> = {
                title: (values.title ?? '').trim(),
                payment_pct: Number(values.payment_pct) || 0,
                status: (values.status ?? '').trim() || 'OPEN',
                deadline_at: (values.deadline_at ?? '').trim() || now,
                updated_at: now,
            };
            const updated = await mockUpdateRecruitmentMilestoneAPI(editingMilestoneId, payload);
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

    // 20）里程碑删除处理（handleDeleteRecruitmentMilestone）
    const handleDeleteRecruitmentMilestone = async (milestoneId: number): Promise<void> => {
        if (selectedProjectId == null) {
            return;
        }
        if (!window.confirm('确定要删除该里程碑吗？此操作仅为本地静态模拟。')) {
            return;
        }
        await mockDeleteRecruitmentMilestoneAPI(milestoneId);
        setProjects((prev) =>
            prev.map((project) =>
                project.id === selectedProjectId
                    ? { ...project, milestones: project.milestones.filter((milestone) => milestone.id !== milestoneId) }
                    : project,
            ),
        );
    };

    // 21）打开任务修改弹窗（handleOpenTaskEditModal）
    const handleOpenTaskEditModal = (milestoneId: number, taskId: number): void => {
        setEditingTaskContext({ milestoneId, taskId });
        setTaskEditModalOpen(true);
    };

    // 22）任务修改提交处理（handleEditRecruitmentTaskSubmit）
    const handleEditRecruitmentTaskSubmit = async (values: CreateFormValues): Promise<void> => {
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
            const updated = await mockUpdateRecruitmentTaskAPI(editingTaskContext.taskId, payload);
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

    // 23）任务删除处理（handleDeleteRecruitmentTask）
    const handleDeleteRecruitmentTask = async (milestoneId: number, taskId: number): Promise<void> => {
        if (selectedProjectId == null) {
            return;
        }
        if (!window.confirm('确定要删除该任务卡片吗？此操作仅为本地静态模拟。')) {
            return;
        }
        await mockDeleteRecruitmentTaskAPI(taskId);
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
                    <h1>实践/招募项目</h1>
                    <p>管理学生发起的创意项目、组队招募及校园实践</p>
                </div>
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    <Plus size={18} /> 发布招募
                </button>
            </div>

            <div className="card table-container">
                <div className="table-toolbar">
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="搜索项目..." />
                    </div>
                </div>

                <table className="standard-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>项目名称 / 发起人</th>
                            <th>类型</th>
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
                                    <div className="name-cell name-cell--recruitment">
                                        <Rocket size={16} />
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
                                                发起人（ID / 名称）：#{p.creator_id}，{p.creator_name}
                                            </div>
                                            <div className="sub-text">
                                                关联实验室（ID / 名称）：
                                                {p.source_lab_id == null ? '—' : `#${p.source_lab_id}，${p.source_lab_name ?? '未知实验室'}`}
                                            </div>
                                            <div className="sub-text">
                                                关联团队（ID / 名称）：
                                                {p.source_team_id == null ? '—' : `#${p.source_team_id}，${p.source_team_name ?? '未知团队'}`}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>{p.type}</td>
                                <td>
                                    <span className={`status-badge ${p.status === 'OPEN' ? 'st-open' : 'st-closed'}`}>
                                        {p.status === 'OPEN' ? '招募中' : '已结束'}
                                    </span>
                                </td>
                                <td>{p.expected_at ?? '—'}</td>
                                <td>{p.published_at}</td>
                                <td>{p.updated_at}</td>
                                <td className="action-btns">
                                    <button
                                        className="btn-icon edit"
                                        title="修改"
                                        onClick={() => handleOpenEditModal(p)}
                                        disabled={editSubmitting || deletingProjectId === p.id}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        title="删除"
                                        onClick={() => { void handleDeleteRecruitmentProject(p.id); }}
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
                title="招募/实践项目详情"
                fields={selectedProjectFields}
                tags={selectedProject?.tags}
                tagsLabel="算法标签"
                intro={selectedProject?.preview}
                introLabel="项目简略描述"
                milestoneList={selectedProject?.milestones}
                milestoneListTitle="里程碑列表（按截止时间排序）"
                onAddMilestone={() => setMilestoneCreateModalOpen(true)}
                onAddTask={(milestoneId) => setTaskCreateMilestoneId(milestoneId)}
                onEditMilestone={handleOpenMilestoneEditModal}
                onDeleteMilestone={(milestoneId) => { void handleDeleteRecruitmentMilestone(milestoneId); }}
                onEditTask={handleOpenTaskEditModal}
                onDeleteTask={(milestoneId, taskId) => { void handleDeleteRecruitmentTask(milestoneId, taskId); }}
                onClose={() => setSelectedProjectId(null)}
            />

            <CreateFormModal
                open={createModalOpen}
                title="新增招募/实践项目"
                fields={recruitmentProjectCreateFields}
                submitText="确认发布"
                submitting={createSubmitting}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateRecruitmentProjectSubmit}
            />

            <CreateFormModal
                open={milestoneCreateModalOpen}
                title="新增里程碑"
                fields={recruitmentMilestoneCreateFields}
                submitText="确认新增里程碑"
                submitting={milestoneCreateSubmitting}
                onClose={() => setMilestoneCreateModalOpen(false)}
                onSubmit={handleCreateRecruitmentMilestoneSubmit}
            />

            <CreateFormModal
                open={taskCreateMilestoneId != null}
                title="新增任务卡片"
                fields={recruitmentTaskCreateFields}
                submitText="确认新增任务"
                submitting={taskCreateSubmitting}
                onClose={() => setTaskCreateMilestoneId(null)}
                onSubmit={handleCreateRecruitmentTaskSubmit}
            />

            <EditFormModal
                open={editModalOpen}
                title="修改招募/实践项目"
                fields={recruitmentProjectEditFields}
                initialValues={{
                    creator_id: String(editingProject?.creator_id ?? ''),
                    type: editingProject?.type ?? 'CAMPUS_PRACTICE',
                    title: editingProject?.title ?? '',
                    preview: editingProject?.preview ?? '',
                    source_lab_id: editingProject?.source_lab_id == null ? '' : String(editingProject.source_lab_id),
                    source_team_id: editingProject?.source_team_id == null ? '' : String(editingProject.source_team_id),
                    tags: editingProject?.tags.join(', ') ?? '',
                    expected_at: editingProject?.expected_at ?? '',
                    status: editingProject?.status ?? 'OPEN',
                    published_at: editingProject?.published_at ?? '',
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
                onSubmit={handleEditRecruitmentProjectSubmit}
            />

            <EditFormModal
                open={milestoneEditModalOpen}
                title="修改里程碑"
                fields={recruitmentMilestoneEditFields}
                initialValues={{
                    title: editingMilestone?.title ?? '',
                    payment_pct: String(editingMilestone?.payment_pct ?? ''),
                    deadline_at: editingMilestone?.deadline_at ?? '',
                    status: editingMilestone?.status ?? 'OPEN',
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
                onSubmit={handleEditRecruitmentMilestoneSubmit}
            />

            <EditFormModal
                open={taskEditModalOpen}
                title="修改任务卡片"
                fields={recruitmentTaskEditFields}
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
                onSubmit={handleEditRecruitmentTaskSubmit}
            />
        </AdminLayout>
    );
};

export default RecruitmentProjects;