// 01）笔记编辑表单（NoteArticleEditorForm）
import { useCallback, useLayoutEffect, useRef } from 'react'
import { MarkdownEditor } from '@shared/ui/MarkdownEditor'
import {
  NOTE_ARTICLE_BODY_MAX_LENGTH,
  NOTE_SUMMARY_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from '@features/note-editor'
import type { UseNoteEditorFormResult } from '../hooks/useNoteEditorForm'
import styles from './note-article-editor-form.module.css'

// 02）表单 Props（NoteArticleEditorFormProps）
export interface NoteArticleEditorFormProps {
  form: UseNoteEditorFormResult
  onMarkdownImageUpload?: (file: File) => Promise<string>
}

// 03）同步摘要输入框高度（syncNoteSummaryInputHeight）
/**
 * 函数名：syncNoteSummaryInputHeight
 * 功能：将摘要 textarea 高度调整为恰好容纳当前内容。
 * 输入：
 * - element：摘要 textarea 元素
 * 输出：
 * - 副作用：写入 element.style.height
 */
function syncNoteSummaryInputHeight(element: HTMLTextAreaElement | null): void {
  if (!element) {
    return
  }
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

/**
 * 函数名：NoteArticleEditorForm
 * 功能：图文笔记编辑中栏——标题、摘要、Markdown 编辑器。
 * 实现方法：
 * - 标题样式与阅读页 h1 对齐，限制 20 字
 * - 摘要 flex 布局 + 高度随内容自适应，字数上限与视频描述一致（NOTE_SUMMARY_MAX_LENGTH）
 * - Markdown 编辑器 sticky 工具头 + bordered 容器
 * 输入：
 * - form：useNoteEditorForm 返回值
 * - onMarkdownImageUpload：粘贴/上传图片回调，可选
 * 输出：
 * - 返回值：React 节点
 */
export function NoteArticleEditorForm({
  form,
  onMarkdownImageUpload,
}: NoteArticleEditorFormProps) {
  const { draft, bodyContent, updateField, handleBodyChange } = form
  const summaryInputRef = useRef<HTMLTextAreaElement>(null)

  const titleLength = draft.title.length
  const summaryLength = draft.summary.length

  const handleSummaryChange = (nextValue: string): void => {
    updateField('summary', nextValue.slice(0, NOTE_SUMMARY_MAX_LENGTH))
  }

  const handleSummaryInput = useCallback((): void => {
    syncNoteSummaryInputHeight(summaryInputRef.current)
  }, [])

  useLayoutEffect(() => {
    syncNoteSummaryInputHeight(summaryInputRef.current)
  }, [draft.summary])

  return (
    <section aria-label="图文笔记编辑表单">
      <header className={styles.noteArticleEditorHeader}>
        <div className={styles.noteArticleEditorTitleField}>
          <input
            type="text"
            value={draft.title}
            onChange={(event) =>
              updateField('title', event.target.value.slice(0, NOTE_TITLE_MAX_LENGTH))
            }
            placeholder="输入笔记标题…"
            className={styles.noteArticleEditorTitleInput}
            aria-label="笔记标题"
            maxLength={NOTE_TITLE_MAX_LENGTH}
          />
          <p className={styles.noteArticleEditorTitleCount}>
            {titleLength}/{NOTE_TITLE_MAX_LENGTH}
          </p>
        </div>

        <label className={styles.noteArticleEditorSummaryField}>
          <span className={styles.noteArticleEditorSummaryLabel}>笔记摘要</span>
          <textarea
            ref={summaryInputRef}
            value={draft.summary}
            onChange={(event) => handleSummaryChange(event.target.value)}
            onInput={handleSummaryInput}
            placeholder="请输入笔记摘要，为空时自动通过正文内容填充"
            className={styles.noteArticleEditorSummaryInput}
            aria-label="笔记摘要"
            maxLength={NOTE_SUMMARY_MAX_LENGTH}
            rows={1}
          />
          <p className={styles.noteArticleEditorSummaryCount}>
            {summaryLength}/{NOTE_SUMMARY_MAX_LENGTH}
          </p>
        </label>
      </header>

      <div className={styles.noteArticleEditorMarkdownShell}>
        <MarkdownEditor
          value={bodyContent.longtext}
          onChange={handleBodyChange}
          maxLength={NOTE_ARTICLE_BODY_MAX_LENGTH}
          placeholder="在此撰写 Markdown 正文…"
          allowMarkdownFileUpload
          onUpload={onMarkdownImageUpload}
          className="note-article-editor-markdown"
          stickyHead
        />
      </div>
    </section>
  )
}
