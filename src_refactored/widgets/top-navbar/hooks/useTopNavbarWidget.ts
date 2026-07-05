// 01）TopNavbar Widget 编排 Hook（useTopNavbarWidget）
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/hooks/useAuth'
import { useTheme } from '@shared/hooks/useTheme'
import { isOrganizationAdminRole, isCounselorRole } from '@shared/lib/organizationSession'
import { getAccessToken, getRefreshToken } from '@shared/lib/tokenStorage'
import { createPublishEntryFreshLocationState } from '@shared/lib/publishEntryNavigation'
import { buildNoteEditorPath } from '@shared/lib/noteRoutes'
import { clearNoteDetailPreview, clearNoteEditorFormSession } from '@features/note-editor'
import { useNoteEditorTypeModal } from '@features/note-editor-entry'
import { logoutByTokens } from '@features/auth-process/services/authService'
import { resolveActiveNavByPathname } from '../navRoutes'
import {
  codeMenuOptions,
  publishEntryMenuOptions,
  type PublishEntryType,
  type PublishMenuOption,
} from '../constants/publishMenuOptions'
import { isSchoolEntity } from '../lib/publishMenuUtils'
import { useTopNavbarScrollHide } from './useTopNavbarScrollHide'

// 02）Widget 视图模型（TopNavbarWidgetModel）
export interface TopNavbarWidgetModel {
  headerClassName: string
  activeNavItem: string
  theme: ReturnType<typeof useTheme>['theme']
  themeLabel: string
  toggleTheme: ReturnType<typeof useTheme>['toggleTheme']
  isLoggedIn: boolean
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
  isPublishMenuOpen: boolean
  isCodeMenuOpen: boolean
  publishMenuRef: RefObject<HTMLDivElement | null>
  showSchoolCodeEntry: boolean
  publishMenuOptions: PublishMenuOption[]
  isCodeGenerateModalOpen: boolean
  isCodeManageModalOpen: boolean
  noteEditorTypeModal: ReturnType<typeof useNoteEditorTypeModal>
  handlePublishEntryClick: () => void
  handleNotifyClick: () => void
  handleAuthEntryClick: () => void
  handleSelectPublishType: (type: PublishEntryType) => void
  handleLogout: () => void
  setIsCodeMenuOpen: (value: boolean | ((previous: boolean) => boolean)) => void
  setIsPublishMenuOpen: (value: boolean | ((previous: boolean) => boolean)) => void
  setIsCodeGenerateModalOpen: (value: boolean | ((previous: boolean) => boolean)) => void
  setIsCodeManageModalOpen: (value: boolean | ((previous: boolean) => boolean)) => void
}

/**
 * 函数名：useTopNavbarWidget
 * 功能：编排 TopNavbar 的业务状态（导航高亮、发布菜单、认证弹窗、滚动隐藏）。
 * 实现方法：
 * - useTopNavbarScrollHide 处理白名单页滚动显隐
 * - 聚合角色判断、发布菜单选项与路由跳转
 * 输入：无
 * 输出：
 * - 返回值：TopNavbarWidgetModel
 * - 副作用：document 事件、navigate、logout API
 */
export function useTopNavbarWidget(): TopNavbarWidgetModel {
  const { isLoggedIn, userProfile, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { headerClassName } = useTopNavbarScrollHide()

  const activeNavItem = resolveActiveNavByPathname(location.pathname)
  const themeLabel = `切换到${theme === 'light' ? '深色' : '浅色'}主题`

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false)
  const publishMenuRef = useRef<HTMLDivElement | null>(null)
  const [isCodeMenuOpen, setIsCodeMenuOpen] = useState(false)
  const [isCodeGenerateModalOpen, setIsCodeGenerateModalOpen] = useState(false)
  const [isCodeManageModalOpen, setIsCodeManageModalOpen] = useState(false)

  const isOrgAdmin = isOrganizationAdminRole(userProfile?.userRole)
  const isCounselor = isCounselorRole(userProfile?.userRole)
  const isSchool = isSchoolEntity(userProfile?.entityCode)
  const showSchoolCodeEntry = isOrgAdmin && isSchool
  const showCodeEntryInPublish = isCounselor

  const publishMenuOptions = useMemo(() => {
    let options = isCounselor
      ? publishEntryMenuOptions.filter((option) => option.type === 'note')
      : [...publishEntryMenuOptions]
    if (showCodeEntryInPublish) {
      options = [...options, ...codeMenuOptions]
    }
    return options
  }, [isCounselor, showCodeEntryInPublish])

  useEffect(() => {
    if (!isPublishMenuOpen && !isCodeMenuOpen) {
      return undefined
    }

    const handleMouseDown = (event: MouseEvent): void => {
      if (!(event.target instanceof Node) || publishMenuRef.current?.contains(event.target)) {
        return
      }
      setIsPublishMenuOpen(false)
      setIsCodeMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsPublishMenuOpen(false)
        setIsCodeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCodeMenuOpen, isPublishMenuOpen])

  const handlePublishEntryClick = useCallback((): void => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true)
      return
    }
    setIsPublishMenuOpen((previous) => !previous)
    setIsCodeMenuOpen(false)
  }, [isLoggedIn])

  const handleNotifyClick = useCallback((): void => {
    navigate('/messages')
  }, [navigate])

  const handleAuthEntryClick = useCallback((): void => {
    setIsAuthModalOpen(true)
  }, [])

  const noteEditorTypeModal = useNoteEditorTypeModal({
    onSelect: (type) => {
      clearNoteDetailPreview()
      clearNoteEditorFormSession()
      navigate(buildNoteEditorPath({ type }), { state: createPublishEntryFreshLocationState() })
    },
  })

  const handleSelectPublishType = useCallback(
    (type: PublishEntryType): void => {
      setIsPublishMenuOpen(false)
      setIsCodeMenuOpen(false)

      if (type === 'code-generate') {
        setIsCodeGenerateModalOpen(true)
        return
      }
      if (type === 'code-manage') {
        setIsCodeManageModalOpen(true)
        return
      }
      if (type === 'note') {
        noteEditorTypeModal.open()
        return
      }

      const option = publishEntryMenuOptions.find((item) => item.type === type)
      if (option?.path) {
        navigate(option.path, { state: createPublishEntryFreshLocationState() })
      }
    },
    [navigate, noteEditorTypeModal],
  )

  const handleLogout = useCallback((): void => {
    void (async () => {
      const accessToken = getAccessToken()
      const refreshToken = getRefreshToken()
      try {
        if (accessToken && refreshToken) {
          await logoutByTokens({ accessToken, refreshToken })
        }
      } catch (error) {
        console.warn('退出登录接口失败：', error)
      } finally {
        logout()
        window.location.reload()
      }
    })()
  }, [logout])

  return {
    headerClassName,
    activeNavItem,
    theme,
    themeLabel,
    toggleTheme,
    isLoggedIn,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isPublishMenuOpen,
    isCodeMenuOpen,
    publishMenuRef,
    showSchoolCodeEntry,
    publishMenuOptions,
    isCodeGenerateModalOpen,
    isCodeManageModalOpen,
    noteEditorTypeModal,
    handlePublishEntryClick,
    handleNotifyClick,
    handleAuthEntryClick,
    handleSelectPublishType,
    handleLogout,
    setIsCodeMenuOpen,
    setIsPublishMenuOpen,
    setIsCodeGenerateModalOpen,
    setIsCodeManageModalOpen,
  }
}
