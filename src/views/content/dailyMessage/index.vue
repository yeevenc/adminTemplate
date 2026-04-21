<script setup lang="ts" name="dailyMessage">
defineOptions({ name: 'dailyMessage' })

import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getDailyMessageList, updateDailyMessage } from '@/api/content'
import DailyMessageDialog from './components/DailyMessageDialog.vue'

interface DailyMessageItem {
  id: number | string
  content: string
  author?: string
  status?: number | string
  status_name?: string
  created_at?: string
  sequence?: number | string
}

interface DailyMessageListResponse {
  list?: DailyMessageItem[]
  data?: DailyMessageItem[]
  total?: number | string
}

const loading = ref(false)
const actionLoading = ref(false)
const tableData = ref<DailyMessageItem[]>([])
const dialogRef = ref<InstanceType<typeof DailyMessageDialog>>()

const queryForm = reactive({
  content: '',
  author: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  content: queryForm.content.trim(),
  author: queryForm.author.trim(),
})

const resolveList = (data: DailyMessageListResponse | DailyMessageItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (data: DailyMessageListResponse | DailyMessageItem[] | undefined, list: DailyMessageItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

const getStatusText = (row: DailyMessageItem) => {
  if (row.status_name) return row.status_name
  const map: Record<number, string> = { 1: '展示', 2: '不展示', 3: '已删除' }
  return map[Number(row.status)] || '-'
}

const getStatusType = (row: DailyMessageItem) => {
  const status = Number(row.status)
  if (status === 1) return 'success'
  if (status === 3) return 'danger'
  return 'info'
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getDailyMessageList(getListParams()) as ApiResponseData<DailyMessageListResponse | DailyMessageItem[]>
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

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchTableData()
}

const handleCurrentPageChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

const handleAdd = () => {
  dialogRef.value?.openCreate()
}

const handleEdit = (row: DailyMessageItem) => {
  dialogRef.value?.openEdit(Number(row.id))
}

const handleDelete = async (row: DailyMessageItem) => {
  try {
    await ElMessageBox.confirm(`您确定删除ID为【${row.id}】的寄语吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    ElMessage.info('已取消删除')
    return
  }

  actionLoading.value = true
  try {
    await updateDailyMessage(Number(row.id), { ...row, status: 3 })
    ElMessage.success('删除成功')
    fetchTableData()
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="daily-message-page">
    <el-card shadow="never" class="glass-card filter-card">
      <el-form inline :model="queryForm">
        <el-form-item label="每日寄语">
          <el-input
            v-model="queryForm.content"
            clearable
            placeholder="请输入每日寄语"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="作者">
          <el-input
            v-model="queryForm.author"
            clearable
            placeholder="请输入作者"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-button :icon="Plus" plain type="primary" @click="handleAdd">添加寄语</el-button>
      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="height: calc(100vh - 350px);"
        class="m-t-10"
      >
        <el-table-column prop="id" label="ID" width="80" fixed="left" />
        <el-table-column prop="content" label="每日寄语" min-width="260" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" show-overflow-tooltip />
        <el-table-column prop="sequence" label="排序" width="90" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="Number(row.status) === 3">
              <el-button link type="danger" disabled>已删除</el-button>
            </template>
            <template v-else>
              <el-button
                link
                type="primary"
                :icon="Edit"
                :disabled="actionLoading"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :disabled="actionLoading"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="m-t-10"
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

    <DailyMessageDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.daily-message-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
