import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  Layers3,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormSection } from '../PublishForm/FormSection'
import type { LevelCode } from '../../types/level'
import {
  publishChannelOptions,
  publishChecklistItems,
  publishLevelOptions,
} from './publishProjectPageData'
import type { PublishProjectFormModel } from './usePublishProjectForm'

// 01）发布项目页视图 Props（PublishProjectViewProps）
interface PublishProjectViewProps {
  form: PublishProjectFormModel
}

// 02）发布项目页主视图（PublishProjectView）
/**
 * 函数名：PublishProjectView
 * 功能：渲染发布项目 UI 草图（主题感知样式 + 共享表单布局）。
 * 实现方法：
 * - 左侧多段表单 + 右侧预览与检查清单
 * - 底部固定操作栏（草稿 / 预览 / 发布）
 * 输入：
 * - form：usePublishProjectForm 返回值
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无（提交仅 console 原型）
 */
export function PublishProjectView({ form }: PublishProjectViewProps) {
  const {
    draft,
    tagInput,
    suggestedSkillTags,
    completionPercent,
    setTagInput,
    updateField,
    addSkillTag,
    removeSkillTag,
    handleTagInputKeyDown,
    toggleSuggestedTag,
    handleSaveDraft,
    handlePreview,
    handlePublish,
  } = form

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
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-main">发布项目</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                填写项目需求信息，发布后将在对应频道展示。当前为 UI 原型，不会真实提交到服务端。
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
              icon={<FolderKanban className="h-5 w-5" />}
              title="基本信息"
              description="用于列表卡片与搜索展示"
            >
              <label className="block space-y-2">
                <span className="label-text">
                  项目标题 <span className="text-danger">*</span>
                </span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="例如：电商平台用户增长数据分析"
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
                  placeholder="80 字以内，突出价值与交付物"
                  className="input-field"
                />
              </label>

              <fieldset>
                <legend className="label-text mb-3">发布频道</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {publishChannelOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`channel-card ${draft.channel === option.value ? 'channel-card--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="channel"
                        value={option.value}
                        checked={draft.channel === option.value}
                        onChange={() => updateField('channel', option.value)}
                        className="sr-only"
                      />
                      <span className="font-semibold text-main">{option.label}</span>
                      <span className="mt-1 block text-xs text-muted">{option.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </FormSection>

            <FormSection
              icon={<Layers3 className="h-5 w-5" />}
              title="需求详情"
              description="帮助接单方理解任务边界"
            >
              <label className="block space-y-2">
                <span className="label-text">
                  详细描述 <span className="text-danger">*</span>
                </span>
                <textarea
                  value={draft.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  rows={8}
                  placeholder="背景、目标、交付标准、协作方式…"
                  className="input-field resize-y"
                />
              </label>

              <div className="space-y-3">
                <span className="label-text">
                  技能标签 <span className="text-danger">*</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {draft.skillTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeSkillTag(tag)}
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
                  <button type="button" onClick={() => addSkillTag(tagInput)} className="btn-secondary">
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkillTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleSuggestedTag(tag)}
                      className={`tag-chip ${draft.skillTags.includes(tag) ? 'tag-chip--selected' : ''}`}
                    >
                      <Tag className="mr-1 inline h-3 w-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={<CircleDollarSign className="h-5 w-5" />}
              title="合作信息"
              description="预算、周期与团队规模"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="label-text">
                    预算 / 金额 <span className="text-danger">*</span>
                  </span>
                  <input
                    type="text"
                    value={draft.amount}
                    onChange={(event) => updateField('amount', event.target.value)}
                    placeholder="例如：¥3000 - ¥5000"
                    className="input-field"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="label-text">预计周期</span>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-icon-muted" />
                    <input
                      type="text"
                      value={draft.duration}
                      onChange={(event) => updateField('duration', event.target.value)}
                      placeholder="例如：4 周"
                      className="input-field pl-10"
                    />
                  </div>
                </label>
                <label className="block space-y-2">
                  <span className="label-text">能力等级</span>
                  <select
                    value={draft.level}
                    onChange={(event) => updateField('level', event.target.value as LevelCode)}
                    className="input-field"
                  >
                    {publishLevelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="label-text">团队人数</span>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-icon-muted" />
                    <input
                      type="text"
                      value={draft.teamSize}
                      onChange={(event) => updateField('teamSize', event.target.value)}
                      placeholder="例如：1-3 人"
                      className="input-field pl-10"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="label-text">报名截止</span>
                <input
                  type="date"
                  value={draft.deadline}
                  onChange={(event) => updateField('deadline', event.target.value)}
                  className="input-field"
                />
              </label>
            </FormSection>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-main">
                <Sparkles className="h-4 w-4 text-warning" />
                卡片预览
              </div>
              <article className="preview-card">
                <div className="mb-3 flex items-center justify-between">
                  <span className="preview-badge">{draft.channel === 'campus' ? '高校招募' : '企业实战'}</span>
                  <span className="preview-level">{draft.level}</span>
                </div>
                <h3 className="text-lg font-bold text-main">
                  {draft.title.trim() || '项目标题将显示在这里'}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">
                  {draft.summary.trim() || '摘要将显示在卡片副标题区域'}
                </p>
                <p className="mt-4 text-sm font-semibold text-accent">
                  {draft.amount.trim() || '预算待填写'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(draft.skillTags.length > 0 ? draft.skillTags : ['标签']).slice(0, 4).map((tag) => (
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
                {publishChecklistItems.map((item) => (
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
              发布项目
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
