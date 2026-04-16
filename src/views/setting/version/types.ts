export type VersionUpgradeChannel = 'ios' | 'huawei' | 'other' | 'all'
export type VersionUpgradeStatus = 1 | 2 | 3
export type VersionUpgradeType = 1 | 2 | 3 | 4

export interface VersionUpgradeItem {
  id: number
  channel: VersionUpgradeChannel
  appVersion: string
  minVersion: string
  upgradeType: VersionUpgradeType
  upgradeTitle: string
  upgradeTip: string
  status: VersionUpgradeStatus
  isDefaultConfig: 1 | 2
  updatedAt: string
}

export interface VersionUpgradeLatestConfig {
  ios: string
  huawei: string
  other: string
}

export interface VersionUpgradePayload {
  id?: number
  channel: VersionUpgradeChannel
  appVersion: string
  minVersion: string
  upgradeType: VersionUpgradeType
  upgradeTitle: string
  upgradeTip: string
  status: VersionUpgradeStatus
  isDefaultConfig: 1 | 2
}
