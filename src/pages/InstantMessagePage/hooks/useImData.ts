import { useMemo, useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type {
  DomainNode,
  ConversationItem,
  MessageItem,
  ChatSessionHeader,
  ToolItem,
  ImPageState,
} from '../types'

// 01）初始域节点数据工厂（createInitialDomains）
function createInitialDomains(): DomainNode[] {
  return [
    {
      id: 'dm',
      kind: 'team',
      label: '私讯 / 群聊',
      shortLabel: '聊',
      unread: true,
      unreadCount: 1,
    },
    {
      id: 'lab-1',
      kind: 'team',
      label: '人工智能实验室',
      unread: true,
      unreadCount: 3,
    },
    {
      id: 'lab-2',
      kind: 'team',
      label: '机器人创新工坊',
      unread: false,
    },
    {
      id: 'team-1',
      kind: 'team',
      label: '前端开发小组',
      unread: true,
      unreadCount: 1,
    },
    {
      id: 'team-2',
      kind: 'team',
      label: '后端攻坚小组',
      unread: false,
    },
    {
      id: 'project-1',
      kind: 'project',
      label: '企业级大模型部署',
      shortLabel: '企',
      unread: true,
      unreadCount: 5,
      isActive: true,
    },
    {
      id: 'project-2',
      kind: 'project',
      label: '校园二手交易平台',
      shortLabel: '校',
      unread: false,
    },
    {
      id: 'project-3',
      kind: 'project',
      label: '数字校园门户',
      shortLabel: '数',
      unread: true,
      unreadCount: 2,
    },
    {
      id: 'project-4',
      kind: 'project',
      label: '机器人创新控制系统',
      shortLabel: '机',
      unread: false,
    },
    {
      id: 'temp-1',
      kind: 'temporary',
      label: '临时对话',
      shortLabel: '临',
      unread: false,
      isDashed: true,
    },
    {
      id: 'notifications',
      kind: 'notification',
      label: '系统通知',
      unread: true,
      unreadCount: 12,
    },
    {
      id: 'settings',
      kind: 'settings',
      label: '设置',
      unread: false,
    },
  ]
}

// 02）初始对话列表数据工厂（createInitialConversations）
function createInitialConversations(): ConversationItem[] {
  return [
    {
      id: 'conv-1',
      kind: 'group',
      title: '项目合作组',
      preview: '王老师：今晚我们先把接口联调计划敲定',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      memberCount: 32,
    },
    {
      id: 'conv-2',
      kind: 'group',
      title: '前端开发组',
      preview: '张同学：PR 已提交，请 review',
      lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 3,
      isActive: true,
      memberCount: 8,
    },
    {
      id: 'conv-3',
      kind: 'group',
      title: '后端接口联调',
      preview: '李同学：接口文档已更新',
      lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
      unreadCount: 1,
      memberCount: 5,
    },
    {
      id: 'conv-4',
      kind: 'direct',
      title: '王老师',
      preview: '很好，顺带把错误码也补上',
      lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
      unreadCount: 0,
    },
    {
      id: 'conv-5',
      kind: 'direct',
      title: '张同学',
      preview: '收到，我先把字段映射整理成表',
      lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
      unreadCount: 2,
    },
    {
      id: 'conv-6',
      kind: 'direct',
      title: '李同学',
      preview: '任务已完成，请检查',
      lastMessageTime: new Date('2025-01-02').toISOString(),
      unreadCount: 0,
    },
    {
      id: 'conv-7',
      kind: 'group',
      title: '技术方案讨论',
      preview: '架构评审定在周三下午',
      lastMessageTime: new Date(Date.now() - 172800000).toISOString(),
      unreadCount: 0,
      memberCount: 12,
    },
  ]
}

// 03）初始消息列表数据工厂（createInitialMessages）
function createInitialMessages(): MessageItem[] {
  return [
    {
      id: 'm1',
      sender: '王老师',
      role: '导师',
      time: '18:40',
      direction: 'left',
      content: '今晚我们先把接口联调计划敲定，明天上午开始联调。',
    },
    {
      id: 'm2',
      sender: '张同学',
      role: '学生',
      time: '18:41',
      direction: 'right',
      content: '收到，我先把登录与消息列表接口的字段映射整理成表。',
    },
    {
      id: 'm3',
      sender: '系统通知',
      role: '系统',
      time: '18:43',
      direction: 'system',
      content: '李同学 已通过审核加入项目：企业级大模型私有化部署。',
    },
    {
      id: 'm4',
      sender: '王老师',
      role: '导师',
      time: '18:46',
      direction: 'left',
      content: '很好，顺带把错误码也补上，我们明天直接走完整流程。',
    },
    {
      id: 'm5',
      sender: '张同学',
      role: '学生',
      time: '18:48',
      direction: 'right',
      content: '好的，我把常见错误码整理一下，包括 401 鉴权、403 权限、500 服务端异常等。',
    },
    {
      id: 'm6',
      sender: '王老师',
      role: '导师',
      time: '18:50',
      direction: 'left',
      content:
        '另外，**Markdown 格式**的通知也请测试一下渲染效果。\n\n```typescript\ninterface ApiResponse<T> {\n  code: number\n  data: T\n  message: string\n}\n```\n\n> 这是引用的文本格式。',
    },
  ]
}

// 04）初始工具列表数据工厂（createInitialTools）
function createInitialTools(): ToolItem[] {
  return [
    { id: 'meeting', label: '语言会议室', icon: 'video', status: '录制中' },
    { id: 'docs', label: '文档仓库', icon: 'folder-open' },
    { id: 'base', label: '多维表格', icon: 'table' },
    { id: 'milestones', label: '里程碑与任务卡片', icon: 'flag' },
    { id: 'repo', label: '代码仓库', icon: 'git-branch' },
  ]
}

// 05）初始聊天头部数据工厂（createInitialChatHeader）
function createInitialChatHeader(): ChatSessionHeader {
  return {
    title: '前端开发组',
    kind: 'group',
    onlineCount: 6,
    totalCount: 8,
    isProjectDefault: false,
  }
}

// 06）IM 数据管理钩子（useImData）
/**
 * 函数名：useImData
 * 功能：管理 IM 页面的全局 UI 状态，包括域选择、对话选择、搜索过滤等。
 * 实现方法：
 * - 维护域列表、对话列表、消息列表、工具列表的本地状态
 * - 提供域切换、对话切换、搜索、发送消息等操作方法
 * - 使用 useMemo 对搜索结果进行缓存
 * 输入：无
 * 输出：
 * - 返回值：ImPageState + 操作方法集合
 * - 副作用：修改组件状态
 */
export function useImData(): ImPageState & {
  selectDomain: (domainId: string) => void
  selectConversation: (conversationId: string) => void
  setSearchKeyword: (keyword: string) => void
  searchActive: boolean
  setSearchActive: Dispatch<SetStateAction<boolean>>
  sendMessage: (content: string) => void
} {
  const [domains, setDomains] = useState<DomainNode[]>(createInitialDomains)
  const [conversations, setConversations] = useState<ConversationItem[]>(createInitialConversations)
  const [messages, setMessages] = useState<MessageItem[]>(createInitialMessages)
  const [tools] = useState<ToolItem[]>(createInitialTools)
  const [chatHeader, setChatHeader] = useState<ChatSessionHeader>(createInitialChatHeader)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchActive, setSearchActive] = useState(false)

  const activeDomainId = useMemo(
    () => domains.find((d) => d.isActive)?.id ?? null,
    [domains],
  )
  const activeConversationId = useMemo(
    () => conversations.find((c) => c.isActive)?.id ?? null,
    [conversations],
  )

  // 07）过滤后的对话列表（filteredConversations）
  const filteredConversations = useMemo(() => {
    if (!searchKeyword.trim()) return conversations
    const keyword = searchKeyword.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(keyword) ||
        (c.preview && c.preview.toLowerCase().includes(keyword)),
    )
  }, [conversations, searchKeyword])

  // 08）选择域（selectDomain）
  const selectDomain = useCallback((domainId: string) => {
    setDomains((prev) =>
      prev.map((d) => ({ ...d, isActive: d.id === domainId })),
    )
  }, [])

  // 09）选择对话（selectConversation）
  const selectConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        isActive: c.id === conversationId,
        ...(c.id === conversationId ? { unreadCount: 0 } : {}),
      })),
    )
    // 切换对话时更新头部，项目合作组标记为项目默认大群
    const selected = conversations.find((c) => c.id === conversationId)
    if (selected) {
      setChatHeader({
        title: selected.title,
        kind: selected.kind,
        onlineCount: selected.memberCount ? Math.ceil(selected.memberCount * 0.6) : 0,
        totalCount: selected.memberCount,
        isProjectDefault: selected.id === 'conv-1',
      })
    }
  }, [conversations])

  // 10）发送消息（sendMessage）
  const sendMessage = useCallback((content: string) => {
    const newMessage: MessageItem = {
      id: `m-${Date.now()}`,
      sender: '我',
      role: '学生',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      direction: 'right',
      content,
    }
    setMessages((prev) => [...prev, newMessage])
  }, [])

  return {
    domains,
    activeDomainId,
    conversations: filteredConversations,
    activeConversationId,
    chatHeader,
    messages,
    tools,
    searchKeyword,
    searchActive,
    selectDomain,
    selectConversation,
    setSearchKeyword,
    setSearchActive,
    sendMessage,
  }
}
