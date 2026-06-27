import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, FilePen, FileText, Save } from 'lucide-react'
import { MdEditor, MdPreview } from 'md-editor-rt'
import 'md-editor-rt/lib/style.css'
import { NotesApiError } from '../../../../api/notes'
import type { NotePublishAction } from '../../../../api/notes/types'
import { useDocumentTheme } from '../../../../components/OnlineEditor/shared/hooks/useDocumentTheme'
import type { LearningNoteParentPayload } from '../../shared/learningNoteParentPayload'
import { createLearningNote } from './createLearningNote'

import './NoteQuickMdEditor.css'

// 01）学习笔记编辑器 Props（NoteQuickMdEditorProps）
export interface NoteQuickMdEditorProps {
  note: LearningNoteParentPayload
  className?: string
  /** 折叠方向：'top' 为上下折叠（默认视频页），'left' 为左右折叠（图文详情页） */
  collapseDirection?: 'top' | 'left'
  /** 编辑器初始内容，默认取 note.body */
  initialContent?: string
}

// 02）笔记模式类型（NoteQuickMode）
type NoteQuickMode = 'edit' | 'preview'

// 03）排除的工具栏按钮（避免与自定义模式切换冲突 + 缩短工具栏宽度）
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

// 03-b）学习笔记字符上限（MAX_CHAR_COUNT）
const MAX_CHAR_COUNT = 10000

// 04）学习笔记编辑器（NoteQuickMdEditor）
/**
 * 函数名：NoteQuickMdEditor
 * 功能：视频详情页 / 图文详情页 Markdown 编辑器；head 提供编辑/预览切换与草稿/正式发布保存。
 * 实现方法：
 * - 编辑：MdEditor（preview={false}）；预览：MdPreview
 * - 草稿/保存分别调用 createLearningNote（publishAction: DRAFT / PUBLISH）
 * - onChange 阶段截断超出 MAX_CHAR_COUNT 的内容并显示警告
 * 输入：
 * - note：视频/图文详情载荷（含 uid 与初始 body）
 * - className：外层附加样式类，可选
 * - initialContent：编辑器初始内容，默认 note.body
 * 输出：
 * - 返回值：React 节点
 * - 副作用：保存时调用 POST /notes
 */
export function NoteQuickMdEditor({ note, className, initialContent, collapseDirection: _collapseDirection }: NoteQuickMdEditorProps) {
  const theme = useDocumentTheme()
  const [content, setContent] = useState(initialContent ?? note.body)
  const [mode, setMode] = useState<NoteQuickMode>('edit')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveHint, setSaveHint] = useState<string | null>(null)

  const isEdit = mode === 'edit'
  const charCount = content.length
  const isOverLimit = charCount >= MAX_CHAR_COUNT

  // 内容 ref，避免闭包过期
  const contentRef = useRef(content)
  contentRef.current = content

  // 自定义粘贴处理（捕获阶段）：粘贴超出剩余容量时，阻止事件传播到 MdEditor，
  // 手动截断后通过 setContent 写入；未超限则放行让 maxLength 正常处理
  const handlePasteCapture = useCallback(
    (event: React.ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData('text/plain')
      if (!pastedText) return

      const currentLength = contentRef.current.length
      const remainingLength = MAX_CHAR_COUNT - currentLength

      // 已达上限：阻止粘贴并吞掉事件（不传给 MdEditor）
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
      setContent((prev) => prev + truncated)
    },
    [],
  )

  // 错误/成功提示 3 秒后自动清除
  useEffect(() => {
    if (!saveError && !saveHint) return
    const timer = window.setTimeout(() => {
      setSaveError(null)
      setSaveHint(null)
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [saveError, saveHint])

  const handleSubmit = useCallback(
    async (publishAction: NotePublishAction) => {
      setSaveError(null)
      setSaveHint(null)
      setIsSaving(true)

      try {
        await createLearningNote({
          note,
          noteUid: note.uid,
          markdown: content,
          publishAction,
        })
        setSaveHint(publishAction === 'DRAFT' ? '草稿已保存' : '笔记已发布')
      } catch (error) {
        const message =
          error instanceof NotesApiError ? error.message : '保存笔记失败，请稍后重试'
        setSaveError(message)
      } finally {
        setIsSaving(false)
      }
    },
    [content, note],
  )

  const handleSaveDraft = () => {
    void handleSubmit('DRAFT')
  }

  const handlePublish = () => {
    void handleSubmit('PUBLISH')
  }

  return (
    <div className={`note-quick-md-editor ${className ?? ''}`.trim()}>
      <div className="note-quick-md-editor__head">
        <div className="note-quick-md-editor__head-main">
          <div className="note-quick-md-editor__tabs" role="tablist" aria-label="笔记模式">
            <button
              type="button"
              role="tab"
              aria-selected={isEdit}
              className={`note-quick-md-editor__tab ${isEdit ? 'note-quick-md-editor__tab--active' : ''}`.trim()}
              onClick={() => setMode('edit')}
            >
              <FilePen className="h-3.5 w-3.5" aria-hidden="true" />
              编辑
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isEdit}
              className={`note-quick-md-editor__tab ${!isEdit ? 'note-quick-md-editor__tab--active' : ''}`.trim()}
              onClick={() => setMode('preview')}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              预览
            </button>
          </div>

          <div className="note-quick-md-editor__actions">
            <button
              type="button"
              className="note-quick-md-editor__action"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              草稿
            </button>
            <button
              type="button"
              className="note-quick-md-editor__action note-quick-md-editor__action--primary"
              onClick={handlePublish}
              disabled={isSaving}
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              保存
            </button>
          </div>
        </div>

        {/* 状态提示：合并 saveError / saveHint / 超限提示 */}
        {saveError ? (
          <p className="note-quick-md-editor__status note-quick-md-editor__status--error" role="alert">
            {saveError}
          </p>
        ) : saveHint ? (
          <p className="note-quick-md-editor__status note-quick-md-editor__status--success" role="status">
            {saveHint}
          </p>
        ) : isOverLimit ? (
          <p className="note-quick-md-editor__status note-quick-md-editor__status--error" role="alert">
            字数已达上限（{MAX_CHAR_COUNT} 字）
          </p>
        ) : null}

        {/* 字符计数 */}
        <div className="flex items-center gap-2">
          <span className="text-[0.625rem] text-zinc-400 dark:text-zinc-500">
            {charCount} / {MAX_CHAR_COUNT} 字
          </span>
        </div>
      </div>

      <div className="note-quick-md-editor__body" onPasteCapture={handlePasteCapture}>
        {isEdit ? (
          <MdEditor
            value={content}
            onChange={setContent}
            maxLength={MAX_CHAR_COUNT}
            theme={theme}
            language="zh-CN"
            previewTheme="default"
            codeTheme={theme === 'dark' ? 'atom' : 'github'}
            placeholder="在这里记录你的想法..."
            preview={false}
            toolbarsExclude={[...EXCLUDED_TOOLBARS]}
            style={{ height: '100%' }}
          />
        ) : (
          <div className="note-quick-md-editor__preview-scroll">
            <MdPreview
              value={content}
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
