import { useEffect, useState } from 'react'

// 01）文档主题类型（DocumentTheme）
export type DocumentTheme = 'light' | 'dark'

// 02）读取文档 data-theme（useDocumentTheme）
/**
 * 函数名：useDocumentTheme
 * 功能：订阅根节点 data-theme，供 MdEditor 等组件切换明暗主题。
 * 实现方法：
 * - 初始化读取 documentElement.dataset.theme
 * - MutationObserver 监听属性变化
 * 输入：无
 * 输出：
 * - 返回值：'light' | 'dark'
 * - 副作用：注册/注销 MutationObserver
 */
export function useDocumentTheme(): DocumentTheme {
  const [theme, setTheme] = useState<DocumentTheme>(() => readDocumentTheme())

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setTheme(readDocumentTheme())
    })

    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return theme
}

// 03）读取当前文档主题（readDocumentTheme）
function readDocumentTheme(): DocumentTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}
