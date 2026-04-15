# Login & Error Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add login page, 404/500 error pages, route auth guard, and API 401/500 redirect handling to PandaSleep Admin 2.0.

**Architecture:** Extend the existing reactive-module pattern from `stores/theme.ts`. New `stores/user.ts` handles token-based login/logout. Router navigation guard protects routes. `request.ts` interceptors redirect on HTTP 401 and 500. Three new view pages reuse the existing CSS variable / glassmorphism design system.

**Tech Stack:** Vue 3, TypeScript, Vue Router 5, Axios, Element Plus

**Spec:** `docs/superpowers/specs/2026-04-15-login-error-pages-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/stores/user.ts` | `isLoggedIn` computed, `loginAction(token)`, `logout()` |
| Create | `src/api/modules/auth.ts` | `POST /auth/login` typed wrapper |
| Modify | `src/api/index.ts` | Re-export auth module |
| Modify | `src/utils/request.ts` | HTTP 401 → clear token + redirect `/login`; HTTP 500 → redirect `/500`; business 401 → add redirect |
| Create | `src/views/login/index.vue` | Fullscreen nebula + centered glass card login form |
| Create | `src/views/error/404.vue` | Large gradient "404" + back buttons |
| Create | `src/views/error/500.vue` | Large gradient "500" + back button |
| Modify | `src/router/index.ts` | Add `/login`, `/404`, `/500` routes, catch-all, navigation guard |
| Modify | `.gitignore` | Ignore `.superpowers/` brainstorm artifacts |

---

## Task 1: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add .superpowers to .gitignore**

Append to `.gitignore`:
```
# Superpowers brainstorm artifacts
.superpowers/
```

- [ ] **Step 2: Commit**
```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm artifacts

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Create src/stores/user.ts

**Files:**
- Create: `src/stores/user.ts`

- [ ] **Step 1: Create the file with full content**

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```
Expected: no errors related to `stores/user.ts`

- [ ] **Step 3: Commit**
```bash
git add src/stores/user.ts
git commit -m "feat: add user store with login/logout actions

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Create auth API module

**Files:**
- Create: `src/api/modules/auth.ts`
- Modify: `src/api/index.ts`

- [ ] **Step 1: Create src/api/modules/auth.ts**

```ts
import { post, type ApiResponseData } from '../../utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
}

export function login(data: LoginParams): Promise<ApiResponseData<LoginResult>> {
  return post<LoginResult, LoginParams>('/auth/login', data, { withToken: false })
}
```

- [ ] **Step 2: Update src/api/index.ts**

Replace the full file content:
```ts
export * from './modules/home'
export * from './modules/auth'
```

- [ ] **Step 3: Verify TypeScript compiles**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**
```bash
git add src/api/modules/auth.ts src/api/index.ts
git commit -m "feat: add auth API module with login endpoint

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Update request.ts interceptors

**Files:**
- Modify: `src/utils/request.ts`

- [ ] **Step 1: Add router import at the top of the file**

After the existing imports, add:
```ts
import router from '../router'
```

The full imports block becomes:
```ts
import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
import router from '../router'
```

- [ ] **Step 2: Update the response success interceptor to redirect on business 401**

Replace the block:
```ts
      if (responseData.code === UNAUTHORIZED_CODE) {
        removeToken()
      }
```
With:
```ts
      if (responseData.code === UNAUTHORIZED_CODE) {
        removeToken()
        router.push('/login')
      }
```

- [ ] **Step 3: Replace the response error interceptor callback**

Replace the second function in `service.interceptors.response.use(...)`:
```ts
    (error: AxiosError<ApiResponseData>) => {
      const requestConfig = error.config as RequestConfig | undefined
      const status = error.response?.status
      const message = error.response?.data?.message || error.message || DEFAULT_ERROR_MESSAGE

      if (status === 401) {
        removeToken()
        router.push('/login')
        return Promise.reject(error)
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
```

