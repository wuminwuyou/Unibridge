import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';

// 01）解析管理端 API 基础地址（apiBaseURL）
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1/admin';
const refreshPath = import.meta.env.VITE_API_REFRESH_PATH || '/refresh';
const accessTokenKey = 'admin_token';
const refreshTokenKey = 'admin_refresh_token';

// 02）扩展请求配置类型（RetryableRequestConfig）
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// 03）刷新返回令牌类型（RefreshedTokenPair）
interface RefreshedTokenPair {
    accessToken: string;
    refreshToken?: string;
}

// 04）刷新队列项类型（RefreshQueueItem）
interface RefreshQueueItem {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

// 05）刷新状态共享（isRefreshing / refreshQueue）
let isRefreshing = false;
let refreshQueue: RefreshQueueItem[] = [];

// 06）创建 axios 实例（request）
const request: AxiosInstance = axios.create({
    baseURL: apiBaseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 07）读取访问令牌（getAccessToken）
/**
 * 函数名：getAccessToken
 * 功能：从本地存储读取当前 access token。
 * 实现方法：
 * - 使用固定 key 从 localStorage 读取
 * - 直接返回字符串或 null
 * 输入：
 * - 无
 * 输出：
 * - 返回值：string | null
 * - 副作用：无
 */
function getAccessToken(): string | null {
    return localStorage.getItem(accessTokenKey);
}

// 08）读取刷新令牌（getRefreshToken）
/**
 * 函数名：getRefreshToken
 * 功能：从本地存储读取当前 refresh token。
 * 实现方法：
 * - 使用固定 key 从 localStorage 读取
 * - 直接返回字符串或 null
 * 输入：
 * - 无
 * 输出：
 * - 返回值：string | null
 * - 副作用：无
 */
function getRefreshToken(): string | null {
    return localStorage.getItem(refreshTokenKey);
}

// 09）持久化令牌（persistTokenPair）
/**
 * 函数名：persistTokenPair
 * 功能：将刷新后拿到的 token 对写入本地存储。
 * 实现方法：
 * - 必写 access token
 * - refresh token 存在时再覆盖写入
 * 输入：
 * - tokenPair：包含 accessToken 与可选 refreshToken
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
function persistTokenPair(tokenPair: RefreshedTokenPair): void {
    localStorage.setItem(accessTokenKey, tokenPair.accessToken);
    if (tokenPair.refreshToken) {
        localStorage.setItem(refreshTokenKey, tokenPair.refreshToken);
    }
}

// 10）清空会话令牌（clearTokenPair）
/**
 * 函数名：clearTokenPair
 * 功能：清理登录态相关 token，防止失效令牌继续使用。
 * 实现方法：
 * - 删除 access token
 * - 删除 refresh token
 * 输入：
 * - 无
 * 输出：
 * - 返回值：void
 * - 副作用：删除 localStorage 中 token 项
 */
function clearTokenPair(): void {
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
}

// 11）分发刷新队列（flushRefreshQueue）
/**
 * 函数名：flushRefreshQueue
 * 功能：在刷新完成后统一处理并发请求队列。
 * 实现方法：
 * - 刷新失败时逐个 reject
 * - 刷新成功时逐个 resolve 并下发新 token
 * - 最后清空队列
 * 输入：
 * - error：刷新错误对象，成功时传 null
 * - token：刷新成功后的 access token（可选）
 * 输出：
 * - 返回值：void
 * - 副作用：消费并清空内存中的 refreshQueue
 */
function flushRefreshQueue(error: unknown, token?: string): void {
    refreshQueue.forEach((item) => {
        if (error) {
            item.reject(error);
            return;
        }
        item.resolve(token || '');
    });
    refreshQueue = [];
}

// 12）解析刷新接口返回（extractRefreshedTokenPair）
/**
 * 函数名：extractRefreshedTokenPair
 * 功能：兼容不同后端响应结构，提取 access/refresh token。
 * 实现方法：
 * - 兼容顶层与 data 包裹结构
 * - 兼容 token/accessToken 字段命名
 * - 未拿到有效 access token 时返回 null
 * 输入：
 * - rawResponse：刷新接口原始响应体
 * 输出：
 * - 返回值：RefreshedTokenPair | null
 * - 副作用：无
 */
function extractRefreshedTokenPair(rawResponse: unknown): RefreshedTokenPair | null {
    if (!rawResponse || typeof rawResponse !== 'object') {
        return null;
    }
    const response = rawResponse as {
        token?: string;
        refreshToken?: string;
        refresh_token?: string;
        accessToken?: string;
        data?: {
            token?: string;
            refreshToken?: string;
            refresh_token?: string;
            accessToken?: string;
        };
    };
    const container = response.data ?? response;
    const accessToken = container.token || container.accessToken;
    if (!accessToken) {
        return null;
    }
    return {
        accessToken,
        refreshToken: container.refreshToken || container.refresh_token,
    };
}

// 13）调用刷新令牌接口（requestTokenRefresh）
/**
 * 函数名：requestTokenRefresh
 * 功能：使用本地 refresh token 请求后端刷新 access token。
 * 实现方法：
 * - 读取本地 refresh token
 * - 通过原生 axios 直接请求刷新接口（避免拦截器递归）
 * - 解析响应中的新 access/refresh token
 * 输入：
 * - 无
 * 输出：
 * - 返回值：Promise<RefreshedTokenPair>
 * - 副作用：无
 */
async function requestTokenRefresh(): Promise<RefreshedTokenPair> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('缺少 refresh token，请重新登录');
    }
    const refreshUrl = `${apiBaseURL}${refreshPath}`;
    const refreshResponse = await axios.post(
        refreshUrl,
        { refreshToken },
        {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${refreshToken}`,
            },
        },
    );
    const tokenPair = extractRefreshedTokenPair(refreshResponse.data);
    if (!tokenPair) {
        throw new Error('刷新 token 失败：响应中未返回有效 token');
    }
    return tokenPair;
}

// 14）判断是否鉴权接口（isAuthEndpoint）
/**
 * 函数名：isAuthEndpoint
 * 功能：判断请求是否为登录/刷新等鉴权接口，避免触发刷新递归。
 * 实现方法：
 * - 判断 URL 是否包含 /login
 * - 判断 URL 是否包含 refreshPath
 * 输入：
 * - url：请求地址（可选）
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
function isAuthEndpoint(url?: string): boolean {
    if (!url) {
        return false;
    }
    return url.includes('/login') || url.includes(refreshPath);
}

// 16）为重放请求写入鉴权头（setRetryAuthorizationHeader）
/**
 * 函数名：setRetryAuthorizationHeader
 * 功能：为重试请求写入新的 Authorization 头。
 * 实现方法：
 * - 兼容 AxiosHeaders.set 与普通对象两种 header 结构
 * - 统一写入 Bearer token
 * 输入：
 * - config：待重放的请求配置
 * - token：新 access token
 * 输出：
 * - 返回值：void
 * - 副作用：修改 config.headers
 */
function setRetryAuthorizationHeader(config: RetryableRequestConfig, token: string): void {
    if (!config.headers) {
        config.headers = {} as any;
    }
    const headers = config.headers as any;
    if (typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`);
        return;
    }
    headers['Authorization'] = `Bearer ${token}`;
}

// 17）请求拦截器（injectAccessToken）
request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// 18）响应成功拦截（unwrapBusinessResponse）
request.interceptors.response.use(
    (response: AxiosResponse) => {
        const res = response.data;
        if (res.code && res.code !== 200) {
            return Promise.reject(new Error(res.message || 'Error'));
        }
        return res;
    },
    async (error: AxiosError) => {
        const originalRequest = (error.config || {}) as RetryableRequestConfig;
        const status = error.response?.status;

        // 19）401 自动刷新并重放失败请求（autoRefreshOn401）
        if (status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                clearTokenPair();
                window.location.href = '/login';
                return Promise.reject(new Error('登录已过期，请重新登录 (401)'));
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({
                        resolve: (newToken: string) => {
                            setRetryAuthorizationHeader(originalRequest, newToken);
                            resolve(request(originalRequest));
                        },
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;
            try {
                const tokenPair = await requestTokenRefresh();
                persistTokenPair(tokenPair);
                flushRefreshQueue(null, tokenPair.accessToken);
                setRetryAuthorizationHeader(originalRequest, tokenPair.accessToken);
                return request(originalRequest);
            } catch (refreshError) {
                flushRefreshQueue(refreshError);
                clearTokenPair();
                window.location.href = '/login';
                return Promise.reject(new Error('登录已过期，请重新登录 (401)'));
            } finally {
                isRefreshing = false;
            }
        }

        // 20）非 401 错误文案映射（mapHttpErrorMessage）
        let errorMessage = '网络请求异常，请稍后重试';
        if (status) {
            switch (status) {
                case 400:
                    errorMessage = '请求参数错误 (400)';
                    break;
                case 401:
                    errorMessage = '登录已过期，请重新登录 (401)';
                    break;
                case 403:
                    errorMessage = '当前账号无权限访问该资源 (403)';
                    break;
                case 404:
                    errorMessage = '请求的资源不存在 (404)';
                    break;
                case 500:
                    errorMessage = '服务器内部错误 (500)';
                    break;
                default:
                    errorMessage = `连接错误 (${status})`;
            }
        } else if (error.message?.includes('timeout')) {
            errorMessage = '请求超时，请检查网络状况';
        }
        return Promise.reject(new Error(errorMessage));
    },
);

export default request;