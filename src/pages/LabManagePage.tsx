// 01）实验室管理页占位组件（LabManagePage）
/**
 * 函数名：LabManagePage
 * 功能：提供 /lab/manage 受保护路由页面占位，验证路由守卫能力。
 * 实现方法：
 * - 渲染基础页面标题与说明文案
 * - 由上层 ProtectedRoute 控制访问权限
 * 输入：无
 * 输出：
 * - 返回值：页面 JSX
 * - 副作用：无
 */
function LabManagePage() {
  return (
    <main style={{ padding: '32px', color: 'var(--text-color, #1f2937)' }}>
      <h1>实验室管理</h1>
      <p>该页面为受保护页面，仅登录后可访问。</p>
    </main>
  )
}

export default LabManagePage
