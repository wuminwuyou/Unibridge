// 01）全局主题提供者组件（ThemeProvider）
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext, type ThemeMode, type ThemeContextValue } from '../../shared/hooks/useTheme'

const THEME_STORAGE_KEY = 'web-client-theme-preference'

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredThemePreference(): ThemeMode | null {
  if (typeof window === 'undefined') return null
  try { const s = window.localStorage.getItem(THEME_STORAGE_KEY); if (s === 'light' || s === 'dark') return s } catch { return null }
  return null
}

function resolveInitialTheme(): ThemeMode {
  if (typeof document !== 'undefined') { const d = document.documentElement.dataset.theme; if (d === 'light' || d === 'dark') return d }
  return getStoredThemePreference() ?? getSystemTheme()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(resolveInitialTheme)
  const [hasCustomTheme, setHasCustomTheme] = useState<boolean>(() => getStoredThemePreference() !== null)

  const applyTheme = useCallback((nextTheme: ThemeMode, animate = true): void => {
    if (typeof document === 'undefined' || typeof window === 'undefined') { setTheme(nextTheme); return }
    const root = document.documentElement
    const update = (): void => { root.dataset.theme = nextTheme; setTheme(nextTheme) }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (animate && !prefersReducedMotion && 'startViewTransition' in document) { document.startViewTransition(() => { update() }); return }
    update()
  }, [])

  useEffect(() => { if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || hasCustomTheme) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const h = (e: MediaQueryListEvent): void => { applyTheme(e.matches ? 'dark' : 'light', false) }
    mql.addEventListener('change', h); return () => mql.removeEventListener('change', h)
  }, [hasCustomTheme, applyTheme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try { if (hasCustomTheme) window.localStorage.setItem(THEME_STORAGE_KEY, theme); else window.localStorage.removeItem(THEME_STORAGE_KEY) } catch { /* 静默降级 */ }
  }, [hasCustomTheme, theme])

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme, hasCustomTheme,
    toggleTheme: () => { setHasCustomTheme(true); applyTheme(theme === 'light' ? 'dark' : 'light', true) },
    resetToSystemTheme: () => { setHasCustomTheme(false); applyTheme(getSystemTheme(), false) },
  }), [theme, hasCustomTheme, applyTheme])

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
