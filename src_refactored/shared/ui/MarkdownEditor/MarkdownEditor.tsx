// 01）Markdown 编辑器元件（MarkdownEditor）
/**
 * 函数名：MarkdownEditor
 * 功能：纯 Markdown 编辑/预览内联组件——编辑/预览双模式、字符上限截断、主题跟随，无业务语义。
 * 实现方法：
 * - 编辑模式：md-editor-rt 的 MdEditor（preview={false}）
 * - 预览模式：md-editor-rt 的 MdPreview
 * - 粘贴/上传超限时通过 onLengthLimitExceeded 上报，由外层决定是否截断写入
 * - 支持从本地 .md / .markdown 文件导入内容
 * - MutationObserver 跟随根节点 data-theme 切换明暗
 * 输入：
 * - value / onChange / maxLength / placeholder / className / allowMarkdownFileUpload / onLengthLimitExceeded
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无 API 调用、无路由跳转（纯 UI 组件）
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Eye, FilePen, FileUp } from 'lucide-react'
import { MdEditor, MdPreview } from 'md-editor-rt'
import 'md-editor-rt/lib/style.css'
import { useDocumentTheme } from '@shared/hooks/useDocumentTheme'

import './MarkdownEditor.css'

// 02）字数超限来源（MarkdownEditorLengthLimitSource）
export type MarkdownEditorLengthLimitSource = 'paste' | 'upload'

// 03）字数超限上报事件载荷（MarkdownEditorLengthLimitExceededPayload）
export interface MarkdownEditorLengthLimitExceededPayload {
  /** 触发来源：粘贴 / 上传文件 */
  source: MarkdownEditorLengthLimitSource
  /** 字符上限 */
  maxLength: number
  /** 当前剩余可写入字数（上传时为 maxLength） */
  remainingLength: number
  /** 原始欲写入内容长度 */
  incomingLength: number
  /** 超出字数 */
  exceededBy: number
  /** 确认后将写入的完整内容（已按上限截断） */
  proposedValue: string
}

// 04）编辑器 Props（MarkdownEditorProps）
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
  /**
   * 粘贴/上传内容超出字数上限时的确认回调。
   * 返回 true 则写入 proposedValue（已截断）；返回 false 则取消。
   * 未提供时保持默认行为：自动截断并写入。
   */
  onLengthLimitExceeded?: (
    payload: MarkdownEditorLengthLimitExceededPayload,
  ) => boolean | Promise<boolean>
  /** 附加 className */
  className?: string
  /** 滚动时固定编辑器 head（模式切换 / 上传 / 字数）于视口内 */
  stickyHead?: boolean
  /** sticky head 的 top 偏移，默认与 TopNavbar 高度一致 */
  stickyHeadTop?: string
}

// 05）编辑器模式类型（EditorMode）
type EditorMode = 'edit' | 'preview'

// 06）排除的工具栏按钮（避免与自定义模式切换冲突 + 缩短工具栏宽度）
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

// 07）允许的 Markdown 文件后缀
const MARKDOWN_FILE_EXTENSIONS = ['.md', '.markdown'] as const

// 08）校验是否为 Markdown 文件（isMarkdownFile）
function isMarkdownFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return MARKDOWN_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

