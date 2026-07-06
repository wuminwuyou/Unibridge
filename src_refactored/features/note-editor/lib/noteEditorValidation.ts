// 01）笔记编辑表单校验（noteEditorValidation）
import type { NoteEditorFormDraft } from '../services/noteEditorService'
import { validateNoteEditorFieldLimits } from './noteEditorFieldLimitValidation'

// 02）判断是否为远程资源 URL（isRemoteAssetUrl）
function isRemoteAssetUrl(url: string | null | undefined): url is string {
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')))
}

// 03）校验笔记编辑草稿（validateNoteEditorDraft）
/**
 * 函数名：validateNoteEditorDraft
 * 功能：按 publishAction 校验笔记编辑表单是否满足提交要求（DRAFT 与 PUBLISH 均校验四项必填）。
 * 实现方法：
 * - 标题非空、封面非空、content 非空、标签非空
 * - 图文检查 bodyMarkdown；视频检查 videoUrl
 * 输入：
 * - draft：NoteEditorFormDraft（coverUrl 已为上传后远程 URL）
 * - publishAction：DRAFT | PUBLISH
 * 输出：
 * - 返回值：错误文案；通过时返回 null
 * - 副作用：无
 */
export function validateNoteEditorDraft(
  draft: NoteEditorFormDraft,
  _publishAction: string,
): string | null {
  if (!draft.title.trim()) {
    return '请填写笔记标题'
  }

  if (!draft.coverUrl.trim() && !isRemoteAssetUrl(draft.coverUrl)) {
    return '请配置笔记封面'
  }

  if (draft.tags.length === 0) {
    return '请至少添加 1 个话题标签'
  }

  if (draft.contentType === '图文') {
    if (!draft.bodyMarkdown.trim()) {
      return '请填写图文正文'
    }
  }

  if (draft.contentType === '视频') {
    if (!draft.videoUrl?.trim() && !isRemoteAssetUrl(draft.videoUrl)) {
      return '请上传视频文件'
    }
  }

  return validateNoteEditorFieldLimits(draft)
}

// 04）提交前前端校验（validateNoteEditorPreSubmit）
/**
 * 函数名：validateNoteEditorPreSubmit
 * 功能：在封面上传前校验表单四项必填（标题、封面预览、正文、标签），阻断无效提交。
 * 实现方法：
 * - 不依赖上传后的 coverUrl，仅检查 activePreviewUrl / selectedFile / persistedCoverUrl 是否存在
 * - 标题、正文、标签直接校验
 * 输入：
 * - draft：NoteEditorFormDraft
 * - coverActivePreviewUrl：当前封面预览 URL（可为 blob/data/http）
 * - coverSelectedFile：当前封面文件
 * - coverPersistedCoverUrl：已持久化的远程封面
 * 输出：
 * - 返回值：错误文案；通过时返回 null
 * - 副作用：无
 */
export function validateNoteEditorPreSubmit(
  draft: NoteEditorFormDraft,
  coverActivePreviewUrl: string | null,
  coverSelectedFile: File | null,
  coverPersistedCoverUrl: string | null,
): string | null {
  if (!draft.title.trim()) {
    return '请填写笔记标题'
  }

  const hasCover = Boolean(
    coverActivePreviewUrl?.trim()
    || coverSelectedFile
    || (coverPersistedCoverUrl?.trim() && isRemoteAssetUrl(coverPersistedCoverUrl)),
  )
  if (!hasCover) {
    return '请配置笔记封面'
  }

  if (draft.tags.length === 0) {
    return '请至少添加 1 个话题标签'
  }

  if (draft.contentType === '图文') {
    if (!draft.bodyMarkdown.trim()) {
      return '请填写图文正文'
    }
  }

  if (draft.contentType === '视频') {
    if (!draft.videoUrl?.trim()) {
      return '请上传视频文件'
    }
  }

  return validateNoteEditorFieldLimits(draft)
}

// 05）校验本地预览草稿（validateNoteEditorDraftForLocalPreview）
/**
 * 函数名：validateNoteEditorDraftForLocalPreview
 * 功能：校验编辑表单是否满足本地预览展示要求（不上传、不保存）。
 * 实现方法：
 * - 校验标题非空
 * - 校验封面 URL 已就绪（blob/data/http 或远程地址）
 * 输入：
 * - draft：NoteEditorFormDraft
 * - coverUrl：resolveLocalNoteCoverUrl 解析结果
 * 输出：
 * - 返回值：错误文案；通过时返回 null
 * - 副作用：无
 */
export function validateNoteEditorDraftForLocalPreview(
  draft: NoteEditorFormDraft,
  coverUrl: string | null,
): string | null {
  if (!draft.title.trim()) {
    return '请填写笔记标题'
  }

  if (!coverUrl?.trim()) {
    return '请配置笔记封面'
  }

  if (draft.contentType === '视频' && !draft.videoUrl?.trim()) {
    return '请先添加视频'
  }

  return null
}
