import { useImData } from './hooks/useImData'
import { useCallback } from 'react'
import { DomainBar } from './components/DomainBar/DomainBar'
import { ChannelPanel } from './components/ChannelPanel/ChannelPanel'
import { ChatView } from './components/ChatView/ChatView'
import { MessageInput } from './components/MessageInput/MessageInput'
import './components/DomainBar/DomainBar.css'
import './components/ChannelPanel/ChannelPanel.css'
import './components/ToolPanel/ToolPanel.css'
import './components/ChatView/ChatView.css'
import './components/MessageInput/MessageInput.css'
import './InstantMessagePage.css'

// 01）即时通讯页面组件（InstantMessagePage）
/**
 * 函数名：InstantMessagePage
 * 功能：渲染完整的 IM 三栏式页面，支持多域导航、频道对话管理、消息收发。
 * 实现方法：
 * - 使用 useImData 钩子管理全局 UI 状态
 * - 三栏 Flex 布局：DomainBar（左） | ChannelPanel（中） | ChatView + MessageInput（右）
 * - 隐藏顶部导航栏，最大化垂直工作空间
 * - 通过 DomainBar onSelectDomain 切换域，ChannelPanel onSelectConversation 切换对话
 * - MessageInput onSend 发送新消息
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element，即时通讯页面结构
 * - 副作用：管理组件内部状态
 */
function InstantMessagePage() {
  const {
    domains,
    conversations,
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
  } = useImData()

  const toggleSearch = useCallback(() => setSearchActive((prev) => !prev), [setSearchActive])

  return (
    <div className="im-page">
      <div className="im-layout" aria-label="即时通讯三栏布局">
        <DomainBar domains={domains} onSelectDomain={selectDomain} />

        <ChannelPanel
          domainName="企业级大模型部署"
          conversations={conversations}
          tools={tools}
          searchActive={searchActive}
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          onToggleSearch={toggleSearch}
          onSelectConversation={selectConversation}
        />

        <div className="im-chat-column">
          <ChatView
            chatHeader={chatHeader}
            messages={messages}
            onSearchMessages={() => {}}
            onStartMeeting={() => {}}
            onAddMember={() => {}}
            onOpenTasks={() => {}}
          />

          <MessageInput onSend={sendMessage} />
        </div>
      </div>
    </div>
  )
}

export default InstantMessagePage
