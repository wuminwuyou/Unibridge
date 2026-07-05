import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resolveNoteEditorialBannerText } from '../../../entities/note/lib/noteDetailFormatUtils'
import type { NoteDetailPublishStatus } from '../../../entities/note/model/noteDetailCommon'
import styles from './NoteEditorialBanner.module.css'

// 01）预览回流横幅 Props（NoteEditorialBannerProps）
interface NoteEditorialBannerProps {
  publishStatus: NoteDetailPublishStatus
}

// 02）预览回流横幅组件（NoteEditorialBanner）
/**
 * 函数名：NoteEditorialBanner
 * 功能：发布预览/草稿态下展示「当前为笔记预览…」警告 +「返回编辑」链接。
 * 输入：
 * - publishStatus：DRAFT / PREVIEW / PUBLISHED
 * 输出：
 * - 返回值：React 节点
 */
export function NoteEditorialBanner({ publishStatus }: NoteEditorialBannerProps) {
  const bannerText = resolveNoteEditorialBannerText(publishStatus)

  return (
    <div className={`border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 ${styles.noteEditorialBanner}`}>
      <div className={styles.noteEditorialBannerInner}>
        <p className={`text-emerald-800 dark:text-emerald-200 ${styles.noteEditorialBannerText}`}>
          {bannerText}
        </p>
        <Link
          to="/publish/note"
          className={`text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 ${styles.noteEditorialBannerLink}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          返回编辑
        </Link>
      </div>
    </div>
  )
}
