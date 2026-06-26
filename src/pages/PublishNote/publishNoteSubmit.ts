import type { NotePublishAction, UpsertNoteRequest } from '../../api/notes/types'
import { NotesApiError, uploadNoteCover } from '../../api/notes'
import { pickNoteCoverUrlFromUploadData } from '../../api/notes/payload'
import type { ContentLongtext } from '../../components/Reader'
import {
  resolvePublishNoteSummary,
} from '../../utils/publishSummary'
import type { PublishNoteCoverModel, PublishNoteCoverSource } from './usePublishNoteCover'
import type { PublishNoteFormDraft } from './publishNotePageData'

// 01）笔记媒体持久化快照（PublishNoteMediaPersist）
export interface PublishNoteMediaPersist {
  coverUrl: string | null
  videoUrl: string | null
  videoDuration: number
}

// 02）判断是否为远程 URL（isRemoteAssetUrl）
function isRemoteAssetUrl(url: string | null | undefined): url is string {
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')))
}

// 03）将预览 URL 转为 Blob（resolvePreviewUrlBlob）
/**
 * 函数名：resolvePreviewUrlBlob
 * 功能：将 blob:/data: 预览地址转为可上传的 Blob。
 */
export async function resolvePreviewUrlBlob(previewUrl: string): Promise<Blob> {
  const response = await fetch(previewUrl)
  return response.blob()
}

// 04）校验笔记提交表单（validatePublishNoteSubmit）
/**
 * 函数名：validatePublishNoteSubmit
 * 功能：按 publishAction 校验发布笔记表单是否满足 API 要求。
 */
export function validatePublishNoteSubmit(
  draft: PublishNoteFormDraft,
  bodyContent: ContentLongtext,
  coverPreviewUrl: string | null,
  videoFile: File | null,
  persistedMedia: PublishNoteMediaPersist | null,
  publishAction: NotePublishAction,
  videoDescription: string,
): string | null {
  if (!draft.title.trim()) {
    return '请填写笔记标题'
  }

  if (!coverPreviewUrl && !isRemoteAssetUrl(persistedMedia?.coverUrl)) {
    return '请配置笔记封面'
  }

  if (publishAction === 'DRAFT') {
    return null
  }

  if (draft.contentType === '图文') {
    if (!bodyContent.longtext.trim()) {
      return '请填写图文正文'
    }

    const resolvedSummary = resolvePublishNoteSummary(
      draft.summary,
      draft.contentType,
      bodyContent.longtext,
      videoDescription,
    )
    if (!resolvedSummary) {
      return '请填写一句话摘要，或确保正文含有可提取的文字内容'
    }
  }

  if (draft.tags.length === 0) {
    return '请至少添加 1 个话题标签'
  }

  if (draft.contentType === '图文') {
    return null
  }

  if (!videoFile && !isRemoteAssetUrl(persistedMedia?.videoUrl)) {
    return '请上传视频文件'
  }

  return null
}

// 05）构建笔记写接口请求体（buildUpsertNoteRequest）
/**
 * 函数名：buildUpsertNoteRequest
 * 功能：将表单与已上传媒体 URL 组装为 POST/PUT /notes 请求体。
 */
export function buildUpsertNoteRequest(
  draft: PublishNoteFormDraft,
  bodyContent: ContentLongtext,
  coverUrl: string,
  publishAction: NotePublishAction,
  videoUrl?: string | null,
  videoDuration = 0,
  videoDescription = '',
): UpsertNoteRequest {
  const normalizedCoverUrl = coverUrl.trim()
  if (!normalizedCoverUrl) {
    throw new NotesApiError(400, '缺少笔记封面 coverUrl')
  }

  const resolvedSummary =
    resolvePublishNoteSummary(draft.summary, draft.contentType, bodyContent.longtext, videoDescription) ||
    '暂无摘要'

  if (draft.contentType === '图文') {
    return {
      publishAction,
      title: draft.title.trim(),
      summary: resolvedSummary,
      contentType: draft.contentType,
      tags: draft.tags,
      coverUrl: normalizedCoverUrl,
      content: bodyContent.longtext,
      visibility: 'PUBLIC',
    }
  }

  const normalizedVideoUrl = videoUrl?.trim() ?? ''
  if (publishAction === 'PUBLISH' && !normalizedVideoUrl) {
    throw new NotesApiError(400, '缺少笔记视频 videoUrl')
  }

  return {
    publishAction,
    title: draft.title.trim(),
    summary: resolvedSummary,
    contentType: draft.contentType,
    tags: draft.tags,
    coverUrl: normalizedCoverUrl,
    videoUrl: normalizedVideoUrl,
    videoDuration,
    visibility: 'PUBLIC',
  }
}

// 06）解析封面上传来源（resolveCoverUploadSource）
export function resolveCoverUploadSource(source: PublishNoteCoverSource): 'auto' | 'upload' {
  return source
}

// 07）提交前上传笔记封面（uploadNoteCoverBeforeSubmit）
/**
 * 函数名：uploadNoteCoverBeforeSubmit
 * 功能：在 POST/PUT /notes 之前，先将当前封面预览上传至 /uploads/note-cover。
 * 实现方法：
 * - 预览已是服务端 URL 且与上次持久化一致时复用，避免重复上传
 * - blob:/data: 预览转为 Blob 后调用封面上传接口
 * 输入：
 * - cover：封面模型（含 activePreviewUrl 与 source）
 * - mediaPersist：上次提交后缓存的媒体 URL
 * 输出：
 * - 返回值：coverUrl，用于写入 UpsertNoteRequest
 * - 副作用：发起 POST /uploads/note-cover
 */
export async function uploadNoteCoverBeforeSubmit(
  cover: Pick<PublishNoteCoverModel, 'activePreviewUrl' | 'source'>,
  mediaPersist: PublishNoteMediaPersist | null,
): Promise<string> {
  const previewUrl = cover.activePreviewUrl

  if (isRemoteAssetUrl(previewUrl) && previewUrl === mediaPersist?.coverUrl) {
    return previewUrl
  }

  if (isRemoteAssetUrl(mediaPersist?.coverUrl) && !previewUrl) {
    return mediaPersist.coverUrl
  }

  if (!previewUrl) {
    throw new Error('请配置笔记封面')
  }

  const blob = await resolvePreviewUrlBlob(previewUrl)
  const uploaded = await uploadNoteCover(blob, resolveCoverUploadSource(cover.source))
  const uploadedCoverUrl = uploaded.coverUrl?.trim() || pickNoteCoverUrlFromUploadData(uploaded)
  if (!uploadedCoverUrl) {
    throw new NotesApiError(400, '封面上传未返回封面地址')
  }
  return uploadedCoverUrl
}
