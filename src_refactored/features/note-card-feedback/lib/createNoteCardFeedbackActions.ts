// 01）笔记卡片反馈动作（createNoteCardFeedbackActions）
import type { GridNoteCardNote } from '@entities/note'

// 02）反馈动作集合（NoteCardFeedbackActions）
export interface NoteCardFeedbackActions {
  onNotInterestedInContent: () => void
  onNotInterestedInAuthor: () => void
}

// 03）创建笔记卡片反馈回调（createNoteCardFeedbackActions）
/**
 * 函数名：createNoteCardFeedbackActions
 * 功能：为网格笔记卡片「更多」菜单生成内容/作者不感兴趣回调。
 * 实现方法：
 * - 暂以控制台记录占位，后续可接入推荐反馈 API
 * 输入：
 * - note：当前笔记卡片数据
 * 输出：
 * - 返回值：NoteCardFeedbackActions
 * - 副作用：触发反馈时可能发起网络请求（待接入）
 */
export function createNoteCardFeedbackActions(note: GridNoteCardNote): NoteCardFeedbackActions {
  return {
    onNotInterestedInContent: () => {
      console.info('[note-feedback] 内容不感兴趣', { noteUid: note.uid, title: note.title })
    },
    onNotInterestedInAuthor: () => {
      console.info('[note-feedback] 作者不感兴趣', {
        noteUid: note.uid,
        authorNickname: note.authorNickname,
      })
    },
  }
}
