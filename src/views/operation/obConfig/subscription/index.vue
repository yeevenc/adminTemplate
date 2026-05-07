<script setup lang="ts">
defineOptions({ name: 'subscription' })

import { CopyDocument, Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getSubscriptionConfigList } from '@/api/operation'
import SubscriptionConfigDialog from './components/SubscriptionConfigDialog.vue'

interface SubscriptionSkuItem {
  sku_id: number | string
}

interface SubscriptionItem {
  id: number | string
  title: string
  remark: string
  sku_memo: SubscriptionSkuItem[]
  created_at: string
  updated_at?: string
  [key: string]: unknown
}

interface SubscriptionListResponse {
  list?: SubscriptionItem[]
  data?: SubscriptionItem[]
  total?: number | string
}

const loading = ref(false)
const tableData = ref<SubscriptionItem[]>([])
const editLoadingId = ref<number | string | null>(null)
const copyLoadingId = ref<number | string | null>(null)
const dialogRef = ref<InstanceType<typeof SubscriptionConfigDialog>>()

const queryForm = reactive({
  id: '',
  title: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  id: queryForm.id.trim(),
  title: queryForm.title.trim(),
})

const resolveList = (data: SubscriptionListResponse | SubscriptionItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (
  data: SubscriptionListResponse | SubscriptionItem[] | undefined,
  list: SubscriptionItem[],
) => {
  if (Array.isArray(data)) return list.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getSubscriptionConfigList(getListParams())) as ApiResponseData<
      SubscriptionListResponse | SubscriptionItem[]
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

const openCreate = () => {
  dialogRef.value?.openCreate()
}

const handleEdit = async (row: SubscriptionItem) => {
  editLoadingId.value = row.id
  try {
    await dialogRef.value?.openEdit(row.id)
  } finally {
    editLoadingId.value = null
  }
}

const handleCopy = async (row: SubscriptionItem) => {
  copyLoadingId.value = row.id
  try {
    await dialogRef.value?.openCopy(row.id)
  } finally {
    copyLoadingId.value = null
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div>
    <el-card shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="订阅页ID">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="请输入订阅页ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="订阅页名称">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="请输入订阅页名称"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="m-t-10">
      <el-button :icon="Plus" plain type="primary" @click="openCreate">添加</el-button>
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        class="m-t-10"
        style="height: calc(100vh - 350px);"
      >
        <el-table-column prop="id" label="订阅页配置ID" width="130" />
        <el-table-column prop="title" label="订阅页标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" label="详情描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="sku_id" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!Array.isArray(row.sku_memo) || !row.sku_memo.length">-</span>
            <el-space v-else wrap>
              <el-tag
                v-for="item in row.sku_memo"
                :key="String(item.sku_id)"
                type="primary"
              >
                {{ item.sku_id }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              :loading="editLoadingId === row.id"
              @click="handleEdit(row)"
            >
              修改
            </el-button>
            <el-button
              link
              type="warning"
              :icon="CopyDocument"
              :loading="copyLoadingId === row.id"
              @click="handleCopy(row)"
            >
              复制
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

    <SubscriptionConfigDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>
