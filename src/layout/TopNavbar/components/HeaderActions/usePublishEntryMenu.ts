import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearNoteDetailPreview } from '../../../../pages/NoteReader/shared/noteDetailPreviewSession'
import { clearPublishNoteSession } from '../../../../pages/PublishNote/publishNoteFormSession'
import { clearProjectDetailPreview } from '../../../../pages/ProjectDetailPage/projectDetailPreviewSession'
import { clearPublishProjectSession } from '../../../../pages/PublishProject/publishFormSession'
import { createPublishEntryFreshLocationState } from './publishEntryNavigation'
import type { PublishEntryType } from './publishEntryMenuData'
import { publishEntryMenuOptions } from './publishEntryMenuData'

// 01）发布入口 Hook 参数（UsePublishEntryMenuParams）
interface UsePublishEntryMenuParams {
  isAuthenticated: boolean
  onRequireAuth: () => void
}

// 02）发布入口 Hook 返回值（UsePublishEntryMenuResult）
export interface UsePublishEntryMenuResult {
  isMenuOpen: boolean
  menuRef: RefObject<HTMLDivElement | null>
  menuOptions: typeof publishEntryMenuOptions
  togglePublishMenu: () => void
  closePublishMenu: () => void
  handleSelectPublishType: (type: PublishEntryType) => void
}

// 03）发布入口下拉菜单 Hook（usePublishEntryMenu）
/**
 * 函数名：usePublishEntryMenu
 * 功能：管理顶部「发布」按钮的下拉菜单开关、选项选择与路由跳转。
 * 实现方法：
 * - 未登录时点击触发 onRequireAuth，不展开菜单
 * - 已登录时切换 isMenuOpen 展示向下弹层
 * - 监听 document 点击与 Escape 关闭菜单
 * - 选择 project/note 后清除 session 表单缓存并跳转（携带 publishEntryFresh 标记）
 * 输入：
 * - isAuthenticated：是否已登录
 * - onRequireAuth：未登录时的鉴权回调（通常打开登录弹窗）
 * 输出：
 * - 返回值：菜单状态、ref 与事件处理器
 * - 副作用：路由跳转、document 级事件监听
 */
export function usePublishEntryMenu({
  isAuthenticated,
  onRequireAuth,
}: UsePublishEntryMenuParams): UsePublishEntryMenuResult {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const closePublishMenu = (): void => {
    setIsMenuOpen(false)
  }

  const togglePublishMenu = (): void => {
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }

    setIsMenuOpen((previous) => !previous)
  }

  const handleSelectPublishType = (type: PublishEntryType): void => {
    const matchedOption = publishEntryMenuOptions.find((option) => option.type === type)
    if (!matchedOption) {
      return
    }

    if (type === 'project') {
      clearPublishProjectSession()
      clearProjectDetailPreview()
    } else {
      clearPublishNoteSession()
      clearNoteDetailPreview()
    }

    closePublishMenu()
    navigate(matchedOption.path, { state: createPublishEntryFreshLocationState() })
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handleDocumentPointerDown = (event: MouseEvent): void => {
      const targetNode = event.target
      if (!(targetNode instanceof Node)) {
        return
      }

      if (menuRef.current?.contains(targetNode)) {
        return
      }

      closePublishMenu()
    }

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closePublishMenu()
      }
    }

    document.addEventListener('mousedown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [isMenuOpen])

  return {
    isMenuOpen,
    menuRef,
    menuOptions: publishEntryMenuOptions,
    togglePublishMenu,
    closePublishMenu,
    handleSelectPublishType,
  }
}
