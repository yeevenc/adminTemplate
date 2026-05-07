<script setup lang="ts" name="xiaohongshu">
defineOptions({ name: 'xiaohongshu' })

import { Delete, Plus, Search,Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { deleteXiaohongshuConfig, getXiaohongshuList } from '@/api/activity'
import XiaohongshuConfigDialog from '@/views/activity/xiaohongshu/components/XiaohongshuConfigDialog.vue'

const loading = ref(false)
const actionLoading = ref(false)
const editLoadingId = ref<number | null>(null)
const tableData = ref<XiaohongshuItem[]>([])
const configDialogRef = ref<{
  openCreate: () => void
  openEdit: (id: number) => Promise<void>
}>()

const queryForm = reactive({
  status: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

interface XiaohongshuItem {
  id: number
  title: string
  cover_url: string
  status: 0 | 1
  updated_at: string
  created_at: string
}

interface XiaohongshuListResponse {
  list?: XiaohongshuItem[]
  data?: XiaohongshuItem[]
  total?: number
}

const statusOptions = [
  { label: '上线', value: '1' },
  { label: '下线', value: '0' },
]

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

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    status: queryForm.status,
  }
}

function getTableList(data: XiaohongshuListResponse | XiaohongshuItem[] | undefined) {
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

function getImageList(url: string) {
  if (!url) {
    return []
  }

  return url
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getStatusText(status: 0 | 1) {
  return status === 1 ? '上线' : '下线'
}

function openCreateDialog() {
  configDialogRef.value?.openCreate()
}

async function handleEdit(row: XiaohongshuItem) {
  editLoadingId.value = row.id

  try {
    await configDialogRef.value?.openEdit(row.id)
  } finally {
    editLoadingId.value = null
  }
}

async function handleDelete(row: XiaohongshuItem) {
  try {
    await ElMessageBox.confirm('是否删除当前数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    ElMessage.info('已取消操作')
    return
  }

  actionLoading.value = true

  try {
    await deleteXiaohongshuConfig(row.id)
    ElMessage.success('删除成功')
    fetchTableData()
  } finally {
    actionLoading.value = false
  }
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getXiaohongshuList(getListParams()) as ApiResponseData<XiaohongshuListResponse | XiaohongshuItem[]>
    const list = getTableList(response.data)

    tableData.value = list
    pagination.total = Number((response.data as XiaohongshuListResponse)?.total) || list.length
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="xiaohongshu-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
          <el-form-item label="状态" >
            <el-select
              v-model="queryForm.status"
              clearable
              placeholder="请选择状态"
              @change="handleSearch"
              @clear="handleSearch"
              style="width: 200px;"
            >
              <el-option
                v-for="item in statusOptions"
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
        <el-button :icon="Plus" plain type="primary" @click="openCreateDialog">新增配置</el-button>
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 350px);" class="m-t-10">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="封面图" width="180">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_url"
              :src="getImageList(row.cover_url)[0]"
              :preview-src-list="getImageList(row.cover_url)"
              :preview-teleported="true"
              fit="contain"
              class="cover-image"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="170" />
        <el-table-column prop="created_at" label="创建时间" min-width="170" />
        <el-table-column label="操作" align="center" fixed="right" width="150">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :loading="editLoadingId === row.id"
              :disabled="actionLoading"
              @click="handleEdit(row)"
              :icon="Edit"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="actionLoading || editLoadingId === row.id"
              @click="handleDelete(row)"
                :icon="Delete"
            >
              删除
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
        :page-sizes="[30, 50, 100,300]"
        :total="pagination.total"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </el-card>

    <XiaohongshuConfigDialog ref="configDialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.xiaohongshu-page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.cover-image {
  width: 120px;
  height: 40px;
  border-radius: 8px;
}

</style>
