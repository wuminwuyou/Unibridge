import { createNote, NotesApiError, updateNote, uploadNoteVideo } from '../../api/notes'
import { isNoteResourceUid } from '../../api/resourceUid'
import type { NoteResourceUid } from '../../api/resourceUid'
import { pickNoteVideoDurationFromUploadData, pickNoteVideoUrlFromUploadData } from '../../api/notes/payload'
import type { NotePublishAction } from '../../api/notes/types'
import type { ContentLongtext } from '../../components/Reader'
import type { PublishNoteFormDraft } from './publishNotePageData'
import {
  buildUpsertNoteRequest,
  uploadNoteCoverBeforeSubmit,
  validatePublishNoteSubmit,
  type PublishNoteMediaPersist,
} from './publishNoteSubmit'
import type { PublishNoteCoverModel } from './usePublishNoteCover'

// 01）提交笔记参数（SubmitPublishNoteOptions）
export interface SubmitPublishNoteOptions {
  draft: PublishNoteFormDraft
  bodyContent: ContentLongtext
  cover: PublishNoteCoverModel
  videoFile: File | null
  noteUid?: NoteResourceUid | null
  mediaPersist?: PublishNoteMediaPersist | null
  publishAction: NotePublishAction
}

// 02）提交笔记结果（SubmitPublishNoteResult）
export interface SubmitPublishNoteResult {
  noteUid: NoteResourceUid
  mediaPersist: PublishNoteMediaPersist
}

// 03）提交阶段（PublishNoteSubmitPhase）
export type PublishNoteSubmitPhase = 'idle' | 'uploading-cover' | 'uploading-video' | 'saving-note'

// 04）提交阶段回调（PublishNoteSubmitPhaseHandler）
export type PublishNoteSubmitPhaseHandler = (phase: PublishNoteSubmitPhase) => void

// 05）判断是否远程资源（isRemoteAssetUrl）
function isRemoteAssetUrl(url: string | null | undefined): url is string {
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')))
}

// 06）确保视频 URL 已上传（ensureNoteVideoAsset）
async function ensureNoteVideoAsset(
  videoFile: File | null,
  mediaPersist: PublishNoteMediaPersist | null,
): Promise<{ videoUrl: string; videoDuration: number }> {
  if (videoFile) {
    const uploaded = await uploadNoteVideo(videoFile)
    const videoUrl = uploaded.videoUrl?.trim() || pickNoteVideoUrlFromUploadData(uploaded)
    if (!videoUrl) {
      throw new NotesApiError(400, '视频上传未返回视频地址')
    }
    return {
      videoUrl,
      videoDuration: uploaded.videoDuration ?? pickNoteVideoDurationFromUploadData(uploaded) ?? 0,
    }
  }

  if (isRemoteAssetUrl(mediaPersist?.videoUrl)) {
    return {
      videoUrl: mediaPersist.videoUrl,
      videoDuration: mediaPersist.videoDuration,
    }
  }

  throw new NotesApiError(400, '请上传视频文件')
}

// 07）提交发布笔记（submitPublishNote）
/**
 * 函数名：submitPublishNote
 * 功能：先上传封面至 /uploads/note-cover，再上传视频（如需），最后 POST/PUT /notes。
 * 实现方法：
 * - 步骤 1：uploadNoteCoverBeforeSubmit → 得到 coverUrl
 * - 步骤 2：视频笔记时 uploadNoteVideo
 * - 步骤 3：buildUpsertNoteRequest 将 coverUrl 写入请求体并提交
 */
export async function submitPublishNote(
  options: SubmitPublishNoteOptions,
  onPhaseChange?: PublishNoteSubmitPhaseHandler,
): Promise<SubmitPublishNoteResult> {
  const validationError = validatePublishNoteSubmit(
    options.draft,
    options.bodyContent,
    options.cover.activePreviewUrl,
    options.videoFile,
    options.mediaPersist ?? null,
    options.publishAction,
  )
  if (validationError) {
    throw new NotesApiError(400, validationError)
  }

  onPhaseChange?.('uploading-cover')
  const coverUrl = await uploadNoteCoverBeforeSubmit(options.cover, options.mediaPersist ?? null)

  let videoUrl: string | null = options.mediaPersist?.videoUrl ?? null
  let videoDuration = options.mediaPersist?.videoDuration ?? 0

  if (options.draft.contentType === '视频') {
    onPhaseChange?.('uploading-video')
    const videoAsset = await ensureNoteVideoAsset(options.videoFile, options.mediaPersist ?? null)
    videoUrl = videoAsset.videoUrl
    videoDuration = videoAsset.videoDuration
  }

  onPhaseChange?.('saving-note')
  const payload = buildUpsertNoteRequest(
    options.draft,
    options.bodyContent,
    coverUrl,
    options.publishAction,
    videoUrl,
    videoDuration,
  )

  const response =
    isNoteResourceUid(options.noteUid)
      ? await updateNote(options.noteUid, payload)
      : await createNote(payload)

  onPhaseChange?.('idle')

  return {
    noteUid: response.uid,
    mediaPersist: {
      coverUrl,
      videoUrl,
      videoDuration,
    },
  }
}

export { NotesApiError }
