// 01）发布入口菜单常量（publishMenuOptions）
import { BookOpenText, FolderKanban, ListTodo, Ticket } from 'lucide-react'
import { PROJECTS_CREATE_PATH } from '@shared/lib/projectRoutes'

// 02）发布入口类型（PublishEntryType）
export type PublishEntryType = 'project' | 'note' | 'code-generate' | 'code-manage'

// 03）发布菜单项（PublishMenuOption）
export interface PublishMenuOption {
  type: PublishEntryType
  label: string
  description: string
  path?: string
  icon: typeof FolderKanban
}

// 04）默认发布菜单（publishEntryMenuOptions）
export const publishEntryMenuOptions: PublishMenuOption[] = [
  {
    type: 'project',
    label: '发布项目',
    description: '创建并发布新的项目需求',
    path: PROJECTS_CREATE_PATH,
    icon: FolderKanban,
  },
  {
    type: 'note',
    label: '发布笔记',
    description: '撰写并分享图文或视频笔记',
    icon: BookOpenText,
  },
]

// 05）认证子码菜单（codeMenuOptions）
export const codeMenuOptions: PublishMenuOption[] = [
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
