<script setup lang="ts" name="abTest">
defineOptions({ name: 'abTest' })

import { CopyDocument, Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getAbTestConfig, getAbTestList } from '@/api/operation'
import { getExperimentDataList } from '@/api/config'
import type { SelectOption } from '@/utils/useConfig'
import AbTestDialog from './components/AbTestDialog.vue'

type AbTestEnv = 'produce' | 'mirror'

interface AbTestItem {
  id: number | string
  title: string
  alert_name: string
  on_line_id: string
  test_id: string
  status: number
  status_name: string
  sensor_key: string
  updated_at: string
  env: AbTestEnv
  [key: string]: unknown
}

interface AbTestListResponse {
  list?: AbTestItem[]
  data?: AbTestItem[]
  total?: number | string
}

// 环境切换选项（放入筛选表单作为一项）
const ENV_OPTIONS: Array<{ label: string; value: AbTestEnv }> = [
  { label: '正式', value: 'produce' },
  { label: '测试(mirror)', value: 'mirror' },
]

// 状态筛选项
const STATUS_OPTIONS: SelectOption[] = [
  { label: '进行', value: 1 },
  { label: '下架', value: 2 },
]

// 广告类型筛选项（含全部）
const AD_TYPE_OPTIONS: SelectOption[] = [
  { label: '全部', value: 0 },
  { label: '全屏', value: 1 },
  { label: '底部条', value: 2 },
]

const loading = ref(false)
const tableData = ref<AbTestItem[]>([])
const sensorOptions = ref<SelectOption[]>([])
const experimentOptions = ref<SelectOption[]>([])
const dialogRef = ref<InstanceType<typeof AbTestDialog>>()

const queryForm = reactive({
  id: '',
  env: 'produce' as AbTestEnv,
  status: 1 as number | '',
  alert_type: '' as number | '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 统一组装列表查询参数，保证筛选和分页共用一套入参
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  id: queryForm.id.trim(),
  env: queryForm.env,
  status: queryForm.status,
  alert_type: queryForm.alert_type,
})

// 列表接口兼容数组 / list / data 三种返回结构
const resolveList = (data: AbTestListResponse | AbTestItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

// 总数优先以后端返回为准，兜底使用当前列表长度
const resolveTotal = (data: AbTestListResponse | AbTestItem[] | undefined, list: AbTestItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

// 获取 abTest 列表
const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getAbTestList(getListParams())) as ApiResponseData<
      AbTestListResponse | AbTestItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

// 神策上报选项：后端返回 { id: title } 对象，扁平化成下拉结构
const fetchSensorConfig = async () => {
  const response = (await getAbTestConfig()) as ApiResponseData<Record<string, string>>
  sensorOptions.value = Object.entries(response.data || {}).map(([value, label]) => ({
    label,
    value: Number(value),
  }))
}

// 线上ID / 实验ID 候选项随环境切换刷新，label 拼成 id—title 便于识别
const fetchExperimentOptions = async () => {
  const response = (await getExperimentDataList({
    page: 1,
    page_size: 99999,
    env: queryForm.env,
  })) as ApiResponseData<{ data?: Array<{ id: number | string; title: string }> }>
  const list = response.data?.data || []
  experimentOptions.value = list.map((item) => ({
    label: `${item.id}—${item.title}`,
    value: item.id,
  }))
}

// 搜索时回到第一页重新查询
const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

// 切换环境需要同步刷新实验候选项
const handleEnvChange = () => {
  fetchExperimentOptions()
  handleSearch()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchTableData()
}

// 页码切换
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

// 添加默认带入当前筛选的环境，避免新增后看不到
const openCreate = () => dialogRef.value?.openCreate(queryForm.env)
const handleEdit = (row: AbTestItem) => dialogRef.value?.openEdit(row.id)
const handleCopy = (row: AbTestItem) => dialogRef.value?.openCopy(row.id)

// 环境值转展示文案
const getEnvText = (value: AbTestEnv) =>
  value === 'produce' ? '正式(线上)' : '测试(mirror)'

// 状态 tag 颜色：进行=success，下架=danger
const getStatusTagType = (status: number) => (status === 1 ? 'success' : 'danger')

// 环境 tag 颜色：正式=success，测试=warning
const getEnvTagType = (value: AbTestEnv) => (value === 'produce' ? 'success' : 'warning')

onMounted(() => {
  fetchTableData()
  fetchSensorConfig()
  fetchExperimentOptions()
})
</script>

<template>
  <div class="ab-test-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="环境">
          <el-radio-group v-model="queryForm.env" @change="handleEnvChange">
            <el-radio-button
              v-for="item in ENV_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="ID">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="请输入ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="选择状态"
            clearable
            style="width: 160px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="广告类型">
          <el-select
            v-model="queryForm.alert_type"
            placeholder="选择广告类型"
            clearable
            style="width: 160px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="item in AD_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-button :icon="Plus" plain type="primary" @click="openCreate">添加</el-button>

      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="width: 100%; height: calc(100vh - 350px)"
        class="m-t-10"
      >
        <el-table-column prop="id" label="ID" fixed="left" width="80" />
        <el-table-column prop="title" label="标题" fixed="left" min-width="160" show-overflow-tooltip />
        <el-table-column prop="alert_name" label="广告类型" min-width="100" />
        <el-table-column prop="on_line_id" label="线上ID" min-width="140" show-overflow-tooltip />
        <el-table-column prop="test_id" label="实验ID" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ row.status_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sensor_key" label="神策KEY" min-width="140" show-overflow-tooltip />
        <el-table-column prop="updated_at" label="创建时间" min-width="170" />
        <el-table-column label="环境" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getEnvTagType(row.env)">{{ getEnvText(row.env) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" width="160">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" :icon="CopyDocument" @click="handleCopy(row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="m-t-10"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[30, 50, 100]"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <AbTestDialog
      ref="dialogRef"
      :sensor-options="sensorOptions"
      :experiment-options="experimentOptions"
      @success="fetchTableData"
    />
  </div>
</template>

<style scoped>
.ab-test-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
