import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// 01）主题模式类型定义（ThemeMode）
export type ThemeMode = 'light' | 'dark'

// 02）主题上下文类型定义（ThemeContextValue）
interface ThemeContextValue {
  theme: ThemeMode
  hasCustomTheme: boolean
  toggleTheme: () => void
  resetToSystemTheme: () => void
}

// 03）主题缓存键常量（THEME_STORAGE_KEY）
const THEME_STORAGE_KEY = 'web-client-theme-preference'

// 04）主题上下文对象（ThemeContext）
const ThemeContext = createContext<ThemeContextValue | null>(null)

// 05）读取系统主题函数（getSystemTheme）
/**
 * 函数名：getSystemTheme
 * 功能：读取用户系统级深浅色偏好并返回对应主题模式。
 * 实现方法：
 * - 使用 matchMedia 检测 prefers-color-scheme: dark
 * - 在浏览器环境中返回 dark 或 light
 * - 在非浏览器环境下回退为 light
 * 输入：
 * - 无
 * 输出：
 * - 返回值：ThemeMode，系统主题模式
 * - 副作用：无
 */
function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 06）读取缓存主题函数（getStoredThemePreference）
/**
 * 函数名：getStoredThemePreference
 * 功能：从 localStorage 读取用户手动设置的主题偏好。
 * 实现方法：
 * - 读取固定键名缓存值
 * - 校验缓存值仅允许 light 或 dark
 * - 异常场景统一返回 null
 * 输入：
 * - 无
 * 输出：
 * - 返回值：ThemeMode | null，合法缓存值或空值
 * - 副作用：无
 */
function getStoredThemePreference(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }
  } catch {
    return null
  }

  return null
}

// 07）读取文档主题函数（getDocumentTheme）
/**
 * 函数名：getDocumentTheme
 * 功能：读取 html 元素上已设置的 data-theme 值，作为应用初始化兜底。
 * 实现方法：
 * - 在浏览器环境读取 documentElement.dataset.theme
 * - 校验值是否为 light 或 dark
 * - 无效值或非浏览器环境返回 null
 * 输入：
 * - 无
 * 输出：
 * - 返回值：ThemeMode | null，文档上的主题值或空值
 * - 副作用：无
 */
function getDocumentTheme(): ThemeMode | null {
  if (typeof document === 'undefined') {
    return null
  }

  const documentTheme = document.documentElement.dataset.theme
  if (documentTheme === 'light' || documentTheme === 'dark') {
    return documentTheme
  }

  return null
}

// 08）解析初始主题函数（resolveInitialTheme）
/**
 * 函数名：resolveInitialTheme
 * 功能：解析应用启动时应使用的主题模式。
 * 实现方法：
 * - 优先读取 html 上预设 data-theme（用于首屏无闪烁）
 * - 优先读取 localStorage 中的用户偏好
 * - 若无用户偏好则回退到系统主题
 * - 返回最终的初始化主题值
 * 输入：
 * - 无
 * 输出：
 * - 返回值：ThemeMode，应用初始主题
 * - 副作用：无
 */
function resolveInitialTheme(): ThemeMode {
  const documentTheme = getDocumentTheme()
  if (documentTheme) {
    return documentTheme
  }

  const storedTheme = getStoredThemePreference()
  if (storedTheme) {
    return storedTheme
  }

  return getSystemTheme()
}

// 09）主题提供者参数类型（ThemeProviderProps）
interface ThemeProviderProps {
  children: ReactNode
}

// 10）全局主题提供者组件（ThemeProvider）
/**
 * 函数名：ThemeProvider
 * 功能：为整个应用提供全局主题状态、系统同步能力与本地持久化能力。
 * 实现方法：
 * - 初始化时读取缓存并回退系统主题
 * - 将最终主题写入 documentElement 的 data-theme，实现全局样式生效
 * - 在用户未自定义主题时监听系统主题变化并自动同步
 * - 用户自定义主题后写入 localStorage 以便下次恢复
 * 输入：
 * - children：需要使用主题能力的组件树
 * 输出：
 * - 返回值：JSX.Element，包裹上下文后的组件树
 * - 副作用：读写 localStorage、监听系统主题变化、修改 html data-theme 属性
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(resolveInitialTheme)
  const [hasCustomTheme, setHasCustomTheme] = useState<boolean>(() => getStoredThemePreference() !== null)

  // 11）应用主题函数（applyTheme）
  /**
   * 函数名：applyTheme
   * 功能：统一应用目标主题，并在支持时使用 View Transitions API 平滑过渡。
   * 实现方法：
   * - 根据 animate 参数和系统“减少动态效果”偏好决定是否启用视图过渡
   * - 在过渡回调中同时更新 html data-theme 与 React theme 状态
   * - 不支持 API 或禁用动画时直接同步更新主题
   * 输入：
   * - nextTheme：目标主题模式（light/dark）
   * - animate：是否启用过渡动画（默认 true）
   * 输出：
   * - 返回值：void
   * - 副作用：更新 documentElement 属性与 React 状态
   */
  const applyTheme = useCallback((nextTheme: ThemeMode, animate = true): void => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      setTheme(nextTheme)
      return
    }

    const rootElement = document.documentElement
    const updateTheme = (): void => {
      rootElement.dataset.theme = nextTheme
      setTheme(nextTheme)
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (animate && !prefersReducedMotion && 'startViewTransition' in document) {
      document.startViewTransition(() => {
        updateTheme()
      })
      return
    }

    updateTheme()
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || hasCustomTheme) {
      return
    }

    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
      applyTheme(event.matches ? 'dark' : 'light', false)
    }

    mediaQueryList.addEventListener('change', handleSystemThemeChange)
    return () => {
      mediaQueryList.removeEventListener('change', handleSystemThemeChange)
    }
  }, [hasCustomTheme, applyTheme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      if (hasCustomTheme) {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
      } else {
        window.localStorage.removeItem(THEME_STORAGE_KEY)
      }
    } catch {
      // localStorage 不可用时静默降级
    }
  }, [hasCustomTheme, theme])

  const toggleTheme = (): void => {
    setHasCustomTheme(true)
    applyTheme(theme === 'light' ? 'dark' : 'light', true)
  }

  const resetToSystemTheme = (): void => {
    setHasCustomTheme(false)
    applyTheme(getSystemTheme(), false)
  }

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      hasCustomTheme,
      toggleTheme,
      resetToSystemTheme,
    }),
    [theme, hasCustomTheme],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

// 12）主题上下文读取 Hook（useTheme）
/**
 * 函数名：useTheme
 * 功能：读取全局主题上下文，供任意组件获取当前主题和操作方法。
 * 实现方法：
 * - 调用 useContext 获取 ThemeContext 的值
 * - 在未被 ThemeProvider 包裹时抛出错误，避免静默失败
 * - 返回完整主题上下文对象
 * 输入：
 * - 无
 * 输出：
 * - 返回值：ThemeContextValue，包含 theme、toggleTheme 等能力
 * - 副作用：无
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用')
  }

  return context
}
