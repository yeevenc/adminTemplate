import type { SelectOption } from '@/utils/useConfig'

// 渠道类型
export type VersionUpgradeChannel = 'ios' | 'huawei' | 'other'

// 状态类型：1-生产/Mirror启用 2-不启用 3-仅Mirror启用
export type VersionUpgradeStatus = 1 | 2 | 3

// 筛选表单项配置
export interface FilterFormItem {
  label: string
  field: keyof VersionUpgradeQueryForm
  type: 'input' | 'select'
  placeholder: string
  options?: SelectOption[]
}

// 查询表单
export interface VersionUpgradeQueryForm {
  appVersion: string
  channel: string
  status: string
  isDefaultConfig: string
}

// 列表数据项
export interface VersionUpgradeItem {
  id: number
  channel: VersionUpgradeChannel
  appVersion: string
  minVersion: string
  upgradeType: 1 | 2 | 3 | 4
  upgradeTitle: string
  upgradeTip: string
  status: VersionUpgradeStatus
  isDefaultConfig: 1 | 2
  updatedAt: string
}

// 列表接口响应
export interface VersionUpgradeListResponse {
  list: VersionUpgradeItem[]
  count: number
}

// 提交载荷
export interface VersionUpgradePayload {
  id?: number
  channel: VersionUpgradeChannel
  appVersion: string
  minVersion: string
  upgradeType: 1 | 2 | 3 | 4
  upgradeTitle: string
  upgradeTip: string
  status: VersionUpgradeStatus
  isDefaultConfig: 1 | 2
}

// 最新版本号配置
export interface VersionUpgradeLatestConfig {
  ios: string
  huawei: string
  other: string
}
