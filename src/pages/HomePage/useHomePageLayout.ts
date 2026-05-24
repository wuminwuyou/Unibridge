import { useEffect, useMemo, useState } from 'react'
import type { ProjectItem } from '../../types/project'
import type { ProfileNoteItem } from '../ProfileSpace/components/types'
import { pickRecommendationBatch } from '../../components/ProjectChannelLayout/recommendationUtils'

// 01）首页布局批次常量（HOME_PROJECT_BATCH_SIZE / HOME_SIDEBAR_NOTE_BATCH_SIZE）
export const HOME_PROJECT_BATCH_SIZE = 5
export const HOME_SIDEBAR_NOTE_BATCH_SIZE = 4

// 02）首页布局 Hook 参数（UseHomePageLayoutParams）
interface UseHomePageLayoutParams {
  projects: ProjectItem[]
  sidebarNotes: ProfileNoteItem[]
}

// 03）首页布局业务 Hook（useHomePageLayout）
/**
 * 函数名：useHomePageLayout
 * 功能：管理首页左侧项目流与右侧经验侧栏的推荐批次状态。
 * 实现方法：
 * - 根据数据池长度计算批次大小
 * - 初始化并在数据源变化时刷新两路批次
 * 输入：
 * - projects：项目数据池
 * - sidebarNotes：侧栏笔记数据池
 * 输出：
 * - 返回值：项目批次与侧栏笔记批次
 * - 副作用：组件内部 state 更新
 */
export function useHomePageLayout({ projects, sidebarNotes }: UseHomePageLayoutParams) {
  const projectBatchSize = useMemo<number>(() => {
    return Math.max(1, Math.min(projects.length, HOME_PROJECT_BATCH_SIZE))
  }, [projects.length])

  const sidebarNoteBatchSize = useMemo<number>(() => {
    if (sidebarNotes.length === 0) {
      return 0
    }

    return Math.min(sidebarNotes.length, HOME_SIDEBAR_NOTE_BATCH_SIZE)
  }, [sidebarNotes.length])

  const [projectBatch, setProjectBatch] = useState<ProjectItem[]>(() =>
    pickRecommendationBatch(projects, projectBatchSize),
  )

  const [sidebarNoteBatch, setSidebarNoteBatch] = useState<ProfileNoteItem[]>(() =>
    sidebarNotes.length > 0 ? pickRecommendationBatch(sidebarNotes, sidebarNoteBatchSize) : [],
  )

  // 04）项目批次随数据源刷新（useEffect）
  useEffect(() => {
    setProjectBatch(pickRecommendationBatch(projects, projectBatchSize))
  }, [projects, projectBatchSize])

  // 05）侧栏笔记批次随数据源刷新（useEffect）
  useEffect(() => {
    if (sidebarNotes.length === 0) {
      setSidebarNoteBatch([])
      return
    }

    setSidebarNoteBatch(pickRecommendationBatch(sidebarNotes, sidebarNoteBatchSize))
  }, [sidebarNotes, sidebarNoteBatchSize])

  return {
    projectBatch,
    sidebarNoteBatch,
  }
}

export type HomePageLayoutModel = ReturnType<typeof useHomePageLayout>
