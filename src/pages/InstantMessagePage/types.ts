// 01）域节点类型枚举（DomainNodeKind）
export type DomainNodeKind = 'private-chat' | 'team' | 'project' | 'temporary' | 'notification' | 'settings'

// 02）会话类型枚举（ConversationKind）
export type ConversationKind = 'group' | 'direct'

// 03）消息方向枚举（MessageDirection）
export type MessageDirection = 'left' | 'right' | 'system'

// 04）消息文件项类型（MessageFileItem）
export interface MessageFileItem {
  /** 文件名 */
  fileName: string
  /** 文件大小（bytes） */
  fileSize: number
  /** SHA-256 哈希指纹（司法级留档） */
  sha256Hash?: string
}

// 05）域节点数据类型（DomainNode）
export interface DomainNode {
  id: string
  kind: DomainNodeKind
  /** 域全称（悬浮气泡展示） */
  label: string
  /** 图标短文本（如项目首字、私聊图标） */
  shortLabel?: string
  /** 图标图片 URL（团队/项目头像） */
  iconUrl?: string
  /** 是否未读 */
  unread: boolean
  /** 未读消息计数 */
  unreadCount?: number
  /** 是否选中激活 */
  isActive?: boolean
  /** 是否为圆形（私聊头像） */
  isCircle?: boolean
  /** 是否为虚线边框（临时对话） */
  isDashed?: boolean
  /** 悬停时形状切换（私聊/群聊创建按钮） */
  hoverShapeTransition?: boolean
}

// 06）会话项数据类型（ConversationItem）
export interface ConversationItem {
  id: string
  /** 会话类型：群组 / 私讯 */
  kind: ConversationKind
  /** 会话标题 */
  title: string
  /** 最新消息预览文本 */
  preview?: string
  /** 最新消息日期（ISO 8601 格式） */
  lastMessageTime?: string
  /** 未读消息计数 */
  unreadCount: number
  /** 是否选中激活 */
  isActive?: boolean
  /** 图标 URL（群组用方形，私讯用圆形头像） */
  iconUrl?: string
  /** 会话成员数 */
  memberCount?: number
}

// 07）消息项数据类型（MessageItem）
export interface MessageItem {
  id: string
  /** 发送者显示名称 */
  sender: string
  /** 发送者身份标识 */
  role: string
  /** 发送时间（HH:mm 格式） */
  time: string
  /** 消息方向 */
  direction: MessageDirection
  /** 消息正文内容 */
  content: string
  /** 文件附件列表 */
  files?: MessageFileItem[]
  /** 是否为 Markdown 格式 */
  isMarkdown?: boolean
}

// 08）聊天会话头部信息类型（ChatSessionHeader）
export interface ChatSessionHeader {
  /** 会话名称 */
  title: string
  /** 会话类型 */
  kind: ConversationKind
  /** 在线成员数 */
  onlineCount?: number
  /** 总成员数 */
  totalCount?: number
  /** 是否为项目默认大群（项目大群不显示添加成员按钮） */
  isProjectDefault?: boolean
}

// 09）工具项数据类型（ToolItem）
export interface ToolItem {
  id: string
  /** 工具名 */
  label: string
  /** 工具图标（lucide-react 图标名） */
  icon: string
  /** 工具状态（如会议录制中） */
  status?: string
}

// 10）IM 页面全局状态类型（ImPageState）
export interface ImPageState {
  /** 左侧域节点列表 */
  domains: DomainNode[]
  /** 当前激活域 ID */
  activeDomainId: string | null
  /** 中栏对话列表 */
  conversations: ConversationItem[]
  /** 当前激活对话 ID */
  activeConversationId: string | null
  /** 当前对话头部信息 */
  chatHeader: ChatSessionHeader | null
  /** 右栏消息列表 */
  messages: MessageItem[]
  /** 工具列表 */
  tools: ToolItem[]
  /** 搜索关键词 */
  searchKeyword: string
}