- [ ] **Step 4: Verify TypeScript compiles**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**
```bash
git add src/utils/request.ts
git commit -m "feat: add 401/500 redirect handling in API interceptors

- HTTP 401: clear token and redirect to /login
- Business code 401: clear token and redirect to /login
- HTTP 500: redirect to /500

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Create login page

**Files:**
- Create: `src/views/login/index.vue`

- [ ] **Step 1: Create the file with full content**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../../api/modules/auth'
import { useUser } from '../../stores/user'
import { applyTheme } from '../../stores/theme'

// Ensure theme CSS vars are applied (in case of direct navigation)
applyTheme()

const router = useRouter()
const route = useRoute()
const { loginAction } = useUser()

const form = ref({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.value.username.trim() || !form.value.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const res = await login(form.value)
    loginAction(res.data.token)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect || '/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Nebula background (matches layout/index.vue cloud system) -->
    <div class="bg-scene" aria-hidden="true">
      <div class="cloud cp1" />
      <div class="cloud cp2" />
      <div class="cloud cp3" />
      <div class="cloud cw1" />
      <div class="cloud cw2" />
    </div>

    <!-- Login card -->
    <div class="login-card glass-card">
      <!-- Header -->
      <div class="login-header">
        <span class="login-logo-icon">🐼</span>
        <h1 class="login-title">PandaSleep Admin</h1>
        <p class="login-subtitle">智慧睡眠管理平台</p>
      </div>

      <!-- Form -->
      <div class="login-form">
        <div class="form-group">
          <label class="form-label" for="login-username">账号</label>
          <input
            id="login-username"
            v-model="form.username"
            class="form-input"
            type="text"
            placeholder="请输入账号"
            autocomplete="username"
            @keyup.enter="handleLogin"
          >
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">密码</label>
          <input
            id="login-password"
            v-model="form.password"
            class="form-input"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          >
        </div>
        <button
          class="login-btn"
          :class="{ loading }"
          :disabled="loading"
          @click="handleLogin"
        >
          <span v-if="!loading">登 录</span>
          <span v-else class="btn-loading">
            <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            登录中
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* ── Nebula background (same pattern as layout/index.vue) ── */
.bg-scene {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.cloud {
  position: absolute;
  transition: background 0.6s ease;
  animation: cloud-drift ease-in-out infinite;
}

.cp1 {
  width: 900px; height: 240px;
  top: -100px; left: -160px;
  background: radial-gradient(ellipse at 40% 50%, var(--color-primary) 0%, transparent 68%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(90px);
  border-radius: 60% 40% 55% 45% / 70% 50% 80% 40%;
  animation-duration: 40s; animation-delay: 0s;
}

.cp2 {
  width: 700px; height: 180px;
  bottom: 60px; right: -80px;
  background: radial-gradient(ellipse at 55% 50%, var(--color-primary-light) 0%, transparent 70%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(80px);
  border-radius: 45% 55% 40% 60% / 55% 65% 45% 70%;
  animation-duration: 33s; animation-delay: -12s;
}

.cp3 {
  width: 500px; height: 160px;
  top: 48%; left: 32%;
  background: radial-gradient(ellipse at 50% 60%, var(--color-primary) 0%, transparent 72%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(75px);
  border-radius: 50% 65% 42% 58% / 60% 42% 68% 50%;
  animation-duration: 46s; animation-delay: -24s;
}

.cw1 {
  width: 680px; height: 150px;
  top: 100px; left: 80px;
  background: radial-gradient(ellipse at 45% 50%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(60px);
  border-radius: 62% 38% 58% 42% / 52% 68% 42% 62%;
  animation-duration: 30s; animation-delay: -6s;
}

.cw2 {
  width: 500px; height: 120px;
  top: 220px; right: 180px;
  background: radial-gradient(ellipse at 50% 45%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(52px);
  border-radius: 48% 52% 60% 40% / 65% 38% 58% 48%;
  animation-duration: 26s; animation-delay: -18s;
}

@keyframes cloud-drift {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  20%       { transform: translate(18px, -9px) scale(1.01); }
  40%       { transform: translate(34px, 6px) scale(0.99); }
  60%       { transform: translate(22px, -13px) scale(1.02); }
  80%       { transform: translate(6px, 10px) scale(0.98); }
}

/* ── Login card ── */
.login-card {
  position: relative;
  z-index: 1;
  width: 360px;
  padding: 40px 36px 36px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo-icon {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 12px;
  display: block;
  filter: drop-shadow(0 0 16px var(--color-glow));
}

.login-title {
  font-family: 'Raleway', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Form ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.3px;
}

.form-input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.form-input::placeholder { color: var(--text-muted); }

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-glow);
}

/* ── Login button ── */
.login-btn {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  background: linear-gradient(135deg, var(--color-primary), var(--el-color-primary-dark-2));
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 20px var(--color-glow);
  font-family: inherit;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 6px 28px var(--color-glow);
}

.login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spin-icon { animation: spin 0.8s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/views/login/index.vue
git commit -m "feat: add login page with glassmorphism design

- Fullscreen nebula cloud background matching layout theme
- Centered glass card with logo, account/password inputs
- Enter-key submit, loading state, redirect-after-login support
- Responds to global theme CSS variables

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Create 404 error page

**Files:**
- Create: `src/views/error/404.vue`

- [ ] **Step 1: Create the file with full content**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-orb" aria-hidden="true" />
    <div class="error-content">
      <div class="error-code">404</div>
      <p class="error-title">页面未找到</p>
      <p class="error-desc">您访问的页面不存在，可能已被移除或链接有误。</p>
      <div class="error-actions">
        <button class="btn-primary" @click="router.push('/')">返回首页</button>
        <button class="btn-secondary" @click="router.back()">上一页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.error-orb {
  position: fixed;
  top: -80px; left: -80px;
  width: 500px; height: 320px;
  background: radial-gradient(ellipse at 40% 50%, var(--color-primary) 0%, transparent 65%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(90px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.error-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.error-code {
  font-family: 'Raleway', sans-serif;
  font-size: clamp(96px, 18vw, 160px);
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  user-select: none;
  filter: drop-shadow(0 0 40px var(--color-glow));
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.error-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 32px;
  max-width: 340px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-primary {
  height: 40px;
  padding: 0 24px;
  background: linear-gradient(135deg, var(--color-primary), #6366F1);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 20px var(--color-glow);
  transition: opacity 0.2s;
  font-family: inherit;
}

.btn-primary:hover { opacity: 0.88; }

.btn-secondary {
  height: 40px;
  padding: 0 24px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.2s, color 0.2s;
  font-family: inherit;
}

.btn-secondary:hover {
  background: var(--glass-hover);
  color: var(--text-primary);
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/views/error/404.vue
git commit -m "feat: add 404 error page

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Create 500 error page

**Files:**
- Create: `src/views/error/500.vue`

- [ ] **Step 1: Create the file with full content**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-orb" aria-hidden="true" />
    <div class="error-content">
      <div class="error-code">500</div>
      <p class="error-title">服务器开了个小差</p>
      <p class="error-desc">服务器内部错误，请稍后重试。如果问题持续存在，请联系管理员。</p>
      <div class="error-actions">
        <button class="btn-primary" @click="router.push('/')">返回首页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.error-orb {
  position: fixed;
  top: -80px; left: -80px;
  width: 500px; height: 320px;
  background: radial-gradient(ellipse at 40% 50%, #EF4444 0%, transparent 65%);
  opacity: 0.18;
  filter: blur(90px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.error-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.error-code {
  font-family: 'Raleway', sans-serif;
  font-size: clamp(96px, 18vw, 160px);
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #EF4444 0%, #F97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  user-select: none;
  filter: drop-shadow(0 0 40px rgba(239,68,68,0.4));
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.error-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 32px;
  max-width: 360px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-primary {
  height: 40px;
  padding: 0 24px;
  background: linear-gradient(135deg, #EF4444, #F97316);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(239,68,68,0.35);
  transition: opacity 0.2s;
  font-family: inherit;
}

.btn-primary:hover { opacity: 0.88; }
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/views/error/500.vue
git commit -m "feat: add 500 error page with red-orange accent

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Update router with new routes and navigation guard

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: Replace src/router/index.ts with full updated content**

```ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '../utils/auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    hidden?: boolean
  }
}

