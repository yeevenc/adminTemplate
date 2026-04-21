<script setup lang="ts" name="subscriptionCenterConfig">
defineOptions({ name: 'subscriptionCenterConfig' })

import { CopyDocument, Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getSubscriptionCenterList } from '@/api/operation'
import {
  USER_GROUP_AGE_OPTIONS,
  USER_GROUP_AGE_ALL_VALUE,
  CHANNEL_OPTIONS,
  getAgeLabel,
} from '@/utils/useConfig'
import SubscriptionConfigDialog from './components/SubscriptionConfigDialog.vue'
import RetainConfigDrawer from './components/RetainConfigDrawer.vue'

type ResourceEnv = 'produce' | 'mirror'

interface SkuMemoItem {
  sku_id: number | string
  sku?: string
  checked: boolean
  background_default: string
  background_checked: string
  sort: number | string
}

interface SubscriptionItem {
  id: number | string
  title: string
  channel: string[]
  min_version: string
  max_version: string
  position: number
  age: number[]
  status: 0 | 1
  sku_memo: SkuMemoItem[]
  created_at: string
  env: ResourceEnv
  user_group_id: number | string
}

interface SubscriptionListResponse {
  list: SubscriptionItem[]
  total: number
}

const ENV_OPTIONS: Array<{ label: string; value: ResourceEnv }> = [
  { label: '正式', value: 'produce' },
  { label: '测试(mirror)', value: 'mirror' },
]

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '上线', value: 1 },
  { label: '下线', value: 0 },
]

const POSITION_OPTIONS = [
  { label: '全部', value: '' },
  { label: '普通会员', value: 1 },
  { label: '超级会员', value: 2 },
]

const AGE_FILTER_OPTIONS = [
  { label: '全部', value: USER_GROUP_AGE_ALL_VALUE },
  ...USER_GROUP_AGE_OPTIONS,
]

const CHANNEL_FILTER_OPTIONS = CHANNEL_OPTIONS

const loading = ref(false)
const tableData = ref<SubscriptionItem[]>([])
const dialogRef = ref<InstanceType<typeof SubscriptionConfigDialog>>()
const retainDrawerRef = ref<InstanceType<typeof RetainConfigDrawer>>()

const queryForm = reactive({
  env: 'produce' as ResourceEnv,
  id: '',
  title: '',
  age: '' as number | '',
  status: '' as number | '',
  position: '' as number | '',
  channel: '' as string,
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  env: queryForm.env,
  id: queryForm.id.trim(),
  title: queryForm.title.trim(),
  age: queryForm.age,
  status: queryForm.status,
  position: queryForm.position,
  channel: queryForm.channel,
})

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getSubscriptionCenterList(getListParams()) as ApiResponseData<SubscriptionListResponse>
    tableData.value = Array.isArray(response.data.list) ? response.data.list : []
    pagination.total = response.data.total || 0
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

const handleAdd = () => {
  dialogRef.value?.openCreate()
}

const handleEdit = (row: SubscriptionItem) => {
  dialogRef.value?.openEdit(row as unknown as Record<string, unknown>)
}

const handleCopy = (row: SubscriptionItem) => {
  dialogRef.value?.openCopy(row as unknown as Record<string, unknown>)
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="subscription-config-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="环境">
          <el-radio-group v-model="queryForm.env" @change="handleSearch">
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
            placeholder="ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="标题">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="标题"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="年龄">
          <el-select
            v-model="queryForm.age"
            clearable
            placeholder="选择年龄"
            @change="handleSearch"
            style="width: 160px"
          >
            <el-option
              v-for="item in AGE_FILTER_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            clearable
            placeholder="选择状态"
            @change="handleSearch"
            style="width: 160px"
          >
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="展示位置">
          <el-select
            v-model="queryForm.position"
            clearable
            placeholder="选择展示位置"
            @change="handleSearch"
            style="width: 160px"
          >
            <el-option
              v-for="item in POSITION_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="平台">
          <el-select
            v-model="queryForm.channel"
            clearable
            placeholder="选择平台"
            @change="handleSearch"
            style="width: 160px"
          >
            <el-option
              v-for="item in CHANNEL_FILTER_OPTIONS"
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

    <el-card shadow="never" class="glass-card m-t-10">
      <el-button :icon="Plus" plain type="primary" @click="handleAdd">添加</el-button>
      <el-button type="info" plain @click="retainDrawerRef?.open()">挽留配置</el-button>

      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="height: calc(100vh - 360px);"
        class="m-t-10"
      >
        <el-table-column prop="id" label="ID" width="80" fixed="left" />
        <el-table-column prop="title" label="标题" min-width="200" fixed="left" show-overflow-tooltip />
        <el-table-column label="平台" min-width="200">
          <template #default="{ row }">
            <el-space wrap size="small">
              <el-tag v-for="channel in row.channel" :key="channel" type="success">
                {{ channel }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="最小版本号" min-width="120">
          <template #default="{ row }">
            {{ row.min_version || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="展示位置" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.position === 2 ? 'danger' : 'info'">
              {{ row.position === 1 ? '普通会员' : '超级会员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="年龄" min-width="280">
          <template #default="{ row }">
             <el-space wrap size="small">
              <el-tag v-for="age in row.age" :key="age" type="warning">
                {{ getAgeLabel(age) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="上线状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '上线中' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="sku_id" min-width="200">
          <template #default="{ row }">
            <el-space wrap  v-if="Array.isArray(row.sku_memo)">
              <el-tag
                v-for="item in row.sku_memo"
                type="primary"
                :key="item.sku_id"
              >
                {{ item.sku_id }}
              </el-tag>
            </el-space>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="175" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">修改</el-button>
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

    <SubscriptionConfigDialog ref="dialogRef" @success="fetchTableData" />
    <RetainConfigDrawer ref="retainDrawerRef" />
  </div>
</template>

<style scoped>
.subscription-config-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
