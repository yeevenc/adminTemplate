import { get, post } from '@/utils/request'

/**
 * 
 * 
 *  支付宝商户管理
 * 
 */

// 获取支付宝商户列表
export const getAlipayMerchantList = (params: object) => {
  return get('getPaymentConfigList', { params })
}

// 编辑支付宝商户配置
export const editAlipayMerchantConfig = (id: number, params: object) => {
  return post('setPaymentConfig/' + id, params)
}
// 获取支付宝商户号 type 1-支付宝 2-微信
export const getAlipayMerchantNo = (params:object) => {
  return get('aliMerchantList', { params })
}
// 获取单年切换支付状态
export const getSingleYearPayStatus = (params:object) => {
  return get('getSingleYearSwitch',{ params })
}
// 切换单年支付状态
export const toggleSingleYearPayStatus = ( params: object) => {
  return post('setSingleYearSwitch', params)
}
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

/**
 * ASA关键词
 */

// 获取ASA关键词列表
export const getAsaAdList = (params: object) => {
  return get('getAsaAdList', { params })
}

// 导入ASA关键词
export const importAsaAd = (params: object) => {
  return post('importAsaAd', params)
}


/**
 * 
 * 
 *   版本审核配置
 * 
 */

// 获取版本审核配置列表
export const getVersionAuditList = (params: object) => {
  return get('getVersionList', { params })
}

// 获取版本审核配置详情
export const getVersionAuditInfo = (id: number) => {
  return get(`getVersionInfo/${id}`)
}

// 编辑版本审核配置
export const editVersionAuditConfig = (id: number, params: object) => {
  return post('updateVersion/' + id, params)
}
