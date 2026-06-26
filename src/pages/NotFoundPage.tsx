import { FileQuestion, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'

// 01）设置页面标题（useNotFoundTitle）
function useNotFoundTitle() {
  useEffect(() => {
    document.title = '404 - 页面未找到 | UniBridge'
  }, [])
}

// 02）404 页面（NotFoundPage）
/**
 * 函数名：NotFoundPage
 * 功能：展示 404 未找到页面，提供回首页入口。
 * 实现方法：
 * - 居中布局，图标 + 标题 + 描述 + 返回首页链接
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export default function NotFoundPage() {
  useNotFoundTitle()

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center px-6 py-12 max-w-md">
        <FileQuestion
          className="mx-auto mb-6 h-20 w-20 text-slate-300 dark:text-slate-600"
          aria-hidden="true"
        />

        <h1 className="text-6xl font-extrabold text-slate-200 dark:text-slate-700 mb-4">
          404
        </h1>

        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3">
          页面未找到
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          你访问的页面可能已被移除、链接失效，或者 URL 拼写有误。
          <br />
          请检查网络链接是否正确。
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <Home className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    </main>
  )
}
