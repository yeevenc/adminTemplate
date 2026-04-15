import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '../utils/auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    hidden?: boolean
  }
}

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
