import request from '../utils/request';

// 01）主体列表查询参数类型（EntityListQuery）
export interface EntityListQuery {
    type?: 'ENTERPRISE' | 'UNIVERSITY';
    auditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    q?: string;
    page?: number;
    pageSize?: number;
}

// 02）主体列表接口响应项类型（EntityListItemResponse）
export interface EntityListItemResponse {
    id: number;
    name: string;
    type: 'ENTERPRISE' | 'UNIVERSITY';
    balance: string | number;
    intro?: string | null;
    auditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    auditAdminId?: string | number | null;
    auditorName?: string | null;
    auditedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    lastLoginAt?: string | null;
}

// 03）主体列表接口 data 类型（EntityListData）
interface EntityListData {
    list?: EntityListItemResponse[];
    records?: EntityListItemResponse[];
    current?: number;
    pages?: number;
}

// 04）通用接口返回类型（BaseResponse）
interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
}

// 05）主体新增请求体类型（CreateEntityRequest）
export interface CreateEntityRequest {
    name: string;
    type: 'ENTERPRISE' | 'UNIVERSITY';
    intro?: string;
}

// 06）主体更新请求体类型（UpdateEntityRequest）
export interface UpdateEntityRequest {
    name: string;
    type: 'ENTERPRISE' | 'UNIVERSITY';
    intro?: string;
}

// 07）获取主体列表 API（getEntityListAPI）
/**
 * 函数名：getEntityListAPI
 * 功能：请求后端主体列表接口 `/entities/list`，返回主体列表数据。
 * 实现方法：
 * - 接收可选筛选参数并作为 query 透传给后端
 * - 统一通过 request 实例发起 GET 请求
 * - 返回后端标准结构中的 `data.records`（兼容旧版 `data.list`）容器数据
 * 输入：
 * - params：主体列表查询参数，支持 type、audit_status、q、page、pageSize，可选
 * 输出：
 * - 返回值：Promise<BaseResponse<EntityListData>>，包含后端返回的主体列表
 * - 副作用：无
 */
export function getEntityListAPI(params?: EntityListQuery): Promise<BaseResponse<EntityListData>> {
    return request.get<never, BaseResponse<EntityListData>>('/entities/list', { params });
}

// 08）新增主体 API（createEntityAPI）
/**
 * 函数名：createEntityAPI
 * 功能：调用主体新增接口 `/entities`，提交主体名称、类型与可选简介。
 * 实现方法：
 * - 接收页面传入的新增请求体
 * - 使用 request 实例发起 POST 请求
 * - 返回后端标准响应结构，供页面按需处理
 * 输入：
 * - data：主体新增请求体，包含 name/type 与可选 intro
 * 输出：
 * - 返回值：Promise<BaseResponse<unknown>>
 * - 副作用：无
 */
export function createEntityAPI(data: CreateEntityRequest): Promise<BaseResponse<unknown>> {
    return request.post<CreateEntityRequest, BaseResponse<unknown>>('/entities', data);
}

// 09）修改主体 API（updateEntityAPI）
/**
 * 函数名：updateEntityAPI
 * 功能：调用主体修改接口 `/entities/:id`，更新主体名称、类型与可选简介。
 * 实现方法：
 * - 接收主体 ID 与修改请求体
 * - 使用 request 实例发起 PUT 请求
 * - 返回后端标准响应结构，供页面提示与刷新
 * 输入：
 * - id：主体 ID（number）
 * - data：主体修改请求体，包含 name/type 与可选 intro
 * 输出：
 * - 返回值：Promise<BaseResponse<unknown>>
 * - 副作用：无
 */
export function updateEntityAPI(id: number, data: UpdateEntityRequest): Promise<BaseResponse<unknown>> {
    return request.put<UpdateEntityRequest, BaseResponse<unknown>>(`/entities/${id}`, data);
}

// 10）删除主体 API（deleteEntityAPI）
/**
 * 函数名：deleteEntityAPI
 * 功能：调用主体删除接口 `/entities/:id`，删除指定主体。
 * 实现方法：
 * - 接收主体 ID
 * - 使用 request 实例发起 DELETE 请求
 * - 返回后端标准响应结构，供页面处理结果
 * 输入：
 * - id：主体 ID（number）
 * 输出：
 * - 返回值：Promise<BaseResponse<unknown>>
 * - 副作用：无
 */
export function deleteEntityAPI(id: number): Promise<BaseResponse<unknown>> {
    return request.delete<never, BaseResponse<unknown>>(`/entities/${id}`);
}
