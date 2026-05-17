import ProjectCard from '../common/ProjectCard'
import GridNoteCard from '../common/GridNoteCard'
import { useEffect, useMemo, useState } from 'react'
import {
  AnnouncementsCard,
  RecommendedCompaniesCard,
  RecommendedTypesCard,
  SearchSidebarCard,
} from './SidebarCards'
import TopNavbar from '../layout/TopNavbar'
import type { Announcement, ProjectItem, RecommendedCompany } from './types'
import type { ProfileNoteItem } from '../profile/types'

// 01）项目专区通用布局参数类型（ProjectZonePageLayoutProps）
interface ProjectZonePageLayoutProps {
  sectionTitle: string
  searchInputId: string
  projects: ProjectItem[]
  experienceRecommendedNotes?: ProfileNoteItem[]
  recommendedTypes: string[]
  recommendedOrganizations: RecommendedCompany[]
  announcements: Announcement[]
  organizationCardTitle?: string
  organizationActionText?: string
  organizationAvatarText?: string
}

// 02）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 03）数组随机打散函数（shuffleItems）
/**
 * 函数名：shuffleItems
 * 功能：对传入数组执行浅拷贝随机打散，用于“换一换”推荐批次生成。
 * 实现方法：
 * - 先复制输入数组避免修改原始数据
 * - 使用 Fisher-Yates 思路从后向前交换元素
 * - 返回新的随机顺序数组
 * 输入：
 * - items：待随机打散的数据数组
 * 输出：
 * - 返回值：T[]，随机顺序的新数组
 * - 副作用：无
 */
function shuffleItems<T>(items: T[]): T[] {
  const clonedItems: T[] = [...items]

  for (let index = clonedItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = clonedItems[index]
    clonedItems[index] = clonedItems[randomIndex]
    clonedItems[randomIndex] = currentItem
  }

  return clonedItems
}

// 04）推荐批次截取函数（pickRecommendationBatch）
/**
 * 函数名：pickRecommendationBatch
 * 功能：从完整数据池中随机抽取指定数量的一批推荐项。
 * 实现方法：
 * - 对输入数组执行随机打散
 * - 按 count 截取前 N 条作为一批
 * - count 超出数组长度时返回全部数据
 * 输入：
 * - items：完整推荐数据池
 * - count：每批次需要返回的数量
 * 输出：
 * - 返回值：T[]，本次推荐批次数据
 * - 副作用：无
 */
function pickRecommendationBatch<T>(items: T[], count: number): T[] {
  const safeCount = Math.max(1, Math.min(items.length, count))
  return shuffleItems(items).slice(0, safeCount)
}

// 05）项目专区通用布局组件（ProjectZonePageLayout）
/**
 * 函数名：ProjectZonePageLayout
 * 功能：渲染首页/企业实战/高校招募三类页面共用的项目列表双栏布局。
 * 实现方法：
 * - 复用 TopNavbar 渲染统一顶部导航
 * - 左侧按项目数组渲染 ProjectCard 列表流
 * - 右侧复用搜索、类型、组织推荐、公告四块侧栏卡片
 * - 通过可选参数切换组织推荐卡片标题与头像文案
 * 输入：
 * - sectionTitle：左侧内容区标题
 * - searchInputId：搜索输入框唯一 id
 * - projects：项目数据数组
 * - experienceRecommendedNotes：首页经验推荐笔记列表，可选
 * - recommendedTypes：推荐类型标签数组
 * - recommendedOrganizations：推荐组织列表（企业或实验室）
 * - announcements：公告数据数组
 * - organizationCardTitle：组织推荐卡片标题，可选
 * - organizationActionText：组织推荐卡片右上角文案，可选
 * - organizationAvatarText：组织列表头像文字，可选
 * 输出：
 * - 返回值：JSX.Element，完整项目专区页面结构
 * - 副作用：无
 */
