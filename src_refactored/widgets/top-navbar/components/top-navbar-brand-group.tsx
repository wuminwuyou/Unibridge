// 01）TopNavbar 品牌区（TopNavbarBrandGroup）
/**
 * 函数名：TopNavbarBrandGroup
 * 功能：渲染顶部导航左侧品牌 Logo 与文案。
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function TopNavbarBrandGroup() {
  return (
    <div className="brand-group">
      <div className="brand-logo" aria-hidden="true">
        U
      </div>
      <div className="brand-text">
        <strong>众创桥</strong>
        <span>连接企业与未来人才</span>
      </div>
    </div>
  )
}
