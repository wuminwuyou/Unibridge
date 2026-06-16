import type { ConversationItem } from '../../types'
import { getRelativeTimeDisplay } from './utils'

// 01）对话项 Props（ChannelItemProps）
export interface ChannelItemProps {
  conversation: ConversationItem
  onClick: (id: string) => void
}

// 02）对话项组件（ChannelItem）
/**
 * 函数名：ChannelItem
 * 功能：渲染单个对话列表项卡片，支持群组（方形图标）/私讯（圆形头像）视觉区分。
 * 实现方法：
 * - 圆角卡片设计，悬停时加深阴影
 * - 选中态显示边框描边激活效果
 * - 右侧绝对显示最新消息日期（智能格式化）
 * - 标题下方单行文本预览，标题过长时自动截断
 * - 未读消息显示红底计数徽章
 * 输入：
 * - conversation：对话数据
 * - onClick：点击回调
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function ChannelItem({ conversation, onClick }: ChannelItemProps) {
  const isActive = conversation.isActive ?? false
  const isDirect = conversation.kind === 'direct'

  return (
    <button
      type="button"
      className={`channel-item ${isActive ? 'channel-item--active' : ''}`}
      onClick={() => onClick(conversation.id)}
      aria-label={`${conversation.title}${conversation.preview ? `，最近消息：${conversation.preview}` : ''}`}
    >
      <div className={`channel-item__avatar ${isDirect ? 'channel-item__avatar--circle' : ''}`}>
        {conversation.iconUrl ? (
          <img src={conversation.iconUrl} alt="" className="channel-item__avatar-img" />
        ) : (
          <span className="channel-item__avatar-text">
            {conversation.title[0]}
          </span>
        )}
      </div>

      <div className="channel-item__body">
        <div className="channel-item__header">
          <span className="channel-item__title" title={conversation.title}>
            {conversation.title}
          </span>
          {conversation.lastMessageTime ? (
            <span className="channel-item__time">
              {getRelativeTimeDisplay(conversation.lastMessageTime)}
            </span>
          ) : null}
        </div>

        <div className="channel-item__footer">
          {conversation.preview ? (
            <span className="channel-item__preview">{conversation.preview}</span>
          ) : null}

          {conversation.unreadCount > 0 ? (
            <span className="channel-item__badge">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

export default ChannelItem
