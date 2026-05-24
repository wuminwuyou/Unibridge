import { useState } from 'react'
import { MilkdownWrapper } from '../../MilkdownWrapper'
import { MarkdownOnlineEditor } from '../editors/markdown/MarkdownEditor'
import { useDocumentTheme } from '../shared/hooks/useDocumentTheme'
import {
  loadOnlineEditorModePreference,
  saveOnlineEditorModePreference,
} from '../shared/utils/onlineEditorModePreference'
import type { OnlineTextEditorMode, OnlineTextEditorSavePayload } from '../types'
import './OnlineTextEditor.css'

// 01）在线正文编辑器 Props（OnlineTextEditorProps）
export interface OnlineTextEditorProps {
  title: string
  initialValue: string
  initialEditorType?: 'MARKDOWN' | 'RICHTEXT'
  onSave: (payload: OnlineTextEditorSavePayload) => void
  onCancel: () => void
}

// 02）在线正文编辑器（OnlineTextEditor）
/**
 * 函数名：OnlineTextEditor
 * 功能：全屏在线正文编辑页；Markdown 源码（Md-Editor-RT）与 WYSIWYG（Milkdown）双模共享单一 Markdown 状态。
 * 实现方法：
 * - 状态单轨：content 始终为 Markdown longtext
 * - 0ms 滑块秒切：切换模式时不做 HTML/Markdown 转码，直接挂载对应编辑器
 * - 保存时记录 editorType（UI 模式）与 Markdown longtext
 * 输入：
 * - title / initialValue / onSave / onCancel
 * 输出：
 * - 返回值：React 节点
 * - 副作用：调用 onSave / onCancel
 */
export function OnlineTextEditor({
  title,
  initialValue,
  onSave,
  onCancel,
}: OnlineTextEditorProps) {
  const documentTheme = useDocumentTheme()
  const isDark = documentTheme === 'dark'
  const [mode, setMode] = useState<OnlineTextEditorMode>(() => loadOnlineEditorModePreference())
  const [content, setContent] = useState<string>(initialValue)

  const switchMode = (nextMode: OnlineTextEditorMode): void => {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    saveOnlineEditorModePreference(nextMode)
  }

  const toggleMode = (): void => {
    switchMode(mode === 'markdown' ? 'richtext' : 'markdown')
  }

  const handleSave = (): void => {
    saveOnlineEditorModePreference(mode)
    onSave({
      content,
      editorType: mode === 'markdown' ? 'MARKDOWN' : 'RICHTEXT',
    })
  }

  const isWysiwyg = mode === 'richtext'

  return (
    <div className="online-text-editor-page">
      <header className="online-text-editor-page__toolbar">
        <div className="online-text-editor-page__toolbar-left">
          <h1 className="online-text-editor-page__title">{title}</h1>
          <p className="online-text-editor-page__subtitle">
            {isWysiwyg ? '所见即所得 · Milkdown' : 'Markdown 源码 · Md Editor'}
          </p>
        </div>

        <div className="online-text-editor-page__mode-slider" role="group" aria-label="编辑模式">
          <span
            className={`online-text-editor-page__mode-label ${!isWysiwyg ? 'online-text-editor-page__mode-label--active' : ''}`}
          >
            Markdown
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isWysiwyg}
            aria-label={
              isWysiwyg
                ? '当前为所见即所得模式，切换到 Markdown 源码'
                : '当前为 Markdown 源码模式，切换到所见即所得'
            }
            className={`online-text-editor-page__switch ${isWysiwyg ? 'online-text-editor-page__switch--on' : ''}`}
            onClick={toggleMode}
          >
            <span className="online-text-editor-page__switch-thumb" />
          </button>
          <span
            className={`online-text-editor-page__mode-label ${isWysiwyg ? 'online-text-editor-page__mode-label--active' : ''}`}
          >
            所见即所得
          </span>
        </div>
      </header>

      <div className="online-text-editor-page__workspace">
        {mode === 'markdown' ? (
          <MarkdownOnlineEditor value={content} onChange={setContent} className="online-text-editor-page__editor" />
        ) : (
          <MilkdownWrapper
            value={content}
            onChange={setContent}
            isDark={isDark}
            className="online-text-editor-page__editor"
          />
        )}
      </div>

      <footer className="online-text-editor-page__footer">
        <button type="button" className="online-text-editor-page__btn online-text-editor-page__btn--ghost" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="online-text-editor-page__btn online-text-editor-page__btn--primary" onClick={handleSave}>
          保存
        </button>
      </footer>
    </div>
  )
}
