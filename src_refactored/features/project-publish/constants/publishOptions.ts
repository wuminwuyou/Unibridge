// 01）发布项目页常量数据
import type { LevelCode } from '@shared/types/level'
import type { CampusRecruitOption, PublishChannelOption, PublishProjectFormDraft } from '../model/types'

// 02）高校招募子类型列表（campusRecruitOptions）
export const campusRecruitOptions: CampusRecruitOption[] = [
  { value: 'LAB_RECRUIT', label: '实验室招募', description: '实验室 / 课题组长期招募' },
  { value: 'TEAM_RECRUIT', label: '团队招募', description: '项目制团队组队招募' },
  { value: 'PERSONAL_RECRUIT', label: '个人招募', description: '个人参与的单人岗位' },
]

// 03）发布渠道列表（publishChannelOptions）
export const publishChannelOptions: PublishChannelOption[] = [
  { value: 'enterprise', label: '企业实战', description: '面向企业真实业务需求' },
  { value: 'campus', label: '高校招募', description: '实验室 / 课题组招募' },
]

// 04）能力等级选项（publishLevelOptions）
export const publishLevelOptions: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']

// 05）技能标签建议（suggestedSkillTags）
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

// 06）发布检查清单（publishChecklistItems）
export const publishChecklistItems: string[] = [
  '标题能概括项目核心价值',
  '摘要控制在 80 字以内便于卡片展示',
  '预算与周期描述清晰可执行',
  '技能标签覆盖主要技术栈',
]

// 07）解析卡片预览频道角标（resolvePublishPreviewBadge）
export function resolvePublishPreviewBadge(draft: PublishProjectFormDraft): string {
  if (draft.channel !== 'campus') {
    return publishChannelOptions.find((item) => item.value === draft.channel)?.label ?? '企业实战'
  }

  if (draft.campusRecruitType) {
    return campusRecruitOptions.find((item) => item.value === draft.campusRecruitType)?.label ?? '高校招募'
  }

  return '高校招募'
}

// 08）默认表单草稿（createDefaultPublishProjectDraft）
export function createDefaultPublishProjectDraft(): PublishProjectFormDraft {
  return {
    title: '',
    summary: '',
    channel: 'enterprise',
    campusRecruitType: null,
    description: '',
    amountMin: '',
    amountMax: '',
    level: 'R',
    duration: '',
    skillTags: [],
    deadline: '',
  }
}
