<script setup lang="ts" name="alipayRetry">
defineOptions({ name: 'alipayRetry' })

import { Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref, watch } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getAlipayRetryData, getAlipayRetryOrderData } from '@/api/statistics'

type TabKey = 'retry' | 'retryOrder'

interface RetryItem {
  day: string
  total?: number | string
  sing_num?: number | string
  not_enough?: number | string
  exe_num?: number | string
  no_exe_num?: number | string
  auto_num?: number | string
  auto_money?: number | string
  no_auto_num?: number | string
  no_auto_money?: number | string
  [key: `data${number}`]: string | number | undefined
}

interface RetryResponse {
  data?: RetryItem[]
  list?: RetryItem[]
  total?: number
}

const TABS: Array<{ label: string; value: TabKey }> = [
  { label: '重新扣费', value: 'retry' },
  { label: '重新扣费订单', value: 'retryOrder' },
]

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

const getDefaultDateRange = (): [string, string] => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  return [formatDate(start), formatDate(end)]
}

const buildShortcut = (days: number) => () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)
  return [start, end] as [Date, Date]
}

const dateShortcuts = [
  { text: '最近7天', value: buildShortcut(6) },
  { text: '最近30天', value: buildShortcut(29) },
  { text: '最近90天', value: buildShortcut(89) },
]

const activeTab = ref<TabKey>('retry')
const loading = ref(false)
const tableData = ref<RetryItem[]>([])

const queryForm = reactive({
  dateRange: getDefaultDateRange(),
})

const buildParams = () => {
  const [begin_time = '', end_time = ''] = queryForm.dateRange || []
  return { begin_time, end_time }
}

const resolveList = (data: RetryResponse | RetryItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.list)) return data.list
  return []
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const fetcher = activeTab.value === 'retry' ? getAlipayRetryData : getAlipayRetryOrderData
    const response = await fetcher(buildParams()) as ApiResponseData<RetryResponse | RetryItem[]>
    tableData.value = resolveList(response.data)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => fetchTableData()

watch(activeTab, fetchTableData)

onMounted(fetchTableData)
</script>

<template>
  <div class="alipay-retry-page">
    <el-card shadow="never" class="glass-card">
      <el-radio-group v-model="activeTab">
        <el-radio-button v-for="tab in TABS" :key="tab.value" :value="tab.value">
          {{ tab.label }}
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="日期区间">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            value-format="YYYYMMDD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            unlink-panels
          />
        </el-form-item>
        <el-form-item>
          <el-button :icon="Search" type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-table
        v-if="activeTab === 'retry'"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        height="calc(100vh - 320px)"
      >
        <el-table-column prop="day" label="日期" width="110" fixed="left" align="center" />
        <el-table-column prop="total" label="支付宝签约订单数量" width="170" align="center" />
        <el-table-column prop="sing_num" label="签约扣费失败订单数量" width="180" align="center" />
        <el-table-column prop="not_enough" label="扣费余额不足订单数量" width="180" align="center" />
        <el-table-column
          v-for="n in 30"
          :key="n"
          :prop="`data${n}`"
          :label="`第${n}日重新扣费成功订单量和收入`"
          width="230"
          align="center"
        />
      </el-table>

      <el-table
        v-else
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        height="calc(100vh - 320px)"
      >
        <el-table-column prop="day" label="日期" width="110" fixed="left" align="center" />
        <el-table-column prop="exe_num" label="续订重新执行扣费订单量" width="180" align="center" />
        <el-table-column prop="no_exe_num" label="非续订重新执行扣费订单量" width="200" align="center" />
        <el-table-column prop="auto_num" label="续订成功执行扣费订单量" width="180" align="center" />
        <el-table-column prop="auto_money" label="续订成功执行扣费的总金额" min-width="200" align="center" />
        <el-table-column prop="no_auto_num" label="非续订成功执行扣费订单量" width="200" align="center" />
        <el-table-column prop="no_auto_money" label="非续订成功执行扣费的总金额" min-width="210" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.alipay-retry-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
