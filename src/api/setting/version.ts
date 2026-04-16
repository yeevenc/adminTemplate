import { post } from '@/utils/request'

/**
 * 版本升级相关接口
 */

// 获取版本列表
export const getVersionList = (params: object) => {
  return post('app_version_list', params)
}

// 新增版本配置
export const addVersionConfig = (params: object) => {
  return post('app_version_add', params)
}

// 编辑版本配置
export const editVersionConfig = (params: object) => {
  return post('app_version_edit', params)
}

// 保存渠道最新版本号配置
export const saveVersionMarketConfig = (params: object) => {
  return post('app_version_set', params)
}
