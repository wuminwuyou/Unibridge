import type { ProjectDetailPayload } from './types'

// 01）项目详情预览存储键（PROJECT_DETAIL_PREVIEW_KEY）
const PROJECT_DETAIL_PREVIEW_KEY = 'unibridge.project-detail.preview'

// 02）保存项目详情预览（saveProjectDetailPreview）
/**
 * 函数名：saveProjectDetailPreview
 * 功能：将项目详情预览数据写入 sessionStorage，支持刷新后仍可查看。
 * 输入：
 * - payload：项目详情载荷
 * 输出：
 * - 副作用：写入 sessionStorage
 */
export function saveProjectDetailPreview(payload: ProjectDetailPayload): void {
  try {
    sessionStorage.setItem(PROJECT_DETAIL_PREVIEW_KEY, JSON.stringify(payload))
  } catch {
    // 静默降级
  }
}

// 03）读取项目详情预览（loadProjectDetailPreview）
/**
 * 函数名：loadProjectDetailPreview
 * 功能：从 sessionStorage 读取最近一次项目详情预览数据。
 * 输出：
 * - 返回值：ProjectDetailPayload 或 null
 */
export function loadProjectDetailPreview(): ProjectDetailPayload | null {
  try {
    const raw = sessionStorage.getItem(PROJECT_DETAIL_PREVIEW_KEY)
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as ProjectDetailPayload
  } catch {
    return null
  }
}

// 04）清除项目详情预览（clearProjectDetailPreview）
/**
 * 函数名：clearProjectDetailPreview
 * 功能：清除 sessionStorage 中的项目详情预览缓存，避免保存/发布后仍展示旧预览数据。
 * 输出：
 * - 副作用：移除 sessionStorage 键
 */
export function clearProjectDetailPreview(): void {
  try {
    sessionStorage.removeItem(PROJECT_DETAIL_PREVIEW_KEY)
  } catch {
    // 静默降级
  }
}
