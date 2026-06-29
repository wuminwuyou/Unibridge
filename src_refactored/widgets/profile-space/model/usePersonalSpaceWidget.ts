// 01）个人空间纯 UI 交互 Hook（usePersonalSpaceWidget）
import { useCallback, useState } from 'react'

// 02）个人空间纯 UI 交互返回（PersonalSpaceUiState）
export interface PersonalSpaceUiState {
  isCreateTeamModalOpen: boolean
  openCreateTeamModal: () => void
  closeCreateTeamModal: () => void
}

// 03）个人空间纯 UI 交互 Hook（usePersonalSpaceWidget）
/**
 * 函数名：usePersonalSpaceWidget
 * 功能：管理个人空间侧栏中「创建团队」弹窗等纯 UI 临时状态。
 * 实现方法：
 * - 使用 useState 维护弹窗开/关
 * - 通过 useCallback 暴露稳定回调
 * 输入：无
 * 输出：
 * - 返回值：PersonalSpaceUiState
 * - 副作用：无（仅本地状态变更）
 */
export function usePersonalSpaceWidget(): PersonalSpaceUiState {
  const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false)

  const openCreateTeamModal = useCallback((): void => {
    setCreateTeamModalOpen(true)
  }, [])

  const closeCreateTeamModal = useCallback((): void => {
    setCreateTeamModalOpen(false)
  }, [])

  return {
    isCreateTeamModalOpen,
    openCreateTeamModal,
    closeCreateTeamModal,
  }
}
