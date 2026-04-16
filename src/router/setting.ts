import { type RouteRecordRaw } from 'vue-router'

export const settingRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'setting',
        redirect: '/setting/version',
        meta: { title: '系统设置', icon: 'settings' },
        children: [
          {
            path: 'version',
            name: 'version',
            component: () => import('@/views/setting/version/index.vue'),
            meta: { title: '版本升级配置' },
          },
        ],
      },
    ],
  },
]
 
