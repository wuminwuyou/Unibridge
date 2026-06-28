// 01）域节点类型枚举（DomainNodeKind）
export type DomainNodeKind = 'private-chat' | 'team' | 'project' | 'temporary' | 'notification' | 'settings'

// 02）会话类型枚举（ConversationKind）
export type ConversationKind = 'group' | 'direct'

// 03）消息方向枚举（MessageDirection）
export type MessageDirection = 'left' | 'right' | 'system'

// 04）消息文件项类型（MessageFileItem）
export interface MessageFileItem {
  fileName: string; fileSize: number; sha256Hash?: string
}

// 05）域节点数据类型（DomainNode）
export interface DomainNode {
  id: string; kind: DomainNodeKind; label: string; shortLabel?: string
  iconUrl?: string; unread: boolean; unreadCount?: number; isActive?: boolean
  isCircle?: boolean; isDashed?: boolean; hoverShapeTransition?: boolean
}

// 06）会话项数据类型（ConversationItem）
export interface ConversationItem {
  id: string; kind: ConversationKind; title: string; preview?: string
  lastMessageTime?: string; unreadCount: number; isActive?: boolean
  iconUrl?: string; memberCount?: number
}

// 07）消息项数据类型（MessageItem）
export interface MessageItem {
  id: string; sender: string; role: string; time: string
  direction: MessageDirection; content: string; files?: MessageFileItem[]
  isMarkdown?: boolean
}
