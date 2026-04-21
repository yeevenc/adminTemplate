<script setup lang="ts" name="subscriptionAbTest">
defineOptions({ name: 'subscriptionAbTest' })

import { Edit, Plus } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getSubscriptionAbTestList } from '@/api/operation'
import SubscriptionAbTestDialog from './components/SubscriptionAbTestDialog.vue'

type SubscriptionAbTestEnv = 'product' | 'mirror'

interface SubscriptionAbTestItem {
  id: number | string
  title: string
  env: SubscriptionAbTestEnv
  status: number
  vip_on_line_id: number | string
  svip_on_line_id: number | string
  vip_test_id: number | string
  svip_test_id: number | string
  sensor_key?: number | string
  created_at: string
  [key: string]: unknown
}

interface SubscriptionAbTestListResponse {
  list?: SubscriptionAbTestItem[]
  data?: SubscriptionAbTestItem[]
  total?: number | string
}

const ENV_OPTIONS: Array<{ label: string; value: SubscriptionAbTestEnv }> = [
  { label: '正式', value: 'product' },
  { label: '测试', value: 'mirror' },
]

const STATUS_OPTIONS = [
  { label: '上线', value: 1 },
  { label: '下线', value: 2 },
]

const loading = ref(false)
const tableData = ref<SubscriptionAbTestItem[]>([])
const editLoadingId = ref<number | string | null>(null)
const dialogRef = ref<InstanceType<typeof SubscriptionAbTestDialog>>()

const queryForm = reactive({
  env: 'product' as SubscriptionAbTestEnv,
  status: '' as number | '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 列表查询参数统一从这里组装，分页和筛选共用一套入参
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  env: queryForm.env,
  status: queryForm.status,
})

// 兼容后端返回 data/list 两种结构
const resolveList = (
  data: SubscriptionAbTestListResponse | SubscriptionAbTestItem[] | undefined,
) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

// 总数优先取后端返回值，没有时回退到当前列表长度
const resolveTotal = (
  data: SubscriptionAbTestListResponse | SubscriptionAbTestItem[] | undefined,
  list: SubscriptionAbTestItem[],
) => {
  if (Array.isArray(data)) return list.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getSubscriptionAbTestList(getListParams())) as ApiResponseData<
      SubscriptionAbTestListResponse | SubscriptionAbTestItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchTableData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

const handleEnvChange = () => {
  handleSearch()
}

const openCreate = () => {
  dialogRef.value?.openCreate(queryForm.env)
}

// 编辑时增加单行 loading，避免重复点击
const handleEdit = async (row: SubscriptionAbTestItem) => {
  editLoadingId.value = row.id
  try {
    await dialogRef.value?.openEdit(row.id)
  } finally {
    editLoadingId.value = null
  }
}

const getStatusText = (status: number) => (status === 1 ? '上线' : '下线')
const getStatusTagType = (status: number) => (status === 1 ? 'success' : 'info')
const getEnvText = (env: SubscriptionAbTestEnv) => (env === 'product' ? '正式' : '测试')
const getEnvTagType = (env: SubscriptionAbTestEnv) => (env === 'product' ? 'success' : 'warning')

onMounted(async () => {
  await fetchTableData()
})
</script>

<template>
  <div>
    <el-card shadow="never">
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

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            clearable
            placeholder="请选择状态"
            style="width: 180px"
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
      </el-form>
    </el-card>

    <el-card shadow="never" class="m-t-10">
      <el-button :icon="Plus" type="primary" @click="openCreate">添加配置</el-button>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        class="m-t-10"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="90" fixed="left" />
        <el-table-column prop="title" label="标题" min-width="180" fixed="left" show-overflow-tooltip />

        <el-table-column label="线上组" min-width="180">
          <template #default="{ row }">
            <div>普通：{{ row.vip_on_line_id || '-' }}</div>
            <div>超级：{{ row.svip_on_line_id || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="实验组" min-width="180">
          <template #default="{ row }">
            <div>普通：{{ row.vip_test_id || '-' }}</div>
            <div>超级：{{ row.svip_test_id || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="环境" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnvTagType(row.env)">
              {{ getEnvText(row.env) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="170" />

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              :loading="editLoadingId === row.id"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
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

    <SubscriptionAbTestDialog
      ref="dialogRef"
      @success="fetchTableData"
    />
  </div>
</template>
