import type { NoteArticleDetailPayload } from '../NoteArticleDetail/types'
import type { NoteDetailDto } from '../../../api/notes/types'
import type { NoteDetailPayload } from './noteDetailPayload'
import type { NoteVideoDetailPayload } from '../NoteVideoDetail/types'
import { formatNoteDetailTime } from './noteDetailShared'

// 01）映射笔记发布状态（mapNoteDetailPublishStatus）
function mapNoteDetailPublishStatus(status: NoteDetailDto['status']): NoteArticleDetailPayload['publishStatus'] {
  return status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
}

// 02）将笔记详情 DTO 转为前端载荷（mapNoteDetailToPayload）
/**
 * 函数名：mapNoteDetailToPayload
 * 功能：将 GET /notes/{noteId} 响应映射为图文或视频详情页载荷。
 * 实现方法：
 * - 按 contentType 分支构造 NoteArticleDetailPayload / NoteVideoDetailPayload
 * - status → publishStatus；时间字段格式化为展示文案
 * 输入：
 * - dto：NoteDetailDto
 * 输出：
 * - 返回值：NoteDetailPayload
 */
export function mapNoteDetailToPayload(dto: NoteDetailDto): NoteDetailPayload {
  const publishStatus = mapNoteDetailPublishStatus(dto.status)
  const publishTime = formatNoteDetailTime(dto.publishTime)
  const updateTime = formatNoteDetailTime(dto.updateTime)

  if (dto.contentType === '视频') {
    const payload: NoteVideoDetailPayload = {
      contentType: '视频',
      title: dto.title,
      summary: dto.summary ?? '',
      tags: dto.tags ?? [],
      coverUrl: dto.coverUrl ?? null,
      videoUrl: dto.videoUrl ?? '',
      videoDuration: dto.videoDuration ?? 0,
      author: dto.author,
      publishTime,
      updateTime,
      views: dto.views ?? 0,
      comments: dto.comments ?? 0,
      favorites: dto.favorites ?? 0,
      publishStatus,
    }
    return payload
  }

  const payload: NoteArticleDetailPayload = {
    contentType: '图文',
    title: dto.title,
    summary: dto.summary ?? '',
    body: dto.body ?? '',
    editorType: dto.editorType === 'RICHTEXT' ? 'RICHTEXT' : 'MARKDOWN',
    tags: dto.tags ?? [],
    coverUrl: dto.coverUrl ?? null,
    author: dto.author,
    publishTime,
    updateTime,
    views: dto.views ?? 0,
    comments: dto.comments ?? 0,
    favorites: dto.favorites ?? 0,
    publishStatus,
  }
  return payload
}
