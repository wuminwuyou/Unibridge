import { useEffect, useRef, useState, useMemo, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearNoteDetailPreview } from '../../../../pages/NoteReader/shared/noteDetailPreviewSession'
import { clearPublishNoteSession } from '../../../../pages/PublishNote/publishNoteFormSession'
import { clearProjectDetailPreview } from '../../../../pages/ProjectDetailPage/projectDetailPreviewSession'
import { clearPublishProjectSession } from '../../../../pages/PublishProject/publishFormSession'
import { createPublishEntryFreshLocationState } from './publishEntryNavigation'
import type { PublishEntryType } from './publishEntryMenuData'
import type { PublishEntryMenuOption } from './publishEntryMenuData'
import { publishEntryMenuOptions, codeMenuOptions } from './publishEntryMenuData'
import { isCounselorRole } from '../../../../auth/organizationSession'

// 01）发布入口 Hook 参数（UsePublishEntryMenuParams）
interface UsePublishEntryMenuParams {
  isAuthenticated: boolean
  userRole?: string | null
  /** 辅导员在学校主体下将认证码入口追加到发布菜单 */
  showCodeEntry?: boolean
  onOpenCodeGenerate?: () => void
  onOpenCodeManage?: () => void
  onRequireAuth: () => void
}

// 02）发布入口 Hook 返回值（UsePublishEntryMenuResult）
export interface UsePublishEntryMenuResult {
  isMenuOpen: boolean
  menuRef: RefObject<HTMLDivElement | null>
  menuOptions: PublishEntryMenuOption[]
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
 * - 辅导员角色仅可见「发布笔记」，不可见「发布项目」；额外合并「生成认证子码」「认证子码管理」
 * 输入：
 * - isAuthenticated：是否已登录
 * - userRole：当前用户角色
 * - showCodeEntry：是否展示认证子码入口（辅导员模式下为 true）
 * - onOpenCodeGenerate：打开生成认证子码弹窗回调
 * - onOpenCodeManage：打开认证子码管理弹窗回调
 * - onRequireAuth：未登录时的鉴权回调（通常打开登录弹窗）
 * 输出：
 * - 返回值：菜单状态、ref 与事件处理器
 * - 副作用：路由跳转、document 级事件监听
 */
export function usePublishEntryMenu({
  isAuthenticated,
  userRole,
  showCodeEntry = false,
  onOpenCodeGenerate,
  onOpenCodeManage,
  onRequireAuth,
}: UsePublishEntryMenuParams): UsePublishEntryMenuResult {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // 辅导员角色过滤掉「发布项目」；所有学校角色合并认证码入口
  const menuOptions = useMemo(() => {
    let options = isCounselorRole(userRole)
      ? publishEntryMenuOptions.filter((option) => option.type === 'note')
      : publishEntryMenuOptions

    if (showCodeEntry) {
      options = [...options, ...codeMenuOptions]
    }

    return options
  }, [userRole, showCodeEntry])

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
    // 认证码入口不走路由，直接触发回调
    if (type === 'code-generate') {
      closePublishMenu()
      onOpenCodeGenerate?.()
      return
    }

    if (type === 'code-manage') {
      closePublishMenu()
      onOpenCodeManage?.()
      return
    }

    const matchedOption = menuOptions.find((option) => option.type === type)
    if (!matchedOption || !matchedOption.path) {
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
    menuOptions,
    togglePublishMenu,
    closePublishMenu,
    handleSelectPublishType,
  }
}
