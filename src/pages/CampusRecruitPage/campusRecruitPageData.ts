import type { Announcement, ProjectItem, RecommendedCompany } from '../../types/project'

// 01）高校招募项目数据（campusRecruitProjects）
export const campusRecruitProjects: ProjectItem[] = [
  {
    id: 2001,
    title: '智能感知实验室项目组招新（计算机视觉方向）',
    preview: '面向本科生与研究生开放项目组招募，参与目标检测与多模态感知项目研发。',
    tags: [{ label: 'CV' }, { label: 'PyTorch' }, { label: '实验室项目' }],
    category: 'RECRUITMENT',
    recruitmentType: 'LAB_RECRUIT',
    ownerOrganization: '深圳技术大学智能感知实验室',
    ownerName: '赵老师',
    publishTime: '刚刚发布',
    level: 'R',
    teamSize: '3-6人',
    duration: '长期',
    status: 'OPEN',
  },
  {
    id: 2002,
    title: '校园服务平台迭代开发（实验室联合项目）',
    preview: '联合信息化中心推进校园服务平台升级，招募前端/后端同学参与真实需求开发。',
    tags: [{ label: 'React' }, { label: 'SpringBoot' }, { label: '实战训练' }],
    category: 'RECRUITMENT',
    recruitmentType: 'TEAM_RECRUIT',
    ownerOrganization: '数字校园联合实验室',
    ownerName: '陈导师',
    publishTime: '2小时前发布',
    level: 'SR',
    teamSize: '4-8人',
    duration: '2个月',
    status: 'OPEN',
  },
  {
    id: 2003,
    title: '大模型应用工程实践营（招募项目助理）',
    preview: '招募能够独立完成提示词工程与评测数据构建的同学，参与大模型应用工程落地。',
    tags: [{ label: 'LLM' }, { label: 'NLP' }, { label: '工程实践' }],
    category: 'RECRUITMENT',
    recruitmentType: 'PERSONAL_RECRUIT',
    ownerOrganization: '人工智能应用实验室',
    ownerName: '刘老师',
    publishTime: '今天发布',
    level: 'SSR',
    teamSize: '1-2人',
    duration: '3个月',
    status: 'OPEN',
  },
  {
    id: 2004,
    title: '机器人创新工坊项目招募（嵌入式方向）',
    preview: '围绕移动机器人控制与视觉导航课题，招募嵌入式开发与算法调试方向成员。',
    tags: [{ label: '机器人' }, { label: '嵌入式' }, { label: 'C++' }],
    category: 'RECRUITMENT',
    recruitmentType: 'LAB_RECRUIT',
    ownerOrganization: '机器人创新工坊',
    ownerName: '周导师',
    publishTime: '昨天发布',
    level: 'N',
    teamSize: '2-4人',
    duration: '长期',
    status: 'OPEN',
  },
]

// 02）高校招募推荐类型（campusRecruitRecommendedTypes）
export const campusRecruitRecommendedTypes: string[] = [
  '实验室项目',
  '科研训练',
  '大模型应用',
  '机器人开发',
  '校园平台',
  'Python',
  '工程实践',
  '竞赛孵化',
]

// 03）高校招募推荐实验室（campusRecruitRecommendedLabs）
export const campusRecruitRecommendedLabs: RecommendedCompany[] = [
  { name: '深圳技术大学智能感知实验室', projects: '12 个项目在招' },
  { name: '数字校园联合实验室', projects: '8 个项目在招' },
  { name: '人工智能应用实验室', projects: '10 个项目在招' },
  { name: '机器人创新工坊', projects: '6 个项目在招' },
]

// 04）高校招募公告（campusRecruitAnnouncements）
export const campusRecruitAnnouncements: Announcement[] = [
  { title: '高校招募季启动：实验室项目全面开放', date: '05-25' },
  { title: '本周新增 9 个校级项目与实践岗位', date: '05-21' },
  { title: '实验室成员选拔流程与考核细则发布', date: '05-18' },
  { title: '高校项目交流分享会预约开启', date: '05-15' },
]