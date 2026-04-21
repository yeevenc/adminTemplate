import { type RouteRecordRaw } from 'vue-router'

export const statisticsRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'statistics',
        redirect: '/statistics/newUserConversion',
        meta: { title: '统计管理', icon: 'DataLine' },
        children: [
          {
            path: 'newUserConversion',
            name: 'newUserConversion',
            component: () => import('@/views/statistics/newUserConversion/index.vue'),
            meta: { title: '新增用户转化' },
          },
          {
            path: 'lapseRatio',
            name: 'lapseRatio',
            component: () => import('@/views/statistics/lapseRatio/index.vue'),
            meta: { title: '解约率' },
          },
          {
            path: 'alipayAutoSubscription',
            name: 'alipayAutoSubscription',
            component: () => import('@/views/statistics/alipayAutoSubscription/index.vue'),
            meta: { title: '支付宝自动订阅' },
          },
          {
            path: 'alipayRetry',
            name: 'alipayRetry',
            component: () => import('@/views/statistics/alipayRetry/index.vue'),
            meta: { title: '支付宝重新扣费' },
          }
        ],
      },
    ],
  },
]
 
