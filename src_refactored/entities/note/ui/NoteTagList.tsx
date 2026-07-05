// 01）笔记标签列表（NoteTagList）

// 02）标签列表 Props
interface NoteTagListProps {
  tags: string[]
}

// 03）标签列表组件
/**
 * 函数名：NoteTagList
 * 功能：渲染 #tag 标签列表，空数组时不渲染。
 * 输入：
 * - tags：标签字符串数组
 * 输出：
 * - 返回值：React 节点
 */
export function NoteTagList({ tags }: NoteTagListProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-4" aria-label="话题标签">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-block rounded-full border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400"
        >
          #{tag}
        </span>
      ))}
    </div>
  )
}
