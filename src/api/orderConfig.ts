import { get, post } from '@/utils/request'

/**
 * 
 * 
 *  订单管理
 * 
 */

// 获取订单列表
export const getOrderList = (params: object) => {
  return get('get_order_list', { params })
}

// 获取订单详情
export const getOrderDetail = (id: number) => {
  return get(`get_order_info/${id}`)
}

// 更新订单状态
export const updateOrderStatus = ( params: object) => {
  return post(`order_processing`, params)
}

// 添加订单
export const addOrder = (params: object) => {
  return post('add_order', params)
}


/**
 * 
 * 
 *  退款订单
 * 
 */

// 获取退款订单列表
export const getRefundOrders = (params: object) => {
  return get('get_order_info', { params })
}

// 挑战赛退款
export const challengeRefundOrder = (params: object) => {
  return post('set_order_refund', params)
}

// 订单首次退款
export const firstRefundOrder = (params: object) => {
  return post('newOrderRefund', params)
}

// 订单二次退款
export const secondRefundOrder = (params: object) => {
  return post('newOrderRefundTwo', params)
}

// 手动退款订单
export const manualRefundOrder = (params: object) => { 
    return post('addAdminAlipayAccountApply', params)
}

// 获取订单退款操作人
export const getRefundOperators = (params: object) => {
    return get('getAdminName', { params })
}


/**
 * 
 * 
 *  退款审核
 * 
 */

// 获取退款审核列表
export const getRefundReviewList = (params: object) => {
  return get('getOrderRefundList', { params })
}

// 单条退款审核
export const reviewRefundOrder = (params: object) => {
  return post('OrderRefundExamine', params)
}

// 批量退款审核
export const batchReviewRefundOrder = (params: object) => {
  return post('OrderRefundBatchExamine', params)
}

// 设置退款限额
export const setRefundReviewLimit = (params: object) => {
  return post('setOrderRefundLimit', params)
}

// 获取退款限额
export const getRefundReviewLimit = () => {
  return get('getOrderRefundLimit')
}

// 获取七鱼聊天记录
export const getQiYuMessageList = (params: object) => {
  return get('getMessageList', { params })
}


/**
 * 
 * 
 *  手动退款
 * 
 */

// 获取手动退款列表
export const getManualRefundList = (params: object) => {
  return get('getAdminAlipayAccountApplyList', { params })
}

// 获取手动退款IP限制
export const getManualRefundIp = () => {
  return get('getApplyIp')
}

// 设置手动退款IP限制
export const setManualRefundIp = (params: object) => {
  return post('setApplyIp', params)
}

// 审核手动退款
export const auditManualRefund = (id: number | string, params: object) => {
  return post(`examineAlipayAccountApply/${id}`, params)
}


/**
 *
 *  支付失败用户
 *
 */

// 获取支付失败用户列表
export const getFailedPaymentList = (params: object) => {
  return get('getUserHightOrderList', { params })
}

// 编辑支付失败用户（更新联系状态和操作人）
export const updateFailedPaymentUser = (id: number | string, params: object) => {
  return post(`updateUserHightOrder/${id}`, params)
}

// 通过 order_id 查询订单详情（下单详情弹窗）
export const getOrderByOrderId = (params: object) => {
  return get('getOrder', { params })
}
