import { ProjectContentReader } from './ProjectContentReader'
import type { ProjectContentReaderProps } from './ProjectContentReader'

// 01）笔记正文阅读器 Props（NoteContentReaderProps）
export type NoteContentReaderProps = ProjectContentReaderProps

// 02）笔记正文阅读器（NoteContentReader）
/**
 * 函数名：NoteContentReader
 * 功能：笔记详情正文阅读器，复用 ProjectContentReader 的模式绑定渲染逻辑。
 * 输入：
 * - contentLongtext：保存时的模式 + longtext
 * 输出：
 * - 返回值：React 节点
 */
export function NoteContentReader(props: NoteContentReaderProps) {
  return <ProjectContentReader {...props} />
}
