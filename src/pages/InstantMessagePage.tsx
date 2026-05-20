import TopNavbar from '../components/layout/TopNavbar'
import '../styles/InstantMessagePage.css'

// 01）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）左侧项目/招募分组图标数据（imGroups）
const directAndGroupMessages = [
  { id: 'dm', label: '个人私聊', shortLabel: '私', unread: true },
  { id: 'lab', label: '实验室群聊', shortLabel: '实', unread: true },
  { id: 'team', label: '团队群聊', shortLabel: '队', unread: false },
]

// 03）基于项目分组名称（projectMessageNames）
const projectMessageNames: string[] = [
  '企业级大模型部署',
  '校园二手交易平台',
  '数字校园联合实验室门户',
  '机器人创新工坊控制系统',
]

// 04）临时对话分组（temporaryMessages）
const temporaryMessages = [{ id: 'temp-1', label: '临时对话', shortLabel: '临', unread: false }]

// 05）从项目名称提取首字图标（resolveProjectShortLabel）
/**
 * 函数名：resolveProjectShortLabel
 * 功能：将项目名称转换为左侧图标短标识，当前规则为“取首个非空字符”。
 * 输入：
 * - projectName：项目名称
 * 输出：
 * - 返回值：string，图标短文本
 * - 副作用：无
 */
function resolveProjectShortLabel(projectName: string): string {
  const normalizedName = projectName.trim()
  return normalizedName.length > 0 ? normalizedName[0] : '项'
}

// 06）基于项目分组图标数据（projectMessages）
const projectMessages = projectMessageNames.map((projectName, index) => ({
  id: `project-${index + 1}`,
  label: projectName,
  shortLabel: resolveProjectShortLabel(projectName),
  unread: index % 2 === 0,
}))

// 07）中栏对话/频道数据（imChannels）
const imChannels = [
  { id: 'all', title: '# 全体群聊', unread: 0 },
  { id: 'frontend', title: '# 前端开发组', unread: 3 },
  { id: 'tech', title: '# 技术方案讨论', unread: 1 },
  { id: 'private-mentor', title: '@ 导师-王老师', unread: 0 },
]

// 08）右栏消息流数据（messageItems）
const messageItems = [
  {
    id: 'm1',
    sender: '王老师',
    role: '导师',
    time: '18:40',
    direction: 'left' as const,
    content: '今晚我们先把接口联调计划敲定，明天上午开始联调。',
  },
  {
    id: 'm2',
    sender: '张同学',
    role: '学生',
    time: '18:41',
    direction: 'right' as const,
    content: '收到，我先把登录与消息列表接口的字段映射整理成表。',
  },
  {
    id: 'm3',
    sender: '系统通知',
    role: '系统',
    time: '18:43',
    direction: 'system' as const,
    content: '李同学 已通过审核加入项目：企业级大模型私有化部署。',
  },
  {
    id: 'm4',
    sender: '王老师',
    role: '导师',
    time: '18:46',
    direction: 'left' as const,
    content: '很好，顺带把错误码也补上，我们明天直接走完整流程。',
  },
]

// 09）即时通讯页面组件（InstantMessagePage）
/**
 * 函数名：InstantMessagePage
 * 功能：渲染即时通讯三栏页面，承载消息分组、频道列表与主对话窗交互外观。
 * 实现方法：
 * - 复用 TopNavbar 作为全局导航头部
 * - 使用三栏 Flex 布局，左栏项目分组、中栏频道、右栏消息流
 * - 右栏按消息方向区分系统消息/接收消息/发送消息样式
 * - 底部提供输入框区域，预留附件、表情与发送入口
 * 输入：
 * - 无（当前为静态原型数据）
 * 输出：
 * - 返回值：JSX.Element，即时通讯页面结构
 * - 副作用：无
 */
function InstantMessagePage() {
  return (
    <div className="im-page">
      <TopNavbar navItems={navItems} />

      <main className="im-layout" aria-label="即时通讯页面">
        <aside className="im-rail" aria-label="项目与对话分组">
          <div className="im-rail__header">
            <button type="button" className="im-rail__all" title="全部消息">
              全
            </button>
          </div>

          <div className="im-rail__list">
            <div className="im-rail__section">
              {directAndGroupMessages.map((group) => (
                <button key={group.id} type="button" className="im-rail__item" aria-label={group.label}>
                  {group.unread ? <span className="im-rail__dot" aria-hidden="true" /> : null}
                  {group.shortLabel}
                  <span className="im-rail__tooltip">{group.label}</span>
                </button>
              ))}
            </div>

            <div className="im-rail__separator" aria-hidden="true" />

            <div className="im-rail__section im-rail__section--spaced">
              {projectMessages.map((group, index) => (
                <button
                  key={group.id}
                  type="button"
                  className={`im-rail__item ${index === 0 ? 'is-active' : ''}`}
                  aria-label={group.label}
                >
                  {group.unread ? <span className="im-rail__dot" aria-hidden="true" /> : null}
                  {group.shortLabel}
                  <span className="im-rail__tooltip">{group.label}</span>
                </button>
              ))}
            </div>

            <div className="im-rail__separator" aria-hidden="true" />

            <div className="im-rail__section im-rail__section--spaced">
              {temporaryMessages.map((group) => (
                <button key={group.id} type="button" className="im-rail__item" aria-label={group.label}>
                  {group.unread ? <span className="im-rail__dot" aria-hidden="true" /> : null}
                  {group.shortLabel}
                  <span className="im-rail__tooltip">{group.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="im-rail__create" title="新建对话分组">
            +
          </button>
        </aside>

        <section className="im-channel-panel" aria-label="频道与私聊列表">
          <header className="im-channel-panel__head">
            <h2>企业级大模型私有化部署</h2>
            <button type="button">切换 ▾</button>
          </header>

          <div className="im-channel-panel__group">
            <p className="im-channel-panel__group-title">频道 / 私聊</p>
            <ul className="im-channel-list">
              {imChannels.map((channel) => (
                <li key={channel.id}>
                  <button type="button" className={`im-channel-item ${channel.id === 'frontend' ? 'is-active' : ''}`}>
                    <span>{channel.title}</span>
                    {channel.unread > 0 ? <em>{channel.unread}</em> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="im-chat-panel" aria-label="主聊天窗口">
          <header className="im-chat-panel__head">
            <div>
              <strong># 前端开发组</strong>
              <p>8 人在线</p>
            </div>
          </header>

          <div className="im-message-flow">
            {messageItems.map((message) => (
              <article key={message.id} className={`im-message im-message--${message.direction}`}>
                {message.direction === 'system' ? (
                  <p className="im-message__system">{message.content}</p>
                ) : (
                  <>
                    <div className="im-message__meta">
                      <span className="im-message__sender">{message.sender}</span>
                      <span className="im-message__role">{message.role}</span>
                      <time>{message.time}</time>
                    </div>
                    <p className="im-message__bubble">{message.content}</p>
                  </>
                )}
              </article>
            ))}
          </div>

          <footer className="im-chat-input">
            <button type="button" aria-label="发送附件">
              ＋
            </button>
            <input placeholder="输入消息内容..." aria-label="消息输入框" />
            <button type="button" aria-label="表情">
              😊
            </button>
            <button type="button" className="im-chat-input__send" aria-label="发送">
              发送
            </button>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default InstantMessagePage
