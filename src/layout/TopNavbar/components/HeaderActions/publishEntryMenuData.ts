import { BookOpenText, FolderKanban, Ticket, ListTodo, type LucideIcon } from 'lucide-react'

// 01）发布入口类型（PublishEntryType）
export type PublishEntryType = 'project' | 'note' | 'code-generate' | 'code-manage'

// 02）发布入口菜单项（PublishEntryMenuOption）
export interface PublishEntryMenuOption {
  type: PublishEntryType
  label: string
  description: string
  path?: string
  icon: LucideIcon
}

// 03）发布入口菜单配置（publishEntryMenuOptions）
export const publishEntryMenuOptions: PublishEntryMenuOption[] = [
  {
    type: 'project',
    label: '发布项目',
    description: '创建并发布新的项目需求',
    path: '/publish/project',
    icon: FolderKanban,
  },
  {
    type: 'note',
    label: '发布笔记',
    description: '撰写并分享图文或视频笔记',
    path: '/publish/note',
    icon: BookOpenText,
  },
]

// 04）认证码菜单项（辅导员发布入口专用）（codeMenuOptions）
export const codeMenuOptions: PublishEntryMenuOption[] = [
  {
    type: 'code-generate',
    label: '生成认证子码',
    description: '创建新的子码',
    icon: Ticket,
  },
  {
    type: 'code-manage',
    label: '认证子码管理',
    description: '查看、停用、延期认证子码',
    icon: ListTodo,
  },
]