function ProjectZonePageLayout({
  sectionTitle,
  searchInputId,
  projects,
  experienceRecommendedNotes,
  recommendedTypes,
  recommendedOrganizations,
  announcements,
  organizationCardTitle,
  organizationActionText,
  organizationAvatarText,
}: ProjectZonePageLayoutProps) {
  const projectBatchSize = useMemo<number>(() => {
    return Math.max(1, Math.min(projects.length, 5))
  }, [projects.length])

  const experienceNoteBatchSize = useMemo<number>(() => {
    if (!experienceRecommendedNotes || experienceRecommendedNotes.length === 0) {
      return 0
    }

    return Math.min(experienceRecommendedNotes.length, 4)
  }, [experienceRecommendedNotes])

  const [recommendedProjectBatch, setRecommendedProjectBatch] = useState<ProjectItem[]>(() =>
    pickRecommendationBatch(projects, projectBatchSize),
  )

  const [recommendedNoteBatch, setRecommendedNoteBatch] = useState<ProfileNoteItem[]>(() =>
    experienceRecommendedNotes && experienceRecommendedNotes.length > 0
      ? pickRecommendationBatch(experienceRecommendedNotes, Math.min(experienceRecommendedNotes.length, 4))
      : [],
  )

  // 06）项目批次同步副作用（useEffect）
  useEffect(() => {
    setRecommendedProjectBatch(pickRecommendationBatch(projects, projectBatchSize))
  }, [projects, projectBatchSize])

  // 07）经验推荐批次同步副作用（useEffect）
  useEffect(() => {
    if (!experienceRecommendedNotes || experienceRecommendedNotes.length === 0) {
      setRecommendedNoteBatch([])
      return
    }

    setRecommendedNoteBatch(pickRecommendationBatch(experienceRecommendedNotes, experienceNoteBatchSize))
  }, [experienceRecommendedNotes, experienceNoteBatchSize])

  // 08）项目换一换处理函数（handleRefreshProjects）
  const handleRefreshProjects = (): void => {
    setRecommendedProjectBatch(pickRecommendationBatch(projects, projectBatchSize))
  }

  // 09）经验推荐换一换处理函数（handleRefreshExperienceNotes）
  const handleRefreshExperienceNotes = (): void => {
    if (!experienceRecommendedNotes || experienceRecommendedNotes.length === 0) {
      return
    }

    setRecommendedNoteBatch(pickRecommendationBatch(experienceRecommendedNotes, experienceNoteBatchSize))
  }

  // 10）经验推荐卡片列表渲染缓存（renderedExperienceNoteCards）
  const renderedExperienceNoteCards = useMemo(() => {
    return recommendedNoteBatch.map((note) => <GridNoteCard key={`home-experience-${note.title}`} note={note} />)
  }, [recommendedNoteBatch])

  // 11）项目卡片列表渲染缓存（renderedProjectCards）
  const renderedProjectCards = useMemo(() => {
    return recommendedProjectBatch.map((project) => (
      <ProjectCard key={`${project.title}-${project.publisher}`} project={project} />
    ))
  }, [recommendedProjectBatch])

  return (
    <div className="home-page">
      <TopNavbar navItems={navItems} />

      <main className="home-main">
        <section className="project-section" aria-label={sectionTitle}>
          {recommendedNoteBatch.length > 0 ? (
            <article className="home-experience-recommendation" aria-label="经验推荐">
              <div className="section-title-row">
                <h2 className="section-title">经验推荐</h2>
                <button type="button" className="section-refresh-button" onClick={handleRefreshExperienceNotes}>
                  换一换
                </button>
              </div>
              <div className="home-experience-recommendation__grid">
                {renderedExperienceNoteCards}
              </div>
            </article>
          ) : null}
          <div className="section-title-row">
            <h2 className="section-title">{sectionTitle}</h2>
            <button type="button" className="section-refresh-button" onClick={handleRefreshProjects}>
              换一换
            </button>
          </div>
          <div className="project-list">
            {renderedProjectCards}
          </div>
        </section>

        <aside className="sidebar" aria-label="右侧信息栏">
          <SearchSidebarCard inputId={searchInputId} />
          <RecommendedTypesCard types={recommendedTypes} />
          <RecommendedCompaniesCard
            companies={recommendedOrganizations}
            title={organizationCardTitle}
            actionText={organizationActionText}
            avatarText={organizationAvatarText}
          />
          <AnnouncementsCard announcements={announcements} />
        </aside>
      </main>
    </div>
  )
}

export default ProjectZonePageLayout
