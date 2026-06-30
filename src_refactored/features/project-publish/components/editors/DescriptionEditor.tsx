// 01）需求说明编辑器交互组件（DescriptionEditor）
/**
 * 函数名：DescriptionEditor
 * 功能：发布项目表单的「需求详情」段——委托 shared/ui/MarkdownEditor 渲染。
 * 输入：
 * - value / onChange / maxLength / required
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { MarkdownEditor } from '@shared/ui/MarkdownEditor'
import styles from './DescriptionEditor.module.css'

export interface DescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  required?: boolean
}

export function DescriptionEditor({ value, onChange, maxLength = 500 }: DescriptionEditorProps) {
  return (
    <div className={styles.root}>
      <div className={styles.editorShell}>
        <MarkdownEditor
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          allowMarkdownFileUpload
          placeholder="请输入项目需求说明，支持 Markdown 语法..."
        />
      </div>
    </div>
  )
}