// 09）Markdown 编辑器组件（MarkdownEditor）
export function MarkdownEditor({
  value,
  onChange,
  maxLength = 10000,
  placeholder = '在这里输入 Markdown 内容...',
  allowMarkdownFileUpload = false,
  onLengthLimitExceeded,
  onUpload,
  className,
  stickyHead = false,
  stickyHeadTop = 'var(--top-header-height, 60px)',
}: MarkdownEditorProps) {
  const theme = useDocumentTheme()
  const [mode, setMode] = useState<EditorMode>('edit')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const toolbarSlotRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isEdit = mode === 'edit'
  const charCount = value.length
  const isOverLimit = charCount >= maxLength

  // 内容 ref，避免闭包过期
  const valueRef = useRef(value)
  valueRef.current = value

  // 10）字数超限确认（confirmLengthLimitExceeded）
  /**
   * 函数名：confirmLengthLimitExceeded
   * 功能：粘贴/上传超出字数上限时，上报事件并等待外部确认是否写入截断内容。
   * 实现方法：
   * - 未超出或未提供回调时直接返回 true
   * - 调用 onLengthLimitExceeded 并 await 其结果
   * 输入：
   * - source / proposedValue / incomingLength / allowedLength
   * 输出：
   * - 返回值：是否允许写入 proposedValue
   */
  const confirmLengthLimitExceeded = useCallback(
    async (
      source: MarkdownEditorLengthLimitSource,
      proposedValue: string,
      incomingLength: number,
      allowedLength: number,
    ): Promise<boolean> => {
      const exceededBy = incomingLength - allowedLength
      if (exceededBy <= 0) {
        return true
      }

      if (!onLengthLimitExceeded) {
        return true
      }

      const remainingLength = source === 'upload'
        ? maxLength
        : Math.max(0, maxLength - valueRef.current.length)

      const result = onLengthLimitExceeded({
        source,
        maxLength,
        remainingLength,
        incomingLength,
        exceededBy,
        proposedValue,
      })

      return result instanceof Promise ? await result : result
    },
    [maxLength, onLengthLimitExceeded],
  )

  // 11）自定义粘贴处理（捕获阶段）
  const handlePasteCapture = useCallback(
    (event: React.ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData('text/plain')
      if (!pastedText) return

      const remainingLength = maxLength - valueRef.current.length

      if (remainingLength <= 0) {
        event.preventDefault()
        event.stopPropagation()
        void (async () => {
          await confirmLengthLimitExceeded('paste', valueRef.current, pastedText.length, 0)
        })()
        return
      }

      if (pastedText.length <= remainingLength) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const truncated = pastedText.slice(0, remainingLength)
      const proposedValue = valueRef.current + truncated

      void (async () => {
        if (await confirmLengthLimitExceeded('paste', proposedValue, pastedText.length, remainingLength)) {
          onChange(proposedValue)
        }
      })()
    },
    [confirmLengthLimitExceeded, maxLength, onChange],
  )

  // 12）Markdown 文件上传处理（handleMarkdownFileChange）
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
        const proposedValue = markdownText.slice(0, maxLength)

        if (!(await confirmLengthLimitExceeded('upload', proposedValue, markdownText.length, maxLength))) {
          return
        }

        onChange(proposedValue)
        setUploadError(null)
        setMode('edit')
      } catch {
        setUploadError('Markdown 文件读取失败，请重试')
      }
    },
    [confirmLengthLimitExceeded, maxLength, onChange],
  )

  const openMarkdownFilePicker = useCallback((): void => {
    fileInputRef.current?.click()
  }, [])

  const handleUploadImg = useCallback<NonNullable<React.ComponentProps<typeof MdEditor>['onUploadImg']>>(
    (files, callback) => {
      if (!onUpload) {
        return
      }

      void (async () => {
        try {
          const urls = await Promise.all(files.map((file) => onUpload(file)))
          callback(urls)
        } catch {
          setUploadError('图片上传失败')
        }
      })()
    },
    [onUpload],
  )

  // 13）将 md-editor 工具栏移入 head，与 tabs 一体 sticky（useLayoutEffect hoistToolbar）
  useLayoutEffect(() => {
    if (!stickyHead || !isEdit) {
      return undefined
    }

    const bodyEl = bodyRef.current
    const slotEl = toolbarSlotRef.current
    if (!bodyEl || !slotEl) {
      return undefined
    }

    const hoistToolbar = (): void => {
      const toolbar = bodyEl.querySelector(
        ':scope .md-editor .md-editor-toolbar-wrapper',
      ) as HTMLElement | null
      if (!toolbar || toolbar.parentElement === slotEl) {
        return
      }
      toolbar.classList.add('md-editor-core__hoisted-toolbar')
      slotEl.appendChild(toolbar)
    }

    hoistToolbar()

    const observer = new MutationObserver(hoistToolbar)
    observer.observe(bodyEl, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [isEdit, stickyHead, theme, allowMarkdownFileUpload])

  const rootClassName = [
    'md-editor-core',
    stickyHead ? 'md-editor-core--sticky-head' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const rootStyle = stickyHead
    ? ({ '--md-editor-sticky-top': stickyHeadTop } as React.CSSProperties)
    : undefined

  return (
    <div ref={rootRef} className={rootClassName} style={rootStyle}>
      <div className="md-editor-core__head">
        <div className="md-editor-core__head-main">
          <div className="md-editor-core__head-leading">
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
            <span className="md-editor-core__char-count" aria-live="polite">
              {charCount} / {maxLength} 字
            </span>
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

        {stickyHead && isEdit ? (
          <div ref={toolbarSlotRef} className="md-editor-core__head-toolbar-slot" />
        ) : null}
      </div>

      <div ref={bodyRef} className="md-editor-core__body" onPasteCapture={handlePasteCapture}>
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
            onUploadImg={onUpload ? handleUploadImg : undefined}
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
