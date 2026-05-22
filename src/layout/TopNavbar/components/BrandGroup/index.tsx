// 01）品牌区视图（BrandGroup）
/**
 * 函数名：BrandGroup
 * 功能：渲染顶部导航左侧的品牌 Logo 与名称区。
 * 实现方法：
 * - 渲染圆形字母 Logo
 * - 渲染品牌名称与一句话标语
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element，品牌区结构
 * - 副作用：无
 */
function BrandGroup() {
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

export default BrandGroup
