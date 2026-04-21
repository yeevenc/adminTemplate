import { ElMessage } from 'element-plus'
// 统一下拉选项数据结构
export interface SelectOption {
  label: string
  value: number | string
}

// 平台选项
export const PLATFORM_OPTIONS: SelectOption[] = [
  { label: 'Android', value: 'android' },
  { label: 'iOS', value: 'ios' },
]
// 多平台
// 平台选项
export const CHANNEL_OPTIONS: SelectOption[] = [
  { label: '安卓其他', value: 'other' },
  { label: 'iOS', value: 'ios' },
  { label: '华为', value: 'huawei' },
]
// 用户分群-渠道筛选选项（列表搜索）
export const USER_GROUP_CHANNEL_FILTER_OPTIONS: SelectOption[] = [
  { label: '投放', value: 1 },
  { label: '自然', value: 2 },
]

// 用户分群-渠道选项（表单多选）
// value 为后端枚举；表单全选时后端约定提交 [3]
export const USER_GROUP_CHANNEL_OPTIONS: SelectOption[] = [
  { label: '投放', value: 1 },
  { label: '自然', value: 2 },
  { label: '今日头条', value: 4 },
  { label: '快手', value: 5 },
  { label: '广点通', value: 6 },
  { label: '百度', value: 7 },
  { label: '网易', value: 8 },
]

// 全选时后端约定的渠道值
export const USER_GROUP_CHANNEL_ALL_VALUE = 3

// 用户分群-年龄段选项
// 表单全选时后端约定提交 [7]
export const USER_GROUP_AGE_OPTIONS: SelectOption[] = [
  { label: '18岁以下', value: 1 },
  { label: '18-24岁', value: 2 },
  { label: '25-30岁', value: 3 },
  { label: '31-40岁', value: 4 },
  { label: '40-50岁', value: 5 },
  { label: '50岁以上', value: 6 },
]

// 全选时后端约定的年龄值
export const USER_GROUP_AGE_ALL_VALUE = 7

// 列表枚举值统一转文案，同时兼容 number / string 两种后端返回类型
export const getLabelText = (
  value: number | string,
  label: SelectOption[],
): string => {
  return (
    label.find((item) => String(item.value) === String(value))?.label ||
    String(value)
  )
}

// 表格导出列配置
export interface ExportColumn<T = Record<string, unknown>> {
  label: string
  prop: string
  formatter?: (row: T, value: unknown) => string | number | null | undefined
}

// 表格 CSV 导出参数
export interface ExportTableOptions<T = Record<string, unknown>> {
  filename: string
  columns: ExportColumn<T>[]
  data: T[]
}

/**
 * 将单元格值格式化为 CSV 安全字符串
 * - 遇到 " , \n 时包裹双引号并转义内部引号
 */
const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return /["\n,]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * 通用表格导出方法（CSV，带 UTF-8 BOM，兼容 Excel 打开）
 * - 接收列配置和数据，生成 CSV 并触发浏览器下载
 * - filename 不需带扩展名，会自动补 .csv
 */
export const exportTableToCsv = <T extends Record<string, unknown>>(options: ExportTableOptions<T>): void => {
  const { filename, columns, data } = options

  const header = columns.map((col) => escapeCsvCell(col.label)).join(',')
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.prop]
        const value = col.formatter ? col.formatter(row, raw) : raw
        return escapeCsvCell(value)
      })
      .join(','),
  )

  const csvContent = [header, ...rows].join('\n')
  // UTF-8 BOM 避免中文在 Excel 中乱码
  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 接口返回的列表项结构（兼容两种来源）
export interface SelectListItem {
  label?: string
  value?: string | number
  id?: number | string
  title?: string
  name?: string
  discount_price?: number | string
}

/**
 * 将后端列表统一转成 el-select-v2 需要的 { label, value } 结构
 * - 若返回 { label, value }：label 用 "value-label" 拼接后返回
 * - 若返回 { id, title/name }：按标准 select-v2 结构 { label: title||name, value: id } 返回
 */
export const selectListData = (data?: SelectListItem[]): SelectOption[] => {
  if (!data?.length) return []

  return data.reduce<SelectOption[]>((result, item) => {
    if (!item) return result

    // 情况一：标准 { label, value } 数据 → 拼接展示
    if (item.label !== undefined && item.value !== undefined) {
      result.push({
        label: `${item.value}-${item.label}`,
        value: item.value,
      })
      return result
    }

    // 情况二：{ id, title/name } 数据 → 正常 select-v2 结构
    const text = item.title ?? item.name
    if (item.id !== undefined && text !== undefined) {
      result.push({
        label: text,
        value: item.id,
      })
    }

    return result
  }, [])
}


// 复制功能
export const copyToClipboard = async (data: string|number): Promise<void> => {
    const text = String(data ?? '')
  if (!text) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 列表展示tag
