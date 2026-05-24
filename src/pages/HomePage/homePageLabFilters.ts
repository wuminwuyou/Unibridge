// 01）项目实验室筛选 Tab 标识（HomeLabFilterTabId）
export type HomeLabFilterTabId = 'all' | 'hot' | 'local' | 'school'

// 02）项目实验室筛选 Tab 配置项（HomeLabFilterTab）
export interface HomeLabFilterTab {
  id: HomeLabFilterTabId
  label: string
  count: number
}

// 03）构建项目实验室筛选 Tab 列表（buildHomeLabFilterTabs）
/**
 * 函数名：buildHomeLabFilterTabs
 * 功能：根据当前项目总数生成首页项目实验室顶部筛选 Tab 及展示数量。
 * 实现方法：
 * - 「全部项目」使用实际项目池长度
 * - 其余 Tab 使用演示用静态数量（后续可接 API）
 * 输入：
 * - totalProjects：项目数据池长度
 * 输出：
 * - 返回值：HomeLabFilterTab 数组
 * - 副作用：无
 */
export function buildHomeLabFilterTabs(totalProjects: number): HomeLabFilterTab[] {
  return [
    { id: 'all', label: '全部项目', count: totalProjects },
    { id: 'hot', label: '看热门', count: 16 },
    { id: 'local', label: '看同地', count: 8 },
    { id: 'school', label: '看同校', count: 4 },
  ]
}

// 04）项目实验室技术方向筛选项（HOME_LAB_TECH_DIRECTION_OPTIONS）
export const HOME_LAB_TECH_DIRECTION_OPTIONS = [
  '全部技术方向',
  '人工智能',
  'Web 开发',
  '数据科学',
  '移动开发',
] as const

// 05）项目实验室排序筛选项（HOME_LAB_SORT_OPTIONS）
export const HOME_LAB_SORT_OPTIONS = ['最新发布', '最多浏览', '即将截止'] as const
