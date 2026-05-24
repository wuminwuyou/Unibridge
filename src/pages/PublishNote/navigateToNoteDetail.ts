import type { NavigateFunction } from 'react-router-dom'
import type { ContentLongtext } from '../../components/Reader'
import {
  buildNoteDetailFromPublishNote,
  buildNoteDetailFromPublishNoteVideo,
  saveNoteDetailPreview,
} from '../NoteDetailPage'
import type { NoteDetailLocationState, NoteDetailPublishStatus } from '../NoteDetailPage/types'
import type { PublishNoteFormDraft } from './publishNotePageData'

// 01）跳转笔记详情（navigateToNoteArticleDetail）
/**
 * 函数名：navigateToNoteArticleDetail
 * 功能：将当前发布笔记表单快照写入 session 并跳转对应类型详情页。
 * 实现方法：
 * - 图文：构建 NoteArticleDetailPayload
 * - 视频：构建 NoteVideoDetailPayload（含 blob 预览 URL）
 * 输入：
 * - navigate / draft / bodyContent / coverUrl / publishStatus
 * - videoPreviewUrl / videoDuration：视频模式专用
 * 输出：
 * - 副作用：路由跳转；sessionStorage 写入预览数据
 */
export function navigateToNoteArticleDetail(
  navigate: NavigateFunction,
  draft: PublishNoteFormDraft,
  bodyContent: ContentLongtext,
  coverUrl: string | null,
  publishStatus: NoteDetailPublishStatus,
  videoPreviewUrl: string | null = null,
  videoDuration = 0,
): void {
  const payload =
    draft.contentType === '视频'
      ? buildNoteDetailFromPublishNoteVideo(draft, coverUrl, videoPreviewUrl, videoDuration, publishStatus)
      : buildNoteDetailFromPublishNote(draft, bodyContent, coverUrl, publishStatus)

  saveNoteDetailPreview(payload)

  const state: NoteDetailLocationState = { payload }
  navigate('/note-detail', { state })
}
