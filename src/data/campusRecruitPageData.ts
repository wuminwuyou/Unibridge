import type { Announcement, ProjectItem, RecommendedCompany } from '../types/project'

// 01）使用方说明
/**
 * 该文件集中维护高校招募页（CampusRecruitPage）的静态展示数据。
 * 使用方：apps/web-client/src/pages/CampusRecruitPage.tsx
 * 数据范围：高校招募项目列表 / 推荐类型 / 推荐本校实验室 / 平台公告
 */

// 02）高校招募项目数据（campusRecruitProjects）
export const campusRecruitProjects: ProjectItem[] = [
  {
    title: '智能感知实验室项目组招新（计算机视觉方向）',
    summary: '面向本科生与研究生开放项目组招募，参与目标检测与多模态感知项目研发。',
    tags: [{ label: '高校招募' }, { label: '实验室项目' }, { label: 'CV' }, { label: 'PyTorch' }, { label: '长期' }],
    company: '深圳技术大学智能感知实验室',
    publisher: '赵老师',
    publishTime: '刚刚发布',
    level: 'R',
    amount: '',
  },
  {
    title: '校园服务平台迭代开发（实验室联合项目）',
    summary: '联合信息化中心推进校园服务平台升级，招募前端/后端同学参与真实需求开发。',
    tags: [{ label: '高校招募' }, { label: 'React' }, { label: 'SpringBoot' }, { label: '实战训练' }, { label: '2个月' }],
    company: '数字校园联合实验室',
    publisher: '陈导师',
    publishTime: '2小时前发布',
    level: 'SR',
    amount: '',
  },
  {
    title: '大模型应用工程实践营（招募项目助理）',
    summary: '招募能够独立完成提示词工程与评测数据构建的同学，参与大模型应用工程落地。',
    tags: [{ label: '高校招募' }, { label: 'LLM' }, { label: 'NLP' }, { label: '工程实践' }, { label: '3个月' }],
    company: '人工智能应用实验室',
    publisher: '刘老师',
    publishTime: '今天发布',
    level: 'SSR',
    amount: '',
  },
  {
    title: '机器人创新工坊项目招募（嵌入式方向）',
    summary: '围绕移动机器人控制与视觉导航课题，招募嵌入式开发与算法调试方向成员。',
    tags: [{ label: '高校招募' }, { label: '机器人' }, { label: '嵌入式' }, { label: 'C++' }, { label: '长期' }],
    company: '机器人创新工坊',
    publisher: '周导师',
    publishTime: '昨天发布',
    level: 'N',
    amount: '',
  },
]

// 03）高校招募推荐项目类型（campusRecruitRecommendedTypes）
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

// 04）高校招募推荐本校实验室（campusRecruitRecommendedLabs）
export const campusRecruitRecommendedLabs: RecommendedCompany[] = [
  { name: '深圳技术大学智能感知实验室', projects: '12 个项目在招' },
  { name: '数字校园联合实验室', projects: '8 个项目在招' },
  { name: '人工智能应用实验室', projects: '10 个项目在招' },
  { name: '机器人创新工坊', projects: '6 个项目在招' },
]

// 05）高校招募平台公告数据（campusRecruitAnnouncements）
export const campusRecruitAnnouncements: Announcement[] = [
  { title: '高校招募季启动：实验室项目全面开放', date: '05-25' },
  { title: '本周新增 9 个校级项目与实践岗位', date: '05-21' },
  { title: '实验室成员选拔流程与考核细则发布', date: '05-18' },
  { title: '高校项目交流分享会预约开启', date: '05-15' },
]
