import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
