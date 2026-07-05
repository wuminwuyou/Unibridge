import type { NoteDetailDto } from '../model/types'
import type { NoteDetailPayload } from '../model/noteDetailViewModel'
import type { ProfileNoteItem } from '../model/profileNoteItem'
import { formatNoteDetailTime } from './noteDetailFormatUtils'

// 01）将父笔记 DTO 映射为行卡片数据（mapParentNoteToRowItem）
function mapParentNoteToRowItem(
  parent: NoteDetailDto['parentNote'],
): ProfileNoteItem | null {
  if (!parent) return null
  return {
    uid: parent.uid,
    title: parent.title,
    summary: parent.summary,
    contentType: parent.contentType,
    tags: parent.tags ?? [],
    cover: parent.cover ?? '',
    publishTime: '',
    updateTime: '',
    views: parent.views ?? 0,
    comments: parent.comments ?? 0,
    favorites: parent.favorites ?? 0,
  }
}

// 02）映射笔记发布状态（mapNoteDetailPublishStatus）
function mapNoteDetailPublishStatus(
  status: NoteDetailDto['status'],
): 'DRAFT' | 'PREVIEW' | 'PUBLISHED' {
  return status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
}

// 03）将笔记详情 DTO 转为前端载荷（mapNoteDetailToPayload）
/**
 * 函数名：mapNoteDetailToPayload
 * 功能：将 GET /notes/{uid} 响应映射为图文或视频详情页载荷。
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
    return {
      uid: dto.uid,
      contentType: '视频',
      title: dto.title,
      summary: dto.summary ?? '',
      body: dto.body ?? '',
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
  }

  const parentNote = mapParentNoteToRowItem(dto.parentNote)
  return {
    uid: dto.uid,
    contentType: '图文',
    title: dto.title,
    summary: dto.summary ?? '',
    body: dto.body ?? '',
    tags: dto.tags ?? [],
    coverUrl: dto.coverUrl ?? null,
    author: dto.author,
    publishTime,
    updateTime,
    views: dto.views ?? 0,
    comments: dto.comments ?? 0,
    favorites: dto.favorites ?? 0,
    publishStatus,
    parentNote,
  }
}
