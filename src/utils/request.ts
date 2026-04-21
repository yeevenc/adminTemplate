import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import { ElLoading, ElMessage, type LoadingInstance } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router'

let isRedirectingToLogin = false
let loadingCount = 0
let loadingInstance: LoadingInstance | null = null

export interface ApiResponseData<T = any> {
  code: number
    message?: string
    msg?: string
    data: T
}

export interface RequestConfig<T = unknown> extends AxiosRequestConfig<T> {
  showError?: boolean
  showLoading?: boolean
  withToken?: boolean
}

export interface BlobRequestConfig<T = unknown> extends RequestConfig<T> {
  responseType: 'blob'
}

const DEFAULT_ERROR_MESSAGE = '服务异常，请稍后重试'
const SUCCESS_CODE_LIST = [0, 200]
const UNAUTHORIZED_CODE = 401
const EXPIRED_LOGIN_CODE = 501

function showErrorMessage(message?: string) {
  ElMessage.error(message || DEFAULT_ERROR_MESSAGE)
}

function resolveAuthorization(token: string) {
  return `Bearer ${token}`
}

function shouldShowError(config?: RequestConfig) {
  return config?.showError !== false
}

function shouldShowLoading(config?: RequestConfig) {
  return config?.showLoading !== false
}

function openGlobalLoading() {
  if (!loadingInstance) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.45)',
    })
  }

  loadingCount += 1
}

function closeGlobalLoading() {
  if (loadingCount > 0) {
    loadingCount -= 1
  }

  if (loadingCount === 0 && loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

function createRequestService(): AxiosInstance {
  const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 50000,
  })

  service.interceptors.request.use(
    (config) => {
      const requestConfig = config as InternalAxiosRequestConfig & RequestConfig

      if (shouldShowLoading(requestConfig)) {
        openGlobalLoading()
      }

      if (requestConfig.withToken === false) {
        return config
      }

      const token = getToken()

      if (!token) {
        return config
      }

      const headers = new AxiosHeaders(config.headers)
      headers.set('Authorization', resolveAuthorization(token))
      config.headers = headers

      return config
    },
    (error: AxiosError) => {
      const requestConfig = error.config as RequestConfig | undefined

      if (shouldShowLoading(requestConfig)) {
        closeGlobalLoading()
      }

      return Promise.reject(error)
    },
  )

  service.interceptors.response.use(
    (response: AxiosResponse<ApiResponseData>) => {
      const requestConfig = response.config as RequestConfig

      if (shouldShowLoading(requestConfig)) {
        closeGlobalLoading()
      }

      if (response.config.responseType === 'blob') {
        return response
      }

      const responseData = response.data

      if (SUCCESS_CODE_LIST.includes(responseData.code)) {
        return response
      }

      if (responseData.code === UNAUTHORIZED_CODE || responseData.code === EXPIRED_LOGIN_CODE) {
        removeToken()
        if (!isRedirectingToLogin && router.currentRoute.value.path !== '/login') {
          isRedirectingToLogin = true
          router.push('/login').finally(() => {
            isRedirectingToLogin = false
          })
        }
        return Promise.reject(responseData)
      }

      if (shouldShowError(requestConfig)) {
        showErrorMessage(responseData.message)
      }

      return Promise.reject(responseData)
    },
    (error: AxiosError<ApiResponseData>) => {
      const requestConfig = error.config as RequestConfig | undefined
      const status = error.response?.status
      const message = error.response?.data?.message || error.message || DEFAULT_ERROR_MESSAGE

      if (shouldShowLoading(requestConfig)) {
        closeGlobalLoading()
      }

      if (status === 401) {
        removeToken()
        if (!isRedirectingToLogin && router.currentRoute.value.path !== '/login') {
          isRedirectingToLogin = true
          router.push('/login').finally(() => {
            isRedirectingToLogin = false
          })
          return Promise.reject(error)
        }
        // On login page (or redirect already in progress): fall through so showErrorMessage runs below
      }

      if (status === 500) {
        router.push('/500')
        return Promise.reject(error)
      }

      if (shouldShowError(requestConfig)) {
        showErrorMessage(message)
      }

      return Promise.reject(error)
    },
  )

  return service
}

const service = createRequestService()

export default service

export function request<T = unknown>(config: BlobRequestConfig): Promise<Blob>
export function request<T = unknown>(config: RequestConfig): Promise<ApiResponseData<T>>
export function request<T = unknown>(config: RequestConfig): Promise<ApiResponseData<T> | Blob> {
  if (config.responseType === 'blob') {
    return service
      .request<Blob, AxiosResponse<Blob>>(config)
      .then((response) => response.data)
  }

  return service
    .request<ApiResponseData<T>, AxiosResponse<ApiResponseData<T>>>(config)
    .then((response) => response.data)
}

export function get<T = any>(url: string, config?: RequestConfig) {
  return request<T>({
    ...config,
    url,
    method: 'get',
  })
}

export function post<T = any, D = unknown>(url: string, data?: D, config?: RequestConfig<D>) {
  return request<T>({
    ...config,
    url,
    data,
    method: 'post',
  })
}

export function put<T = any, D = unknown>(url: string, data?: D, config?: RequestConfig<D>) {
  return request<T>({
    ...config,
    url,
    data,
    method: 'put',
  })
}

export function del<T = any>(url: string, config?: RequestConfig) {
  return request<T>({
    ...config,
    url,
    method: 'delete',
  })
}
