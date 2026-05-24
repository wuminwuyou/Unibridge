import { FileUp } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import './MarkdownEditorField.css'

// 01）Markdown 编辑区 Props（MarkdownEditorFieldProps）
export interface MarkdownEditorFieldProps {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  textareaClassName?: string
}

// 02）Markdown 编辑区（MarkdownEditorField）
/**
 * 函数名：MarkdownEditorField
 * 功能：带「上传 Markdown 文件」入口的多行文本编辑区（表单内嵌，非全屏）。
 * 实现方法：
 * - 右上角按钮触发隐藏 file input
 * - 读取 .md / .markdown 文件内容写入 value
 * 输入：
 * - label / value / onChange 等表单属性
 * 输出：
 * - 返回值：React 节点
 * - 副作用：读取本地文件内容（原型）
 */
export function MarkdownEditorField({
  label,
  required = false,
  value,
  onChange,
  rows = 12,
  placeholder,
  textareaClassName = 'input-field resize-y',
}: MarkdownEditorFieldProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importedFileName, setImportedFileName] = useState<string | null>(null)

  const openMarkdownPicker = (): void => {
    fileInputRef.current?.click()
  }

  const handleMarkdownFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const markdownText = await file.text()
      onChange(markdownText)
      setImportedFileName(file.name)
    } catch (error) {
      console.error('[MarkdownEditorField] 读取 Markdown 文件失败', error)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="markdown-editor-field">
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="sr-only"
        onChange={handleMarkdownFileChange}
      />
      <div className="markdown-editor-field__header">
        <span className="label-text">
          {label} {required ? <span className="text-danger">*</span> : null}
        </span>
        <button type="button" className="btn-secondary markdown-editor-field__upload" onClick={openMarkdownPicker}>
          <FileUp className="mr-1 inline h-4 w-4" />
          上传 Markdown 文件
        </button>
      </div>
      <textarea
        value={value}
        onChange={(event) => {
          setImportedFileName(null)
          onChange(event.target.value)
        }}
        rows={rows}
        placeholder={placeholder}
        className={`markdown-editor-field__textarea ${textareaClassName}`}
      />
      {importedFileName ? <p className="markdown-editor-field__hint">已导入：{importedFileName}</p> : null}
    </div>
  )
}
