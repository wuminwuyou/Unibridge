import { FileUp, PenLine } from 'lucide-react'
import { useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MarkdownContentChangeMeta, MarkdownContentSource, OnlineTextEditorLocationState } from '../../types'
import './ContentModePicker.css'

// 01）Markdown 内容双选项 Props（MarkdownContentModePickerProps）
export interface MarkdownContentModePickerProps {
  label: string
  required?: boolean
  value: string
  source: MarkdownContentSource | null
  uploadedFileName?: string | null
  contentEditorType?: 'MARKDOWN' | 'RICHTEXT'
  editorPath: string
  editorTitle: string
  returnTo: string
  onChange: (value: string, meta: MarkdownContentChangeMeta) => void
  /** 跳转全屏编辑器时附带的发布页表单快照（仅路由 state，不写 sessionStorage） */
  buildEditorLocationState?: () => Partial<OnlineTextEditorLocationState>
}

// 02）Markdown 内容双选项（MarkdownContentModePicker）
/**
 * 函数名：MarkdownContentModePicker
 * 功能：提供「在线编辑器 / 上传 Markdown 文件」两种方式录入正文类字段。
 * 实现方法：
 * - 左侧跳转全屏在线编辑器，选中态与 source === editor 对应
 * - 右侧上传 .md 文件，选中态与 source === upload 对应
 * - 根据来源在对应卡片展示摘要信息；已上传时左侧提示可在线修改
 * 输入：
 * - label / value / source / onChange 等
 * 输出：
 * - 返回值：React 节点
 * - 副作用：路由跳转或读取本地文件
 */
export function MarkdownContentModePicker({
  label,
  required = false,
  value,
  source,
  uploadedFileName = null,
  contentEditorType,
  editorPath,
  editorTitle,
  returnTo,
  onChange,
  buildEditorLocationState,
}: MarkdownContentModePickerProps) {
  const navigate = useNavigate()
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hasContent = value.trim().length > 0
  const wordCount = value.trim().length
  const isEditorActive = source === 'editor'
  const isUploadActive = source === 'upload'

  const openOnlineEditor = (): void => {
    const editorState: OnlineTextEditorLocationState = {
      returnTo,
      title: editorTitle,
      initialValue: value,
      initialEditorType: contentEditorType,
      ...buildEditorLocationState?.(),
    }
    navigate(editorPath, { state: editorState })
  }

  const openFilePicker = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const markdownText = await file.text()
      onChange(markdownText, { source: 'upload', fileName: file.name })
    } catch (error) {
      console.error('[MarkdownContentModePicker] 读取 Markdown 失败', error)
    } finally {
      event.target.value = ''
    }
  }

  const contentSnippet = value.trim().replace(/\s+/g, ' ').slice(0, 48)

  return (
    <div className="markdown-content-mode-picker">
      <span className="label-text">
        {label} {required ? <span className="text-danger">*</span> : null}
      </span>

      <div className="markdown-content-mode-picker__options">
        <button
          type="button"
          className={`markdown-content-mode-picker__option ${isEditorActive ? 'markdown-content-mode-picker__option--active' : ''}`}
          onClick={openOnlineEditor}
        >
          <span className="markdown-content-mode-picker__badge">
            <PenLine className="h-4 w-4" />
            打开在线编辑器
          </span>
          <div className="markdown-content-mode-picker__body">
            {isEditorActive && hasContent ? (
              <>
                <p className="markdown-content-mode-picker__status">在线编辑 · 共 {wordCount} 字</p>
                <p className="markdown-content-mode-picker__snippet">{contentSnippet}…</p>
              </>
            ) : isUploadActive && hasContent ? (
              <p className="markdown-content-mode-picker__hint">可在线修改markdown文件</p>
            ) : (
              <p className="markdown-content-mode-picker__hint">全屏编辑，支持编辑 / 分栏 / 预览</p>
            )}
          </div>
        </button>

        <button
          type="button"
          className={`markdown-content-mode-picker__option ${isUploadActive ? 'markdown-content-mode-picker__option--active' : ''}`}
          onClick={openFilePicker}
        >
          <span className="markdown-content-mode-picker__badge">
            <FileUp className="h-4 w-4" />
            上传 Markdown 文件
          </span>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept=".md,.markdown,text/markdown"
            className="sr-only"
            onChange={handleFileChange}
          />
          <div className="markdown-content-mode-picker__body markdown-content-mode-picker__body--upload">
            {isUploadActive && hasContent ? (
              <>
                <p className="markdown-content-mode-picker__status">已上传 · 共 {wordCount} 字</p>
                {uploadedFileName ? (
                  <p className="markdown-content-mode-picker__file-name">{uploadedFileName}</p>
                ) : null}
                <p className="markdown-content-mode-picker__snippet">{contentSnippet}…</p>
              </>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-icon-muted" />
                <p className="markdown-content-mode-picker__hint">点击选择 .md / .markdown 文件</p>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
