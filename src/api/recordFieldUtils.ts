// 01）读取记录字段（readRecordField）
/**
 * 函数名：readRecordField
 * 功能：从接口对象读取字段，兼容 camelCase 与 snake_case 键名。
 * 输入：
 * - record：原始对象
 * - camelKey：camelCase 键名
 * - snakeKey：可选 snake_case 键名（缺省由 camelKey 推导）
 * 输出：
 * - 返回值：字段值或 undefined
 * - 副作用：无
 */
export function readRecordField<T>(
  record: Record<string, unknown>,
  camelKey: string,
  snakeKey?: string,
): T | undefined {
  const resolvedSnakeKey =
    snakeKey ?? camelKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

  if (record[camelKey] !== undefined && record[camelKey] !== null) {
    return record[camelKey] as T
  }

  if (record[resolvedSnakeKey] !== undefined && record[resolvedSnakeKey] !== null) {
    return record[resolvedSnakeKey] as T
  }

  return undefined
}

// 02）读取数字字段（readRecordNumber）
/**
 * 函数名：readRecordNumber
 * 功能：从记录中读取数字字段并回退默认值。
 * 输入：
 * - record：原始对象
 * - camelKey：camelCase 键名
 * - defaultValue：默认值
 * - snakeKey：可选 snake_case 键名
 * 输出：
 * - 返回值：number
 * - 副作用：无
 */
export function readRecordNumber(
  record: Record<string, unknown>,
  camelKey: string,
  defaultValue: number,
  snakeKey?: string,
): number {
  const value = readRecordField<number | string>(record, camelKey, snakeKey)
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return defaultValue
}

// 03）读取布尔字段（readRecordBoolean）
/**
 * 函数名：readRecordBoolean
 * 功能：从记录中读取布尔字段（兼容 true / "true" / 1）。
 * 输入：
 * - record：原始对象
 * - camelKey：camelCase 键名
 * - snakeKey：可选 snake_case 键名
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function readRecordBoolean(
  record: Record<string, unknown>,
  camelKey: string,
  snakeKey?: string,
): boolean {
  const value = readRecordField<unknown>(record, camelKey, snakeKey)
  return value === true || value === 'true' || value === 1
}

// 04）读取字符串字段（readRecordString）
/**
 * 函数名：readRecordString
 * 功能：从记录中读取字符串字段，空串视为 null（当 nullable 为 true）。
 * 输入：
 * - record：原始对象
 * - camelKey：camelCase 键名
 * - options.nullable：是否允许返回 null
 * - options.snakeKey：可选 snake_case 键名
 * 输出：
 * - 返回值：string | null | undefined
 * - 副作用：无
 */
export function readRecordString(
  record: Record<string, unknown>,
  camelKey: string,
  options?: { nullable?: boolean; snakeKey?: string },
): string | null | undefined {
  const value = readRecordField<unknown>(record, camelKey, options?.snakeKey)
  if (value == null) {
    return options?.nullable ? null : undefined
  }

  const normalized = String(value).trim()
  if (!normalized) {
    return options?.nullable ? null : undefined
  }

  return normalized
}
