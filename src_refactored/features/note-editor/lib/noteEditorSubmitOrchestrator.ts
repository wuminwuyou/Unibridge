// 01）笔记编辑提交编排（noteEditorSubmitOrchestrator）
import { NotesApiError } from '@entities/note/api/noteApi'
import type { NoteResourceUid } from '@shared/api/resourceUid'
import type { NotePublishAction } from '@entities/note/model/types'
import {
  NOTE_ARTICLE_EMPTY_COVER_URL,
  hasNoteEditorCoverInput,
  isNoteCoverDisplayable,
} from '@shared/lib/noteCoverSentinel'
import { submitNote, type NoteEditorFormDraft } from '../services/noteEditorService'
import { validateNoteEditorDraft } from './noteEditorValidation'
import type { NoteCoverUploadSource, UploadCoverBeforeSubmitInput } from './noteCoverUploadUtils'
import type { UploadVideoBeforeSubmitInput, UploadVideoBeforeSubmitResult } from './noteVideoUploadUtils'

// 02）提交时封面状态（NoteEditorSubmitCoverState）
export interface NoteEditorSubmitCoverState {
  source: NoteCoverUploadSource
  activePreviewUrl: string | null
  selectedFile: File | null
  persistedCoverUrl: string | null
}

// 02b）提交时视频状态（NoteEditorSubmitVideoState）
export interface NoteEditorSubmitVideoState {
  selectedFile: File | null
  persistedVideoUrl: string | null
}

// 03）提交输入（NoteEditorSubmitInput）
export interface NoteEditorSubmitInput {
  draft: NoteEditorFormDraft
  cover: NoteEditorSubmitCoverState
  video?: NoteEditorSubmitVideoState
  noteUid: NoteResourceUid | null
  publishAction: NotePublishAction
  uploadCoverBeforeSubmit: (input: UploadCoverBeforeSubmitInput) => Promise<string | null>
  uploadVideoBeforeSubmit?: (
    input: UploadVideoBeforeSubmitInput,
  ) => Promise<UploadVideoBeforeSubmitResult | null>
}

// 04）提交结果（NoteEditorSubmitResult）
export interface NoteEditorSubmitResult {
  noteUid: NoteResourceUid
  submitDraft: NoteEditorFormDraft
}

/**
 * 函数名：executeNoteEditorSubmit
 * 功能：提交前上传封面、校验草稿并调用 create/update 笔记 API。
 * 实现方法：
 * - uploadCoverBeforeSubmit 得到 coverUrl 并写入 draft
 * - validateNoteEditorDraft 按 publishAction 校验
 * - submitNote 创建或更新笔记
 * 输入：
 * - input：草稿、封面状态、noteUid、publishAction、封面上传函数
 * 输出：
 * - 返回值：noteUid 与最终提交草稿
 * - 副作用：发起封面上传与 POST/PUT /notes
 */
export async function executeNoteEditorSubmit(
  input: NoteEditorSubmitInput,
): Promise<NoteEditorSubmitResult> {
  let submitDraft: NoteEditorFormDraft = { ...input.draft }

  if (submitDraft.contentType === '视频' && input.uploadVideoBeforeSubmit) {
    const videoResult = await input.uploadVideoBeforeSubmit({
      draftVideoUrl: submitDraft.videoUrl,
      selectedFile: input.video?.selectedFile ?? null,
      persistedVideoUrl: input.video?.persistedVideoUrl ?? null,
      draftVideoDuration: submitDraft.videoDuration,
    })

    if (!videoResult?.videoUrl?.trim()) {
      throw new NotesApiError(400, '请上传视频文件')
    }

    submitDraft = {
      ...submitDraft,
      videoUrl: videoResult.videoUrl,
      videoDuration: videoResult.videoDuration || submitDraft.videoDuration,
      coverUrl: submitDraft.coverUrl.trim() || videoResult.coverUrl || submitDraft.coverUrl,
    }
  }

  const coverUrl = await (async (): Promise<string> => {
    const hasCoverInput = hasNoteEditorCoverInput({
      activePreviewUrl: input.cover.activePreviewUrl,
      selectedFile: input.cover.selectedFile,
      persistedCoverUrl: input.cover.persistedCoverUrl,
    })

    if (submitDraft.contentType === '图文' && !hasCoverInput) {
      return NOTE_ARTICLE_EMPTY_COVER_URL
    }

    const uploadedCoverUrl = await input.uploadCoverBeforeSubmit({
      source: input.cover.source,
      activePreviewUrl: input.cover.activePreviewUrl,
      selectedFile: input.cover.selectedFile,
      persistedCoverUrl: input.cover.persistedCoverUrl,
    })

    if (!uploadedCoverUrl) {
      if (submitDraft.contentType === '图文') {
        return NOTE_ARTICLE_EMPTY_COVER_URL
      }
      throw new NotesApiError(400, '请配置笔记封面')
    }

    return uploadedCoverUrl
  })()

  if (submitDraft.contentType === '视频' && !isNoteCoverDisplayable(coverUrl)) {
    throw new NotesApiError(400, '请配置笔记封面')
  }

  submitDraft = {
    ...submitDraft,
    coverUrl,
  }

  const validationError = validateNoteEditorDraft(submitDraft, input.publishAction)
  if (validationError) {
    throw new NotesApiError(400, validationError)
  }

  const response = await submitNote(submitDraft, input.publishAction, input.noteUid ?? undefined)

  return {
    noteUid: response.uid,
    submitDraft,
  }
}
