<script setup lang="ts" name="h5CustomerService">
defineOptions({ name: 'h5CustomerService' })

import { Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getH5CustomerServiceData } from '@/api/statistics'

interface H5CustomerServiceItem {
  date: string
  start_total: number | string
  on_line_total: number | string
}

interface H5CustomerServiceResponse {
  list?: H5CustomerServiceItem[]
  total?: number
}

const SOURCE_OPTIONS = [
  { label: '支付宝小程序', value: 1 },
  { label: 'App', value: 2 },
]

const PROJECT_OPTIONS = [
  { label: '冥想', value: 1 },
  { label: '熊猫', value: 2 },
  { label: '心晴', value: 3 },
]

const getDefaultDateRange = (): [string, string] => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)

  const format = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }

  return [format(start), format(end)]
}

const loading = ref(false)
const tableData = ref<H5CustomerServiceItem[]>([])

const queryForm = reactive({
  dateRange: getDefaultDateRange(),
  source: '' as number | string,
  project: '' as number | string,
})

const pagination = reactive({
  page: 1,
  page_size: 30,
  total: 0,
})

const buildParams = () => {
  const [date_start = '', date_end = ''] = queryForm.dateRange || []
  return {
    page: pagination.page,
    page_size: pagination.page_size,
    date_start,
    date_end,
    source: queryForm.source,
    project: queryForm.project,
  }
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getH5CustomerServiceData(buildParams()) as ApiResponseData<H5CustomerServiceResponse>
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
  <div class="h5-customer-service-page">
    <el-card  class="glass-card ">
      <el-form :model="queryForm" inline>
        <el-form-item label="日期区间">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            value-format="YYYYMMDD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
          />
        </el-form-item>

        <el-form-item label="来源">
          <el-select
            v-model="queryForm.source"
            placeholder="请选择来源"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in SOURCE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="项目">
          <el-select
            v-model="queryForm.project"
            placeholder="请选择项目"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in PROJECT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button :icon="Search" type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card  class="glass-card ">
      <el-table v-loading="loading" :data="tableData" border stripe style="height: calc(100vh - 330px)">
        <el-table-column prop="date" sortable label="日期" width="120" align="center" />
        <el-table-column prop="rate" sortable label="客服介入率" align="center" />
        <el-table-column prop="start_total" sortable label="曝光次数" align="center" />
        <el-table-column prop="on_line_total" sortable label="人工客服介入次数" align="center" />
      </el-table>

      <el-pagination
        class="m-t-10"
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
.h5-customer-service-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

</style>
