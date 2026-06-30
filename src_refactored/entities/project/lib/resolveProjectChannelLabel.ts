// 01）频道 label 映射 — 发布/详情共用，不依赖 publish feature 常量
// 部署位置：entities/project/lib（实体层，FSD 规范：publish feature 从 entities 导入）

// 02）频道值 → 展示名（channelLabelMap）
const channelLabelMap: Record<string, string> = {
  enterprise: '企业实战',
  campus: '高校招募',
}

// 03）高校招募子类型值 → 展示名（campusRecruitLabelMap）
const campusRecruitLabelMap: Record<string, string> = {
  LAB_RECRUIT: '实验室招募',
  TEAM_RECRUIT: '团队招募',
  PERSONAL_RECRUIT: '个人招募',
}

// 04）解析项目频道展示名（resolveProjectChannelLabel）
/**
 * 函数名：resolveProjectChannelLabel
 * 功能：将 channel 与 campusRecruitType 原始值转为展示用中文标签。
 * 实现方法：
 * - 查找 channel 直出映射（企业实战 / 高校招募）
 * - campus 频道下套 campusRecruitType 查找子类型标签
 * 输入：
 * - channel：频道原始值（如 'enterprise'、'campus'）
 * - campusRecruitType：高校招募子类型（如 'LAB_RECRUIT'），可选
 * 输出：
 * - 返回值：中文频道展示名
 */
export function resolveProjectChannelLabel(
  channel: string,
  campusRecruitType: string | null | undefined,
): string {
  if (channel !== 'campus') {
    return channelLabelMap[channel] ?? '企业实战'
  }

  if (campusRecruitType) {
    return campusRecruitLabelMap[campusRecruitType] ?? '高校招募'
  }

  return '高校招募'
}
