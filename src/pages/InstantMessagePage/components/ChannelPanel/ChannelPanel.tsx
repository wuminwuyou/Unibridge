import { useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import type { ConversationItem, ToolItem } from '../../types'
import ChannelItem from './ChannelItem'

// 01）频道面板 Props（ChannelPanelProps）
export interface ChannelPanelProps {
  domainName: string
  conversations: ConversationItem[]
  tools: ToolItem[]
  searchActive: boolean
  /** 搜索过滤关键词 */
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  onToggleSearch: () => void
  onSelectConversation: (conversationId: string) => void
}

// 02）频道面板组件（ChannelPanel）
/**
 * 函数名：ChannelPanel
 * 功能：渲染中间栏频道分组与管理工具集成面板。
 * 实现方法：
 * - 顶部展示当前域名称、搜索按钮（左侧）与新建对话按钮（右侧），高度与左右栏对齐
 * - 点击搜索按钮展开内联搜索输入框
 * - 中部使用 ChannelItem 渲染群组/私讯对话列表
 * - 底部通过分割线分隔，展示项目与实验室管理工具
 * - 宽度使用 clamp(240px, 18vw, 360px) 动态适配
 * 输入：
 * - domainName：当前域名
 * - conversations：对话列表
 * - tools：工具列表
 * - searchActive：搜索是否激活
 * - searchKeyword：搜索关键词
 * - onSearchChange：搜索变更回调
 * - onToggleSearch：切换搜索激活状态回调
 * - onSelectConversation：对话选中回调
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function ChannelPanel({
  domainName,
  conversations,
  tools,
  searchActive,
  searchKeyword,
  onSearchChange,
  onToggleSearch,
  onSelectConversation,
}: ChannelPanelProps) {
  const groupConversations = useMemo(
    () => conversations.filter((c) => c.kind === 'group'),
    [conversations],
  )
  const directConversations = useMemo(
    () => conversations.filter((c) => c.kind === 'direct'),
    [conversations],
  )

  return (
    <aside className="channel-panel" aria-label="频道与工具面板">
      <div className="channel-panel__header">
        <div className="channel-panel__header-row">
          <h2 className="channel-panel__domain-name">{domainName}</h2>
          <div className="channel-panel__header-actions">
            <button
              type="button"
              className={`channel-panel__search-btn ${searchActive ? 'channel-panel__search-btn--active' : ''}`}
              onClick={onToggleSearch}
              title="搜索对话或消息"
              aria-label="搜索对话或消息"
            >
              <Search size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="channel-panel__new-btn"
              title="新建对话"
              aria-label="新建对话"
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {searchActive ? (
          <div className="channel-panel__search-inline">
            <input
              type="text"
              className="channel-panel__search-inline-input"
              placeholder="搜索对话或消息..."
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              aria-label="搜索对话或消息"
            />
          </div>
        ) : null}
      </div>

      <div className="channel-panel__body">
        <div className="channel-panel__conversation-list">
          {groupConversations.length > 0 ? (
            <div className="channel-panel__section">
              <p className="channel-panel__section-title">群组</p>
              {groupConversations.map((conv) => (
                <ChannelItem
                  key={conv.id}
                  conversation={conv}
                  onClick={onSelectConversation}
                />
              ))}
            </div>
          ) : null}

          {directConversations.length > 0 ? (
            <div className="channel-panel__section">
              <p className="channel-panel__section-title">私讯</p>
              {directConversations.map((conv) => (
                <ChannelItem
                  key={conv.id}
                  conversation={conv}
                  onClick={onSelectConversation}
                />
              ))}
            </div>
          ) : null}

          {conversations.length === 0 ? (
            <p className="channel-panel__empty">暂无匹配的对话</p>
          ) : null}
        </div>

        {tools.length > 0 ? (
          <div className="channel-panel__tools">
            <div className="channel-panel__divider" aria-hidden="true" />
            <div className="channel-panel__tools-list">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  className="channel-panel__tool-item"
                  title={tool.label}
                >
                  <span className="channel-panel__tool-icon">{getToolIcon(tool.id)}</span>
                  <span className="channel-panel__tool-label">{tool.label}</span>
                  {tool.status ? (
                    <span className="channel-panel__tool-status">{tool.status}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

// 03）工具图标映射（getToolIcon）
function getToolIcon(toolId: string): string {
  const iconMap: Record<string, string> = {
    meeting: '\uD83C\uDFA5',
    docs: '\uD83D\uDCC1',
    base: '\uD83D\uDCCA',
    milestones: '\uD83C\uDFC1',
    repo: '\uD83D\uDD00',
  }
  return iconMap[toolId] ?? '\uD83D\uDD27'
}

export default ChannelPanel
