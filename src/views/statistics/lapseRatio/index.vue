<script setup lang="ts" name="lapseRatio">
defineOptions({ name: 'lapseRatio' })

import { Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getSkuList } from '@/api/config'
import { getLapseRatioData } from '@/api/statistics'
import { CHANNEL_OPTIONS, selectListData, type SelectOption } from '@/utils/useConfig'

interface SkuItem {
  id: number | string
  title?: string
  name?: string
  discount_price?: number | string
}

interface LapseRatioItem {
  day: string
  v1: number | string
  v2: number | string
  v3: number | string
  v4: number | string
  v5: number | string
  v6: number | string
  v7: number | string
  v8: number | string
  v9: number | string
  v10: number | string
}

interface LapseRatioResponse {
  list?: LapseRatioItem[]
  data?: LapseRatioItem[]
}

const PAY_TYPE_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '包月', value: 1 },
  { label: '包季', value: 2 },
  { label: '包年', value: 3 },
]

const PAYMENT_METHOD_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '支付宝', value: 1 },
  { label: 'iOS', value: 2 },
]

const loading = ref(false)
const tableData = ref<LapseRatioItem[]>([])
const skuOptions = ref<SelectOption[]>([])

const getDefaultDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 60)

  const format = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return [format(start), format(end)]
}

const queryForm = reactive({
  dateRange: getDefaultDateRange() as [string, string],
  payType: 0,
  paymentMethod: 0,
  skuId: '',
  channel: '',
})

const getListParams = () => {
  const [startTime = '', endTime = ''] = queryForm.dateRange || []

  return {
    start_time: startTime,
    end_time: endTime,
    pay_type: queryForm.payType,
    type: queryForm.paymentMethod,
    sku_id: queryForm.skuId,
    channel: queryForm.channel,
  }
}

const resolveList = (data: LapseRatioResponse | LapseRatioItem[] | undefined) => {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.list)) {
    return data.list
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

const fetchSkuOptions = async () => {
  const response = await getSkuList() as ApiResponseData<SkuItem[]>
  skuOptions.value = selectListData(response.data)
}

const fetchTableData = async () => {
  loading.value = true

  try {
    const response = await getLapseRatioData(getListParams()) as ApiResponseData<LapseRatioResponse | LapseRatioItem[]>
    tableData.value = resolveList(response.data)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchTableData()
}

onMounted(async () => {
  await fetchSkuOptions()
  fetchTableData()
})
</script>

<template>
  <div class="lapse-ratio-page">
    <div class="page-header glass-card">
      <div>
        <h2 class="page-title">解约率统计</h2>
        <p class="page-subtitle">默认展示最近 60 天数据，可按时间区间、产品和渠道筛选。</p>
      </div>
    </div>

    <el-card shadow="never" class="glass-card filter-card">
      <div class="page-tip">注意：当前最多展示 60 天数据</div>
      <el-form :model="queryForm" inline>
        <div class="filter-row">
          <el-form-item label="日期区间">
            <el-date-picker
              v-model="queryForm.dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>

          <el-form-item label="产品类型">
            <el-select-v2
            v-model="queryForm.payType"
            :options="PAY_TYPE_OPTIONS"
            placeholder="请选择产品类型"
            clearable
            filterable
            @change="handleSearch"
            @clear="handleSearch"
            style="width: 400px;"
          />
          </el-form-item>

          <el-form-item label="支付方式" >
            <el-select
              v-model="queryForm.paymentMethod"
              placeholder="请选择支付方式"
              @change="handleSearch"
                          style="width: 200px;"

            >
              <el-option
                v-for="item in PAYMENT_METHOD_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="产品ID">
            <el-select-v2
              v-model="queryForm.skuId"
              :options="skuOptions"
              placeholder="请选择产品ID"
              clearable
              filterable
              @change="handleSearch"
              @clear="handleSearch"
              style="width: 200px;"
            />
          </el-form-item>

          <el-form-item label="渠道">
            <el-select
              v-model="queryForm.channel"
              placeholder="请选择渠道"
              @change="handleSearch"
              style="width: 200px;"
            >
              <el-option
                v-for="item in CHANNEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item >
            <el-button :icon="Search" type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card table-card">
      <el-table v-loading="loading" stripe border :data="tableData">
        <el-table-column prop="day" label="日期" width="120" />
        <el-table-column prop="v1" label="当日新增自动订阅签约数量" min-width="200" />
        <el-table-column prop="v2" label="当日新增自动订阅支付成功订单数量" min-width="240" />
        <el-table-column prop="v3" label="当日解约数量" min-width="120" />
        <el-table-column prop="v4" label="当日解约率" min-width="120" />
        <el-table-column prop="v5" label="3日解约数量" min-width="120" />
        <el-table-column prop="v6" label="3日解约率" min-width="120" />
        <el-table-column prop="v7" label="7日解约数量" min-width="120" />
        <el-table-column prop="v8" label="7日解约率" min-width="120" />
        <el-table-column prop="v9" label="30日解约数量" min-width="130" />
        <el-table-column prop="v10" label="30日解约率" min-width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.lapse-ratio-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
}

.page-title {
  margin: 0 0 8px;
  color: var(--text-primary);
  font-size: 26px;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.page-tip {
  margin-bottom: 16px;
  color: #f56c6c;
  font-size: 14px;
  font-weight: 600;
}

.filter-card,
.table-card {
  border: none;
}

@media (max-width: 768px) {
  .page-header,
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item,
  .filter-item--wide {
    width: 100%;
  }
}
</style>
