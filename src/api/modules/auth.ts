import { post, type ApiResponseData } from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
}

export function login(data: LoginParams): Promise<ApiResponseData<LoginResult>> {
  return post<LoginResult, LoginParams>('/auth/login', data, { withToken: false, showError: false })
}
