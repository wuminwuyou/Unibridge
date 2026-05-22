import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  FileText,
  Hash,
  ImageIcon,
  Sparkles,
  Tag,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormSection } from '../PublishForm/FormSection'
import { publishContentTypeOptions, publishNoteChecklistItems } from './publishNotePageData'
import type { PublishNoteFormModel } from './usePublishNoteForm'

// 01）发布笔记页视图 Props（PublishNoteViewProps）
interface PublishNoteViewProps {
  form: PublishNoteFormModel
}

// 02）发布笔记页主视图（PublishNoteView）
/**
 * 函数名：PublishNoteView
 * 功能：渲染发布笔记 UI 草图（主题感知样式 + 共享表单布局）。
 * 实现方法：
 * - 左侧多段表单 + 右侧网格卡片预览与检查清单
 * - 底部固定操作栏（草稿 / 预览 / 发布）
 * 输入：
 * - form：usePublishNoteForm 返回值
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无（提交仅 console 原型）
 */
export function PublishNoteView({ form }: PublishNoteViewProps) {
  const {
    draft,
    tagInput,
    suggestedNoteTags,
    completionPercent,
    setTagInput,
    updateField,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    toggleSuggestedTag,
    setContentType,
    handleSaveDraft,
    handlePreview,
    handlePublish,
  } = form

  const coverPreview = draft.cover.trim()

  return (
    <div className="publish-form-page min-h-screen bg-page text-main">
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <Link to="/" className="back-link inline-flex items-center gap-2 text-sm font-medium transition">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Publish</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-main">发布笔记</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                撰写图文或视频笔记并发布到经验分享频道。当前为 UI 原型，不会真实提交到服务端。
              </p>
            </div>
            <div className="rounded-2xl border bg-surface px-4 py-3 shadow-sm">
              <p className="text-xs text-muted">完成度</p>
              <p className="text-2xl font-bold text-accent">{completionPercent}%</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            <FormSection
              icon={<BookOpenText className="h-5 w-5" />}
              title="基本信息"
              description="标题、摘要与内容类型"
            >
              <label className="block space-y-2">
                <span className="label-text">
                  笔记标题 <span className="text-danger">*</span>
                </span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="例如：大三暑期实习投递复盘"
                  className="input-field"
                />
              </label>

              <label className="block space-y-2">
                <span className="label-text">
                  一句话摘要 <span className="text-danger">*</span>
                </span>
                <input
                  type="text"
                  value={draft.summary}
                  onChange={(event) => updateField('summary', event.target.value)}
                  placeholder="概括核心观点，便于列表快速浏览"
                  className="input-field"
                />
              </label>

              <fieldset>
                <legend className="label-text mb-3">内容类型</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {publishContentTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`channel-card ${draft.contentType === option.value ? 'channel-card--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="contentType"
                        value={option.value}
                        checked={draft.contentType === option.value}
                        onChange={() => setContentType(option.value)}
                        className="sr-only"
                      />
                      <span className="inline-flex items-center gap-2 font-semibold text-main">
                        {option.value === '视频' ? (
                          <Video className="h-4 w-4 text-accent" />
                        ) : (
                          <FileText className="h-4 w-4 text-accent" />
                        )}
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs text-muted">{option.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </FormSection>

            <FormSection
              icon={<FileText className="h-5 w-5" />}
              title="正文内容"
              description="支持 Markdown 风格排版（原型为纯文本）"
            >
              <label className="block space-y-2">
                <span className="label-text">
                  正文 <span className="text-danger">*</span>
                </span>
                <textarea
                  value={draft.body}
                  onChange={(event) => updateField('body', event.target.value)}
                  rows={12}
                  placeholder={
                    draft.contentType === '视频'
                      ? '撰写视频简介、章节要点；可在文末附上视频链接…'
                      : '## 背景\n\n## 过程\n\n## 结论与建议…'
                  }
                  className="input-field resize-y"
                />
              </label>

              <label className="block space-y-2">
                <span className="label-text">封面图 URL（可选）</span>
                <div className="relative">
                  <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-icon-muted" />
                  <input
                    type="url"
                    value={draft.cover}
                    onChange={(event) => updateField('cover', event.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="input-field pl-10"
                  />
                </div>
              </label>
            </FormSection>

            <FormSection
              icon={<Hash className="h-5 w-5" />}
              title="话题标签"
              description="帮助用户在经验分享频道发现你的内容"
            >
              <div className="space-y-3">
                <span className="label-text">
                  话题标签 <span className="text-danger">*</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {draft.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="tag-chip tag-chip--selected"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="输入后回车添加"
                    className="input-field flex-1"
                  />
                  <button type="button" onClick={() => addTag(tagInput)} className="btn-secondary">
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedNoteTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleSuggestedTag(tag)}
                      className={`tag-chip ${draft.tags.includes(tag) ? 'tag-chip--selected' : ''}`}
                    >
                      <Tag className="mr-1 inline h-3 w-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </FormSection>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-main">
                <Sparkles className="h-4 w-4 text-warning" />
                卡片预览
              </div>
              <article className="preview-card">
                {coverPreview ? (
                  <img src={coverPreview} alt="" className="preview-cover mb-3" />
                ) : (
                  <div className="preview-cover preview-cover--placeholder mb-3">封面预览</div>
                )}
                <span className="preview-badge">{draft.contentType}</span>
                <h3 className="mt-2 text-lg font-bold text-main line-clamp-2">
                  {draft.title.trim() || '笔记标题将显示在这里'}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">
                  {draft.summary.trim() || '摘要将显示在卡片副标题区域'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(draft.tags.length > 0 ? draft.tags : ['话题']).slice(0, 3).map((tag) => (
                    <span key={tag} className="preview-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </section>

            <section className="rounded-2xl border bg-surface p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-main">发布前检查</h3>
              <ul className="mt-4 space-y-3">
                {publishNoteChecklistItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>

      <footer className="publish-footer">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted">草稿仅保存在本地原型状态，刷新后丢失</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleSaveDraft} className="btn-secondary">
              保存草稿
            </button>
            <button type="button" onClick={handlePreview} className="btn-secondary">
              预览
            </button>
            <button type="button" onClick={handlePublish} className="btn-primary">
              发布笔记
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
