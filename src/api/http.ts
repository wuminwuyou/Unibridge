import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { dispatchAuthForceLogout, dispatchAuthTokensUpdated } from '../auth/authEvents'
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../auth/tokenStorage'

// 01）后端统一响应结构类型定义（ApiEnvelope）
export interface ApiEnvelope<TData> {
  code: number
  message: string
  data: TData
}

// 02）统一 HTTP 异常类型定义（HttpApiError）
export class HttpApiError extends Error {
  readonly code: number
  readonly requestConfig?: InternalAxiosRequestConfig

  constructor(code: number, message: string, requestConfig?: InternalAxiosRequestConfig) {
    super(message)
    this.name = 'HttpApiError'
    this.code = code
    this.requestConfig = requestConfig
  }
}

// 03）请求基地址配置（API_BASE_URL）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api/v1/client'

// 04）刷新令牌接口路径常量（REFRESH_API_PATH）
const REFRESH_API_PATH = '/auth/refresh'

// 05）可重试请求扩展配置类型（RetryableRequestConfig）
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// 06）刷新令牌响应数据类型（RefreshTokenData）
interface RefreshTokenData {
  accessToken: string
  refreshToken: string
}

// 07）401 重试排队项类型定义（QueuedRetryRequest）
interface QueuedRetryRequest {
  resolve: (accessToken: string) => void
  reject: (error: unknown) => void
}

// 08）创建 Axios 实例（httpClient）
const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 09）创建刷新令牌专用 Axios 实例（refreshClient）
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 10）刷新锁与请求队列（isRefreshing / requestsQueue）
let isRefreshing = false
let requestsQueue: QueuedRetryRequest[] = []

// 11）处理队列中的挂起请求（processRequestsQueue）
/**
 * 函数名：processRequestsQueue
 * 功能：在 refresh 完成后统一恢复或拒绝所有排队请求。
 * 实现方法：
 * - 刷新成功：将新 accessToken 传给队列中每个请求并 resolve
 * - 刷新失败：将同一错误传给队列中每个请求并 reject
 * - 最后清空队列，避免重复消费
 * 输入：
 * - error：刷新失败时的错误对象，可为空
 * - renewedAccessToken：刷新成功后的 accessToken，可为空
 * 输出：
 * - 返回值：void
 * - 副作用：变更队列中 Promise 的状态
 */
function processRequestsQueue(error: unknown, renewedAccessToken: string | null): void {
  requestsQueue.forEach((queuedRequest) => {
    if (error) {
      queuedRequest.reject(error)
      return
    }

    if (renewedAccessToken) {
      queuedRequest.resolve(renewedAccessToken)
    }
  })
  requestsQueue = []
}

// 12）队列挂起等待刷新结果（enqueueRetryRequest）
/**
 * 函数名：enqueueRetryRequest
 * 功能：将 401 失败请求挂起到队列，等待刷新完成后继续执行。
 * 实现方法：
 * - 返回一个 Promise，并将其 resolve/reject 注册到 requestsQueue
 * - 由 processRequestsQueue 在刷新完成时统一触发
 * 输入：无
 * 输出：
 * - 返回值：Promise<string>（刷新后的 accessToken）
 * - 副作用：向 requestsQueue 追加待处理项
 */
function enqueueRetryRequest(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    requestsQueue.push({ resolve, reject })
  })
}

// 13）判断是否刷新接口（isRefreshRequest）
/**
 * 函数名：isRefreshRequest
 * 功能：判断当前请求是否为刷新令牌接口，避免拦截器递归刷新。
 * 实现方法：
 * - 读取请求 URL
 * - 当 URL 以 /auth/refresh 结尾时返回 true
 * 输入：
 * - requestConfig：请求配置
 * 输出：
 * - 返回值：是否为刷新令牌请求
 * - 副作用：无
 */
function isRefreshRequest(requestConfig?: InternalAxiosRequestConfig): boolean {
  if (!requestConfig?.url) {
    return false
  }
  return requestConfig.url.includes(REFRESH_API_PATH)
}

// 14）判断是否为 accessToken 失效错误（isAccessTokenExpiredError）
/**
 * 函数名：isAccessTokenExpiredError
 * 功能：根据错误码或错误消息判断是否属于 accessToken 失效场景。
 * 实现方法：
 * - 匹配常见 token 过期错误文案
 * - 兼容 code=401 的鉴权失败场景
 * 输入：
 * - code：业务错误码或 HTTP 状态码
 * - message：错误消息
 * 输出：
 * - 返回值：是否应触发 refresh
 * - 副作用：无
 */
