import { BookOpenText, FolderKanban, type LucideIcon } from 'lucide-react'

// 01）发布入口类型（PublishEntryType）
export type PublishEntryType = 'project' | 'note'

// 02）发布入口菜单项（PublishEntryMenuOption）
export interface PublishEntryMenuOption {
  type: PublishEntryType
  label: string
  description: string
  path: string
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
