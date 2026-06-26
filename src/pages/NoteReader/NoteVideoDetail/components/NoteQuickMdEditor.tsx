import { useCallback, useState } from 'react'
import { Eye, FilePen, FileText, Save } from 'lucide-react'
import { MdEditor, MdPreview } from 'md-editor-rt'
import 'md-editor-rt/lib/style.css'
import { NotesApiError } from '../../../../api/notes'
import type { NotePublishAction } from '../../../../api/notes/types'
import { useDocumentTheme } from '../../../../components/OnlineEditor/shared/hooks/useDocumentTheme'
import type { NoteVideoDetailPayload } from '../types'
import { createLearningNote } from './createLearningNote'

import './NoteQuickMdEditor.css'

// 01）学习笔记编辑器 Props（NoteQuickMdEditorProps）
export interface NoteQuickMdEditorProps {
  note: NoteVideoDetailPayload
  className?: string
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

// 04）学习笔记编辑器（NoteQuickMdEditor）
/**
 * 函数名：NoteQuickMdEditor
 * 功能：视频详情页右侧栏 Markdown 编辑器；head 提供编辑/预览切换与草稿/正式发布保存。
 * 实现方法：
 * - 编辑：MdEditor（preview={false}）；预览：MdPreview
 * - 草稿/保存分别调用 createLearningNote（publishAction: DRAFT / PUBLISH）
 * - TODO：后续接入笔记可见性（仅自己可见 / 公开）
 * 输入：
 * - note：视频详情载荷（含 uid、媒体字段与初始 body）
 * - className：外层附加样式类，可选
 * 输出：
 * - 返回值：React 节点
 * - 副作用：保存时调用 POST /notes
 */
export function NoteQuickMdEditor({ note, className }: NoteQuickMdEditorProps) {
  const theme = useDocumentTheme()
  const [content, setContent] = useState(note.body)
  const [mode, setMode] = useState<NoteQuickMode>('edit')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveHint, setSaveHint] = useState<string | null>(null)

  const isEdit = mode === 'edit'

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

        {saveError ? (
          <p className="note-quick-md-editor__status note-quick-md-editor__status--error" role="alert">
            {saveError}
          </p>
        ) : saveHint ? (
          <p className="note-quick-md-editor__status note-quick-md-editor__status--success" role="status">
            {saveHint}
          </p>
        ) : null}
      </div>

      <div className="note-quick-md-editor__body">
        {isEdit ? (
          <MdEditor
            modelValue={content}
            onChange={setContent}
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
              modelValue={content}
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