function isAccessTokenExpiredError(code: number, message: string): boolean {
  if (code === 401) {
    return true
  }

  const tokenExpiredMessages = new Set([
    'ACCESS_TOKEN_EXPIRED',
    'TOKEN_EXPIRED',
    'TOKEN_INVALID',
    'UNAUTHORIZED',
    'INVALID_TOKEN',
  ])
  return tokenExpiredMessages.has(message)
}

// 15）会话失效兜底处理（handleSessionExpired）
/**
 * 函数名：handleSessionExpired
 * 功能：当 refresh 失败时清理会话并广播全局强制登出事件。
 * 实现方法：
 * - 清理本地 token
 * - 派发全局强制登出事件，重置 React 认证状态
 * 输入：无
 * 输出：
 * - 返回值：void
 * - 副作用：清空 localStorage、触发全局事件
 */
function handleSessionExpired(): void {
  clearAuthTokens()
  dispatchAuthForceLogout()
}

// 16）持久化刷新后的令牌（persistRefreshedTokens）
/**
 * 函数名：persistRefreshedTokens
 * 功能：将刷新接口返回的新 token 写入 localStorage。
 * 实现方法：
 * - accessToken 与 refreshToken 都必须存在
 * - 两个 token 都进行覆盖写入，满足 refreshToken 一次性轮换安全策略
 * 输入：
 * - refreshedTokens：刷新接口返回的令牌对象
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
function persistRefreshedTokens(refreshedTokens: RefreshTokenData): void {
  if (!refreshedTokens.accessToken || !refreshedTokens.refreshToken) {
    throw new HttpApiError(401, '登录状态已失效，请重新登录')
  }
  setAuthTokens({
    accessToken: refreshedTokens.accessToken,
    refreshToken: refreshedTokens.refreshToken,
  })
  dispatchAuthTokensUpdated({
    accessToken: refreshedTokens.accessToken,
    refreshToken: refreshedTokens.refreshToken,
  })
}

// 17）执行刷新令牌请求（requestTokenRefresh）
/**
 * 函数名：requestTokenRefresh
 * 功能：调用 /auth/refresh 接口换取新的 accessToken 与 refreshToken。
 * 实现方法：
 * - 从 localStorage 读取 refreshToken 作为请求参数
 * - 使用 refreshClient 调用刷新接口，校验统一响应结构
 * - 成功后校验新 accessToken 与 refreshToken 均存在
 * - 将两枚新 token 写入本地并返回新 accessToken
 * 输入：无
 * 输出：
 * - 返回值：新的 accessToken
 * - 副作用：发起网络请求并写入 localStorage
 */
async function requestTokenRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new HttpApiError(401, '登录状态已失效，请重新登录')
  }

  try {
    const response = await refreshClient.post<ApiEnvelope<RefreshTokenData>>(REFRESH_API_PATH, { refreshToken })
    if (response.data.code !== 200) {
      throw new HttpApiError(response.data.code, response.data.message)
    }
    if (!response.data.data?.accessToken || !response.data.data?.refreshToken) {
      throw new HttpApiError(401, '登录状态已失效，请重新登录')
    }

    persistRefreshedTokens(response.data.data)
    return response.data.data.accessToken
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw error
    }
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiEnvelope<unknown>>
      const responseCode = axiosError.response?.data?.code ?? axiosError.response?.status ?? 401
      const responseMessage = axiosError.response?.data?.message ?? '登录状态已失效，请重新登录'
      throw new HttpApiError(responseCode, responseMessage)
    }
    throw new HttpApiError(401, '登录状态已失效，请重新登录')
  }
}

// 18）获取刷新后的 accessToken（getRefreshedAccessToken）
/**
 * 函数名：getRefreshedAccessToken
 * 功能：在刷新期间对后续 401 请求进行排队等待，防止并发重复刷新。
 * 实现方法：
 * - 当 isRefreshing=true 时，将请求加入 requestsQueue 挂起等待
 * - 当 isRefreshing=false 时获取刷新锁并发起单次 refresh 请求
 * - refresh 成功后广播新 token 并恢复队列；失败则拒绝队列并清会话
 * 输入：无
 * 输出：
 * - 返回值：新的 accessToken
 * - 副作用：发起 refresh 请求并处理队列
 */
