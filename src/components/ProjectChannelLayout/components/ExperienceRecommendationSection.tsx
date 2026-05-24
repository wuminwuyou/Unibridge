import { useMemo } from 'react'
import GridNoteCard from '../../NoteCard/GridNoteCard'
import type { ProfileNoteItem } from '../../../pages/ProfileSpace/components/types'

// 01）经验推荐区参数（ExperienceRecommendationSectionProps）
interface ExperienceRecommendationSectionProps {
  notes: ProfileNoteItem[]
  onRefresh: () => void
  sectionTitle?: string
}

// 02）经验推荐区（ExperienceRecommendationSection）
/**
 * 函数名：ExperienceRecommendationSection
 * 功能：在项目频道页左栏顶部渲染「经验推荐」区域（HomePage 专用）。
 * 实现方法：
 * - 当 notes 为空时不渲染任何节点
 * - 渲染标题行 + 「换一换」按钮
 * - 使用 GridNoteCard 渲染笔记网格
 * 输入：
 * - notes：当前批次的经验笔记列表
 * - onRefresh：点击「换一换」回调
 * 输出：
 * - 返回值：JSX.Element | null
 * - 副作用：无
 */
function ExperienceRecommendationSection({
  notes,
  onRefresh,
  sectionTitle = '经验推荐',
}: ExperienceRecommendationSectionProps) {
  const renderedNoteCards = useMemo(() => {
    return notes.map((note) => <GridNoteCard key={`home-experience-${note.title}`} note={note} />)
  }, [notes])

  if (notes.length === 0) {
    return null
  }

  return (
    <article className="home-experience-recommendation" aria-label={sectionTitle}>
      <div className="section-title-row">
        <h2 className="section-title">{sectionTitle}</h2>
        <button type="button" className="section-refresh-button" onClick={onRefresh}>
          换一换
        </button>
      </div>
      <div className="home-experience-recommendation__grid grid-note-card-grid--equal-rows">{renderedNoteCards}</div>
    </article>
  )
}

export default ExperienceRecommendationSection
