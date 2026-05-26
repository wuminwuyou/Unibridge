import type { ProfileTeamPreviewItem } from '../../components/types'
import { ProfileTeamsSection } from '../../components/ProfileTeamsSection'

// 01）实验室 Tab 内容 Props（LabsTabContentProps）
export interface LabsTabContentProps {
  title?: string
  teams: ProfileTeamPreviewItem[]
  emptyLabel?: string
}

// 02）实验室 Tab 内容（LabsTabContent）
/**
 * 函数名：LabsTabContent
 * 功能：渲染机构空间「实验室」Tab 完整列表。
 * 输入：
 * - title：区块标题
 * - teams：下属实验室列表
 * - emptyLabel：空态文案
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function LabsTabContent({
  title = '下属实验室',
  teams,
  emptyLabel = '暂无下属实验室',
}: LabsTabContentProps) {
  return (
    <ProfileTeamsSection title={title} teams={teams} mode="full" emptyLabel={emptyLabel} />
  )
}