async function getRefreshedAccessToken(): Promise<string> {
  if (isRefreshing) {
    return enqueueRetryRequest()
  }

  isRefreshing = true
  try {
    const renewedAccessToken = await requestTokenRefresh()
    processRequestsQueue(null, renewedAccessToken)
    return renewedAccessToken
  } catch (error) {
    processRequestsQueue(error, null)
    handleSessionExpired()
    throw error
  } finally {
    isRefreshing = false
  }
}

// 19）使用新 token 重试原请求（retryRequestWithRefreshedToken）
/**
 * 函数名：retryRequestWithRefreshedToken
 * 功能：当 accessToken 失效时刷新 token 并自动重试原请求。
 * 实现方法：
 * - 阻止已重试或刷新接口本身再次进入刷新逻辑
 * - 获取新 accessToken 后覆盖原请求 Authorization
 * - 使用原请求配置再次调用 httpClient.request
 * 输入：
 * - requestConfig：失败请求的原始配置
 * 输出：
 * - 返回值：重试请求后的业务结果
 * - 副作用：可能触发 refresh 请求并重试网络请求
 */
async function retryRequestWithRefreshedToken<TData>(requestConfig: RetryableRequestConfig): Promise<TData> {
  if (requestConfig._retry || isRefreshRequest(requestConfig)) {
    throw new HttpApiError(401, '登录状态已失效，请重新登录', requestConfig)
  }

  requestConfig._retry = true
  const renewedAccessToken = await getRefreshedAccessToken()
  const latestAccessToken = getAccessToken() ?? renewedAccessToken
  requestConfig.headers = new AxiosHeaders(requestConfig.headers)
  requestConfig.headers.Authorization = `Bearer ${latestAccessToken}`
  return httpClient.request<unknown, TData>(requestConfig)
}

// 20）请求拦截器（requestInterceptor）
/**
 * 函数名：requestInterceptor
 * 功能：统一处理请求发起前的配置，例如注入认证头等。
 * 实现方法：
 * - 保证 headers 对象存在
 * - 预留从 localStorage 读取 token 并注入 Authorization 的位置
 * - 返回处理后的配置对象
 * 输入：
 * - config：Axios 内部请求配置
 * 输出：
 * - 返回值：处理后的请求配置
 * - 副作用：无（仅读取本地存储）
 */
function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (!config.headers) {
    config.headers = new AxiosHeaders()
  }

  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization
  }

  return config
}

// 21）响应成功拦截器（responseSuccessInterceptor）
/**
 * 函数名：responseSuccessInterceptor
 * 功能：统一解包后端响应并校验业务 code 字段。
 * 实现方法：
 * - 将响应体断言为 { code, message, data } 结构
 * - 当 code 非 200 且为 accessToken 失效时触发自动 refresh 并重试
 * - 其他 code 非 200 场景抛出 HttpApiError
 * - 返回 data 字段作为业务层直接可用结果
 * 输入：
 * - response：Axios 原始响应对象
 * 输出：
 * - 返回值：业务数据 data（泛型）或重试后的业务数据
 * - 副作用：可能触发 refresh 请求与原请求重试
 */
async function responseSuccessInterceptor<TData>(response: AxiosResponse<ApiEnvelope<TData>>): Promise<TData> {
  const responseBody = response.data
  if (responseBody.code !== 200) {
    if (isAccessTokenExpiredError(responseBody.code, responseBody.message)) {
      return retryRequestWithRefreshedToken<TData>(response.config)
    }
    throw new HttpApiError(responseBody.code, responseBody.message, response.config)
  }
  return responseBody.data
}

// 22）响应失败拦截器（responseErrorInterceptor）
/**
 * 函数名：responseErrorInterceptor
 * 功能：统一归一化网络层异常，转换为 HttpApiError。
 * 实现方法：
 * - 识别 token 失效异常并自动触发 refresh + 原请求重试
 * - 识别 AxiosError，并优先读取后端返回的 code/message
 * - 对无响应场景返回网络异常提示
 * - 保证抛出的错误格式一致，便于业务层处理
 * 输入：
 * - error：Axios 抛出的异常对象
 * 输出：
 * - 返回值：重试后的业务结果或 Promise.reject(HttpApiError)
 * - 副作用：可能触发 refresh 请求与原请求重试
 */
