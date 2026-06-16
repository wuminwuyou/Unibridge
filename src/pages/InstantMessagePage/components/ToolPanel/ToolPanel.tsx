import type { ToolItem } from '../../types'

// 01）工具面板 Props（ToolPanelProps）
export interface ToolPanelProps {
  tools: ToolItem[]
}

// 02）工具面板组件（ToolPanel）
/**
 * 函数名：ToolPanel
 * 功能：渲染频道面板底部的项目与实验室管理工具链列表。
 * 实现方法：
 * - 每个工具项渲染为紧凑的按钮行，含图标+名称+可选状态标签
 * - 支持折叠隐藏（预留接口）
 * 输入：
 * - tools：工具项列表
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function ToolPanel({ tools }: ToolPanelProps) {
  if (tools.length === 0) return null

  return (
    <div className="tool-panel">
      <div className="tool-panel__divider" aria-hidden="true" />
      <div className="tool-panel__list">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="tool-panel__item"
            title={tool.label}
          >
            <span className="tool-panel__icon">{getToolIcon(tool.id)}</span>
            <span className="tool-panel__label">{tool.label}</span>
            {tool.status ? (
              <span className="tool-panel__status">{tool.status}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}

// 03）工具图标映射（getToolIcon）
function getToolIcon(toolId: string): string {
  const iconMap: Record<string, string> = {
    meeting: '\uD83C\uDFA5',
    docs: '\uD83D\uDCC1',
    base: '\uD83D\uDCCA',
    milestones: '\uD83C\uDFC1',
    repo: '\uD83D\uDD00',
  }
  return iconMap[toolId] ?? '\uD83D\uDD27'
}

export default ToolPanel
