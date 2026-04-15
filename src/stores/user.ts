import { ref, computed } from 'vue'
import { getToken, setToken, removeToken } from '../utils/auth'
import router from '../router'

const _token = ref(getToken())

export function useUser() {
  const isLoggedIn = computed(() => !!_token.value)

  function loginAction(token: string): void {
    setToken(token)
    _token.value = token
  }

  function logout(): void {
    removeToken()
    _token.value = null
    router.push('/login')
  }

  return { isLoggedIn, loginAction, logout }
}
