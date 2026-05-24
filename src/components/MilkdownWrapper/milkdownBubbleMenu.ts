import { commandsCtx } from '@milkdown/core'
import type { Ctx } from '@milkdown/ctx'
import type { CmdKey } from '@milkdown/core'
import { TooltipProvider, tooltipFactory } from '@milkdown/plugin-tooltip'
import {
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
} from '@milkdown/preset-commonmark'
import { toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import { TextSelection } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'

// 01）选区浮动菜单插件 id（SELECTION_TOOLTIP_ID）
const SELECTION_TOOLTIP_ID = 'UNIBRIDGE_SELECTION'

// 02）Milkdown 选区 Bubble Menu 插件（selectionBubbleTooltip）
/** 官方 tooltipFactory 生成的选区浮动菜单插件对 */
export const selectionBubbleTooltip = tooltipFactory(SELECTION_TOOLTIP_ID)

// 03）创建 Bubble Menu 按钮（createBubbleMenuButton）
/**
 * 函数名：createBubbleMenuButton
 * 功能：为选区浮动菜单创建可执行 Milkdown 命令的 DOM 按钮。
 * 输入：
 * - label：按钮文案
 * - title：无障碍提示
 * - onClick：点击回调
 * 输出：
 * - 返回值：HTMLButtonElement
 * - 副作用：无
 */
function createBubbleMenuButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'milkdown-bubble-menu__btn'
  button.textContent = label
  button.title = title
  button.setAttribute('aria-label', title)
  button.addEventListener('mousedown', (event) => {
    event.preventDefault()
    onClick()
  })
  return button
}

// 04）判断选区是否应展示 Bubble Menu（shouldShowSelectionBubbleMenu）
/**
 * 函数名：shouldShowSelectionBubbleMenu
 * 功能：仅在非空文本选区且编辑器可编辑时展示浮动菜单。
 * 输入：
 * - view：ProseMirror EditorView
 * - menuElement：菜单根节点
 * 输出：
 * - 返回值：boolean
 */
function shouldShowSelectionBubbleMenu(view: EditorView, menuElement: HTMLElement): boolean {
  const { doc, selection } = view.state
  const { empty, from, to } = selection

  if (!(selection instanceof TextSelection)) {
    return false
  }

  const isEmptyTextBlock = !doc.textBetween(from, to).length
  const isTooltipFocused = menuElement.contains(document.activeElement)
  const notHasFocus = !view.hasFocus() && !isTooltipFocused

  if (notHasFocus || empty || isEmptyTextBlock || !view.editable) {
    return false
  }

  return true
}

// 05）创建选区 Bubble Menu 视图（createSelectionBubbleMenuView）
/**
 * 函数名：createSelectionBubbleMenuView
 * 功能：挂载 Notion 风格选区浮动菜单（加粗 / 斜体 / 删除线 / 行内代码）。
 * 实现方法：
 * - TooltipProvider 负责定位与显隐
 * - 通过 commandsCtx 调用 preset 命令
 * 输入：
 * - ctx：Milkdown 上下文
 * - rootElement：菜单挂载根节点
 * 输出：
 * - 返回值：ProseMirror Plugin view 生命周期对象
 * - 副作用：向 DOM 注入浮动菜单
 */
export function createSelectionBubbleMenuView(ctx: Ctx, rootElement: HTMLElement) {
  const content = document.createElement('div')
  content.className = 'milkdown-bubble-menu'
  content.setAttribute('role', 'toolbar')
  content.setAttribute('aria-label', '选区格式')

  const runCommand = (commandKey: CmdKey<unknown>): void => {
    ctx.get(commandsCtx).call(commandKey)
  }

  content.append(
    createBubbleMenuButton('B', '加粗', () => runCommand(toggleStrongCommand.key)),
    createBubbleMenuButton('I', '斜体', () => runCommand(toggleEmphasisCommand.key)),
    createBubbleMenuButton('S', '删除线', () => runCommand(toggleStrikethroughCommand.key)),
    createBubbleMenuButton('</>', '行内代码 / 高亮', () => runCommand(toggleInlineCodeCommand.key)),
  )

  const provider = new TooltipProvider({
    content,
    debounce: 20,
    offset: 8,
    root: rootElement,
    shouldShow: (view) => shouldShowSelectionBubbleMenu(view, content),
  })

  return {
    update: (view: EditorView, prevState?: Parameters<TooltipProvider['update']>[1]) => {
      provider.update(view, prevState)
    },
    destroy: () => {
      provider.destroy()
      content.remove()
    },
  }
}

// 06）注册选区 Bubble Menu 插件（configureSelectionBubbleMenu）
/**
 * 函数名：configureSelectionBubbleMenu
 * 功能：将 Bubble Menu 插件 spec 写入 Milkdown ctx。
 * 输入：
 * - ctx：Milkdown 上下文
 * - rootElement：菜单挂载根节点
 * 输出：
 * - 返回值：void
 * - 副作用：注册 tooltip plugin view
 */
export function configureSelectionBubbleMenu(ctx: Ctx, rootElement: HTMLElement): void {
  ctx.set(selectionBubbleTooltip.key, {
    view: () => createSelectionBubbleMenuView(ctx, rootElement),
  })
}
