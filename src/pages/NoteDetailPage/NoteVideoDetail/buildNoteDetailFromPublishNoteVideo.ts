import type { PublishNoteFormDraft } from '../../PublishNote/publishNotePageData'
import type { NoteDetailPublishStatus } from '../shared/noteDetailCommon'
import type { NoteVideoDetailPayload } from './types'

// 01）由发布表单构建视频笔记详情（buildNoteDetailFromPublishNoteVideo）
/**
 * 函数名：buildNoteDetailFromPublishNoteVideo
 * 功能：将发布笔记表单与视频上传状态转为视频详情页载荷。
 * 输入：
 * - draft：表单草稿
 * - coverUrl：封面 URL
 * - videoUrl：视频 URL（可为 blob 或远程）
 * - videoDuration：时长（秒）
 * - publishStatus：发布状态
 * 输出：
 * - 返回值：NoteVideoDetailPayload
 */
export function buildNoteDetailFromPublishNoteVideo(
  draft: PublishNoteFormDraft,
  coverUrl: string | null,
  videoUrl: string | null,
  videoDuration: number,
  publishStatus: NoteDetailPublishStatus,
): NoteVideoDetailPayload {
  return {
    contentType: '视频',
    title: draft.title.trim() || '未命名视频笔记',
    summary: draft.summary.trim() || '暂无简介',
    tags: draft.tags,
    coverUrl,
    videoUrl: videoUrl ?? '',
    videoDuration,
    author: {
      name: '我',
      handle: 'me',
      avatarUrl: null,
    },
    publishTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 10),
    views: 0,
    comments: 0,
    favorites: 0,
    publishStatus,
  }
}
