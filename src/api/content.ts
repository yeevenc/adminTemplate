import { get, post } from '@/utils/request'

/**
 * 内容管理相关接口
 */

// 获取课程列表
export const getCourseList = (params: object) => {
  return get('get_course_list', { params })
}

// 添加课程
export const addCourse = (params: object) => {
  return post('add_course', params)
}

// 编辑课程
export const updateCourse = (id: number, params: object) => {
  return post(`update_course/${id}`, params)
}

// 获取课程详情
export const getCourseDetail = (id: number) => {
  return get(`get_course_info/${id}`)
}

// 获取课程分类类型
export const getCourseTypeList = (params?: object) => {
  return get('get_type', params ? { params } : undefined)
}

// 获取系列课程列表
export const getSeriesCourseList = (params: object) => {
  return get('getCourseSectionList', { params })
}

// 获取系列课程详情
export const getSeriesCourseDetail = (id: number) => {
  return get(`getCourseSectionDetail/${id}`)
}
// 添加系列课程
export const addSeriesCourse = (params: object) => {
  return post('addCourseSection', params)
}

// 编辑系列课程
export const updateSeriesCourse = (id: number, params: object) => {
  return post(`updateCourseSection/${id}`, params)
}
/**
 * 
 *  文章配置
 * 
 */

// 获取文章配置列表
export const getArticleConfigList = (params: object) => {
  return get('get_article_list', { params })
}

// 添加文章配置
export const addArticleConfig = (params: object) => {
  return post('add_article', params)
}

// 编辑文章配置
export const updateArticleConfig = (id: number, params: object) => {
  return post(`update_article/${id}`, params)
}
// 删除文章配置
export const deleteArticleConfig = (id: number) => {
  return post(`del_article/${id}`)
}
// 获取文章配置详情
export const getArticleConfigDetail = (id: number) => {
  return get(`get_article_info/${id}`)
}

/**
 * 
 * 
 *  解梦配置
 * 
 */

// 获取解梦配置列表
export const getOneiromancyList = (params: object) => {
  return get('get_dream_list', { params })
}

// 添加解梦配置
export const addOneiromancy = (params: object) => {
  return post('add_dream', params)
}

// 编辑解梦配置
export const updateOneiromancy = (id: number, params: object) => {
  return post(`update_dream/${id}`, params)
}
// 删除解梦配置
export const deleteOneiromancy = (id: number) => {
  return post(`del_dream/${id}`)
}
// 获取解梦配置详情
export const getOneiromancyDetail = (id: number) => {
  return get(`get_dream_info/${id}`)
}


/**
 * 
 * 
 *  每日寄语
 * 
 * 
 */

// 获取每日寄语列表
export const getDailyMessageList = (params: object) => {
  return get('getEveryDayMessageList', { params })
}

// 添加每日寄语
export const addDailyMessage = (params: object) => {
  return post('addEveryDayMessage', params)
}

// 编辑每日寄语
export const updateDailyMessage = (id: number, params: object) => {
  return post(`updateEveryDayMessage/${id}`, params)
}

// 获取每日寄语详情
export const getDailyMessageDetail = (id: number) => {
  return get(`get_everyday_message_info/${id}`)
}