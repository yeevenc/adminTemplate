<script setup lang="ts" name="alipayAutoSubscription">
defineOptions({ name: 'alipayAutoSubscription' })

import { Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getAlipayAutoSubscriptionData } from '@/api/statistics'
import { PLATFORM_OPTIONS } from '@/utils/useConfig'

interface AutoSubscribeItem {
  day: string
  total: number | string
  success: number | string
  success_per: string
  per: string
  not_enough: number | string
  no: number | string
  available: number | string
  fail: number | string
  disable: number | string
  other: number | string
}

interface AutoSubscribeResponse {
  list?: AutoSubscribeItem[]
  total?: number
}

const getDefaultDateRange = (): [string, string] => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)

  const format = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return [format(start), format(end)]
}

const loading = ref(false)
const tableData = ref<AutoSubscribeItem[]>([])

const queryForm = reactive({
  platform: '',
  dateRange: getDefaultDateRange(),
})

const pagination = reactive({
  page: 1,
  page_size: 30,
  total: 0,
})

const buildParams = () => {
  const [begin_day = '', end_day = ''] = queryForm.dateRange || []
  return {
    page: pagination.page,
    page_size: pagination.page_size,
    platform: queryForm.platform,
    begin_day,
    end_day,
  }
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getAlipayAutoSubscriptionData(buildParams()) as ApiResponseData<AutoSubscribeResponse>
    tableData.value = response.data?.list || []
    pagination.total = response.data?.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

const handleSizeChange = (size: number) => {
  pagination.page_size = size
  pagination.page = 1
  fetchTableData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

onMounted(fetchTableData)
</script>

<template>
  <div class="auto-subscribe-page">
    <el-card shadow="never" class="glass-card filter-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="平台">
          <el-select
            v-model="queryForm.platform"
            placeholder="请选择平台"
            style="width: 180px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in PLATFORM_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="日期区间">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
          />
        </el-form-item>

        <el-form-item>
          <el-button :icon="Search" type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card table-card">
      <el-table v-loading="loading" :data="tableData" border stripe style="height: calc(100vh - 320px)">
        <el-table-column prop="day" fixed label="日期" width="120" align="center" />
        <el-table-column prop="total" label="应扣款订单数" width="130" align="center" />
        <el-table-column prop="success" label="扣款成功数量" width="130" align="center" />
        <el-table-column prop="success_per" label="扣款成功率" width="120" align="center" />
        <el-table-column prop="per" label="成功率环比" width="120" align="center" />
        <el-table-column prop="not_enough" label="余额不足失败" width="130" align="center" />
        <el-table-column prop="no" label="协议失效失败" width="130" align="center" />
        <el-table-column prop="available" label="没有可用的支付工具" width="160" align="center" />
        <el-table-column prop="fail" label="支付失败" width="110" align="center" />
        <el-table-column prop="disable" label="余额支付功能关闭" width="160" align="center" />
        <el-table-column prop="other" label="其他失败" width="110" align="center" />
      </el-table>

      <el-pagination
        class="pagination"
        background
        :current-page="pagination.page"
        :page-size="pagination.page_size"
        :page-sizes="[30, 50, 100, 300]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>

<style scoped>
.auto-subscribe-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card,
.table-card {
  border: none;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
