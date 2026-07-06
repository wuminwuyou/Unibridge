// shared/lib — 公开接口
export { formatMetricCount } from './formatMetricCount'
export {
  registerUserInputSanitizer,
  resetUserInputSanitizer,
  sanitizePlainTextInput,
  sanitizeUserInput,
  type UserInputSanitizer,
  type UserInputSanitizeContext,
} from './sanitizeUserInput'
