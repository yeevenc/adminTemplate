import { get, type ApiResponseData } from '@/utils/request'

export interface HomeInfoItem {
  title: string
  description: string
}

export type HomeInfoResponse = HomeInfoItem[]

// 首页示例接口，后续业务模块可按当前写法继续拆分
export function getHomeInfo(): Promise<ApiResponseData<HomeInfoResponse>> {
  return get<HomeInfoResponse>('/home/info')
}
