<script setup lang="ts" name="retain">
defineOptions({ name: 'retain' })

import { CopyDocument, Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getObRetainList } from '@/api/operation'
import ObRetainDialog from './components/ObRetainDialog.vue'

interface ObRetainSkuItem {
  sku_id: number | string
}

interface ObRetainItem {
  id: number | string
  title: string
  remark: string
  sku_memo: ObRetainSkuItem[]
  created_at: string
  updated_at?: string
  [key: string]: unknown
}

interface ObRetainListResponse {
  list?: ObRetainItem[]
  data?: ObRetainItem[]
  total?: number | string
}

const loading = ref(false)
const tableData = ref<ObRetainItem[]>([])
const editLoadingId = ref<number | string | null>(null)
const copyLoadingId = ref<number | string | null>(null)
const dialogRef = ref<InstanceType<typeof ObRetainDialog>>()

const queryForm = reactive({
  id: '',
  title: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 查询参数统一从这里组装，避免分页和搜索各自维护一套字段
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  id: queryForm.id.trim(),
  title: queryForm.title.trim(),
})

// 兼容 data/list 两种列表返回结构
const resolveList = (data: ObRetainListResponse | ObRetainItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

// 总数优先使用接口返回值，没有时回退到当前列表长度
const resolveTotal = (
  data: ObRetainListResponse | ObRetainItem[] | undefined,
  list: ObRetainItem[],
) => {
  if (Array.isArray(data)) return list.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getObRetainList(getListParams())) as ApiResponseData<
      ObRetainListResponse | ObRetainItem[]
    >
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

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchTableData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

const openCreate = () => {
  dialogRef.value?.openCreate()
}

// 编辑前由弹窗内部先拉模板和 SKU 配置，再拉详情数据
const handleEdit = async (row: ObRetainItem) => {
  editLoadingId.value = row.id
  try {
    await dialogRef.value?.openEdit(row.id)
  } finally {
    editLoadingId.value = null
  }
}

// 复制沿用详情接口回填，但保存时仍走新增接口
const handleCopy = async (row: ObRetainItem) => {
  copyLoadingId.value = row.id
  try {
    await dialogRef.value?.openCopy(row.id)
  } finally {
    copyLoadingId.value = null
  }
}

const getSkuText = (skuList: ObRetainSkuItem[]) => {
  if (!Array.isArray(skuList) || !skuList.length) return '-'
  return skuList.map((item) => item.sku_id).filter(Boolean).join(' / ')
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div>
    <el-card shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="挽留页ID">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="请输入挽留页ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="挽留页名称">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="请输入挽留页名称"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="m-t-10">
      <el-button :icon="Plus" type="primary" @click="openCreate">添加挽留</el-button>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        class="m-t-10"
        style="width: 100%"
      >
        <el-table-column prop="id" label="挽留页配置ID" width="130" />
        <el-table-column prop="title" label="挽留页标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" label="详情描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="sku_id" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getSkuText(row.sku_memo) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              :loading="editLoadingId === row.id"
              @click="handleEdit(row)"
            >
              修改
            </el-button>
            <el-button
              link
              type="warning"
              :icon="CopyDocument"
              :loading="copyLoadingId === row.id"
              @click="handleCopy(row)"
            >
              复制
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
        :page-sizes="[30, 50, 100]"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <ObRetainDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>
