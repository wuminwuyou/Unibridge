import type { NoteVideoDetailPayload } from './types'

// 01）演示视频地址（NOTE_VIDEO_DEMO_URL）
const NOTE_VIDEO_DEMO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

// 02）视频笔记详情回退数据（buildNoteVideoDetailFallback）
/**
 * 函数名：buildNoteVideoDetailFallback
 * 功能：从 URL 标题等最小信息生成视频详情演示数据。
 * 输入：
 * - title：笔记标题
 * 输出：
 * - 返回值：NoteVideoDetailPayload
 */
export function buildNoteVideoDetailFallback(title: string): NoteVideoDetailPayload {
  return {
    contentType: '视频',
    title: title.trim() || '未命名视频笔记',
    summary: '该视频笔记来自经验分享入口，完整详情待后端接口接入。',
    tags: ['视频笔记'],
    coverUrl: null,
    videoUrl: NOTE_VIDEO_DEMO_URL,
    videoDuration: 596,
    author: {
      name: '社区创作者',
      handle: 'unibridge-user',
      avatarUrl: null,
    },
    publishTime: '2026-05-20',
    updateTime: '2026-05-20',
    views: 1280,
    comments: 42,
    favorites: 86,
    publishStatus: 'PUBLISHED',
  }
}
