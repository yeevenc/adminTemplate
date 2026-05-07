<script setup lang="ts" name="obTemplate">
defineOptions({ name: 'obTemplate' })

import { onMounted, reactive, ref } from 'vue'
import { Plus, Search,Edit,CopyDocument } from '@element-plus/icons-vue'
import type { ApiResponseData } from '@/utils/request'
import { getTemplateList } from '@/api/operation'
import SubscriptionTemplateDialog from './components/SubscriptionTemplateDialog.vue'
import RetainTemplateDialog from './components/RetainTemplateDialog.vue'

// 模板类型选项
const TEMPLATE_TYPE_OPTIONS = [
  { label: '订阅页', value: 1 },
  { label: '挽留', value: 2 },
]

interface TemplateItem {
  id: number | string
  title: string
  type: 1 | 2
  remark: string
  created_at?: string
  [key: string]: unknown
}

interface TemplateListResponse {
  list: TemplateItem[]
  total: number
}

const loading = ref(false)
const tableData = ref<TemplateItem[]>([])

const queryForm = reactive({
  id: '',
  title: '',
  type: '' as number | '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const subscriptionDialogRef = ref<InstanceType<typeof SubscriptionTemplateDialog>>()
const retainDialogRef = ref<InstanceType<typeof RetainTemplateDialog>>()

const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  id: queryForm.id.trim(),
  title: queryForm.title.trim(),
  type: queryForm.type,
})

const fetchTableData = async () => {
  loading.value = true
  try {
    const res = await getTemplateList(getListParams()) as ApiResponseData<TemplateListResponse>
    tableData.value = Array.isArray(res.data?.list) ? res.data.list : []
    pagination.total = res.data?.total || 0
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

// 添加订阅页
const handleAddSubscription = () => {
  subscriptionDialogRef.value?.openCreate()
}

// 添加挽留
const handleAddRetain = () => {
  retainDialogRef.value?.openCreate()
}

// 详情下沉到各自弹窗组件中处理，列表页只负责按类型分发打开逻辑
const openDialogWithDetail = async (row: TemplateItem, mode: 'edit' | 'copy') => {
  if (row.type === 1) {
    mode === 'edit'
      ? subscriptionDialogRef.value?.openEdit(row.id)
      : subscriptionDialogRef.value?.openCopy(row.id)
  } else {
    mode === 'edit'
      ? retainDialogRef.value?.openEdit(row.id)
      : retainDialogRef.value?.openCopy(row.id)
  }
}

// 修改
const handleEdit = (row: TemplateItem) => {
  openDialogWithDetail(row, 'edit')
}

// 复制
const handleCopy = (row: TemplateItem) => {
  openDialogWithDetail(row, 'copy')
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="template-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="模板ID">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="模板ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="模板名称">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="模板名称"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="模板类型">
          <el-select
            v-model="queryForm.type"
            clearable
            placeholder="选择类型"
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in TEMPLATE_TYPE_OPTIONS"
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
      <el-button :icon="Plus" type="primary" plain @click="handleAddSubscription">添加订阅页</el-button>
      <el-button :icon="Plus" type="warning" plain @click="handleAddRetain">添加挽留</el-button>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        class="m-t-10"
        style="height: calc(100vh - 355px)"
      >
        <el-table-column prop="id" label="ID" width="80" fixed="left" />
        <el-table-column prop="title" label="模板名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="模板类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : 'warning'">
              {{ row.type === 1 ? '订阅页' : '挽留' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="详细描述" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">修改</el-button>
            <el-button link type="warning" :icon="CopyDocument" @click="handleCopy(row)">复制</el-button>
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

    <SubscriptionTemplateDialog ref="subscriptionDialogRef" @success="fetchTableData" />
    <RetainTemplateDialog ref="retainDialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.template-page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>
