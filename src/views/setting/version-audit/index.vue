<script setup lang="ts" name="versionAudit">
defineOptions({ name: 'versionAudit' })

import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { editVersionAuditConfig, getVersionAuditInfo, getVersionAuditList } from '@/api/setting'

interface VersionAuditItem {
  id: number
  name: string
  channel: string
  value: string
}

interface VersionAuditForm {
  id: number
  channel: string
  value: string
}

const platformOptions = [
  { label: 'iOS', value: 'ios' },
  { label: '华为', value: 'huawei' },
  { label: 'vivo', value: 'vivo' },
  { label: '全部', value: 'all' },
]

const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const tableData = ref<VersionAuditItem[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const form = reactive<VersionAuditForm>({
  id: 0,
  channel: '',
  value: '',
})

function getTableList(data: VersionAuditItem[] | { list?: VersionAuditItem[]; data?: VersionAuditItem[] } | undefined) {
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

function getPlatformText(channel: string) {
  const target = platformOptions.find((item) => item.value === channel)
  return target?.label || channel || '-'
}

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
  }
}

function resetForm() {
  form.id = 0
  form.channel = ''
  form.value = ''
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getVersionAuditList(getListParams()) as ApiResponseData<VersionAuditItem[] | { list?: VersionAuditItem[]; data?: VersionAuditItem[]; total?: number }>
    const list = getTableList(response.data)

    tableData.value = list
    pagination.total = Number((response.data as { total?: number })?.total) || list.length
  } finally {
    loading.value = false
  }
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

async function handleEdit(row: VersionAuditItem) {
  detailLoading.value = true

  try {
    const response = await getVersionAuditInfo(row.id) as ApiResponseData<VersionAuditItem>

    form.id = response.data.id
    form.channel = response.data.channel
    form.value = response.data.value
    dialogVisible.value = true
  } finally {
    detailLoading.value = false
  }
}

function handleClose() {
  dialogVisible.value = false
  resetForm()
}

async function handleSubmit() {
  if (!form.channel) {
    ElMessage.warning('请选择平台')
    return
  }

  if (!form.value.trim()) {
    ElMessage.warning('请输入版本号')
    return
  }

  submitLoading.value = true

  try {
    await editVersionAuditConfig(form.id, {
      channel: form.channel,
      version_code: form.value.trim(),
    })
    ElMessage.success('保存成功')
    handleClose()
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
  <div class="version-audit-page">
    <el-card shadow="never" class="glass-card table-card">
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 300px);">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="平台" min-width="140">
          <template #default="{ row }">
            {{ getPlatformText(row.channel) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="版本号" min-width="160" />
        <el-table-column label="操作" align="center" fixed="right" width="100">
          <template #default="{ row }">
            <el-button :loading="detailLoading && form.id === row.id" link type="primary" @click="handleEdit(row)">编辑</el-button>
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

    <el-dialog
      :model-value="dialogVisible"
      title="编辑版本审核"
      width="40%"
      destroy-on-close
      @close="handleClose"
    >
      <el-form label-position="left" label-width="auto">
        <el-form-item label="平台">
          <el-radio-group v-model="form.channel">
            <el-radio
              v-for="item in platformOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="版本号">
          <el-input v-model="form.value" placeholder="请输入版本号" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.version-audit-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-card {
  border: none;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}
</style>
