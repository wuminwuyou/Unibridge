import { useId } from 'react'

// 01）Markdown 阅读器 id Hook（useMarkdownReaderId）
/**
 * 函数名：useMarkdownReaderId
 * 功能：生成与 MdPreview / MdCatalog 配对的唯一 editorId。
 * 输出：
 * - 返回值：string，可作为 MdPreview id 与 MdCatalog editorId
 */
export function useMarkdownReaderId(): string {
  const reactId = useId()
  return `reader-${reactId.replace(/:/g, '')}`
}
