// 01）页面滚动容器（markdownReaderScrollElement）
export const markdownReaderScrollElement: HTMLElement | string =
  typeof document !== 'undefined' ? document.documentElement : 'html'

// 02）生成标题锚点 id（createMarkdownHeadingId）
/**
 * 函数名：createMarkdownHeadingId
 * 功能：为 MdPreview / MdCatalog 生成稳定且可读的标题锚点 id。
 * 输入：
 * - params：标题文本、层级与序号
 * 输出：
 * - 返回值：DOM id 字符串
 */
export function createMarkdownHeadingId(params: { text: string; level: number; index: number }): string {
  const slug = params.text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
  const base = slug || `heading-${params.index}`
  return `md-heading-${params.level}-${base}-${params.index}`
}
