// 01）项目实验室筛选 Tab 标识（ProjectLabFilterTabId）
export type ProjectLabFilterTabId = 'all' | 'hot' | 'local' | 'school'

// 02）项目实验室筛选 Tab 配置项（ProjectLabFilterTab）
export interface ProjectLabFilterTab {
  id: ProjectLabFilterTabId
  label: string
  count: number
}

// 03）构建项目实验室筛选 Tab 列表（buildProjectLabFilterTabs）
/**
 * 函数名：buildProjectLabFilterTabs
 * 功能：根据当前项目总数生成项目实验室顶部筛选 Tab 及展示数量。
 * 实现方法：
 * - 「全部项目」使用实际项目池长度
 * - 其余 Tab 使用演示用静态数量（后续可接 API）
 * 输入：
 * - totalProjects：项目数据池长度
 * 输出：
 * - 返回值：ProjectLabFilterTab 数组
 * - 副作用：无
 */
export function buildProjectLabFilterTabs(totalProjects: number): ProjectLabFilterTab[] {
  return [
    { id: 'all', label: '全部项目', count: totalProjects },
    { id: 'hot', label: '看热门', count: 16 },
    { id: 'local', label: '看同地', count: 8 },
    { id: 'school', label: '看同校', count: 4 },
  ]
}

// 04）构建企业实战筛选 Tab 列表（buildCommercialLabFilterTabs）
/**
 * 函数名：buildCommercialLabFilterTabs
 * 功能：根据当前项目总数生成企业实战页顶部筛选 Tab 及展示数量。
 * 实现方法：
 * - 「全部项目」使用实际项目池长度
 * - 其余 Tab 使用演示用静态数量（后续可接 API）
 * 输入：
 * - totalProjects：项目数据池长度
 * 输出：
 * - 返回值：ProjectLabFilterTab 数组（不含「看同校」）
 * - 副作用：无
 */
export function buildCommercialLabFilterTabs(totalProjects: number): ProjectLabFilterTab[] {
  return [
    { id: 'all', label: '全部项目', count: totalProjects },
    { id: 'hot', label: '看热门', count: 16 },
    { id: 'local', label: '看同地', count: 8 },
  ]
}

// 05）项目实验室技术方向筛选项（PROJECT_LAB_TECH_DIRECTION_OPTIONS）
export const PROJECT_LAB_TECH_DIRECTION_OPTIONS = [
  '全部技术方向',
  '人工智能',
  'Web 开发',
  '数据科学',
  '移动开发',
] as const

// 06）项目实验室排序筛选项（PROJECT_LAB_SORT_OPTIONS）
export const PROJECT_LAB_SORT_OPTIONS = ['最新发布', '最多浏览', '即将截止'] as const