// _-prefix suppresses vue-tsc false-positive TS6133 on RouteRecordRaw union types
const _p = () => import('../views/placeholder/index.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/home/index.vue'),
        meta: { title: '数据概览', icon: 'dashboard' },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/error/404.vue'),
    meta: { title: '页面未找到', hidden: true },
  },
  {
    path: '/500',
    name: '500',
    component: () => import('../views/error/500.vue'),
    meta: { title: '服务器错误', hidden: true },
  },
  // Catch-all: redirect unknown paths to /404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const WHITE_LIST = ['/login', '/404', '/500']

router.beforeEach((to, _from, next) => {
  const token = getToken()

  // Always allow white-listed routes
  if (WHITE_LIST.includes(to.path)) {
    // Already logged in — bounce away from /login to home
    if (token && to.path === '/login') {
      next('/')
    } else {
      next()
    }
    return
  }

  // Protected route: require token
  if (token) {
    next()
    return
  }

  // Not authenticated: go to login, preserve intended destination
  next({ path: '/login', query: { redirect: to.fullPath } })
})

export default router
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Run dev server and manually verify**
```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npm run dev
```

Manual checks (open browser at `http://localhost:5173`):
1. Visit `/` without token → redirects to `/login` ✓
2. Login page shows nebula background + centered glass card ✓
3. Submit empty form → ElMessage warning toast ✓
4. Visit `/some-random-path` → renders 404 page with purple gradient code ✓
5. Visit `/500` → renders 500 page with red-orange gradient code ✓
6. After login with valid token → redirects to `/` or `?redirect` target ✓

- [ ] **Step 4: Commit**
```bash
git add src/router/index.ts
git commit -m "feat: add /login /404 /500 routes and auth navigation guard

- /login, /404, /500 are whitelisted (no token required)
- Unauthenticated access to protected routes redirects to /login?redirect=<path>
- Already-authenticated access to /login bounces to /
- Catch-all route redirects unknown paths to /404

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Login page (account + password, glassmorphism, matching theme) — Task 5
- ✅ 404 error page — Task 6
- ✅ 500 error page — Task 7
- ✅ API interceptor → HTTP 401 redirect to /login — Task 4
- ✅ API interceptor → business code 401 redirect to /login — Task 4
- ✅ API interceptor → HTTP 500 redirect to /500 — Task 4
- ✅ Token stored in localStorage (existing `utils/auth.ts`, used in Tasks 2/3/5)
- ✅ Already-logged-in /login → redirect / — Task 8 nav guard
- ✅ Unknown routes → /404 — Task 8 catch-all
- ✅ `withToken: false` on login request — Task 3

**Placeholder scan:** No TBDs, vague steps, or missing code blocks found.

**Type consistency:**
- `loginAction(token: string)` defined in Task 2 → called in Task 5 ✅
- `login(data: LoginParams)` returns `Promise<ApiResponseData<LoginResult>>` → `.data.token` accessed in Task 5 ✅
- `getToken()` / `removeToken()` from `utils/auth` used in Tasks 2, 4, 8 ✅
- `WHITE_LIST` uses plain string paths matching route definitions ✅
