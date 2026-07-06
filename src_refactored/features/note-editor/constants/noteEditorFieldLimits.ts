// 01）笔记编辑字段长度限制（noteEditorFieldLimits）

/** 笔记标题最大字数（图文 / 视频共用） */
export const NOTE_TITLE_MAX_LENGTH = 30

/** 笔记摘要最大字数（图文 summary / 视频 videoDescription 共用，提交后均映射为 summary） */
export const NOTE_SUMMARY_MAX_LENGTH = 200

/** 图文笔记正文 Markdown 最大字数 */
export const NOTE_ARTICLE_BODY_MAX_LENGTH = 20_000

/** 单个话题标签最大字数（手动输入） */
export const NOTE_TAG_MAX_LENGTH = 20

/** 话题标签最大数量 */
export const NOTE_TAG_MAX_COUNT = 5
