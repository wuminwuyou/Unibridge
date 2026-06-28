// 01）主题上下文类型定义 & 读取 Hook（shared 层，不含 Provider）
import { createContext, useContext } from 'react'

export type ThemeMode = 'light' | 'dark'

// 02）主题上下文类型定义（ThemeContextValue）
export interface ThemeContextValue {
  theme: ThemeMode
  hasCustomTheme: boolean
  toggleTheme: () => void
  resetToSystemTheme: () => void
}

// 03）主题上下文对象（ThemeContext）
export const ThemeContext = createContext<ThemeContextValue | null>(null)

// 04）主题上下文读取 Hook（useTheme）
/**
 * 函数名：useTheme
 * 功能：读取全局主题上下文。
 * 输入：无
 * 输出：
 * - 返回值：ThemeContextValue
 * - 副作用：无
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme 必须在 ThemeProvider 内部使用')
  return context
}
