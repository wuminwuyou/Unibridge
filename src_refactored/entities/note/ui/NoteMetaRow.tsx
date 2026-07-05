// 01）笔记元信息行（NoteMetaRow）

// 02）元信息行 Props
interface NoteMetaRowProps {
  publishTime: string
  updateTime: string
}

// 03）格式化时间为 yyyy-MM-dd HH:mm（formatDisplayTime）
function formatDisplayTime(dateTime: string): string {
  const normalized = dateTime.replace('T', ' ').trim()
  if (!normalized) {
    return ''
  }
  return normalized.slice(0, 16)
}

// 04）元信息行组件
/**
 * 函数名：NoteMetaRow
 * 功能：渲染「发布于… · 修改于…」时间行。
 * 输入：
 * - publishTime：发布时间
 * - updateTime：修改时间（与发布时间相同则不显示「修改于」）
 * 输出：
 * - 返回值：React 节点
 */
export function NoteMetaRow({ publishTime, updateTime }: NoteMetaRowProps) {
  const publishDisplay = formatDisplayTime(publishTime)
  const updateDisplay = formatDisplayTime(updateTime)
  const showUpdate = updateDisplay && updateDisplay !== publishDisplay

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-zinc-400 dark:text-zinc-500">
      {publishDisplay ? (
        <time dateTime={publishTime}>
          发布于 {publishDisplay}
        </time>
      ) : null}
      {showUpdate ? (
        <>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <time dateTime={updateTime}>
            修改于 {updateDisplay}
          </time>
        </>
      ) : null}
    </div>
  )
}
