import { type RouteRecordRaw } from 'vue-router'

export const userConfigRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'userConfig',
        redirect: '/userConfig/ad-block',
        meta: { title: '用户管理', icon: 'User' },
        children: [
          {
            path: 'ad-block',
            name: 'adBlock',
            component: () => import('@/views/userConfig/ad-block/index.vue'),
            meta: { title: '广告屏蔽' },
          },
          {
            path: 'messageWhiteList',
            name: 'messageWhiteList',
            component: () => import('@/views/userConfig/messageWhiteList/index.vue'),
            meta: { title: '短信白名单' },
          },
          {
            path: 'userCheckInDuration',
            name: 'userCheckInDuration',
            component: () => import('@/views/userConfig/userCheckInDuration/index.vue'),
            meta: { title: '用户打卡查询' },
          },
        ],
      },
    ],
  },
]
 
