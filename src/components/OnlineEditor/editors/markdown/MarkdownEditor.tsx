import { MdEditor } from 'md-editor-rt'
import 'md-editor-rt/lib/style.css'
import { useDocumentTheme } from '../../shared/hooks/useDocumentTheme'
import {
  MARKDOWN_CONTENT_SHELL_CLASSES,
  MARKDOWN_PROSE_CLASSES,
} from '../../../Reader/markdownContentShell'
import '../../../Reader/mdEditorSiteTheme.css'
import './MarkdownEditor.css'

// 01）Markdown 在线编辑器 Props（MarkdownOnlineEditorProps）
export interface MarkdownOnlineEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

// 02）Markdown 在线编辑器（MarkdownOnlineEditor）
/**
 * 函数名：MarkdownOnlineEditor
 * 功能：基于 md-editor-rt 的 Markdown 编辑区（预览、工具栏由组件内置）。
 * 实现方法：
 * - 受控 modelValue / onChange
 * - 跟随站点 data-theme 切换明暗
 * 输入：
 * - value：Markdown 文本
 * - onChange：内容变更回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function MarkdownOnlineEditor({ value, onChange, className }: MarkdownOnlineEditorProps) {
  const theme = useDocumentTheme()

  return (
    <div className={`markdown-online-editor ${MARKDOWN_CONTENT_SHELL_CLASSES} ${className ?? ''}`.trim()}>
      <div className={`markdown-online-editor__prose ${MARKDOWN_PROSE_CLASSES}`}>
        <MdEditor
          modelValue={value}
          onChange={onChange}
          theme={theme}
          language="zh-CN"
          previewTheme="default"
          codeTheme={theme === 'dark' ? 'atom' : 'github'}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}
