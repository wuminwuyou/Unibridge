// 01）用户输入消毒上下文（UserInputSanitizeContext）
/** 输入框类型，供 XSS 消毒策略区分处理 */
export type UserInputSanitizeContext = 'plainText' | 'markdown' | 'title' | 'tag' | 'url'

// 02）用户输入消毒器（UserInputSanitizer）
/**
 * 函数名：UserInputSanitizer
 * 功能：统一 XSS 防御扩展点，可在应用层注入 DOMPurify 等实现。
 */
export interface UserInputSanitizer {
  /**
   * 函数名：sanitize
   * 功能：对单段用户输入做 XSS 过滤或转义。
   * 输入：
   * - value：原始输入
   * - context：输入场景（plainText / markdown / title 等）
   * 输出：
   * - 返回值：安全可用的字符串
   */
  sanitize(value: string, context: UserInputSanitizeContext): string
}

// 03）默认透传消毒器（defaultUserInputSanitizer）
const defaultUserInputSanitizer: UserInputSanitizer = {
  sanitize(value: string): string {
    return value
  },
}

let activeUserInputSanitizer: UserInputSanitizer = defaultUserInputSanitizer

// 04）注册用户输入消毒器（registerUserInputSanitizer）
/**
 * 函数名：registerUserInputSanitizer
 * 功能：在应用入口注册全局 XSS 消毒实现（如 DOMPurify 封装）。
 * 输入：
 * - sanitizer：UserInputSanitizer 实例
 * 输出：
 * - 副作用：替换后续 sanitizeUserInput 使用的实现
 */
export function registerUserInputSanitizer(sanitizer: UserInputSanitizer): void {
  activeUserInputSanitizer = sanitizer
}

// 05）重置为默认消毒器（resetUserInputSanitizer）
/**
 * 函数名：resetUserInputSanitizer
 * 功能：恢复默认透传消毒器，主要用于测试。
 * 输出：
 * - 副作用：重置 activeUserInputSanitizer
 */
export function resetUserInputSanitizer(): void {
  activeUserInputSanitizer = defaultUserInputSanitizer
}

// 06）消毒用户输入（sanitizeUserInput）
/**
 * 函数名：sanitizeUserInput
 * 功能：通过已注册的 UserInputSanitizer 处理用户输入，预留 XSS 防御能力。
 * 输入：
 * - value：原始输入
 * - context：输入场景，默认 plainText
 * 输出：
 * - 返回值：消毒后的字符串
 * - 副作用：无（具体副作用取决于已注册实现）
 */
export function sanitizeUserInput(
  value: string,
  context: UserInputSanitizeContext = 'plainText',
): string {
  return activeUserInputSanitizer.sanitize(value, context)
}

// 07）消毒纯文本输入（sanitizePlainTextInput）
/**
 * 函数名：sanitizePlainTextInput
 * 功能：对 textarea / input 等纯文本字段做 XSS 消毒。
 * 输入：
 * - value：原始纯文本
 * 输出：
 * - 返回值：消毒后的纯文本
 */
export function sanitizePlainTextInput(value: string): string {
  return sanitizeUserInput(value, 'plainText')
}
