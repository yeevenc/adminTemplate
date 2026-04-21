import { get, post } from '@/utils/request'

/**
 * 
 * 
 *  广告屏蔽
 * 
 */

// 获取广告屏蔽列表
export const getAdBlockList = (params: object) => {
  return get('getBlockAdsList', { params })
}

// 添加广告屏蔽用户
export const addAdBlockUser = (params: object) => {
  return post('addBlockAds', params)
}

/**
 * 短信白名单
 */

// 获取短信白名单列表
export const getAdminSmsWhiteList = (params: object) => {
  return get('getAdminSmsWhiteList', { params })
}

// 添加短信白名单
export const addSmsWhiteList = (params: object) => {
  return post('addSmsWhiteList', params)
}

// 修改短信白名单
export const updateSmsWhiteList = (id: number, params: object) => {
  return post(`updateSmsWhiteList/${id}`, params)
}

// 获取短信白名单详情
export const getSmsWhiteListDetail = (id: number) => {
  return get(`getSmsWhiteListDetail/${id}`)
}
// 查询用户打卡时长
export const getUserCheckInDuration = (params: object) => {
  return get(`user_training_info`, { params })
}