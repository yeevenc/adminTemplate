import { get, post } from '@/utils/request'

/**
 * 活动管理相关接口
 */

// 获取抖音好评列表
export const getTikTokList = (params: object) => {
  return get('getRaffleList', { params })
}

// 审核抖音好评
export const handleCheckComment = (params: object) => {
  return post('verify', params)
}

// 兼容后续其他页面的语义化引用，避免重复创建相同接口
export const getDouyinCommentList = getTikTokList
export const auditDouyinComment = handleCheckComment

/**
 * 
 *  
 * 小红书配置
 * 
 * 
 */


// 获取小红书配置列表
export const getXiaohongshuList = (params: object) => {
  return get('getAdminRednoteList', { params })
}

// 编辑小红书活动
export const editXiaohongshuConfig = (id: number, params: object) => {
  return post('updateRednote/' + id, params)
}

// 获取小红书活动详情
export const getXiaohongshuInfo = (id: number) => {
  return get(`getRednoteInfo/${id}`)
}

// 添加小红书配置活动
export const addXiaohongshuConfig = (params: object) => {
  return post('addRednote', params)
}

// 删除小红书配置活动
export const deleteXiaohongshuConfig = (id: number) => {
  return post(`delRednote/${id}`)
}

/**
 * 
 *  挑战赛报名列表
 * 
 */

// 获取挑战赛报名列表
export const getChallengeList = (params: object) => {
  return get('user_daily_plan', { params })
}

// 查看用户当前活动列表 
export const getUserChallengeList = (params: object) => {
  return get(`user_capsule_info`, { params })
}

// 补签
export const handleChallengeMakeup = (params: object) => {
  return post('setCheckRecord', params)
}