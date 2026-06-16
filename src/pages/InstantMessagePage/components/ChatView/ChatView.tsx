import { useRef, useEffect } from 'react'
import { Search, Video, UserPlus, CheckSquare, MoreHorizontal } from 'lucide-react'
import type { MessageItem, ChatSessionHeader } from '../../types'
import MessageItemView from './MessageItemView'
import { MessageTimeDivider } from './MessageTimeDivider'

export interface ChatViewProps {
  chatHeader: ChatSessionHeader | null
  messages: MessageItem[]
  onSearchMessages?: () => void
  onStartMeeting?: () => void
  onAddMember?: () => void
  onOpenTasks?: () => void
}

export function ChatView({
  chatHeader,
  messages,
  onSearchMessages,
  onStartMeeting,
  onAddMember,
  onOpenTasks,
}: ChatViewProps) {
  const flowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (flowRef.current) {
      flowRef.current.scrollTop = flowRef.current.scrollHeight
    }
  }, [messages])

  const isGroup = chatHeader?.kind === 'group'
  const isProjectDefault = chatHeader?.isProjectDefault ?? false

  return (
    <section className="chat-view" aria-label="聊天主看板">
      {chatHeader ? (
        <header className="chat-view__header">
          <div className="chat-view__header-info">
            <h3 className="chat-view__title">
              {isGroup ? (
                <span className="chat-view__kind-indicator"># </span>
              ) : null}
              {chatHeader.title}
            </h3>
            {chatHeader.onlineCount != null || chatHeader.totalCount != null ? (
              <p className="chat-view__status">
                {chatHeader.onlineCount != null ? (
                  <span className="chat-view__online">
                    <span className="chat-view__online-dot" aria-hidden="true" />
                    {chatHeader.onlineCount} 人在线
                  </span>
                ) : null}
                {chatHeader.totalCount != null ? (
                  <span className="chat-view__total">
                    {chatHeader.onlineCount != null ? ' / ' : ''}
                    {chatHeader.totalCount} 位成员
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="chat-view__header-actions">
            <button
              type="button"
              className="chat-view__action-btn"
              title="搜索会话内容"
              aria-label="搜索会话内容"
              onClick={onSearchMessages}
            >
              <Search size={16} strokeWidth={1.5} />
            </button>

            {isGroup ? (
              <>
                <button
                  type="button"
                  className="chat-view__action-btn"
                  title="发起视频会议"
                  aria-label="发起视频会议"
                  onClick={onStartMeeting}
                >
                  <Video size={16} strokeWidth={1.5} />
                </button>

                {!isProjectDefault ? (
                  <button
                    type="button"
                    className="chat-view__action-btn"
                    title="添加群组成员"
                    aria-label="添加群组成员"
                    onClick={onAddMember}
                  >
                    <UserPlus size={16} strokeWidth={1.5} />
                  </button>
                ) : null}

                <button
                  type="button"
                  className="chat-view__action-btn"
                  title="群成员任务"
                  aria-label="群成员任务"
                  onClick={onOpenTasks}
                >
                  <CheckSquare size={16} strokeWidth={1.5} />
                </button>
              </>
            ) : null}

            <button
              type="button"
              className="chat-view__action-btn"
              title="更多"
              aria-label="更多选项"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </button>
          </div>
        </header>
      ) : null}

      <div className="chat-view__flow" ref={flowRef}>
        {messages.length === 0 ? (
          <div className="chat-view__empty">
            <p className="chat-view__empty-text">暂无消息</p>
            <p className="chat-view__empty-hint">开始一段对话吧</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const previous = idx > 0 ? messages[idx - 1] : null
            return (
              <div key={msg.id} className="chat-view__message-group">
                <MessageTimeDivider current={msg} previous={previous} />
                <MessageItemView message={msg} />
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export default ChatView
