// 01）笔记摘要框（NoteSummaryBox）

// 02）摘要框 Props
interface NoteSummaryBoxProps {
  summary: string
}

// 03）摘要框组件
/**
 * 函数名：NoteSummaryBox
 * 功能：渲染笔记摘要描述框，空字符串时不渲染。
 * 输入：
 * - summary：摘要文本
 * 输出：
 * - 返回值：React 节点
 */
export function NoteSummaryBox({ summary }: NoteSummaryBoxProps) {
  if (!summary.trim()) {
    return null
  }

  return (
    <div className="mt-4 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50">
      <p className="m-0 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {summary}
      </p>
    </div>
  )
}
