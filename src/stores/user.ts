import { computed } from 'vue'
import { getToken, setToken, removeToken } from '../utils/auth'
import router from '../router'

export function useUser() {
  const isLoggedIn = computed(() => !!getToken())

  function loginAction(token: string): void {
    setToken(token)
  }

  function logout(): void {
    removeToken()
    router.push('/login')
  }

  return { isLoggedIn, loginAction, logout }
}
