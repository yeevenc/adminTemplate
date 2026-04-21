import { get, post } from '@/utils/request'

/**
 * 
 *  新增用户转化
 * 
 */

// 获取新增用户转化数据
export const getNewUserConversionData = (params: object) => {
  return get('get_page_data', { params })
}

// 添加投放金额
export const addInvestmentAmount = (params: object) => {
  return post('addRoiData', params)
}

/**
 * 解约率统计
 */

// 获取解约率统计数据
export const getLapseRatioData = (params: object) => {
  return get('getAutoStat', { params })
}
/**
 * 
 *  支付宝自动订阅统计
 * 
 */

// 获取支付宝自动订阅统计数据
export const getAlipayAutoSubscriptionData = (params: object) => {
  return get('getAliAutoList', { params })
}


// 获取支付宝重新扣费统计
export const getAlipayRetryData = (params: object) => {
  return get('get_fail_list_page', { params })
}

// 获取支付宝重新扣费订单统计
export const getAlipayRetryOrderData = (params: object) => {
    return get('get_fail_list_page_v2', { params })
}