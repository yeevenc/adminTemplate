<script setup lang="ts" name="cdKeyCategory">
defineOptions({ name: 'cdKeyCategory' })

import { Plus, Search,Edit } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getCodeCategoryList } from '@/api/operation'
import CdKeyCategoryDialog from '@/views/operation/cdKey/category/components/CdKeyCategoryDialog.vue'

interface CdKeyCategoryItem {
  id: number | string
  title: string
  sku_id: number | string
  duration: number | string
  sort: number | string
  created_at: string
}

interface CdKeyCategoryListResponse {
  list?: CdKeyCategoryItem[]
  data?: CdKeyCategoryItem[]
  total?: number | string
}

const loading = ref(false)
const tableData = ref<CdKeyCategoryItem[]>([])
const dialogRef = ref<InstanceType<typeof CdKeyCategoryDialog>>()

const queryForm = reactive({
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 统一组装列表查询参数，避免分页和搜索条件在多个入口重复拼接
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  key_words: queryForm.keyword.trim(),
})

// 列表接口兼容数组 / list / data 三种返回结构
const resolveList = (data: CdKeyCategoryListResponse | CdKeyCategoryItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

// 总数优先以后端返回为准，兜底使用当前列表长度
const resolveTotal = (
  data: CdKeyCategoryListResponse | CdKeyCategoryItem[] | undefined,
  list: CdKeyCategoryItem[],
) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

// 获取兑换码分类列表
const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getCodeCategoryList(getListParams()) as ApiResponseData<
      CdKeyCategoryListResponse | CdKeyCategoryItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

// 搜索时重置页码重新查询
const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

// 分页大小切换
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchTableData()
}

// 页码切换
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

// 打开新增弹窗
const handleAdd = () => {
  dialogRef.value?.openCreate()
}

// 打开编辑弹窗
const handleEdit = (row: CdKeyCategoryItem) => {
  dialogRef.value?.openEdit(row.id)
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="cd-key-category-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="分类名称">
          <el-input
            v-model="queryForm.keyword"
            clearable
            placeholder="请输入分类名称"
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
        <el-button :icon="Plus" plain type="primary" @click="handleAdd">新增分类</el-button>
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 360px);" class="m-t-10">
        <el-table-column prop="id" fixed label="ID" width="80" />
        <el-table-column prop="title" label="名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sku_id" label="skuId" min-width="120" />
        <el-table-column prop="duration" label="时长" min-width="120" />
        <el-table-column prop="sort" label="排序" min-width="100" />
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
        <el-table-column label="操作" align="center" fixed="right" width="100">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
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

    <CdKeyCategoryDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.cd-key-category-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

</style>
