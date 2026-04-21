<script setup lang="ts" name="messageWhiteList">
defineOptions({ name: 'messageWhiteList' })

import { Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getAdminSmsWhiteList } from '@/api/userConfig'
import MessageWhiteListDialog from '@/views/userConfig/messageWhiteList/components/MessageWhiteListDialog.vue'

interface MessageWhiteListItem {
  id: number | string
  mobile: string
  title: string
  status_name: string
}

interface MessageWhiteListListResponse {
  list?: MessageWhiteListItem[]
  data?: MessageWhiteListItem[]
  total?: number | string
}

const loading = ref(false)
const editLoadingId = ref<number | string | null>(null)
const tableData = ref<MessageWhiteListItem[]>([])
const dialogRef = ref<{
  openCreate: () => void
  openEdit: (id: number) => Promise<void>
}>()

const queryForm = reactive({
  mobile: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    mobile: queryForm.mobile.trim(),
  }
}

function resolveList(data: MessageWhiteListListResponse | MessageWhiteListItem[] | undefined) {
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

function resolveTotal(data: MessageWhiteListListResponse | MessageWhiteListItem[] | undefined, list: MessageWhiteListItem[]) {
  if (Array.isArray(data)) {
    return data.length
  }

  return Number(data?.total) || list.length
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getAdminSmsWhiteList(getListParams()) as ApiResponseData<MessageWhiteListListResponse | MessageWhiteListItem[]>
    const list = resolveList(response.data)

    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchTableData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchTableData()
}

function handleCurrentPageChange(page: number) {
  pagination.page = page
  fetchTableData()
}

function openCreateDialog() {
  dialogRef.value?.openCreate()
}

async function handleEdit(row: MessageWhiteListItem) {
  editLoadingId.value = row.id

  try {
    await dialogRef.value?.openEdit(Number(row.id))
  } finally {
    editLoadingId.value = null
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="message-white-list-page">
    <el-card shadow="never" class="glass-card filter-card">
      <el-form :model="queryForm" class="filter-form" label-position="top">
        <div class="filter-row">
          <el-form-item label="手机号" class="filter-item">
            <el-input
              v-model="queryForm.mobile"
              clearable
              placeholder="请输入手机号"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item class="filter-actions">
            <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card table-card">
      <div class="table-header-actions">
        <el-button :icon="Plus" type="primary" @click="openCreateDialog">添加</el-button>
      </div>
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 300px);">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="mobile" label="手机号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="status_name" label="状态" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :loading="editLoadingId === row.id"
              @click="handleEdit(row)"
              :icon="Edit"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="table-pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 30, 50, 100]"
        :total="pagination.total"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </el-card>

    <MessageWhiteListDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.message-white-list-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 16px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    width: 100%;
  }
}
</style>
