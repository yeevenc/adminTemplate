<script setup lang="ts" name="adBlock">
defineOptions({ name: 'adBlock' })

import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { addAdBlockUser, getAdBlockList } from '@/api/userConfig'

interface AdBlockItem {
  id: number | string
  uid: number | string
  nickname: string
  updated_at: string
  created_at: string
}

interface AdBlockListResponse {
  list?: AdBlockItem[]
  data?: AdBlockItem[]
  total?: number | string
}

interface AdBlockFormState {
  uid: string
}

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<AdBlockItem[]>([])
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const queryForm = reactive({
  uid: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const form = reactive<AdBlockFormState>({
  uid: '',
})

const rules: FormRules<AdBlockFormState> = {
  uid: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
}

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    uid: queryForm.uid.trim(),
  }
}

function resolveList(data: AdBlockListResponse | AdBlockItem[] | undefined) {
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

function resolveTotal(data: AdBlockListResponse | AdBlockItem[] | undefined, list: AdBlockItem[]) {
  if (Array.isArray(data)) {
    return data.length
  }

  return Number(data?.total) || list.length
}

function resetForm() {
  form.uid = ''
  formRef.value?.clearValidate()
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getAdBlockList(getListParams()) as ApiResponseData<AdBlockListResponse | AdBlockItem[]>
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

function openAddDialog() {
  resetForm()
  dialogVisible.value = true
}

function handleCloseDialog() {
  dialogVisible.value = false
  resetForm()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  submitLoading.value = true

  try {
    await addAdBlockUser({
      uid: form.uid.trim(),
    })
    ElMessage.success('添加成功')
    handleCloseDialog()
    pagination.page = 1
    fetchTableData()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="ad-block-page">
    <el-card shadow="never" class="glass-card filter-card">
      <el-form :model="queryForm" class="filter-form" label-position="top">
        <div class="filter-row">
          <el-form-item label="用户ID" class="filter-item">
            <el-input
              v-model="queryForm.uid"
              clearable
              placeholder="请输入用户ID"
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
        <el-button :icon="Plus" type="primary" @click="openAddDialog">添加</el-button>
      </div>
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 300px);">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="uid" label="用户ID" min-width="140" show-overflow-tooltip />
        <el-table-column prop="nickname" label="用户昵称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="updated_at" label="更新时间" min-width="180" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" min-width="180" show-overflow-tooltip />
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

    <el-dialog
      :model-value="dialogVisible"
      title="添加广告屏蔽用户"
      width="40%"
      destroy-on-close
      @close="handleCloseDialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户ID" prop="uid">
          <el-input v-model="form.uid" placeholder="请输入用户ID" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCloseDialog">取消</el-button>
        <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ad-block-page {
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
