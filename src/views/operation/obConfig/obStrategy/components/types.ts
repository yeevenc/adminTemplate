export type ResourceEnv = 'produce' | 'mirror'

export interface ObStrategyItem {
  id: number | string
  title: string
  remark?: string
  scene: 1 | 2
  env: ResourceEnv
  is_silent: Array<number | string>
  channel: string[]
  sensors_channel: Array<number | string>
  age: number[]
  status: 0 | 1
  status_name?: string
  is_test?: string
  experiment_name?: string
  strategy_arr?: string[]
  strategy_memo?: Array<number | string>
  group_id?: number | string
  created_at?: string
  [key: string]: unknown
}

export interface ObStrategyDetail {
  id: number | string
  title: string
  remark?: string
  experiment_status: 0 | 1 | 2 | ''
  experiment_address?: number | string
  sensors_key?: number | string
  line_rate?: number | string
  scene_id?: number | string
  ob_id?: number | string
  first_cancel_id?: number | string
  two_cancel_id?: number | string
  ali_pay_switch?: 1 | 2
  test_scene_id?: number | string
  test_ob_id?: number | string
  test_first_cancel_id?: number | string
  test_two_cancel_id?: number | string
  test_ali_pay_switch?: 1 | 2
  created_at?: string
  [key: string]: unknown
}

export interface UserGroupItem {
  id: number | string
  title: string
}

export interface ObPageIdItem {
  id?: number | string
  value?: number | string
  label?: string
}

// scene=2 的顶层 OB 配置，被策略表单作为"选择二次OB"下拉使用
export interface SecondaryObItem {
  id: number | string
  title: string
}

export const SENSORS_KEY_OPTIONS = [
  { label: 'strategy_test_group_huawei_name_1', value: 1 },
  { label: 'strategy_test_group_huawei_name_2', value: 2 },
  { label: 'strategy_test_group_huawei_name_3', value: 7 },
  { label: 'strategy_test_group_ios_name_1', value: 3 },
  { label: 'strategy_test_group_ios_name_2', value: 4 },
  { label: 'strategy_test_group_ios_name_3', value: 8 },
  { label: 'strategy_test_group_android_name_1', value: 5 },
  { label: 'strategy_test_group_android_name_2', value: 6 },
  { label: 'strategy_test_group_android_name_3', value: 9 },
]

export const PAY_SWITCH_OPTIONS = [
  { label: '先支付，后签约', value: 1 },
  { label: '先签约，后支付', value: 2 },
]

export const EXPERIMENT_OPTIONS = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
]

// 后端可能把 strategy_memo 以字符串形式返回（例如 "[806]"），这里统一解析成真数组
export const parseStrategyMemo = (raw: unknown): Array<number | string> => {
  if (Array.isArray(raw)) return [...raw]
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}
