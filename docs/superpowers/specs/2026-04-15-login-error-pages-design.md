# Login & Error Pages Design

**Project:** PandaSleep Admin 2.0  
**Date:** 2026-04-15  
**Status:** Approved

## Problem

The admin system has no login page, no route authentication, no 404/500 error pages, and the API interceptor removes the token on 401 but does not redirect the user.

## Approach

Extend the existing reactive-module pattern (matching `stores/theme.ts`) with minimal new files. No new dependencies required.

---

## Architecture

### New Files

| File | Purpose |
|---|---|
| `src/views/login/index.vue` | Login page — fullscreen nebula bg + centered glass card |
| `src/views/error/404.vue` | 404 page — large gradient "404" + back button |
| `src/views/error/500.vue` | 500 page — large gradient "500" + back button |
| `src/stores/user.ts` | User state: login(token), logout(), isLoggedIn computed |
| `src/api/modules/auth.ts` | `POST /auth/login` → `{ token }` |

### Modified Files

| File | Change |
|---|---|
| `src/router/index.ts` | Add /login, /404, /500 routes; add navigation guard |
| `src/utils/request.ts` | Interceptor: HTTP 401 → clear token + redirect /login; HTTP 500 → redirect /500 |
| `src/api/index.ts` | Export auth module |

---

## Pages

### Login Page (`/login`)

- **Layout:** Fullscreen nebula background (same CSS cloud/gradient system as layout), centered glassmorphism card (matches `glass-card` pattern).
- **Card contents:** Logo (🐼 icon + "PandaSleep Admin" + subtitle), account input, password input, login button.
- **Interactions:** Enter key submits; button shows loading state to prevent duplicate submissions; inline error message on failure.
- **Already logged in:** If user visits `/login` with a valid token, redirect immediately to `/` or the `redirect` query param target.
- **After login:** Redirect to `?redirect=<path>` if present, otherwise `/`.
- **Theme:** Primary color and dark/light mode follow the global theme store (same CSS variables).

### 404 Page (`/404`)

- **Background:** Same nebula background as login page.
- **Content:** Large gradient "404" (purple `#8B5CF6 → #6366F1`), subtitle "页面未找到", two buttons: "返回首页" → `/`, "上一页" → `router.back()`.
- **Triggered by:** Unknown routes via `{ path: '/:pathMatch(.*)*', redirect: '/404' }`.

### 500 Page (`/500`)

- **Background:** Same nebula background, red-orange nebula orb.
- **Content:** Large gradient "500" (red-orange `#EF4444 → #F97316`), subtitle "服务器开了个小差", button: "返回首页" → `/`.
- **Triggered by:** `request.ts` interceptor when HTTP response status is 500.

---

## Auth Flow

### Navigation Guard

```
beforeEach:
  const WHITE_LIST = ['/login', '/404', '/500']
  if WHITE_LIST includes to.path → next()
  else if token exists → next() (if to.path === '/login' → next('/'))
  else → next('/login?redirect=' + to.fullPath)
```

### API Interceptor (request.ts)

**Request:** Already attaches `Authorization: Bearer <token>` when token exists. No change needed.

**Response — success path:** No change.

**Response — error path (additions):**
- HTTP status 401 → `removeToken()` + `router.push('/login')` (safe: `/login` is in the white list, so no redirect loop even if already on login page)
- HTTP status 500 → `router.push('/500')`
- Business code 401 → existing `removeToken()` + add `router.push('/login')`

### stores/user.ts

```ts
// Reactive state: no persistent fields beyond token (token lives in localStorage via auth.ts)
{
  isLoggedIn: computed(() => !!getToken())
  login(token: string): void   // setToken + (router push handled by caller)
  logout(): void               // removeToken + router.push('/login')
}
```

### api/modules/auth.ts

```ts
interface LoginParams { username: string; password: string }
interface LoginResult { token: string }

// POST /auth/login  { withToken: false }  ← must skip token attachment
export function login(data: LoginParams): Promise<ApiResponseData<LoginResult>>
```

---

## Data Storage

Only `token` is stored in `localStorage` under the key `"token"` (existing `src/utils/auth.ts`). No other user fields are persisted.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Wrong credentials | API returns error message; shown via `ElMessage.error` (existing interceptor) |
| Network timeout | Existing interceptor shows default error message |
| 401 (token expired) | Clear token → redirect `/login` |
| HTTP 500 | Redirect `/500` |
| Unknown route | Redirect `/404` |
| Already logged in visits /login | Redirect `/` |

---

## Out of Scope

- User profile page / avatar
- Remember me / auto-login
- OAuth / SSO
- Refresh token logic
- Permission-based route access (beyond authenticated vs. not)
