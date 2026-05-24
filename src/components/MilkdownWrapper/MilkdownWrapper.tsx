import { Editor, defaultValueCtx, rootCtx } from '@milkdown/core'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { nord } from '@milkdown/theme-nord'
import { useEffect, useRef } from 'react'
import {
  MARKDOWN_CONTENT_SHELL_CLASSES,
  MARKDOWN_PROSE_CLASSES,
} from '../Reader/markdownContentShell'
import {
  configureSelectionBubbleMenu,
  selectionBubbleTooltip,
} from './milkdownBubbleMenu'
import './MilkdownWrapper.css'
import '@milkdown/theme-nord/style.css'

// 01）Milkdown 包装器 Props（MilkdownWrapperProps）
export interface MilkdownWrapperProps {
  /** Markdown 源码（双模共享的单一 longtext 状态） */
  value: string
  /** Markdown 实际变更回调（仅内容变化时触发） */
  onChange?: (markdown: string) => void
  /** 全站暗黑模式联动 */
  isDark: boolean
  className?: string
}

// 02）Milkdown 编辑器内核（MilkdownEditorCore）
/**
 * 函数名：MilkdownEditorCore
 * 功能：初始化 Milkdown WYSIWYG 实例，绑定 Nord 主题、GFM、选区 Bubble Menu 与变更监听。
 * 实现方法：
 * - useEditor 在 root 挂载 Editor.make 链
 * - listenerCtx.markdownUpdated 向上游同步 Markdown
 * - 主题状态合并：外层 dark class + nord 插件
 * 输入：
 * - value / onChange / isDark / className
 * 输出：
 * - 返回值：React 节点
 * - 副作用：创建/销毁 Milkdown 实例
 */
function MilkdownEditorCore({ value, onChange, isDark, className }: MilkdownWrapperProps) {
  const onChangeRef = useRef(onChange)
  const lastMarkdownRef = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    lastMarkdownRef.current = value
  }, [value])

  useEditor(
    (root) => {
      return Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root)
          ctx.set(defaultValueCtx, lastMarkdownRef.current)
          configureSelectionBubbleMenu(ctx, root)

          ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (markdown === prevMarkdown) {
              return
            }

            lastMarkdownRef.current = markdown
            onChangeRef.current?.(markdown)
          })
        })
        .config(nord)
        .use(commonmark)
        .use(gfm)
        .use(listener)
        .use(selectionBubbleTooltip)
    },
    [value],
  )

  return (
    <div
      className={`milkdown-wrapper__surface ${MARKDOWN_CONTENT_SHELL_CLASSES} ${isDark ? 'milkdown-wrapper__surface--dark dark' : ''} ${className ?? ''}`.trim()}
    >
      <div className={MARKDOWN_PROSE_CLASSES}>
        <Milkdown />
      </div>
    </div>
  )
}

// 03）Milkdown 通用包装器（MilkdownWrapper）
/**
 * 函数名：MilkdownWrapper
 * 功能：对外暴露 Milkdown WYSIWYG 编辑器，供在线编辑器「富文本模式」0ms 秒切挂载。
 * 实现方法：
 * - MilkdownProvider 提供 React 集成上下文
 * - 以 value 作为 remount key，保证双模切换时注入最新 Markdown
 * 输入：
 * - value / onChange / isDark
 * 输出：
 * - 返回值：React 节点
 */
export function MilkdownWrapper({ value, onChange, isDark, className }: MilkdownWrapperProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditorCore
        key={value}
        value={value}
        onChange={onChange}
        isDark={isDark}
        className={className}
      />
    </MilkdownProvider>
  )
}
