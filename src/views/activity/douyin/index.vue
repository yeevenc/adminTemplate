<script setup lang="ts" name="douyin">
defineOptions({ name: 'douyin' })

import { Close, Search,Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getTikTokList, handleCheckComment } from '@/api/activity'

const loading = ref(false)
const actionLoading = ref(false)
const tableData = ref<TikTokCommentItem[]>([])

const queryForm = reactive({
  uid: '',
  deviceId: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

interface TikTokCommentItem {
  id: number
  uid: number | string
  device_id: string
  image_url: string
  reward_day: string | number
  verify_status: 1 | 2 | 3
  updated_at: string
  created_at: string
}

interface TikTokCommentListResponse {
  list?: TikTokCommentItem[]
  total?: number
  data?: TikTokCommentItem[]
}

const verifyStatusMap: Record<number, { label: string; type: 'warning' | 'success' | 'danger' }> = {
  1: { label: '未审核', type: 'warning' },
  2: { label: '通过', type: 'success' },
  3: { label: '拒绝', type: 'danger' },
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

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    uid: queryForm.uid.trim(),
    device_id: queryForm.deviceId.trim(),
  }
}

function getTableList(data: TikTokCommentListResponse | TikTokCommentItem[] | undefined) {
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

function getImageList(imageUrl: string) {
  if (!imageUrl) {
    return []
  }

  return imageUrl
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getVerifyStatus(status: number) {
  return verifyStatusMap[status] || { label: '-', type: 'warning' as const }
}

async function handleVerify(row: TikTokCommentItem, verifyStatus: 2 | 3) {
  if (String(row.reward_day) === '0') {
    ElMessage.warning('该用户暂未抽奖')
    return
  }

  const actionText = verifyStatus === 2 ? '通过' : '拒绝'

  try {
    await ElMessageBox.confirm(`是否${actionText}审核？`, '提示', {
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
    await handleCheckComment({
      id: row.id,
      verify_status: verifyStatus,
    })
    ElMessage.success('审核成功')
    fetchTableData()
  } finally {
    actionLoading.value = false
  }
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getTikTokList(getListParams()) as ApiResponseData<TikTokCommentListResponse | TikTokCommentItem[]>
    const list = getTableList(response.data)

    tableData.value = list
    pagination.total = Number((response.data as TikTokCommentListResponse)?.total) || list.length
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="douyin-page">
    <el-card shadow="never" class="glass-card">
      <el-form inline :model="queryForm">
          <el-form-item label="用户ID" >
            <el-input
              v-model="queryForm.uid"
              clearable
              placeholder="请输入用户ID"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="设备号">
            <el-input
              v-model="queryForm.deviceId"
              clearable
              placeholder="请输入设备号"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card ">
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 300px);">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="uid" label="用户ID" min-width="120" />
        <el-table-column prop="device_id" label="设备号" min-width="200" show-overflow-tooltip />
        <el-table-column label="评论图片" width="180">
          <template #default="{ row }">
            <el-image
              v-if="row.image_url"
              :src="getImageList(row.image_url)[0]"
              :preview-src-list="getImageList(row.image_url)"
              :preview-teleported="true"
              fit="contain"
              class="comment-image"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="reward_day" label="中奖结果" width="100" />
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getVerifyStatus(row.verify_status).type">
              {{ getVerifyStatus(row.verify_status).label }}
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
              :disabled="row.verify_status !== 1 || actionLoading"
              @click="handleVerify(row, 2)"
              :icon="Check"
            >
              通过
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="row.verify_status !== 1 || actionLoading"
              @click="handleVerify(row, 3)"
              :icon="Close"
            >
              拒绝
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
  </div>
</template>

<style scoped>
.douyin-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-image {
  width: 120px;
  height: 40px;
  border-radius: 8px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}

@media (max-width: 768px) {
  .filter-item {
    width: 100%;
  }
}
</style>
