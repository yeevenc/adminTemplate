<script setup lang="ts" name="asaKeyword">
defineOptions({ name: 'asaKeyword' })

import { Search, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getAsaAdList, importAsaAd } from '@/api/setting'

interface AsaKeywordItem {
  id: number | string
  name: string
  ad_group_id: number | string
  campaign_id: number | string
  match_type: string
  ctime: string
}

interface AsaKeywordListResponse {
  list?: AsaKeywordItem[]
  data?: AsaKeywordItem[]
  total?: number | string
}

const tableColumns = [
  { prop: 'id', label: '关键词ID' },
  { prop: 'name', label: '关键词' },
  { prop: 'ad_group_id', label: '词组ID' },
  { prop: 'campaign_id', label: '广告计划ID' },
  { prop: 'match_type', label: '匹配类型' },
  { prop: 'ctime', label: '创建时间' },
]

// 统一维护筛选参数，避免多个请求入口重复拼接
const queryForm = reactive({
  keyword: '',
  batchKeywords: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const loading = ref(false)
const importLoading = ref(false)
const tableData = ref<AsaKeywordItem[]>([])
const importDialogVisible = ref(false)
const importFile = ref<File | null>(null)
const importFileName = ref('')

function getKeywordList(data: AsaKeywordListResponse | AsaKeywordItem[] | undefined) {
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

function getKeywordTotal(data: AsaKeywordListResponse | AsaKeywordItem[] | undefined, list: AsaKeywordItem[]) {
  if (Array.isArray(data)) {
    return data.length
  }

  return Number(data?.total) || list.length
}

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    keyword: queryForm.keyword.trim(),
    batch_keywords: queryForm.batchKeywords.trim(),
  }
}

function formatCell(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value)
  }

  if (value === '' || value === null || typeof value === 'undefined') {
    return '-'
  }

  return value
}

function resetImportState() {
  importFile.value = null
  importFileName.value = ''
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getAsaAdList(getListParams()) as ApiResponseData<AsaKeywordListResponse | AsaKeywordItem[]>
    const list = getKeywordList(response.data)

    tableData.value = list
    pagination.total = getKeywordTotal(response.data, list)
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

function openImportDialog() {
  resetImportState()
  importDialogVisible.value = true
}

function closeImportDialog() {
  importDialogVisible.value = false
  resetImportState()
}

function handleFileChange(file: File) {
  importFile.value = file
  importFileName.value = file.name
}

function handleFileExceed() {
  ElMessage.warning('只能选择一个文件')
}

async function handleImport() {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  const formData = new FormData()
  formData.append('file', importFile.value)
  importLoading.value = true

  try {
    await importAsaAd(formData)
    ElMessage.success('导入成功')
    closeImportDialog()
    pagination.page = 1
    fetchTableData()
  } finally {
    importLoading.value = false
  }
}

function handleClearKeyword() {
  handleSearch()
}

function handleClearBatchKeywords() {
  handleSearch()
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="asa-keyword-page">
    <el-card shadow="never" class="glass-card filter-card">
      <el-form :model="queryForm" class="filter-form" label-position="top">
          <el-form-item label="关键词" class="filter-item">
            <el-input
              v-model="queryForm.keyword"
              clearable
              placeholder="请输入关键词"
              @clear="handleClearKeyword"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
        <el-form-item label="批量关键词">
          <el-input
            v-model="queryForm.batchKeywords"
            type="textarea"
            :rows="3"
            clearable
            placeholder="请输入批量关键词，多个关键词用逗号或换行分隔"
            @clear="handleClearBatchKeywords"
          />
        </el-form-item>
         <el-form-item class="filter-actions">
            <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card table-card">
        <el-button :icon="Upload" type="success" plain @click="openImportDialog">导入关键词</el-button>
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 300px);" class="m-t-10">
        <el-table-column
          v-for="column in tableColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ formatCell(row[column.prop as keyof AsaKeywordItem]) }}</span>
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

    <el-dialog
      :model-value="importDialogVisible"
      title="导入ASA关键词"
      width="40%"
      destroy-on-close
      @close="closeImportDialog"
    >
      <uploadFile
        :auto-upload="false"
        :show-file-list="false"
        :limit="1"
        accept=""
        button-label="选择文件"
        @file-change="handleFileChange"
        @exceed="handleFileExceed"
      />
      <div v-if="importFileName" class="selected-file-name">
        已选择：{{ importFileName }}
      </div>

      <template #footer>
        <el-button @click="closeImportDialog">取消</el-button>
        <el-button :loading="importLoading" type="primary" @click="handleImport">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.asa-keyword-page {
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

.selected-file-name {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-muted, #909399);
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
