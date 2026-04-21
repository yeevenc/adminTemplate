import { type RouteRecordRaw } from 'vue-router'

export const settingRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'setting',
        redirect: '/setting/version',
        meta: { title: '通用设置', icon: 'Setting' },
        children: [
          {
             path: 'alipayMerchant',
            name: 'alipayMerchant',
            component: () => import('@/views/setting/alipayMerchant/index.vue'),
            meta: { title: '支付宝商户' },
          },
          {
            path: 'version-audit',
            name: 'versionAudit',
            component: () => import('@/views/setting/version-audit/index.vue'),
            meta: { title: '版本审核' },
          },
          {
            path: 'version',
            name: 'version',
            component: () => import('@/views/setting/version/index.vue'),
            meta: { title: '版本升级配置' },
          },
          {
            path: 'asa-keyword',
            name: 'asaKeyword',
            component: () => import('@/views/setting/asa-keyword/index.vue'),
            meta: { title: 'ASA关键词' },
          },
          {
            path: 'manual',
            name: 'manual',
            component: () => import('@/views/manual/index.vue'),
            meta: { title: '使用手册' },
          },
        ],
      },
    ],
  },
]
 
