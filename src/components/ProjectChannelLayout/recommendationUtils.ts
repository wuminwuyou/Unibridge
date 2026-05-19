// 01）数组随机打散（shuffleItems）
/**
 * 函数名：shuffleItems
 * 功能：对传入数组执行浅拷贝随机打散，用于"换一换"推荐批次生成。
 * 实现方法：
 * - 先复制输入数组避免修改原始数据
 * - 使用 Fisher-Yates 思路从后向前交换元素
 * - 返回新的随机顺序数组
 * 输入：
 * - items：待随机打散的数据数组
 * 输出：
 * - 返回值：T[]，随机顺序的新数组
 * - 副作用：无
 */
export function shuffleItems<T>(items: T[]): T[] {
  const clonedItems: T[] = [...items]

  for (let index = clonedItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = clonedItems[index]
    clonedItems[index] = clonedItems[randomIndex]
    clonedItems[randomIndex] = currentItem
  }

  return clonedItems
}

// 02）推荐批次截取（pickRecommendationBatch）
/**
 * 函数名：pickRecommendationBatch
 * 功能：从完整数据池中随机抽取指定数量的一批推荐项。
 * 实现方法：
 * - 对输入数组执行随机打散
 * - 按 count 截取前 N 条作为一批
 * - count 超出数组长度时自动裁剪到合法范围
 * 输入：
 * - items：完整推荐数据池
 * - count：每批次需要返回的数量
 * 输出：
 * - 返回值：T[]，本次推荐批次数据
 * - 副作用：无
 */
export function pickRecommendationBatch<T>(items: T[], count: number): T[] {
  if (items.length === 0) {
    return []
  }

  const safeCount = Math.max(1, Math.min(items.length, count))
  return shuffleItems(items).slice(0, safeCount)
}
