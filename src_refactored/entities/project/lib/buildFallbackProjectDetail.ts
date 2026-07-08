// 01）Title 回退占位载荷（buildFallbackProjectDetail）
// 与旧版 buildFallbackFromSearch 字段级 1:1，返回完整 ProjectDetailPayload
import type { ProjectDetailPayload } from '../model/projectDetailViewModel'
import { DEFAULT_PROJECT_LEVEL } from '@shared/lib/levelConstants'

// 02）由 title 构建回退载荷（buildFallbackProjectDetail）
/**
 * 函数名：buildFallbackProjectDetail
 * 功能：路由 id 非有效 uid 时，按 title 构造完整占位载荷，与 API/预览共用 ProjectDetailView。
 * 输入：
 * - title：解码后的标题字符串（来自路由参数）
 * 输出：
 * - 返回值：ProjectDetailPayload | null（title 为空或仅空白时返回 null）
 */
export function buildFallbackProjectDetail(title: string | null): ProjectDetailPayload | null {
  const normalized = title?.trim()
  if (!normalized) {
    return null
  }

  return {
    title: normalized,
    summary: '该项目来自卡片链接，完整详情待后端接口接入。',
    channel: 'enterprise',
    channelLabel: '企业实战',
    description: '',
    descriptionEditorType: 'MARKDOWN',
    amountMin: '—',
    amountMax: '—',
    level: DEFAULT_PROJECT_LEVEL,
    duration: '—',
    skillTags: [],
    deadline: '—',
    publishStatus: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    owner: null,
  }
}
