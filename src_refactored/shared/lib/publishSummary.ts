// 01）发布表单自动摘要最大长度（PUBLISH_AUTO_SUMMARY_MAX_LENGTH）
export const PUBLISH_AUTO_SUMMARY_MAX_LENGTH = 50

// 02）Markdown 转纯文本（stripMarkdownToPlainText）
/**
 * 函数名：stripMarkdownToPlainText
 * 功能：去除 Markdown 语法符号，保留可读纯文本，供自动摘要提取使用。
 * 实现方法：
 * - 依次处理代码块、链接/图片、标题、引用、列表等常见语法
 * - 去除 HTML 标签与残留 Markdown 符号
 * - 行内空白合并为空格，保留换行供句界识别
 * 输入：
 * - markdown：Markdown 或混合文本
 * 输出：
 * - 返回值：纯文本字符串
 * - 副作用：无
 */
export function stripMarkdownToPlainText(markdown: string): string {
  let text = markdown

  text = text.replace(/```[\s\S]*?```/g, '\n')
  text = text.replace(/~~~[\s\S]*?~~~/g, '\n')
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/^>\s?/gm, '')
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')
  text = text.replace(/~~(.*?)~~/g, '$1')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/^[-*_]{3,}\s*$/gm, '\n')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/[#*`~>|\\[\](){}!]/g, ' ')

  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

// 03）判断是否为句界字符（isSentenceBoundaryChar）
function isSentenceBoundaryChar(char: string): boolean {
  return char === '。' || char === '.' || char === '\n'
}

// 04）将纯文本拆分为完整句子（splitPlainTextIntoSentences）
/**
 * 函数名：splitPlainTextIntoSentences
 * 功能：按中文句号、英文句号与换行将纯文本拆成完整句子片段。
 * 输入：
 * - plainText：已去 Markdown 的纯文本
 * 输出：
 * - 返回值：句子数组
 * - 副作用：无
 */
function splitPlainTextIntoSentences(plainText: string): string[] {
  const sentences: string[] = []
  let buffer = ''

  for (const char of plainText) {
    buffer += char
    if (isSentenceBoundaryChar(char)) {
      const trimmed = buffer.trim()
      if (trimmed) {
        sentences.push(trimmed)
      }
      buffer = ''
    }
  }

  const trailing = buffer.trim()
  if (trailing) {
    sentences.push(trailing)
  }

  return sentences
}

// 05）在句界处截断超长文本（truncateAtSentenceBoundary）
/**
 * 函数名：truncateAtSentenceBoundary
 * 功能：将文本限制在 maxLength 内，优先在句界字符处截断以保持完整句意。
 * 输入：
 * - text：待截断文本
 * - maxLength：最大字符数
 * 输出：
 * - 返回值：截断后的文本
 * - 副作用：无
 */
function truncateAtSentenceBoundary(text: string, maxLength: number): string {
  const normalized = text.trim()
  if (!normalized || normalized.length <= maxLength) {
    return normalized
  }

  const slice = normalized.slice(0, maxLength)
  let lastBoundaryIndex = -1

  for (let index = 0; index < slice.length; index += 1) {
    if (isSentenceBoundaryChar(slice[index] ?? '')) {
      lastBoundaryIndex = index
    }
  }

  if (lastBoundaryIndex >= 0) {
    return slice.slice(0, lastBoundaryIndex + 1).trim()
  }

  return slice.trim()
}

// 06）从 Markdown 内容提取自动摘要（extractAutoSummaryFromMarkdown）
/**
 * 函数名：extractAutoSummaryFromMarkdown
 * 功能：过滤 Markdown 后按句连续拼接简介，最多 maxLength 字，在句界处截断。
 * 实现方法：
 * - 先 stripMarkdownToPlainText 得到纯文本
 * - 按 `。`、`.`、换行拆句
 * - 逐句累加直至达到字数上限；单句超长时在句界内截断
 * 输入：
 * - content：Markdown 正文
 * - maxLength：最大字符数，默认 50
 * 输出：
 * - 返回值：自动摘要；无有效文字时为 ''
 * - 副作用：无
 */
export function extractAutoSummaryFromMarkdown(
  content: string,
  maxLength = PUBLISH_AUTO_SUMMARY_MAX_LENGTH,
): string {
  const plainText = stripMarkdownToPlainText(content)
  if (!plainText) {
    return ''
  }

  const sentences = splitPlainTextIntoSentences(plainText)
  if (sentences.length === 0) {
    return truncateAtSentenceBoundary(plainText, maxLength)
  }

  let summary = ''

  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      if (!summary) {
        return truncateAtSentenceBoundary(sentence, maxLength)
      }
      break
    }

    const candidate = summary ? `${summary}${sentence}` : sentence
    if (candidate.length <= maxLength) {
      summary = candidate
      continue
    }

    break
  }

  if (summary) {
    return summary
  }

  return truncateAtSentenceBoundary(plainText, maxLength)
}

// 07）解析发布项目/图文笔记简介（resolvePublishSummary）
/**
 * 函数名：resolvePublishSummary
 * 功能：优先使用用户填写的简介；为空时从 Markdown 正文按句自动提取（最多 50 字）。
 * 输入：
 * - manualSummary：表单简介字段
 * - contentMarkdown：Markdown 正文（项目需求说明或图文笔记正文）
 * 输出：
 * - 返回值：最终简介字符串
 * - 副作用：无
 */
export function resolvePublishSummary(manualSummary: string, contentMarkdown: string): string {
  const trimmedSummary = manualSummary.trim()
  if (trimmedSummary) {
    return trimmedSummary
  }

  return extractAutoSummaryFromMarkdown(contentMarkdown)
}

// 08）解析发布笔记简介（resolvePublishNoteSummary）
/**
 * 函数名：resolvePublishNoteSummary
 * 功能：解析笔记简介；图文笔记可从正文自动提取，视频笔记简介可选。
 * 实现方法：
 * - 已填写简介时直接使用
 * - 图文笔记从 Markdown 正文按句提取
 * - 视频笔记仅从视频简介字段按句提取（不强制）
 * 输入：
 * - manualSummary：表单简介字段
 * - contentType：笔记内容类型
 * - bodyMarkdown：图文正文 Markdown
 * - videoDescription：视频简介文本
 * 输出：
 * - 返回值：最终简介字符串（可为空）
 * - 副作用：无
 */
export function resolvePublishNoteSummary(
  manualSummary: string,
  contentType: '图文' | '视频',
  bodyMarkdown: string,
  videoDescription: string,
): string {
  const trimmedSummary = manualSummary.trim()
  if (trimmedSummary) {
    return trimmedSummary
  }

  if (contentType === '视频') {
    return extractAutoSummaryFromMarkdown(videoDescription)
  }

  return extractAutoSummaryFromMarkdown(bodyMarkdown)
}
