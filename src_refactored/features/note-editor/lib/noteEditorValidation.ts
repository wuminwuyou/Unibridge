// 01）笔记编辑表单校验（noteEditorValidation）
import { resolvePublishNoteSummary } from '@shared/lib/publishSummary'
import type { NotePublishAction } from '@entities/note/model/types'
import type { NoteEditorFormDraft } from '../services/noteEditorService'

// 02）判断是否为远程资源 URL（isRemoteAssetUrl）
function isRemoteAssetUrl(url: string | null | undefined): url is string {
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')))
}

// 03）校验笔记编辑草稿（validateNoteEditorDraft）
/**
 * 函数名：validateNoteEditorDraft
 * 功能：按 publishAction 校验笔记编辑表单是否满足提交要求。
 * 实现方法：
 * - 草稿态（DRAFT）：校验标题与封面
 * - 发布态（PUBLISH）：额外校验正文/视频、摘要、标签
 * - 图文与视频分支分别校验 content 字段
 * 输入：
 * - draft：NoteEditorFormDraft
 * - publishAction：DRAFT | PUBLISH
 * 输出：
 * - 返回值：错误文案；通过时返回 null
 * - 副作用：无
 */
export function validateNoteEditorDraft(
  draft: NoteEditorFormDraft,
  publishAction: NotePublishAction,
): string | null {
  if (!draft.title.trim()) {
    return '请填写笔记标题'
  }

  if (!draft.coverUrl.trim() && !isRemoteAssetUrl(draft.coverUrl)) {
    return '请配置笔记封面'
  }

  if (publishAction === 'DRAFT') {
    return null
  }

  if (draft.contentType === '图文') {
    if (!draft.bodyMarkdown.trim()) {
      return '请填写图文正文'
    }

    const resolvedSummary = resolvePublishNoteSummary(
      draft.summary,
      draft.contentType,
      draft.bodyMarkdown,
      draft.videoDescription,
    )
    if (!resolvedSummary) {
      return '请填写一句话摘要，或确保正文含有可提取的文字内容'
    }
  }

  if (draft.tags.length === 0) {
    return '请至少添加 1 个话题标签'
  }

  if (draft.contentType === '视频') {
    if (!draft.videoUrl?.trim() && !isRemoteAssetUrl(draft.videoUrl)) {
      return '请上传视频文件'
    }

    const resolvedSummary = resolvePublishNoteSummary(
      draft.summary,
      draft.contentType,
      draft.bodyMarkdown,
      draft.videoDescription,
    )
    if (!resolvedSummary) {
      return '请填写视频简介，或确保描述含有可提取的文字内容'
    }
  }

  return null
}
