import HomePage from './pages/HomePage'

// 01）应用入口组件（App）
/**
 * 函数名：App
 * 功能：作为 Web Client 应用根组件，挂载首页页面组件。
 * 实现方法：
 * - 引入首页页面组件
 * - 直接返回首页组件作为当前应用默认入口
 * 输入：
 * - 无
 * 输出：
 * - 返回值：JSX.Element，首页组件实例
 * - 副作用：无
 */
function App() {
  return <HomePage />
}

export default App
