// 01）editorial 回流 Banner 文案映射（editorialBannerText）
import type { ProjectDetailPublishStatus } from '@entities/project'

// 02）发布状态 → 编辑回流提示文案（resolveEditorialBannerText）
/**
 * 函数名：resolveEditorialBannerText
 * 功能：根据发布状态返回详情页顶栏提示文案。
 * 迁移自旧 ProjectDetailView.resolveProjectEditorialBannerText。
 * 输入：
 * - status：DRAFT | PREVIEW | PUBLISHED
 * 输出：
 * - 返回值：中文提示文案
 */
export function resolveEditorialBannerText(status: ProjectDetailPublishStatus): string {
  if (status === 'PREVIEW') {
    return '当前为项目预览，请提前保存草稿'
  }
  if (status === 'DRAFT') {
    return '当前为项目草稿，可返回继续编辑'
  }
  return '项目已保存，可返回继续修改'
}
