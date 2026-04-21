import { get } from '@/utils/request'

/**
 * 
 *  通用接口
 * 
 */

// 获取sku列表 
export const getSkuList = () => {
  return get('get_all_sku_list' )
}

// 获取微信订阅ID
export const getWeChatSubscriptionList = () => {
  return get('getPlanList')
}


// 获取实验数据列表
export const getExperimentDataList = (params: object) => {
  return get('get_home_sku_list', { params })
}

// 广告预览
export const getAdvertisingPreview = (id: number) => {
  return get('getFullScreenPreview/' + id)
}

// 通用配置接口
export const getConfigList = () => {
  return get('get_universal_config')
}