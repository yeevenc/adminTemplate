<script setup lang="ts" name="articleConfig">
defineOptions({ name: 'articleConfig' })

import { Plus, Search ,Edit, Delete} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import {
  deleteArticleConfig,
  getArticleConfigList,
} from '@/api/content'
import ArticleConfigDialog from '@/views/content/articleConfig/components/ArticleConfigDialog.vue'

interface ArticleItem {
  id: number | string
  title: string
  subtitle: string
  img?: string
  status?: number | string
  status_name?: string
  created_at?: string
  sequence?: number | string
}

interface ArticleListResponse {
  list?: ArticleItem[]
  data?: ArticleItem[]
  total?: number | string
}

const loading = ref(false)
const actionLoading = ref(false)
const editLoadingId = ref<number | string | null>(null)
const tableData = ref<ArticleItem[]>([])
const dialogRef = ref<{
  openCreate: () => void
  openEdit: (id: number) => Promise<void>
}>()

const queryForm = reactive({
  keyword: '',
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
    key_words: queryForm.keyword.trim(),
  }
}

function resolveList(data: ArticleListResponse | ArticleItem[] | undefined) {
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

function resolveTotal(data: ArticleListResponse | ArticleItem[] | undefined, list: ArticleItem[]) {
  if (Array.isArray(data)) {
    return data.length
  }

  return Number(data?.total) || list.length
}

function getImageList(url?: string) {
  if (!url) {
    return []
  }

  return [url]
}

function getStatusText(row: ArticleItem) {
  if (row.status_name) {
    return row.status_name
  }

  return Number(row.status) === 2 ? '禁用' : '正常'
}

function getStatusType(row: ArticleItem) {
  return Number(row.status) === 2 ? 'danger' : 'success'
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getArticleConfigList(getListParams()) as ApiResponseData<ArticleListResponse | ArticleItem[]>
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

async function handleEdit(row: ArticleItem) {
  editLoadingId.value = row.id

  try {
    await dialogRef.value?.openEdit(Number(row.id))
  } finally {
    editLoadingId.value = null
  }
}

async function handleDelete(row: ArticleItem) {
  try {
    await ElMessageBox.confirm('是否删除当前文章？', '提示', {
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
    await deleteArticleConfig(Number(row.id))
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
  <div class="article-config-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
          <el-form-item label="文章名称" >
            <el-input
              v-model="queryForm.keyword"
              clearable
              placeholder="请输入文章名称"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item >
            <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-button :icon="Plus" type="primary" plain  @click="openCreateDialog">添加</el-button>
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh -300px);" class="m-t-10">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="主标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="subtitle" label="副标题" min-width="260" show-overflow-tooltip />
        <el-table-column label="封面图" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.img"
              :src="row.img"
              :preview-src-list="getImageList(row.img)"
              :preview-teleported="true"
              fit="contain"
              class="thumb-image"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" show-overflow-tooltip />
        <el-table-column prop="sequence" label="排序" width="100" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
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
              :icon="Delete"
              :disabled="actionLoading || editLoadingId === row.id"
              @click="handleDelete(row)"
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

    <ArticleConfigDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.article-config-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
