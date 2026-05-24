// 01）项目对外 uid 类型（ProjectResourceUid）
/** 格式：`PR` + 11 位字符（= `project_uid`） */
export type ProjectResourceUid = string

// 02）笔记对外 uid 类型（NoteResourceUid）
/** 格式：`TX` / `VD` + 11 位字符（= `content_type_code`） */
export type NoteResourceUid = string

// 03）资源 uid 正则（PROJECT_RESOURCE_UID_REGEXP / NOTE_RESOURCE_UID_REGEXP）
const PROJECT_RESOURCE_UID_REGEXP = /^PR[A-Za-z0-9]{11}$/
const NOTE_RESOURCE_UID_REGEXP = /^(TX|VD)[A-Za-z0-9]{11}$/

// 04）校验项目 uid（isProjectResourceUid）
/**
 * 函数名：isProjectResourceUid
 * 功能：判断字符串是否为合法的项目对外 uid。
 * 输入：
 * - value：待校验字符串
 * 输出：
 * - 返回值：类型守卫
 * - 副作用：无
 */
export function isProjectResourceUid(value: string | null | undefined): value is ProjectResourceUid {
  return typeof value === 'string' && PROJECT_RESOURCE_UID_REGEXP.test(value)
}

// 05）校验笔记 uid（isNoteResourceUid）
/**
 * 函数名：isNoteResourceUid
 * 功能：判断字符串是否为合法的笔记对外 uid。
 * 输入：
 * - value：待校验字符串
 * 输出：
 * - 返回值：类型守卫
 * - 副作用：无
 */
export function isNoteResourceUid(value: string | null | undefined): value is NoteResourceUid {
  return typeof value === 'string' && NOTE_RESOURCE_UID_REGEXP.test(value)
}

// 06）解析项目 uid 查询参数（parseProjectUidFromQuery）
/**
 * 函数名：parseProjectUidFromQuery
 * 功能：从 URL 查询参数解析项目 uid；优先 `uid`，兼容旧参数名 `id`（值须为 uid 字符串）。
 * 输入：
 * - uidParam：searchParams.get('uid')
 * - legacyIdParam：searchParams.get('id')
 * 输出：
 * - 返回值：合法 ProjectResourceUid 或 null
 * - 副作用：无
 */
export function parseProjectUidFromQuery(
  uidParam: string | null,
  legacyIdParam: string | null = null,
): ProjectResourceUid | null {
  if (isProjectResourceUid(uidParam)) {
    return uidParam
  }

  if (isProjectResourceUid(legacyIdParam)) {
    return legacyIdParam
  }

  return null
}

// 07）解析笔记 uid 查询参数（parseNoteUidFromQuery）
/**
 * 函数名：parseNoteUidFromQuery
 * 功能：从 URL 查询参数解析笔记 uid；优先 `uid`，兼容旧参数名 `id`（值须为 uid 字符串）。
 * 输入：
 * - uidParam：searchParams.get('uid')
 * - legacyIdParam：searchParams.get('id')
 * 输出：
 * - 返回值：合法 NoteResourceUid 或 null
 * - 副作用：无
 */
export function parseNoteUidFromQuery(
  uidParam: string | null,
  legacyIdParam: string | null = null,
): NoteResourceUid | null {
  if (isNoteResourceUid(uidParam)) {
    return uidParam
  }

  if (isNoteResourceUid(legacyIdParam)) {
    return legacyIdParam
  }

  return null
}
