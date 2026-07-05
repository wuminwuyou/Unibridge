// 01）Markdown 内容大厅外层皮囊（MARKDOWN_CONTENT_SHELL_CLASSES）
/** 编辑器 / 阅读器共用的最外层容器：白底 · 暗色 zinc-800 · 边框 · 圆角 */
export const MARKDOWN_CONTENT_SHELL_CLASSES =
  'markdown-content-shell rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-auto'

// 02）Markdown 阅读器外层皮囊（MARKDOWN_READER_SHELL_CLASSES）
/** 阅读器在共用皮囊上追加内边距，与编辑器 Milkdown 内边距视觉对齐；禁止横向滚动 */
export const MARKDOWN_READER_SHELL_CLASSES = [
  'markdown-content-shell',
  'rounded-xl border border-zinc-200 dark:border-zinc-700',
  'bg-white dark:bg-zinc-800',
  'overflow-x-hidden overflow-y-auto',
  'p-5 sm:p-6',
].join(' ')

// 03）Markdown Prose 排版矩阵（MARKDOWN_PROSE_CLASSES）
/** Milkdown / MdPreview 包裹层统一 Typography 矩阵，消除两端色差 */
export const MARKDOWN_PROSE_CLASSES = [
  'markdown-content-prose',
  'prose dark:prose-invert max-w-none',
  'prose-headings:text-gray-950 dark:prose-headings:text-white',
  'prose-p:text-gray-800 dark:prose-p:text-zinc-200',
  'prose-li:text-gray-800 dark:prose-li:text-zinc-200',
  'prose-strong:text-gray-900 dark:prose-strong:text-zinc-100',
  'prose-a:text-blue-600 dark:prose-a:text-blue-400',
].join(' ')
