// 01）项目实验室筛选常量
export type ProjectLabFilterTabId = 'all' | 'hot' | 'local' | 'school'
export interface ProjectLabFilterTab { id: ProjectLabFilterTabId; label: string; count: number }

export function buildProjectLabFilterTabs(total: number): ProjectLabFilterTab[] { return [{ id: 'all', label: '全部项目', count: total }, { id: 'hot', label: '看热门', count: 16 }, { id: 'local', label: '看同地', count: 8 }, { id: 'school', label: '看同校', count: 4 }] }
export const PROJECT_LAB_TECH_DIRECTION_OPTIONS = ['全部技术方向', '人工智能', 'Web 开发', '数据科学', '移动开发'] as const
export const PROJECT_LAB_SORT_OPTIONS = ['最新发布', '最多浏览', '即将截止'] as const
