// 01）发布菜单工具（publishMenuUtils）

/**
 * 函数名：isSchoolEntity
 * 功能：根据 entityCode 判断是否为学校主体（5 位编码）。
 * 输入：
 * - code：机构编码，可选
 * 输出：
 * - 返回值：boolean
 */
export function isSchoolEntity(code?: string): boolean {
  return typeof code === 'string' && code.trim().length === 5
}
