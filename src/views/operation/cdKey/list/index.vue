<script setup lang="ts" name="cdKeyList">
defineOptions({ name: 'cdKeyList' })

import {  CopyDocument, Delete, Download, Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { deleteCode, getCodeCategoryList, getCodeList } from '@/api/operation'
import { exportTableToCsv, type ExportColumn,copyToClipboard } from '@/utils/useConfig'
import CdKeyDialog from '@/views/operation/cdKey/list/components/CdKeyDialog.vue'

interface CdKeyItem {
  id: number | string
  config_name: string
  code: string
  title: string
  start_date: string
  end_date: string
  created_at: string
  [key: string]: unknown
}

interface CdKeyCategoryOption {
  id: number | string
  title: string
}

interface CdKeyListResponse {
  list?: CdKeyItem[]
  data?: CdKeyItem[]
  total?: number | string
}

interface CdKeyCategoryResponse {
  list?: CdKeyCategoryOption[]
  data?: CdKeyCategoryOption[]
}

const loading = ref(false)
const exportLoading = ref(false)
const tableData = ref<CdKeyItem[]>([])
const categoryOptions = ref<CdKeyCategoryOption[]>([])
const dialogRef = ref<InstanceType<typeof CdKeyDialog>>()

const queryForm = reactive({
  code: '',
  configId: '' as number | string | '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const EXPORT_COLUMNS: ExportColumn<CdKeyItem>[] = [
  { label: 'ID', prop: 'id' },
  { label: '兑换码名称', prop: 'config_name' },
  { label: '兑换码', prop: 'code' },
  { label: '名称', prop: 'title' },
  { label: '开始时间', prop: 'start_date' },
  { label: '结束时间', prop: 'end_date' },
  { label: '创建时间', prop: 'created_at' },
]

// 统一列表查询参数
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  code: queryForm.code.trim(),
  config_id: queryForm.configId,
})

// 兼容 list / data / 数组 三种返回结构
const resolveList = <T>(data: { list?: T[]; data?: T[] } | T[] | undefined): T[] => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (data: CdKeyListResponse | CdKeyItem[] | undefined, list: CdKeyItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

// 获取兑换码列表
const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getCodeList(getListParams()) as ApiResponseData<CdKeyListResponse | CdKeyItem[]>
    const list = resolveList<CdKeyItem>(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

// 获取兑换码分类（供搜索和弹窗共用）
const fetchCategoryList = async () => {
  const response = await getCodeCategoryList({ page: 1, page_size: 9999 }) as ApiResponseData<CdKeyCategoryResponse | CdKeyCategoryOption[]>
  categoryOptions.value = resolveList<CdKeyCategoryOption>(response.data)
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

// 复制兑换码到剪贴板，优先使用 Clipboard API，降级到 execCommand
const handleCopyCode = async (row: CdKeyItem) => {
  copyToClipboard(row.code)
}

// 删除兑换码（二次确认）
const handleDelete = async (row: CdKeyItem) => {
  try {
    await ElMessageBox.confirm('此操作将永久删除该兑换码，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  await deleteCode(row.id)
  ElMessage.success('删除成功')
  fetchTableData()
}

// 导出当前列表数据为 CSV
const handleExport = () => {
  if (!tableData.value.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  exportLoading.value = true
  try {
    exportTableToCsv<CdKeyItem>({
      filename: '兑换码列表',
      columns: EXPORT_COLUMNS,
      data: tableData.value,
    })
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  fetchTableData()
  fetchCategoryList()
})
</script>

<template>
  <div class="cd-key-list-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="兑换码名称">
          <el-select
            v-model="queryForm.configId"
            placeholder="选择兑换码名称"
            clearable
            style="width: 200px;"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换码">
          <el-input
            v-model="queryForm.code"
            clearable
            placeholder="请输入兑换码"
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
        <el-button :icon="Plus" plain type="primary" @click="handleAdd">添加</el-button>
        <el-button :icon="Download" plain type="success" :loading="exportLoading" @click="handleExport">导出</el-button>

      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 360px);" class="m-t-10">
        <el-table-column prop="id" fixed label="ID" width="80" />
        <el-table-column prop="config_name" label="兑换码名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="兑换码" min-width="220">
          <template #default="{ row }">
            <div class="code-cell">
              <el-tag type="success">{{ row.code }}</el-tag>
              <el-button link type="primary" :icon="CopyDocument" @click="handleCopyCode(row)">复制</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="start_date" label="开始时间" min-width="170" />
        <el-table-column prop="end_date" label="结束时间" min-width="170" />
        <el-table-column prop="created_at" label="创建时间" min-width="170" />
        <el-table-column label="操作" align="center" fixed="right" width="100">
          <template #default="{ row }">
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="m-t-10"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[30, 100, 300, 500]"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <CdKeyDialog ref="dialogRef" :category-options="categoryOptions" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.cd-key-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}


.code-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.code-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
