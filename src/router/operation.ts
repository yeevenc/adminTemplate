import { type RouteRecordRaw } from 'vue-router'

export const operationRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'operation',
        redirect: '/operation',
        meta: { title: '运营配置', icon: 'Grid' },
        children: [
          {
            path: 'obConfig',
            redirect: '/operation/obConfig/template',
            meta: { title: 'OB配置', icon: 'Star' },
            children: [
                 {
                path: 'obStrategy',
                name: 'obStrategy',
                component: () => import('@/views/operation/obConfig/obStrategy/index.vue'),
                meta: { title: 'OB策略' },
              },
               {
                path: 'subscription',
                name: 'subscription',
                component: () => import('@/views/operation/obConfig/subscription/index.vue'),
                meta: { title: '订阅页配置' },
              },
              {
                path: 'template',
                name: 'template',
                component: () => import('@/views/operation/obConfig/template/index.vue'),
                meta: { title: '模版配置' },
              },
              {
                path: 'retain',
                name: 'retain',
                component: () => import('@/views/operation/obConfig/retain/index.vue'),
                meta: { title: '挽留配置' },
              }
            ],
          },
          {
            path: 'resource',
            redirect: '/operation/resource/abTest',
            meta: { title: '资源位配置', icon: 'Pointer' },
            children: [
              {
                path: 'abTest',
                name: 'abTest',
                component: () => import('@/views/operation/resource/abTest/index.vue'),
                meta: { title: 'abTest' },
              },
              {
                path: 'advertising',
                name: 'advertising',
                component: () => import('@/views/operation/resource/advertising/index.vue'),
                meta: { title: '广告配置' },
              },
            ],
          },
              {
            path: 'subscriptionCenter',
            redirect: '/operation/subscriptionCenter/subscriptionCenterConfig',
            meta: { title: '订阅中心', icon: 'Checked' },
            children: [
              {
                path: 'subscriptionCenterConfig',
                name: 'subscriptionCenterConfig',
                component: () => import('@/views/operation/subscriptionCenter/subscriptionCenterConfig/index.vue'),
                meta: { title: '订阅中心配置' },
              },
              {
                path: 'makeUpSKu',
                name: 'makeUpSKu',
                component: () => import('@/views/operation/subscriptionCenter/makeUpSKu/index.vue'),
                meta: { title: '补差SKU' },
              },
              {
                path: 'subscriptionAbTest',
                name: 'subscriptionAbTest',
                component: () => import('@/views/operation/subscriptionCenter/subscriptionAbTest/index.vue'),
                meta: { title: 'ab实验' },
              },
            ],
          },
          {
            path: 'skuConfig',
            name: 'skuConfig',
            component: () => import('@/views/operation/skuConfig/index.vue'),
            meta: { title: 'sku配置' },
          },
          {
            path: 'userGroup',
            name: 'userGroup',
            component: () => import('@/views/operation/userGroup/index.vue'),
            meta: { title: '用户分群' },
          },
          {
            path: 'cdKey',
            redirect: '/operation/cdKey/list',
            meta: { title: '兑换码管理', icon: 'Ticket' },
            children: [
              {
                path: 'list',
                name: 'cdKeyList',
                component: () => import('@/views/operation/cdKey/list/index.vue'),
                meta: { title: '兑换码列表' },
              },
              {
                path: 'category',
                name: 'cdKeyCategory',
                component: () => import('@/views/operation/cdKey/category/index.vue'),
                meta: { title: '兑换码分类' },
              },
            ],
          },
        ],
      },
    ],
  },
]
 
