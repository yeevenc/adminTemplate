import { type RouteRecordRaw } from 'vue-router'

export const contentRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'content',
        redirect: '/content/classContent',
        meta: { title: '内容管理', icon: 'DocumentAdd' },
        children: [
          {
            path: 'classContent',
            name: 'classContent',
            component: () => import('@/views/content/classContent/index.vue'),
            meta: { title: '课程内容' },
          },
          {
            path: 'articleConfig',
            name: 'articleConfig',
            component: () => import('@/views/content/articleConfig/index.vue'),
            meta: { title: '文章配置' },
          },
          {
            path: 'oneiromancy',
            name: 'oneiromancy',
            component: () => import('@/views/content/oneiromancy/index.vue'),
            meta: { title: '解梦配置' },
          },
           {
            path: 'dailyMessage',
            name: 'dailyMessage',
            component: () => import('@/views/content/dailyMessage/index.vue'),
            meta: { title: '每日寄语' },
          },
        ],
      },
    ],
  },
]
 
