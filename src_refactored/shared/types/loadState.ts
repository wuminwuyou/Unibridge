// 01）Tab/区块数据加载态（ProfileTabLoadState）
/**
 * 函数名/类型：ProfileTabLoadState
 * 功能：表示个人/团队/机构空间 Tab 与区块数据加载的三态。
 * 输入：
 * - 类型字面值：'loading' / 'error' / 'ready'
 * 输出：
 * - 仅作类型声明，不存在运行时实现
 */
export type ProfileTabLoadState = 'loading' | 'error' | 'ready'
