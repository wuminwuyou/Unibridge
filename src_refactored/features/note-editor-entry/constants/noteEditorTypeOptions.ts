// 01）笔记编辑路由类型（NoteEditorRouteType）
import type { LucideIcon } from 'lucide-react'
import { FileText, Video } from 'lucide-react'

/** 编辑页 query `type` 取值 */
export type NoteEditorRouteType = 'article' | 'video'

// 02）类型选择卡片选项（NoteEditorTypeOption）
export interface NoteEditorTypeOption {
  type: NoteEditorRouteType
  label: string
  description: string
  icon: LucideIcon
}

// 03）类型选择列表（noteEditorTypeOptions）
export const noteEditorTypeOptions: NoteEditorTypeOption[] = [
  {
    type: 'article',
    label: '图文笔记',
    description: 'Markdown 图文编辑器，适合教程、博客、文档',
    icon: FileText,
  },
  {
    type: 'video',
    label: '视频笔记',
    description: '上传或链接视频，适合课程、讲解、演示',
    icon: Video,
  },
]
