import request from '../utils/request';

/**
 * 登录请求参数接口
 */
interface LoginRequest {
    adminId: string;
    passwordHash: string;
}

/**
 * 后端统一返回格式接口
 * 这里的 T 是具体的业务数据类型
 */
interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
}

/**
 * 登录成功后的业务数据接口
 */
interface LoginData {
    token: string;
    refreshToken?: string;
    refresh_token?: string;
    auth_level: number;
    admin_id: string;
}

/**
 * 函数名：loginAPI
 * 功能：调用管理员登录接口，获取登录后的访问令牌及管理员身份信息。
 * 实现方法：
 * - 接收前端整理好的登录参数（账号与密码哈希）
 * - 调用 request.post 发送登录请求
 * - 依赖 request.ts 的统一响应拦截器完成业务响应解包
 * 输入：
 * - data：登录请求体，包含 adminId 与 passwordHash
 * 输出：
 * - 返回值：Promise<BaseResponse<LoginData>>，其中 data 内含 token/refreshToken（若后端返回）等信息
 * - 副作用：无（仅发起网络请求，不直接修改本地存储）
 */
export const loginAPI = (data: LoginRequest) => {
    // 我们在 request.ts 的响应拦截器里已经做了 response.data 的提取
    // 所以这里返回的类型是 BaseResponse<LoginData>
    // baseURL 已包含 /api/v1/admin，登录路径使用 /login，避免出现 /admin/admin/login 的 404
    return request.post<LoginRequest, BaseResponse<LoginData>>('/login', data);
};