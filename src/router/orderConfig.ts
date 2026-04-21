import { type RouteRecordRaw } from 'vue-router'

export const orderConfigRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'orderConfig',
        redirect: '/orderConfig/orderList',
        meta: { title: '订单管理', icon: 'List' },
        children: [
          {
            path: 'orderList',
            name: 'orderList',
            component: () => import('@/views/orderConfig/orderList/index.vue'),
            meta: { title: '订单列表' },
          },
          {
            path: 'refundOrders',
            name: 'refundOrders',
            component: () => import('@/views/orderConfig/refundOrders/index.vue'),
            meta: { title: '退款订单' },
          },
          {
            path: 'refundReviews',
            name: 'refundReviews',
            component: () => import('@/views/orderConfig/refundReviews/index.vue'),
            meta: { title: '退款审核' },
          },
           {
            path: 'manualRefunds',
            name: 'manualRefunds',
            component: () => import('@/views/orderConfig/manualRefunds/index.vue'),
            meta: { title: '手动退款' },
          },
           {
            path: 'failedPayments',
            name: 'failedPayments',
            component: () => import('@/views/orderConfig/failedPayments/index.vue'),
            meta: { title: '支付失败用户' },
          }
        ],
      },
    ],
  },
]
 
