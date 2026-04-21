import { type RouteRecordRaw } from 'vue-router'

export const activityRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'activity',
        redirect: '/activity/douyin',
        meta: { title: '活动管理', icon: 'Notebook' },
        children: [
          {
            path: 'douyin',
            name: 'douyin',
            component: () => import('@/views/activity/douyin/index.vue'),
            meta: { title: '抖音好评' },
          },
          {
            path: 'xiaohongshu',
            name: 'xiaohongshu',
            component: () => import('@/views/activity/xiaohongshu/index.vue'),
            meta: { title: '小红书' },
          },
          {
            path: 'challenge',
            name: 'challenge',
            component: () => import('@/views/activity/challenge/index.vue'),
            meta: { title: '挑战赛报名' },
          },
        ],
      },
    ],
  },
]
 
