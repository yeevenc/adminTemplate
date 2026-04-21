import { get, post } from '@/utils/request'

/**
 *
 *  运营配置
 *
 */

// 获取sku列表
export const getSkuList = (params?: object) => {
  return get('get_sku_list', { params })
}

// 添加sku
export const addSku = (params: object) => {
  return post('add_sku_info', params)
}

// 编辑sku
export const editSku = (id: number | string, params: object) => {
  return post(`edit_sku_info/${id}`, params)
}

// 获取sku详情
export const getSkuInfo = (id: number | string) => {
  return get(`sku_info/${id}`)
}

/**
 * 
 * 
 *  用户分群配置
 * 
 * 
 */


// 获取用户分群列表
export const getUserGroupList = (params?: object) => {
  return get('getUserGroupAdminList', { params })
}

// 获取用户分群详情
export const getUserGroupInfo = (id: number | string) => {
  return get(`user_group_info/${id}`)
}

// 添加用户分群
export const addUserGroup = (params: object) => {
  return post('addAdminUserGroup', params)
}

// 编辑用户分群
export const editUserGroup = (id: number | string, params: object) => {
  return post(`updateAdminUserGroup/${id}`, params)
}

// 获取人群分类
export const getUserGroupCategory = () => {
  return get('getVipTagList')
}



/**
 * 
 * 
 *  兑换码管理
 * 
 * 
 */


// 获取兑换码分类列表
export const getCodeCategoryList = (params?: object) => {
  return get('getCodeClassConfigList', { params })
}

// 添加兑换码分类
export const addCodeCategory = (params: object) => {
  return post('addCodeClassConfig', params)
}

// 获取兑换码分类详情
export const getCodeCategoryInfo = (id: number | string) => {
  return get(`getCodeClassConfigInfo/${id}`)
}

// 编辑兑换码分类
export const editCodeCategory = (id: number | string, params: object) => {
  return post(`updateCodeClassConfig/${id}`, params)
}

/**
 * 
 *  兑换码列表
 * 
 */


// 获取兑换码列表
export const getCodeList = (params?: object) => {
  return get('getRedemptionCodeList', { params })
}

// 获取兑换码详情
export const getCodeInfo = (id: number | string) => {
  return get(`getRedemptionCodeDetail/${id}`)
}

// 添加兑换码
export const addCode = (params: object) => {
  return post('addRedemptionCode', params)
}

// 删除兑换码
export const deleteCode = (id: number | string) => {
  return post(`delRedemptionCode/${id}`)
}


/***
 * 
 * 
 *  资源位配置-abTest和广告配置共用接口
 * 
 * 
 */
// 获取abTest列表
export const getAbTestList = (params: object) => {
  return get('getAdvertisementAbtestList', { params })
}
// 获取abTest详情
export const getAbTestInfo = (id: number | string) => {
  return get(`getResourceTestDetail/${id}`)
}
// 添加abTest
export const addAbTest = (params: object) => {
  return post('addResourceTest', params)
}
// 编辑abTest
export const editAbTest = (id: number | string, params: object) => {
  return post(`updateResourceTest/${id}`, params)
}
// 获取AB测试配置项数据
export const getAbTestConfig = () => {
  return get(`getDefaultAbtest`)
}

// 获取广告列表
export const getResourceList = (params: object) => {
  return get('get_home_sku_list', { params })
}

// 获取广告配置详情
export const getResourceInfo = (id: number | string) => {
  return get(`get_resource/${id}`)
}

// 添加广告配置
export const addResource = (params: object) => {
  return post('add_home_sku', params)
}

// 编辑广告配置
export const editResource = (id: number | string, params: object) => {
  return post(`update_home_sku/${id}`, params)
}

// 广告配置上下架
export const upDownResource = (id: number | string, params: object) => {
  return post(`up_down_resource/${id}`, params)
}

// 获取广告配置-补差sku列表（用于会员升级场景）

/**
 * 
 * 
 * 
 *  订阅中心
 * 
 * 
 */

/***
 * 
 *  订阅中心配置
 * 
 */

// 获取订阅中心列表
export const getSubscriptionCenterList = (params: object) => {
  return get('getCenterVipConfigList', { params })
}

// 获取订阅中心配置详情
export const getSubscriptionCenterInfo = (id: number | string) => {
  return get(`getCenterVipConfigInfo/${id}`)
}

// 添加订阅中心配置
export const addSubscriptionCenter = (params: object) => {
  return post('addCenterVipConfig', params)
}

export const editSubscriptionCenter = (id: number | string, params: object) => {
  return post(`updateCenterVipConfig/${id}`, params)
}

/***
 * 
 *  
 * 补差sku配置
 * 
 * 
 */

// 获取补差sku列表
export const getSubscriptionSkuList = (params?: object) => {
  return get('getAdminPriceUpgradeConfigList', { params })
}

// 获取补差sku详情
export const getMakeUpSkuInfo = (id: number | string) => {
  return get(`getAdminPriceUpgradeConfigInfo/${id}`)
}

// 添加补差sku配置
export const addMakeUpSku = (params: object) => {
  return post('addAdminPriceUpgradeConfig', params)
}

// 编辑补差sku配置
export const editMakeUpSku = (id: number | string, params: object) => {
  return post(`updateAdminPriceUpgradeConfig/${id}`, params)
}

/**
 * 
 *  
 *  订阅中心挽留配置
 * 
 */

