import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login, type LoginParams, type LoginResult } from '@/api/modules/auth'
import router from '@/router'
import { getToken, SLEEP_USER_STORE_STORAGE_KEY } from '@/utils/auth'

export const useSleepUserStore = defineStore(
  'sleepUser',
  () => {
    const token = ref(getToken() || '')
    const userInfo=ref<{ name: string }>({ name: '' })
    const isLoggedIn = computed(() => !!token.value)

    async function loginAction(params: LoginParams): Promise<LoginResult> {
      const response = await login(params)
      setToken(response.data.token)
      setUserInfo(response.data.name)
      return response.data
    }
    const setUserInfo=(name:string)=>{
      userInfo.value={name}
    }
    function setToken(value: string) {
      token.value = value
    }

    function clearToken() {
      token.value = ''
    }

    function logout() {
      clearToken()

      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }

    return {
      token,
      isLoggedIn,
      loginAction,
      setToken,
      clearToken,
      logout,
      userInfo,
      setUserInfo
    }
  },
  {
    persist: {
      key: SLEEP_USER_STORE_STORAGE_KEY,
      storage: localStorage,
      pick: ['token','userInfo'] // 只持久化 token 和 userInfo,
    },
  },
)
