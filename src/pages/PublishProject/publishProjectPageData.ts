import type { LevelCode } from '../../types/level'

// 01）高校招募子类型（CampusRecruitType）
export type CampusRecruitType = 'LAB_RECRUIT' | 'TEAM_RECRUIT' | 'PERSONAL_RECRUIT'

// 02）高校招募子类型选项（CampusRecruitOption）
export interface CampusRecruitOption {
  value: CampusRecruitType
  label: string
  description: string
}

// 03）发布渠道选项（PublishChannelOption）
export interface PublishChannelOption {
  value: string
  label: string
  description: string
}

// 04）发布项目表单草稿类型（PublishProjectFormDraft）
export interface PublishProjectFormDraft {
  title: string
  summary: string
  channel: string
  /** 高校招募子类型；非 campus 频道时为 null */
  campusRecruitType: CampusRecruitType | null
  description: string
  amount: string
  level: LevelCode
  duration: string
  teamSize: string
  skillTags: string[]
  deadline: string
}

// 05）高校招募子类型列表（campusRecruitOptions）
export const campusRecruitOptions: CampusRecruitOption[] = [
  { value: 'LAB_RECRUIT', label: '实验室招募', description: '实验室 / 课题组长期招募' },
  { value: 'TEAM_RECRUIT', label: '团队招募', description: '项目制团队组队招募' },
  { value: 'PERSONAL_RECRUIT', label: '个人招募', description: '个人参与的单人岗位' },
]

// 06）顶部导航数据（publishProjectNavItems）
export const publishProjectNavItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 07）发布渠道列表（publishChannelOptions）
export const publishChannelOptions: PublishChannelOption[] = [
  { value: 'enterprise', label: '企业实战', description: '面向企业真实业务需求' },
  { value: 'campus', label: '高校招募', description: '实验室 / 课题组招募' },
]

// 08）能力等级选项（publishLevelOptions）
export const publishLevelOptions: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']

// 09）技能标签建议（suggestedSkillTags）
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

// 10）发布检查清单（publishChecklistItems）
export const publishChecklistItems: string[] = [
  '标题能概括项目核心价值',
  '摘要控制在 80 字以内便于卡片展示',
  '预算与周期描述清晰可执行',
  '技能标签覆盖主要技术栈',
]

// 11）解析卡片预览频道角标（resolvePublishPreviewBadge）
/**
 * 函数名：resolvePublishPreviewBadge
 * 功能：根据发布频道与高校子类型，生成预览卡片左上角角标文案。
 * 输入：
 * - draft：表单草稿
 * 输出：
 * - 返回值：角标字符串
 */
export function resolvePublishPreviewBadge(draft: PublishProjectFormDraft): string {
  if (draft.channel !== 'campus') {
    return publishChannelOptions.find((item) => item.value === draft.channel)?.label ?? '企业实战'
  }

  if (draft.campusRecruitType) {
    return campusRecruitOptions.find((item) => item.value === draft.campusRecruitType)?.label ?? '高校招募'
  }

  return '高校招募'
}

// 12）解析项目详情频道展示名（resolveProjectChannelLabel）
/**
 * 函数名：resolveProjectChannelLabel
 * 功能：将发布表单频道与子类型映射为详情页展示文案。
 * 输入：
 * - channel：enterprise / campus
 * - campusRecruitType：高校子类型，可选
 * 输出：
 * - 返回值：频道展示名
 */
export function resolveProjectChannelLabel(
  channel: string,
  campusRecruitType: CampusRecruitType | null | undefined,
): string {
  if (channel !== 'campus') {
    return publishChannelOptions.find((item) => item.value === channel)?.label ?? '企业实战'
  }

  if (campusRecruitType) {
    return campusRecruitOptions.find((item) => item.value === campusRecruitType)?.label ?? '高校招募'
  }

  return '高校招募'
}

// 13）默认表单草稿（createDefaultPublishProjectDraft）
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
    campusRecruitType: null,
    description: '',
    amount: '',
    level: 'R',
    duration: '',
    teamSize: '',
    skillTags: [],
    deadline: '',
  }
}
