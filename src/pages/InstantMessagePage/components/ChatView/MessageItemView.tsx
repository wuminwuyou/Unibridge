import type { MessageItem } from '../../types'
import type { ReactNode } from 'react'

// 01）消息项 Props（MessageItemProps）
interface MessageItemProps {
  message: MessageItem
}

// 02）消息项组件（MessageItemView）
/**
 * 函数名：MessageItemView
 * 功能：渲染单条消息气泡，按方向区分系统消息/接收消息/发送消息样式。
 * 实现方法：
 * - system 消息居中展示，带虚线边框
 * - left 消息左对齐，深色气泡
 * - right 消息右对齐，蓝色气泡
 * - 显示发送者名称、身份标签、时间
 * - 若有附件，显示文件卡片与 SHA-256 指纹
 * 输入：
 * - message：消息数据
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function MessageItemView({ message }: MessageItemProps) {
  if (message.direction === 'system') {
    return (
      <article className="msg-item msg-item--system" aria-label={`系统消息：${message.content}`}>
        <p className="msg-item__system-text">{message.content}</p>
      </article>
    )
  }

  const isRight = message.direction === 'right'

  return (
    <article
      className={`msg-item ${isRight ? 'msg-item--right' : 'msg-item--left'}`}
      aria-label={`${message.sender}：${message.content}`}
    >
      {!isRight ? (
        <div className="msg-item__avatar" aria-hidden="true">
          <span className="msg-item__avatar-text">
            {message.sender[0]}
          </span>
        </div>
      ) : null}

      <div className={`msg-item__body ${isRight ? 'msg-item__body--right' : ''}`}>
        <div className="msg-item__meta">
          <span className="msg-item__sender">{message.sender}</span>
          {message.role ? (
            <span className="msg-item__role">{message.role}</span>
          ) : null}
          <time className="msg-item__time">{message.time}</time>
        </div>

        <div className={`msg-item__bubble ${isRight ? 'msg-item__bubble--right' : ''}`}>
          {message.isMarkdown ? (
            <div className="msg-item__prose prose prose-sm prose-invert max-w-none">
              {renderMarkdownContent(message.content)}
            </div>
          ) : (
            <p className="msg-item__text">{message.content}</p>
          )}

          {message.files && message.files.length > 0 ? (
            <div className="msg-item__files">
              {message.files.map((file, idx) => (
                <div key={idx} className="msg-item__file-card">
                  <span className="msg-item__file-name">{file.fileName}</span>
                  <span className="msg-item__file-size">
                    {formatFileSize(file.fileSize)}
                  </span>
                  {file.sha256Hash ? (
                    <span className="msg-item__file-hash" title={`SHA-256: ${file.sha256Hash}`}>
                      {computeShortHash(file.sha256Hash)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {isRight ? (
        <div className="msg-item__avatar" aria-hidden="true">
          <span className="msg-item__avatar-text msg-item__avatar-text--self">
            我
          </span>
        </div>
      ) : null}
    </article>
  )
}

// 03）文件大小格式化（formatFileSize）
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 04）短哈希指纹展示（computeShortHash）
function computeShortHash(hash: string): string {
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

// 05）Markdown 内容简单渲染（renderMarkdownContent）
function renderMarkdownContent(content: string): ReactNode {
  const lines = content.split('\n')
  const elements: ReactNode[] = []
  let codeBlock = false
  let codeContent = ''
  let codeLang = ''

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (codeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="msg-item__code-block">
            <code>{codeContent}</code>
          </pre>,
        )
        codeContent = ''
        codeBlock = false
      } else {
        codeBlock = true
        codeLang = line.slice(3).trim()
      }
      return
    }

    if (codeBlock) {
      codeContent += (codeContent ? '\n' : '') + line
      return
    }

    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`bq-${i}`} className="msg-item__quote">
          {line.slice(2)}
        </blockquote>,
      )
      return
    }

    if (line.startsWith('**') && line.includes('**')) {
      const match = line.match(/\*\*(.+?)\*\*/)
      if (match) {
        const parts = line.split('**')
        elements.push(
          <p key={`p-${i}`} className="msg-item__text">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
            )}
          </p>,
        )
        return
      }
    }

    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="msg-item__text">
          {line}
        </p>,
      )
    }
  })

  if (elements.length === 0) {
    elements.push(
      <p key="fallback" className="msg-item__text">
        {content}
      </p>,
    )
  }

  return <>{elements}</>
}

export default MessageItemView
