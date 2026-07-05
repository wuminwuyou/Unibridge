// 01）图文三栏 Column 布局（NoteArticleColumnLayout）
import type { ReactNode } from 'react'
import styles from './noteArticleColumnLayout.module.css'

// 02）布局 Props（NoteArticleColumnLayoutProps）
export interface NoteArticleColumnLayoutProps {
  /** 左栏 TOC 内容；不传时使用占位保持 Grid 对齐 */
  tocAside?: ReactNode
  /** 中栏主内容 */
  body: ReactNode
  /** 右栏侧栏内容 */
  sidebar: ReactNode
  /** 外层 main 附加 className */
  className?: string
  /** 中栏附加 className */
  bodyClassName?: string
  /** 右栏附加 className（默认 sticky top-[5.5rem] self-start） */
  sidebarClassName?: string
}

/**
 * 函数名：NoteArticleColumnLayout
 * 功能：图文笔记阅读/编辑页共享三栏 Grid 壳（左 3 / 中 6 / 右 3）。
 * 实现方法：
 * - 消费 noteArticleColumnLayout.module.css 统一 Grid 规格
 * - tocAside 缺省时渲染 span 3 占位
 * - 右栏默认 sticky 对齐 Navbar 下方
 * 输入：
 * - tocAside / body / sidebar 三个 slot
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function NoteArticleColumnLayout({
  tocAside,
  body,
  sidebar,
  className,
  bodyClassName,
  sidebarClassName = 'sticky top-[var(--top-header-height,60px)] self-start',
}: NoteArticleColumnLayoutProps) {
  const layoutClassName = [styles.noteArticleLayout, className].filter(Boolean).join(' ')
  const bodyColClassName = [styles.noteArticleBodyCol, bodyClassName].filter(Boolean).join(' ')
  const sidebarColClassName = [styles.noteArticleSidebar, sidebarClassName].filter(Boolean).join(' ')

  return (
    <main className={layoutClassName}>
      <div className={styles.noteArticleGrid}>
        {tocAside ?? <div className={styles.noteArticleTocSpacer} aria-hidden="true" />}

        <div className={bodyColClassName}>{body}</div>

        <aside className={sidebarColClassName}>{sidebar}</aside>
      </div>
    </main>
  )
}
