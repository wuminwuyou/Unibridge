import request from '../utils/request';

// 01）用户列表查询参数类型（UserListQuery）
export interface UserListQuery {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: 'id' | 'lastLoginAt';
    order?: 'asc' | 'desc';
}

// 02）用户列表响应项类型（UserListItemResponse）
export interface UserListItemResponse {
    id: number;
    phone: string;
    realName?: string | null;
    currentEntityName?: string | null;
    bioData?: string[] | string;
    careerData?: string[] | string;
    lastLoginAt?: string | null;
    intro?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

// 03）用户详情响应类型（UserDetailResponse）
export interface UserDetailResponse extends UserListItemResponse {
    intro: string | null;
}

// 04）用户更新请求体类型（UpdateUserRequest）
export interface UpdateUserRequest {
    phone: string;
    profile?: {
        realName?: string;
        currentEntityName?: string;
        bioData?: string[] | string;
        careerData?: string[] | string;
        intro?: string;
    };
}

// 05）用户列表接口 data 类型（UserListData）
interface UserListData {
    list?: UserListItemResponse[];
    records?: UserListItemResponse[];
}

// 06）用户新增请求体类型（CreateUserRequest）
export interface CreateUserRequest {
    phone: string;
    passwordHash: string;
    profile?: {
        realName?: string;
        currentEntityName?: string;
        bioData?: string[] | string;
        careerData?: string[] | string;
        intro?: string;
    };
}

// 07）通用接口返回类型（BaseResponse）
interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
}

// 08）获取用户列表 API（getUserListAPI）
/**
 * 函数名：getUserListAPI
 * 功能：调用用户列表接口 `/users/list`，返回用户与档案聚合列表。
 * 实现方法：
 * - 接收可选查询参数并透传到 query
 * - 通过 request 实例发起 GET 请求
 * - 返回后端标准响应结构供页面解析
 * 输入：
 * - params：用户列表查询参数（q/page/pageSize/sort/order），可选
 * 输出：
 * - 返回值：Promise<BaseResponse<UserListData>>
 * - 副作用：无
 */
export function getUserListAPI(params?: UserListQuery): Promise<BaseResponse<UserListData>> {
    return request.get<never, BaseResponse<UserListData>>('/users/list', { params });
}

// 09）获取用户详情 API（getUserDetailAPI）
/**
 * 函数名：getUserDetailAPI
 * 功能：调用用户详情接口 `/users/:id`，获取单个用户完整档案信息。
 * 实现方法：
 * - 接收用户 ID 作为路径参数
 * - 通过 request 实例发起 GET 请求
 * - 返回后端标准响应结构供详情弹窗渲染
 * 输入：
 * - id：用户 ID（number）
 * 输出：
 * - 返回值：Promise<BaseResponse<UserDetailResponse>>
 * - 副作用：无
 */
export function getUserDetailAPI(id: number): Promise<BaseResponse<UserDetailResponse>> {
    return request.get<never, BaseResponse<UserDetailResponse>>(`/users/${id}`);
}

// 10）新增用户 API（createUserAPI）
/**
 * 函数名：createUserAPI
 * 功能：调用用户新增接口 `/users`，创建用户及可选档案信息。
 * 实现方法：
 * - 接收页面提交的新增请求体
 * - 通过 request 实例发起 POST 请求
 * - 返回后端标准响应结构供页面提示与刷新
 * 输入：
 * - data：用户新增请求体（phone/passwordHash 必填，profile 可选）
 * 输出：
 * - 返回值：Promise<BaseResponse<unknown>>
 * - 副作用：无
 */
export function createUserAPI(data: CreateUserRequest): Promise<BaseResponse<unknown>> {
    return request.post<CreateUserRequest, BaseResponse<unknown>>('/users', data);
}

// 11）修改用户 API（updateUserAPI）
/**
 * 函数名：updateUserAPI
 * 功能：调用用户修改接口 `/users/:id`，更新用户手机号和档案信息。
 * 实现方法：
 * - 接收用户 ID 与更新请求体
 * - 通过 request 实例发起 PUT 请求
 * - 返回后端标准响应结构供页面处理
 * 输入：
 * - id：用户 ID（number）
 * - data：用户更新请求体（phone 必填，profile 可选）
 * 输出：
 * - 返回值：Promise<BaseResponse<unknown>>
 * - 副作用：无
 */
export function updateUserAPI(id: number, data: UpdateUserRequest): Promise<BaseResponse<unknown>> {
    return request.put<UpdateUserRequest, BaseResponse<unknown>>(`/users/${id}`, data);
}

// 12）删除用户 API（deleteUserAPI）
/**
 * 函数名：deleteUserAPI
 * 功能：调用用户删除接口 `/users/:id`，删除指定用户。
 * 实现方法：
 * - 接收用户 ID
 * - 通过 request 实例发起 DELETE 请求
 * - 返回后端标准响应结构供页面处理
 * 输入：
 * - id：用户 ID（number）
 * 输出：
 * - 返回值：Promise<BaseResponse<unknown>>
 * - 副作用：无
 */
export function deleteUserAPI(id: number): Promise<BaseResponse<unknown>> {
    return request.delete<never, BaseResponse<unknown>>(`/users/${id}`);
}
