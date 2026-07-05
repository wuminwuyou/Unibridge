// 01）笔记作者昵称来源字段（NoteAuthorNicknameSource）
/** 后端不同接口可能返回 authorNickname / authorNickName / authorName */
export interface NoteAuthorNicknameSource {
  authorNickname?: string | null
  authorNickName?: string | null
  authorName?: string | null
}

// 02）解析笔记作者昵称（resolveNoteAuthorNickname）
/**
 * 函数名：resolveNoteAuthorNickname
 * 功能：从笔记 DTO 中归一化作者昵称，兼容后端字段命名差异。
 * 实现方法：
 * - 依次尝试 authorNickname、authorNickName、authorName
 * - 取首个非空 trim 结果
 * 输入：
 * - source：含作者昵称字段的对象
 * 输出：
 * - 返回值：昵称字符串或 undefined
 * - 副作用：无
 */
export function resolveNoteAuthorNickname(
  source: NoteAuthorNicknameSource,
): string | undefined {
  const candidates = [source.authorNickname, source.authorNickName, source.authorName]
  for (const value of candidates) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}
