import { useEffect, useMemo, useState } from 'react'
import type { ProjectItem } from '../../types/project'
import type { ProfileNoteItem } from '../../pages/ProfileSpace/components/types'
import { useActionCooldown } from '../../hooks/useActionCooldown'
import { FEED_SHUFFLE_COOLDOWN_MS } from '../../api/feed/constants'
import { EXPERIENCE_NOTE_BATCH_SIZE, PROJECT_BATCH_SIZE } from './constants'
import { pickRecommendationBatch } from './recommendationUtils'

// 01）Hook 参数类型（UseProjectChannelLayoutParams）
interface UseProjectChannelLayoutParams {
  projects: ProjectItem[]
  experienceRecommendedNotes?: ProfileNoteItem[]
}

// 02）项目频道布局业务 Hook（useProjectChannelLayout）
/**
 * 函数名：useProjectChannelLayout
 * 功能：管理项目频道布局中"项目随机批次"与"经验推荐随机批次"两路推荐状态，
 *      并在数据源变化时自动重置批次。
 * 实现方法：
 * - 根据项目池与笔记池长度推导本次展示的批次大小
 * - useState 初始化两路推荐批次
 * - 两个 useEffect 在数据源变化时同步刷新批次
 * - 提供两组「换一换」回调供视图按钮使用
 * 输入：
 * - projects：项目数据池
 * - experienceRecommendedNotes：可选，经验推荐笔记池
 * 输出：
 * - 返回值：批次状态与换一换处理器
 * - 副作用：组件内部 state 更新
 */
export function useProjectChannelLayout({ projects, experienceRecommendedNotes }: UseProjectChannelLayoutParams) {
  const projectBatchSize = useMemo<number>(() => {
    return Math.max(1, Math.min(projects.length, PROJECT_BATCH_SIZE))
  }, [projects.length])

  const experienceNoteBatchSize = useMemo<number>(() => {
    if (!experienceRecommendedNotes || experienceRecommendedNotes.length === 0) {
      return 0
    }

    return Math.min(experienceRecommendedNotes.length, EXPERIENCE_NOTE_BATCH_SIZE)
  }, [experienceRecommendedNotes])

  const [recommendedProjectBatch, setRecommendedProjectBatch] = useState<ProjectItem[]>(() =>
    pickRecommendationBatch(projects, projectBatchSize),
  )

  const [recommendedNoteBatch, setRecommendedNoteBatch] = useState<ProfileNoteItem[]>(() =>
    experienceRecommendedNotes && experienceRecommendedNotes.length > 0
      ? pickRecommendationBatch(experienceRecommendedNotes, Math.min(experienceRecommendedNotes.length, EXPERIENCE_NOTE_BATCH_SIZE))
      : [],
  )

  const {
    isOnCooldown: isProjectRefreshCooldown,
    remainingSeconds: projectRefreshCooldownSeconds,
    startCooldown: startProjectRefreshCooldown,
    resetCooldown: resetProjectRefreshCooldown,
  } = useActionCooldown({ cooldownMs: FEED_SHUFFLE_COOLDOWN_MS })

  const {
    isOnCooldown: isExperienceRefreshCooldown,
    remainingSeconds: experienceRefreshCooldownSeconds,
    startCooldown: startExperienceRefreshCooldown,
    resetCooldown: resetExperienceRefreshCooldown,
  } = useActionCooldown({ cooldownMs: FEED_SHUFFLE_COOLDOWN_MS })

  // 03）项目批次随数据源刷新副作用（useEffect）
  useEffect(() => {
    setRecommendedProjectBatch(pickRecommendationBatch(projects, projectBatchSize))
    resetProjectRefreshCooldown()
  }, [projects, projectBatchSize, resetProjectRefreshCooldown])

  // 04）经验推荐批次随数据源刷新副作用（useEffect）
  useEffect(() => {
    if (!experienceRecommendedNotes || experienceRecommendedNotes.length === 0) {
      setRecommendedNoteBatch([])
      resetExperienceRefreshCooldown()
      return
    }

    setRecommendedNoteBatch(pickRecommendationBatch(experienceRecommendedNotes, experienceNoteBatchSize))
    resetExperienceRefreshCooldown()
  }, [experienceRecommendedNotes, experienceNoteBatchSize, resetExperienceRefreshCooldown])

  // 05）项目换一换（handleRefreshProjects）
  const handleRefreshProjects = (): void => {
    if (isProjectRefreshCooldown) {
      return
    }

    setRecommendedProjectBatch(pickRecommendationBatch(projects, projectBatchSize))
    startProjectRefreshCooldown()
  }

  // 06）经验推荐换一换（handleRefreshExperienceNotes）
  const handleRefreshExperienceNotes = (): void => {
    if (!experienceRecommendedNotes || experienceRecommendedNotes.length === 0 || isExperienceRefreshCooldown) {
      return
    }

    setRecommendedNoteBatch(pickRecommendationBatch(experienceRecommendedNotes, experienceNoteBatchSize))
    startExperienceRefreshCooldown()
  }

  return {
    recommendedProjectBatch,
    recommendedNoteBatch,
    handleRefreshProjects,
    handleRefreshExperienceNotes,
    isProjectRefreshCooldown,
    projectRefreshCooldownSeconds,
    isExperienceRefreshCooldown,
    experienceRefreshCooldownSeconds,
  }
}

// 07）项目频道布局业务模型类型（ProjectChannelLayoutModel）
export type ProjectChannelLayoutModel = ReturnType<typeof useProjectChannelLayout>
