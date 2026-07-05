// 01）图文编辑三栏布局（NoteArticleEditorLayout）
import type { ReactNode } from 'react'
import { ListTree } from 'lucide-react'
import { NoteArticleColumnLayout } from '@shared/ui/note-article-column-layout'
import layoutStyles from '@shared/ui/note-article-column-layout/noteArticleColumnLayout.module.css'
import styles from './note-article-editor-layout.module.css'

// 02）布局 Props（NoteArticleEditorLayoutProps）
export interface NoteArticleEditorLayoutProps {
  /** 右栏 + 窄屏顶部的封面选择器（由父级传入同一组 props 渲染两次） */
  renderCoverPicker: (slotClassName: string) => ReactNode
  /** 右栏封面下方的附加内容（如标签输入） */
  sidebarExtra?: ReactNode
  children: ReactNode
}

/**
 * 函数名：NoteArticleEditorLayout
 * 功能：图文笔记编辑页三栏壳——左 TOC 占位、中栏表单、右栏 CoverPicker。
 * 实现方法：
 * - 消费 shared NoteArticleColumnLayout 保证与阅读页 Grid 对齐
 * - 窄屏（<1280px）CoverPicker 折叠至中栏顶部
 * 输入：
 * - renderCoverPicker：按 slot className 渲染封面控件
 * - children：中栏主编辑表单
 * 输出：
 * - 返回值：React 节点
 */
export function NoteArticleEditorLayout({
  renderCoverPicker,
  sidebarExtra,
  children,
}: NoteArticleEditorLayoutProps) {
  return (
    <div className={`bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${styles.noteArticleEditorRoot}`}>
      <NoteArticleColumnLayout
        sidebarClassName={styles.noteArticleEditorStickyAside}
        tocAside={
          <aside
            className={`${layoutStyles.noteArticleTocAside} ${styles.noteArticleEditorStickyAside}`}
            aria-label="目录占位"
          >
            <div className={styles.noteArticleEditorTocPlaceholder}>
              <p className={styles.noteArticleEditorTocPlaceholderTitle}>
                <ListTree size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                文章目录
              </p>
              <p className={styles.noteArticleEditorTocPlaceholderText}>
                发布后，此处将根据正文 Markdown 自动生成可跳转目录，与阅读页左侧目录栏一致。
              </p>
            </div>
          </aside>
        }
        body={
          <>
            {renderCoverPicker(styles.noteArticleEditorCoverInline)}
            {children}
          </>
        }
        sidebar={
          <div className={styles.noteArticleEditorSidebarStack}>
            {renderCoverPicker(styles.noteArticleEditorCoverSidebar)}
            {sidebarExtra}
          </div>
        }
      />
    </div>
  )
}
