import { useState } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'

// 01）消息输入区 Props（MessageInputProps）
export interface MessageInputProps {
  onSend: (content: string) => void
}

// 02）消息输入区组件（MessageInput）
/**
 * 函数名：MessageInput
 * 功能：渲染多功能富文本输入区，集成附件、表情与发送按钮。
 * 实现方法：
 * - 使用受控 input 管理输入状态
 * - 点击发送或按下 Enter（非 Shift）提交消息
 * - 左侧预留附件按钮、右侧表情按钮与发送按钮
 * - 发送后自动清空输入并聚焦
 * 输入：
 * - onSend：发送消息回调
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：修改组件状态
 */
export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <footer className="msg-input" aria-label="消息输入区">
      <button
        type="button"
        className="msg-input__attach-btn"
        title="发送附件"
        aria-label="发送附件"
      >
        <Paperclip size={18} strokeWidth={1.5} />
      </button>

      <input
        type="text"
        className="msg-input__field"
        placeholder="输入消息内容..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="消息输入框"
        autoFocus
      />

      <button
        type="button"
        className="msg-input__emoji-btn"
        title="表情"
        aria-label="表情"
      >
        <Smile size={18} strokeWidth={1.5} />
      </button>

      <button
        type="button"
        className="msg-input__send-btn"
        onClick={handleSend}
        disabled={!text.trim()}
        aria-label="发送消息"
      >
        <Send size={16} strokeWidth={1.5} />
        <span className="msg-input__send-text">发送</span>
      </button>
    </footer>
  )
}

export default MessageInput