async function responseErrorInterceptor(error: unknown): Promise<unknown> {
  if (error instanceof HttpApiError) {
    if (
      error.requestConfig &&
      !isRefreshRequest(error.requestConfig) &&
      isAccessTokenExpiredError(error.code, error.message)
    ) {
      return retryRequestWithRefreshedToken(error.requestConfig)
    }
    return Promise.reject(error)
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiEnvelope<unknown>>
    const responseStatusCode = axiosError.response?.status ?? -1
    const responseMessage = axiosError.response?.data?.message ?? ''

    if (axiosError.config && !isRefreshRequest(axiosError.config) && isAccessTokenExpiredError(responseStatusCode, responseMessage)) {
      return retryRequestWithRefreshedToken(axiosError.config)
    }

    const responseCode = axiosError.response?.data?.code ?? responseStatusCode
    const normalizedMessage = axiosError.response?.data?.message ?? '请求失败，请稍后重试'
    return Promise.reject(new HttpApiError(responseCode, normalizedMessage, axiosError.config))
  }

  return Promise.reject(new HttpApiError(-1, '网络异常，请稍后重试'))
}

httpClient.interceptors.request.use(requestInterceptor)
httpClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor)

// 23）通用 GET 请求方法（getApi）
/**
 * 函数名：getApi
 * 功能：基于统一 axios 实例发送 GET 请求，并返回业务数据。
 * 实现方法：
 * - 使用 httpClient.get 发起请求
 * - 依赖响应拦截器自动完成解包和错误归一化
 * - 返回泛型业务数据 TData
 * 输入：
 * - path：接口相对路径（例如 /user-profile/menu）
 * 输出：
 * - 返回值：业务数据对象
 * - 副作用：发起网络请求
 */
export async function getApi<TData>(path: string): Promise<TData> {
  return httpClient.get<ApiEnvelope<TData>, TData>(path)
}

// 24）通用 POST 请求方法（postApi）
/**
 * 函数名：postApi
 * 功能：基于统一 axios 实例发送 POST 请求，并返回业务数据。
 * 实现方法：
 * - 使用 httpClient.post 发起请求
 * - 依赖响应拦截器自动完成解包和错误归一化
 * - 返回泛型业务数据 TData
 * 输入：
 * - path：接口相对路径（例如 /auth/personal/register）
 * - payload：请求体对象
 * 输出：
 * - 返回值：业务数据对象
 * - 副作用：发起网络请求
 */
export async function postApi<TPayload extends object, TData>(path: string, payload: TPayload): Promise<TData> {
  return httpClient.post<ApiEnvelope<TData>, TData>(path, payload)
}

// 25）通用 PUT 请求方法（putApi）
/**
 * 函数名：putApi
 * 功能：基于统一 axios 实例发送 PUT 请求，并返回业务数据。
 * 输入：
 * - path：接口相对路径
 * - payload：请求体对象
 * 输出：
 * - 返回值：业务数据对象
 */
export async function putApi<TPayload extends object, TData>(path: string, payload: TPayload): Promise<TData> {
  return httpClient.put<ApiEnvelope<TData>, TData>(path, payload)
}

// 26）通用 DELETE 请求方法（deleteApi）
/**
 * 函数名：deleteApi
 * 功能：基于统一 axios 实例发送 DELETE 请求，并返回业务数据。
 * 输入：
 * - path：接口相对路径
 * 输出：
 * - 返回值：业务数据对象
 */
export async function deleteApi<TData>(path: string): Promise<TData> {
  return httpClient.delete<ApiEnvelope<TData>, TData>(path)
}

// 27）multipart POST 请求方法（postFormDataApi）
/**
 * 函数名：postFormDataApi
 * 功能：发送 multipart/form-data POST 请求（媒体上传等）。
 * 输入：
 * - path：接口相对路径
 * - formData：FormData 表单
 * 输出：
 * - 返回值：业务数据对象
 */
export async function postFormDataApi<TData>(path: string, formData: FormData): Promise<TData> {
  return httpClient.post<ApiEnvelope<TData>, TData>(path, formData)
}

export { httpClient }
