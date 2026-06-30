// 01）editorial 回流预览 Banner 组件（EditorialPreviewBanner）
// 职责：展示「返回编辑」顶栏，Link 指向 /projects/create
// 依赖：@entities/project 类型（合法上层 → 下层）
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ProjectDetailPublishStatus } from '@entities/project'
import { resolveEditorialBannerText } from '../lib/editorialBannerText'
import styles from './EditorialPreviewBanner.module.css'

// 02）Banner Props（EditorialPreviewBannerProps）
export interface EditorialPreviewBannerProps {
  status: ProjectDetailPublishStatus
}

// 03）预览回流 Banner（EditorialPreviewBanner）
/**
 * 函数名：EditorialPreviewBanner
 * 功能：渲染编辑回流顶栏，根据 publishStatus 展示对应文案与返回链接。
 * 输入：
 * - status：DRAFT | PREVIEW | PUBLISHED
 * 输出：
 * - 返回值：React 节点
 */
export function EditorialPreviewBanner({ status }: EditorialPreviewBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>{resolveEditorialBannerText(status)}</p>
      <Link to="/projects/create" className={styles.action}>
        <ArrowLeft className="h-4 w-4" />
        返回编辑
      </Link>
    </div>
  )
}