// 获取挽留配置列表
export const getRetainConfigList = (params?: object) => {
  return get('getCancelCenterVipConfigList', { params })
}

// 获取挽留配置详情
export const getRetainConfigInfo = (id: number | string) => {
  return get(`getCancelCenterVipConfigInfo/${id}`)
}

// 添加挽留配置
export const addRetainConfig = (params: object) => {
  return post('addCancelCenterVipConfig', params)
}

// 编辑挽留配置
export const editRetainConfig = (id: number | string, params: object) => {
  return post(`updateCancelCenterVipConfig/${id}`, params)
}

/**
 * 
 * 
 *  订阅中心 ab实验列表
 * 
 * 
 */

// 获取ab实验列表
export const getSubscriptionAbTestList = (params: object) => {
  return get('getAdminCenterVipAbtestList', { params })
}

// 获取ab实验详情
export const getSubscriptionAbTestInfo = (id: number | string) => {
  return get(`getCenterVipAbtestInfo/${id}`)
}

// 添加ab实验
export const addSubscriptionAbTest = (params: object) => {
  return post('addCenterVipAbtest', params)
}

// 编辑ab实验
export const editSubscriptionAbTest = (id: number | string, params: object) => {
  return post(`updateCenterVipAbtest/${id}`, params)
}
// ab实验vip列表数据
export const getSubscriptionAbTestVipList = () => {
  return get(`getAdminCenterVipList`)
}

// 订阅中心ab实验神策key列表
export const getSubscriptionAbTestSenceKey = () => {
  return get('getVipSensorKey')
}

/***
 * 
 * 
 *  
 *  ob-模版配置
 * 
 * 
 * 
 */

// 获取模版列表
export const getTemplateList = (params?: object) => {
  return get('getTemplateConfigAdminList', { params })
}

// 添加ob模版-订阅页
export const addTemplate = (params: object) => {
  return post('addTemplateConfig', params)
}

// 编辑ob模版-订阅页
export const editTemplate = (id: number | string, params: object) => {
  return post(`updateTemplateConfig/${id}`, params)
}

// 获取模版详情
export const getTemplateInfo = (id: number | string,params?: object) => {
  return get(`getTemplateConfigInfo/${id}`, { params })
}

/**
 * 
 * 
 *  ob-挽留配置
 *  
 * 
 */

// 获取挽留配置列表
export const getObRetainList = (params?: object) => {
  return get('getCancelConfigAdminList', { params })
}

// 获取挽留配置详情
export const getObRetainInfo = (id: number | string) => {
  return get(`getCancelConfigInfo/${id}`)
}

// 添加挽留配置
export const addObRetain = (params: object) => {
  return post('addCancelConfig', params)
}

// 编辑挽留配置
export const editObRetain = (id: number | string, params: object) => {
  return post(`updateCancelConfig/${id}`, params)
}

/**
 * 
 * 
 *  ob-订阅页配置
 * 
 * 
 */

// 获取订阅页配置列表
export const getSubscriptionConfigList = (params?: object) => {
  return get('getObConfigAdminList', { params })
}

// 获取订阅页配置详情
export const getSubscriptionConfigInfo = (id: number | string) => {
  return get(`getObConfigInfo/${id}`)
}

// 添加订阅页配置
export const addSubscriptionConfig = (params: object) => {
  return post('addObConfig', params)
}

// 编辑订阅页配置
export const editSubscriptionConfig = (id: number | string, params: object) => {
  return post(`updateObConfig/${id}`, params)
}


/**
 *
 *
 *
 *  ob 策略配置
 *
 *
 *
 */

// 获取 OB 策略顶层列表（含筛选字段）
export const getObStrategyList = (params?: object) => {
  return get('getStrategyList', { params })
}

// 获取 OB 策略顶层配置详情（表单回显使用）
export const getObSubConfigInfo = (id: number | string) => {
  return get(`getObSubConfigInfo/${id}`)
}

// 添加 OB 策略（顶层配置）
export const addObStrategyConfig = (params: object) => {
  return post('addStrategy', params)
}

// 编辑 OB 策略（顶层配置）
export const editObStrategyConfig = (id: number | string, params: object) => {
  return post(`updateStrategy/${id}`, params)
}

// OB 策略上下架
export const updateObStrategyStatus = (id: number | string, params: object) => {
  return post(`updateObSubConfigStatus/${id}`, params)
}

// 根据多个策略 id 获取策略详情列表
export const getObStrategyInfoByIds = (params: object) => {
  return get('getObStrategyConfig', { params })
}

// 添加单个策略
export const addObStrategyItem = (params: object) => {
  return post('addObStrategyConfig', params)
}

// 编辑单个策略
export const editObStrategyItem = (id: number | string, params: object) => {
  return post(`updateObStrategyConfig/${id}`, params)
}

// 删除单个策略
export const delObStrategyItem = (id: number | string) => {
  return post(`delObStrategyConfig/${id}`)
}

// 订阅页/挽留页 id 模糊搜索（type=1 订阅页，type=2 挽留页）
export const getObPageIdList = (params: object) => {
  return get('getObSubConfigId', { params })
}

// 释放实验（释放实验组/线上组）
export const releaseObStrategyTest = (params: object) => {
  return get('releaseTest', { params })
}

// 预览订阅页配置
export const previewObSubscription = (id: number | string) => {
  return get(`getPreviewObConfig/${id}`)
}

// 预览挽留页配置
export const previewObRetain = (id: number | string) => {
  return get(`getPreviewCancelConfig/${id}`)
}
