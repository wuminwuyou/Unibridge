import type { LevelCode } from '../../types/level'

// 01）发布渠道选项（PublishChannelOption）
export interface PublishChannelOption {
  value: string
  label: string
  description: string
}

// 02）发布项目表单草稿类型（PublishProjectFormDraft）
export interface PublishProjectFormDraft {
  title: string
  summary: string
  channel: string
  description: string
  amount: string
  level: LevelCode
  duration: string
  teamSize: string
  skillTags: string[]
  deadline: string
}

// 03）顶部导航数据（publishProjectNavItems）
export const publishProjectNavItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 04）发布渠道列表（publishChannelOptions）
export const publishChannelOptions: PublishChannelOption[] = [
  { value: 'enterprise', label: '企业实战', description: '面向企业真实业务需求' },
  { value: 'campus', label: '高校招募', description: '实验室 / 课题组招募' },
]

// 05）能力等级选项（publishLevelOptions）
export const publishLevelOptions: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']

// 06）技能标签建议（suggestedSkillTags）
export const suggestedSkillTags: string[] = [
  'Vue3',
  'React',
  'Python',
  'UI设计',
  '小程序',
  '数据分析',
  'SpringBoot',
  '大模型',
]

// 07）发布检查清单（publishChecklistItems）
export const publishChecklistItems: string[] = [
  '标题能概括项目核心价值',
  '摘要控制在 80 字以内便于卡片展示',
  '预算与周期描述清晰可执行',
  '技能标签覆盖主要技术栈',
]

// 08）默认表单草稿（createDefaultPublishProjectDraft）
/**
 * 函数名：createDefaultPublishProjectDraft
 * 功能：生成发布项目表单的默认草稿值。
 * 实现方法：
 * - 为各字段提供空字符串或合理默认值
 * 输入：无
 * 输出：
 * - 返回值：PublishProjectFormDraft
 * - 副作用：无
 */
export function createDefaultPublishProjectDraft(): PublishProjectFormDraft {
  return {
    title: '',
    summary: '',
    channel: 'enterprise',
    description: '',
    amount: '',
    level: 'R',
    duration: '',
    teamSize: '',
    skillTags: [],
    deadline: '',
  }
}
