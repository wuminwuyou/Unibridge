import { HttpApiError } from '../http'
import type { NoteCoverUploadResponse, NoteVideoUploadResponse, UpsertNoteRequest } from './types'

// 01）从上传响应提取封面 URL（pickNoteCoverUrlFromUploadData）
/**
 * 函数名：pickNoteCoverUrlFromUploadData
 * 功能：兼容多种封面上传响应字段，解析出可用的 coverUrl。
 * 实现方法：
 * - 支持 data 为字符串 URL
 * - 支持 coverUrl / cover_url / url 及嵌套 cover 对象
 * 输入：
 * - data：封面上传接口 data 字段
 * 输出：
 * - 返回值：封面 URL 或 null
 */
export function pickNoteCoverUrlFromUploadData(data: unknown): string | null {
  if (typeof data === 'string') {
    const trimmed = data.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  const directCandidates = [record.coverUrl, record.cover_url, record.url]

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  const nestedCover = record.cover
  if (nestedCover && typeof nestedCover === 'object') {
    const nestedRecord = nestedCover as Record<string, unknown>
    const nestedCandidates = [nestedRecord.coverUrl, nestedRecord.cover_url, nestedRecord.url]
    for (const candidate of nestedCandidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }
  }

  return null
}

// 02）规范化封面上传响应（normalizeNoteCoverUploadResponse）
/**
 * 函数名：normalizeNoteCoverUploadResponse
 * 功能：将封面上传接口 data 规范为 NoteCoverUploadResponse。
 * 输入：
 * - data：上传接口返回的 data
 * 输出：
 * - 返回值：含 coverUrl 的对象
 * - 副作用：无；解析失败时抛出 HttpApiError
 */
export function normalizeNoteCoverUploadResponse(data: unknown): NoteCoverUploadResponse {
  const coverUrl = pickNoteCoverUrlFromUploadData(data)
  if (!coverUrl) {
    throw new HttpApiError(400, '封面上传未返回封面地址')
  }
  return { coverUrl }
}

// 03）从上传响应提取视频 URL（pickNoteVideoUrlFromUploadData）
/**
 * 函数名：pickNoteVideoUrlFromUploadData
 * 功能：兼容多种视频上传响应字段，解析出可用的 videoUrl。
 */
export function pickNoteVideoUrlFromUploadData(data: unknown): string | null {
  if (typeof data === 'string') {
    const trimmed = data.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  const directCandidates = [record.videoUrl, record.video_url, record.url]

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  const nestedVideo = record.video
  if (nestedVideo && typeof nestedVideo === 'object') {
    const nestedRecord = nestedVideo as Record<string, unknown>
    const nestedCandidates = [nestedRecord.videoUrl, nestedRecord.video_url, nestedRecord.url]
    for (const candidate of nestedCandidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }
  }

  return null
}

// 04）从上传响应提取视频时长（pickNoteVideoDurationFromUploadData）
/**
 * 函数名：pickNoteVideoDurationFromUploadData
 * 功能：兼容 videoDuration / video_duration / duration 字段。
 */
export function pickNoteVideoDurationFromUploadData(data: unknown): number | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  const candidates = [record.videoDuration, record.video_duration, record.duration]

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
      return Math.round(candidate)
    }
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      const parsed = Number(candidate)
      if (Number.isFinite(parsed) && parsed >= 0) {
        return Math.round(parsed)
      }
    }
  }

  return null
}

// 05）规范化视频上传响应（normalizeNoteVideoUploadResponse）
/**
 * 函数名：normalizeNoteVideoUploadResponse
 * 功能：将视频上传接口 data 规范为 NoteVideoUploadResponse。
 */
export function normalizeNoteVideoUploadResponse(data: unknown): NoteVideoUploadResponse {
  const videoUrl = pickNoteVideoUrlFromUploadData(data)
  if (!videoUrl) {
    throw new HttpApiError(400, '视频上传未返回视频地址')
  }

  const coverUrl = pickNoteCoverUrlFromUploadData(data) ?? undefined
  return {
    videoUrl,
    videoDuration: pickNoteVideoDurationFromUploadData(data) ?? 0,
    coverUrl,
  }
}

// 06）规范化笔记写请求体（normalizeUpsertNoteRequestPayload）
/**
 * 函数名：normalizeUpsertNoteRequestPayload
 * 功能：确保 POST/PUT /notes 请求体始终包含非空 coverUrl，避免 undefined 被 JSON 省略。
 * 输入：
 * - payload：待提交的 UpsertNoteRequest
 * 输出：
 * - 返回值：字段完整的请求体
 * - 副作用：coverUrl 缺失时抛出 HttpApiError
 */
export function normalizeUpsertNoteRequestPayload(payload: UpsertNoteRequest): UpsertNoteRequest {
  const payloadRecord = payload as UpsertNoteRequest & {
    cover_url?: string
    video_url?: string
    video_duration?: number
  }
  const coverUrl = payloadRecord.coverUrl?.trim() || payloadRecord.cover_url?.trim() || ''

  if (!coverUrl) {
    throw new HttpApiError(400, '缺少笔记封面 coverUrl')
  }

  const normalized: UpsertNoteRequest = {
    publishAction: payload.publishAction,
    title: payload.title,
    summary: payload.summary,
    contentType: payload.contentType,
    tags: payload.tags,
    coverUrl,
  }

  if (payload.contentType === '图文') {
    normalized.content = payload.content ?? null
    return normalized
  }

  const videoUrl = payloadRecord.videoUrl?.trim() || payloadRecord.video_url?.trim() || ''
  const videoDuration =
    payloadRecord.videoDuration ?? payloadRecord.video_duration ?? pickNoteVideoDurationFromUploadData(payload) ?? 0

  if (payload.publishAction === 'PUBLISH' && !videoUrl) {
    throw new HttpApiError(400, '缺少笔记视频 videoUrl')
  }

  normalized.videoUrl = videoUrl
  normalized.videoDuration = videoDuration
  if (payload.content != null) {
    normalized.content = payload.content
  }
  return normalized
}
