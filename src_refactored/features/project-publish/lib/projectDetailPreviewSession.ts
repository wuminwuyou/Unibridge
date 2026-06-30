// 01）项目详情预览 sessionStorage 工具
import type { ProjectDetailPayload } from '@entities/project'

// 02）项目详情预览存储键（PROJECT_DETAIL_PREVIEW_KEY）
const PROJECT_DETAIL_PREVIEW_KEY = 'unibridge.project-detail.preview'

// 03）保存项目详情预览（saveProjectDetailPreview）
export function saveProjectDetailPreview(payload: ProjectDetailPayload): void {
  try { sessionStorage.setItem(PROJECT_DETAIL_PREVIEW_KEY, JSON.stringify(payload)) } catch { /* 静默降级 */ }
}

// 04）读取项目详情预览（loadProjectDetailPreview）
export function loadProjectDetailPreview(): ProjectDetailPayload | null {
  try {
    const raw = sessionStorage.getItem(PROJECT_DETAIL_PREVIEW_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ProjectDetailPayload
  } catch { return null }
}

// 05）清除项目详情预览（clearProjectDetailPreview）
export function clearProjectDetailPreview(): void {
  try { sessionStorage.removeItem(PROJECT_DETAIL_PREVIEW_KEY) } catch { /* 静默降级 */ }
}
