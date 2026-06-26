import { NotesApiError, createNote } from '../../../../api/notes'
import type { NotePublishAction, UpsertNoteRequest } from '../../../../api/notes/types'
import { isNoteResourceUid } from '../../../../api/resourceUid'
import type { NoteResourceUid } from '../../../../api/resourceUid'
import { extractAutoSummaryFromMarkdown } from '../../../../utils/publishSummary'
import { generateAndUploadNoteCover } from '../../../../pages/PublishNote/utils/autoGenerateNoteCover'
import type { NoteVideoDetailPayload } from '../types'

// 01）从 Markdown 正文提取一级标题（extractFirstHeading）
/**
 * 函数名：extractFirstHeading
 * 功能：从学习笔记 Markdown 正文开头提取一级大标题，供自动生成笔记标题使用。
 * 实现方法：
 * - 按行扫描，返回首个匹配 `# ` 开头的行（去除前导空格），去除 `# ` 后即为标题
 * 输入：
 * - markdown：编辑器 Markdown 正文
 * 输出：
 * - 返回值：一级标题文本或 null
 */
function extractFirstHeading(markdown: string): string | null {
  const lines = markdown.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ') && trimmed.length > 2) {
      return trimmed.slice(2).trim() || null
    }
  }
  return null
}

// 02）构建学习笔记创建请求体（buildCreateLearningNoteRequest）
/**
 * 函数名：buildCreateLearningNoteRequest
 * 功能：将视频详情页上下文与学习笔记 Markdown 组装为 POST /notes 创建请求体（图文子笔记）。
 * 实现方法：
 * - 通过 extractAutoSummaryFromMarkdown 自动生成摘要
 * - contentType 固定为「图文」，tags 继承父视频笔记，visibility 默认 PRIVATE
 * - 传入 parentContentTypeCode 建立父子关联
 * 输入：
 * - note：父视频笔记载荷
 * - markdown：学习笔记 Markdown（仅用于提取摘要）
 * - publishAction：DRAFT 或 PUBLISH
 * - coverUrl：已上传的封面 URL（由 generateAndUploadNoteCover 根据学习笔记标题生成）
 * - titleText：学习笔记标题（已在调用方从 Markdown 提取或回退生成）
 * 输出：
 * - 返回值：UpsertNoteRequest
 * - 副作用：coverUrl 为空时抛出 NotesApiError
 */
export function buildCreateLearningNoteRequest(
  note: NoteVideoDetailPayload,
  markdown: string,
  publishAction: NotePublishAction,
  coverUrl: string,
  titleText: string,
): UpsertNoteRequest {
  const normalizedCoverUrl = coverUrl.trim()
  if (!normalizedCoverUrl) {
    throw new NotesApiError(400, '缺少笔记封面 coverUrl')
  }

  const parentUid = note.uid
  if (!isNoteResourceUid(parentUid)) {
    throw new NotesApiError(400, '父笔记 uid 无效，无法创建学习笔记')
  }

  const trimmedContent = markdown.trim()
  const summary = extractAutoSummaryFromMarkdown(trimmedContent) || '暂无摘要'

  return {
    publishAction,
    title: titleText,
    summary,
    contentType: '图文',
    content: trimmedContent || null,
    tags: note.tags,
    coverUrl: normalizedCoverUrl,
    parentContentTypeCode: parentUid,
    visibility: 'PRIVATE',
  }
}

// 03）校验学习笔记创建表单（validateCreateLearningNote）
/**
 * 函数名：validateCreateLearningNote
 * 功能：按 publishAction 校验学习笔记是否满足创建接口要求。
 * 输入：
 * - note：父视频笔记载荷
 * - markdown：编辑器 Markdown 正文
 * - publishAction：DRAFT 或 PUBLISH
 * 输出：
 * - 返回值：错误文案或 null
 */
export function validateCreateLearningNote(
  note: NoteVideoDetailPayload,
  markdown: string,
  publishAction: NotePublishAction,
): string | null {
  if (!isNoteResourceUid(note.uid)) {
    return '父笔记尚未关联服务端 ID，无法创建学习笔记'
  }

  const trimmedContent = markdown.trim()
  if (!trimmedContent) {
    return '请输入学习笔记正文'
  }

  if (publishAction === 'DRAFT') {
    return null
  }

  if (note.tags.length === 0) {
    return '请至少添加 1 个话题标签'
  }

  return null
}

// 04）创建学习笔记（createLearningNote）
/**
 * 函数名：createLearningNote
 * 功能：观看视频笔记时，创建一篇与之关联的图文学习笔记。
 * 实现方法：
 * - 校验表单与父笔记 uid
 * - 根据学习笔记自身的 title（Markdown 一级标题或回退标题）用 generateAndUploadNoteCover 生成并上传封面
 * - buildCreateLearningNoteRequest 组装请求体（使用上传后的封面 URL）
 * - createNote 写入服务端
 * 输入：
 * - note：父视频笔记载荷
 * - noteUid：笔记对外 uid（兼容保留，当前未使用，由 note.uid 驱动）
 * - markdown：学习笔记 Markdown
 * - publishAction：DRAFT 或 PUBLISH
 * 输出：
 * - 返回值：UpsertNoteResponse.uid
 * - 副作用：发起 POST /uploads/note-cover、POST /notes
 */
export async function createLearningNote(options: {
  note: NoteVideoDetailPayload
  noteUid: NoteResourceUid | null | undefined
  markdown: string
  publishAction: NotePublishAction
}): Promise<NoteResourceUid> {
  const validationError = validateCreateLearningNote(options.note, options.markdown, options.publishAction)
  if (validationError) {
    throw new NotesApiError(400, validationError)
  }

  const learningNoteTitle = extractFirstHeading(options.markdown.trim()) ?? `关于"${options.note.title.trim() || '未命名视频笔记'}"的笔记`
  const coverUrl = await generateAndUploadNoteCover(learningNoteTitle)
  const payload = buildCreateLearningNoteRequest(options.note, options.markdown, options.publishAction, coverUrl, learningNoteTitle)
  const response = await createNote(payload)
  return response.uid
}
