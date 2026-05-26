// 01）项目对外 uid 类型（ProjectResourceUid）
/** 格式：`PR` + 11 位字符（= `project_uid`） */
export type ProjectResourceUid = string

// 02）笔记对外 uid 类型（NoteResourceUid）
/** 格式：`TX` / `VD` + 11 位字符（= `content_type_code`） */
export type NoteResourceUid = string

// 03）用户对外 uid 类型（UserResourceUid）
/** 格式：后端 `user_uid` 对外字符串标识；客户端禁止使用自增数字 id */
export type UserResourceUid = string

// 04）团队/实验室对外 uid 类型（TeamResourceUid）
/** 格式：后端 `team_uid` 对外字符串标识 */
export type TeamResourceUid = string

// 04.1）机构主体代码类型（EntityCode）
/** 格式：高校代码或社会统一信用代码（entity.entity_code） */
export type EntityCode = string

// 05）资源 uid 正则（PROJECT_RESOURCE_UID_REGEXP / NOTE_RESOURCE_UID_REGEXP）
const PROJECT_RESOURCE_UID_REGEXP = /^PR[A-Za-z0-9]{11}$/
const NOTE_RESOURCE_UID_REGEXP = /^(TX|VD)[A-Za-z0-9]{11}$/

// 06）校验项目 uid（isProjectResourceUid）
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

// 06）校验笔记 uid（isNoteResourceUid）
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

// 07）校验用户 uid（isUserResourceUid）
/**
 * 函数名：isUserResourceUid
 * 功能：判断字符串是否为合法的用户对外 uid。
 * 输入：
 * - value：待校验字符串
 * 输出：
 * - 返回值：类型守卫
 * - 副作用：无
 */
export function isUserResourceUid(value: string | null | undefined): value is UserResourceUid {
  return typeof value === 'string' && value.trim().length > 0
}

// 08）从接口对象解析用户 uid（normalizeUserResourceUid）
/**
 * 函数名：normalizeUserResourceUid
 * 功能：从认证/用户资料响应中提取对外 uid，兼容 uid / userUid / user_uid / 字符串 userId。
 * 实现方法：
 * - 按优先级读取常见字段名
 * - 忽略数字型 userId（自增 id 不可用于客户端请求）
 * 输入：
 * - source：接口 data 对象或任意含用户标识字段的对象
 * 输出：
 * - 返回值：UserResourceUid | null
 * - 副作用：无
 */
export function normalizeUserResourceUid(source: Record<string, unknown> | null | undefined): UserResourceUid | null {
  if (!source) {
    return null
  }

  const candidates = [source.uid, source.userUid, source.user_uid, source.userId]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && isUserResourceUid(candidate)) {
      return candidate.trim()
    }
  }

  return null
}

// 09）解析项目 uid 查询参数（parseProjectUidFromQuery）
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

// 10）解析笔记 uid 查询参数（parseNoteUidFromQuery）
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
