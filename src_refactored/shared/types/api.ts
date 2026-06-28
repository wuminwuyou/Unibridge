// 01）HTTP 通用响应类型定义（ApiResponse）
export interface ApiResponse<TData> {
  code: number
  message: string
  data: TData
}
