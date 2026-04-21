import { post, type ApiResponseData } from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  name:string
}

export function login(data: LoginParams): Promise<ApiResponseData<LoginResult>> {
  return post<LoginResult, LoginParams>('login', data, {
    withToken: false,
    showError: false,
    showLoading: false,
  })
}
