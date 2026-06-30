// 01）Markdown 编辑器元件（MarkdownEditor）
/**
 * 函数名：MarkdownEditor
 * 功能：纯 Markdown 编辑/预览内联组件——编辑/预览双模式、字符上限截断、主题跟随，无业务语义。
 * 实现方法：
 * - 编辑模式：md-editor-rt 的 MdEditor（preview={false}）
 * - 预览模式：md-editor-rt 的 MdPreview
 * - 字符超限时阻止粘贴并截断
 * - 支持从本地 .md / .markdown 文件导入内容
 * - MutationObserver 跟随根节点 data-theme 切换明暗
 * 输入：
 * - value / onChange / maxLength / placeholder / className / allowMarkdownFileUpload
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无 API 调用、无路由跳转（纯 UI 组件）
 */
import { useCallback, useRef, useState } from 'react'
import { Eye, FilePen, FileUp } from 'lucide-react'
import { MdEditor, MdPreview } from 'md-editor-rt'
import 'md-editor-rt/lib/style.css'
import { useDocumentTheme } from '@shared/hooks/useDocumentTheme'

import './MarkdownEditor.css'

// 02）编辑器 Props（MarkdownEditorProps）
export interface MarkdownEditorProps {
  /** Markdown 内容 */
  value: string
  /** 内容变更回调 */
  onChange: (val: string) => void
  /** 字符上限（默认 10000） */
  maxLength?: number
  /** 占位文本 */
  placeholder?: string
  /** 附件上传回调（由外部注入 upload 逻辑，可选） */
  onUpload?: (file: File) => Promise<string>
  /** 是否显示「上传 Markdown 文件」入口（默认 false） */
  allowMarkdownFileUpload?: boolean
  /** 附加 className */
  className?: string
}

// 03）编辑器模式类型（EditorMode）
type EditorMode = 'edit' | 'preview'

// 04）排除的工具栏按钮（避免与自定义模式切换冲突 + 缩短工具栏宽度）
const EXCLUDED_TOOLBARS = [
  'preview',
  'previewOnly',
  'htmlPreview',
  'pageFullscreen',
  'fullscreen',
  'catalog',
  'github',
  'save',
  'prettier',
] as const

// 05）允许的 Markdown 文件后缀
const MARKDOWN_FILE_EXTENSIONS = ['.md', '.markdown'] as const

// 06）校验是否为 Markdown 文件（isMarkdownFile）
function isMarkdownFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return MARKDOWN_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

// 07）Markdown 编辑器组件（MarkdownEditor）
export function MarkdownEditor({
  value,
  onChange,
  maxLength = 10000,
  placeholder = '在这里输入 Markdown 内容...',
  allowMarkdownFileUpload = false,
  className,
}: MarkdownEditorProps) {
  const theme = useDocumentTheme()
  const [mode, setMode] = useState<EditorMode>('edit')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = mode === 'edit'
  const charCount = value.length
  const isOverLimit = charCount >= maxLength

  // 内容 ref，避免闭包过期
  const valueRef = useRef(value)
  valueRef.current = value

  // 自定义粘贴处理（捕获阶段）：粘贴超出剩余容量时，阻止事件传播到 MdEditor，
  // 手动截断后通过 onChange 写入；未超限则放行让 maxLength 正常处理
  const handlePasteCapture = useCallback(
    (event: React.ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData('text/plain')
      if (!pastedText) return

      const currentLength = valueRef.current.length
      const remainingLength = maxLength - currentLength

      // 已达上限：阻止粘贴并吞掉事件
      if (remainingLength <= 0) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      // 粘贴内容未超限：放行，由 MdEditor 的 maxLength 正常处理
      if (pastedText.length <= remainingLength) {
        return
      }

      // 粘贴内容超限：阻止事件传播，手动截断写入
      event.preventDefault()
      event.stopPropagation()
      const truncated = pastedText.slice(0, remainingLength)
      onChange(valueRef.current + truncated)
    },
    [onChange, maxLength],
  )

  const handleMarkdownFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0]
      event.target.value = ''

      if (!file) {
        return
      }

      if (!isMarkdownFile(file)) {
        setUploadError('仅支持 .md / .markdown 文件')
        return
      }

      try {
        const markdownText = await file.text()
        onChange(markdownText.slice(0, maxLength))
        setUploadError(null)
        setMode('edit')
      } catch {
        setUploadError('Markdown 文件读取失败，请重试')
      }
    },
    [maxLength, onChange],
  )

  const openMarkdownFilePicker = useCallback((): void => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className={`md-editor-core ${className ?? ''}`.trim()}>
      <div className="md-editor-core__head">
        <div className="md-editor-core__head-main">
          <div className="md-editor-core__tabs" role="tablist" aria-label="编辑器模式">
            <button
              type="button"
              role="tab"
              aria-selected={isEdit}
              className={`md-editor-core__tab ${isEdit ? 'md-editor-core__tab--active' : ''}`.trim()}
              onClick={() => setMode('edit')}
            >
              <FilePen className="h-3.5 w-3.5" aria-hidden="true" />
              编辑
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isEdit}
              className={`md-editor-core__tab ${!isEdit ? 'md-editor-core__tab--active' : ''}`.trim()}
              onClick={() => setMode('preview')}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              预览
            </button>
          </div>

          {allowMarkdownFileUpload && (
            <div className="md-editor-core__head-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,text/markdown"
                className="md-editor-core__file-input"
                aria-hidden="true"
                tabIndex={-1}
                onChange={handleMarkdownFileChange}
              />
              <button
                type="button"
                className="md-editor-core__upload-btn"
                onClick={openMarkdownFilePicker}
              >
                <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
                上传 Markdown 文件
              </button>
            </div>
          )}
        </div>

        {((isOverLimit) || (allowMarkdownFileUpload && uploadError)) && (
          <p
            className={`md-editor-core__status ${isOverLimit || uploadError ? 'md-editor-core__status--error' : ''}`.trim()}
            role="alert"
          >
            {isOverLimit ? `字数已达上限（${maxLength} 字）` : uploadError}
          </p>
        )}

        {/* 字符计数 */}
        <div className="flex items-center gap-2">
          <span className="text-[0.625rem] text-zinc-400 dark:text-zinc-500">
            {charCount} / {maxLength} 字
          </span>
        </div>
      </div>

      <div className="md-editor-core__body" onPasteCapture={handlePasteCapture}>
        {isEdit ? (
          <MdEditor
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            theme={theme}
            language="zh-CN"
            previewTheme="default"
            codeTheme={theme === 'dark' ? 'atom' : 'github'}
            placeholder={placeholder}
            preview={false}
            toolbarsExclude={[...EXCLUDED_TOOLBARS]}
            style={{ height: '100%' }}
          />
        ) : (
          <div className="md-editor-core__preview-scroll">
            <MdPreview
              value={value}
              theme={theme}
              language="zh-CN"
              previewTheme="default"
              codeTheme={theme === 'dark' ? 'atom' : 'github'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
