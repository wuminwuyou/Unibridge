// 01）频道选择器交互组件（ChannelPicker）
/**
 * 函数名：ChannelPicker
 * 功能：管理发布频道的切换与高校招募子类型的选择，组合 entities 纯展示卡片 + features 切换逻辑。
 * 实现方法：
 * - 渲染两个 publishChannelOptions 的 ChannelOptionCard
 * - 选中 campus 时展开 campusRecruitOptions
 * 输入：
 * - channel / campusRecruitType / onChannelChange / onCampusRecruitTypeChange
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { ChannelOptionCard } from '@entities/project/ui/ChannelOptionCard'
import { CampusRecruitOptionCard } from './CampusRecruitOptionCard'
import { publishChannelOptions, campusRecruitOptions } from '../constants/publishOptions'
import type { CampusRecruitType } from '@shared/types/project'
import styles from './ChannelPicker.module.css'

export interface ChannelPickerProps {
  channel: string
  campusRecruitType: CampusRecruitType | null
  onChannelChange: (channel: string) => void
  onCampusRecruitTypeChange: (type: CampusRecruitType) => void
}

export function ChannelPicker({ channel, campusRecruitType, onChannelChange, onCampusRecruitTypeChange }: ChannelPickerProps) {
  return (
    <fieldset>
      <legend className={styles.label}>发布频道</legend>
      <div className={styles.channelGrid}>
        {publishChannelOptions.map((option) => (
          <ChannelOptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={channel === option.value}
            onClick={() => onChannelChange(option.value)}
          />
        ))}
      </div>

      {channel === 'campus' && (
        <div className={styles.campusFieldset} role="group" aria-label="高校招募类型">
          <p className={styles.label}>高校招募类型</p>
          <div className={styles.campusGrid}>
            {campusRecruitOptions.map((option) => (
              <CampusRecruitOptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                selected={campusRecruitType === option.value}
                onClick={() => onCampusRecruitTypeChange(option.value)}
              />
            ))}
          </div>
        </div>
      )}
    </fieldset>
  )
}
