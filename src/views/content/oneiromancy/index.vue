<script setup lang="ts" name="oneiromancy">
defineOptions({ name: 'oneiromancy' })

import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { deleteOneiromancy, getOneiromancyList } from '@/api/content'
import OneiromancyDialog from './components/OneiromancyDialog.vue'

interface OneiromancyItem {
  id: number | string
  title: string
  img?: string
  moral?: string
  directive?: string
  url?: string
  is_free?: number | string
  is_new?: number | string
  status?: number | string
  status_name?: string
  created_at?: string
  sequence?: number | string
  home_page_seq?: number | string
}

interface OneiromancyListResponse {
  list?: OneiromancyItem[]
  data?: OneiromancyItem[]
  total?: number | string
}

const loading = ref(false)
const tableData = ref<OneiromancyItem[]>([])
const dialogRef = ref<InstanceType<typeof OneiromancyDialog>>()

/** 搜索条件 */
const queryForm = reactive({
  title: '',
})

/** 分页配置 */
const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

/** 构建列表查询参数 */
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  key_words: queryForm.title.trim(),
})

/** 解析列表数据，兼容多种返回格式 */
const resolveList = (data: OneiromancyListResponse | OneiromancyItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

/** 解析列表总数 */
const resolveTotal = (data: OneiromancyListResponse | OneiromancyItem[] | undefined, list: OneiromancyItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

/** 将图片地址转为预览列表 */
const getImageList = (url?: string) => url ? [url] : []

/** 获取是否免费文本 */
const getFreeText = (value: number | string | undefined) =>
  Number(value) === 1 ? '免费' : Number(value) === 2 ? '付费' : '-'

/** 获取是否上新文本 */
const getNewText = (value: number | string | undefined) =>
  Number(value) === 1 ? '是' : Number(value) === 2 ? '否' : '-'

/** 获取列表数据 */
const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getOneiromancyList(getListParams()) as ApiResponseData<OneiromancyListResponse | OneiromancyItem[]>
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

/** 搜索，重置页码后加载数据 */
const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

/** 每页条数变更 */
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchTableData()
}

/** 页码变更 */
const handleCurrentPageChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

/** 打开添加弹窗 */
const handleAdd = () => {
  dialogRef.value?.openCreate()
}

/** 打开编辑弹窗 */
const handleEdit = (row: OneiromancyItem) => {
  dialogRef.value?.openEdit(Number(row.id))
}

/** 删除解梦配置 */
const handleDelete = async (row: OneiromancyItem) => {
  try {
    await ElMessageBox.confirm(`确定删除ID为【${row.id}】的解梦配置吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteOneiromancy(Number(row.id))
    ElMessage.success('删除成功')
    fetchTableData()
  } catch {
    // 用户取消操作
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="oneiromancy-page">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="glass-card filter-card">
      <el-form inline :model="queryForm">
        <el-form-item label="标题">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="请输入标题"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item class="filter-actions">
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="glass-card">
        <el-button :icon="Plus" plain type="primary" @click="handleAdd">添加解梦</el-button>
      <el-table style="height: calc(100vh - 350px);" v-loading="loading" stripe border :data="tableData" class="m-t-10">
        <el-table-column prop="id" label="ID" width="80" fixed="left" />
        <el-table-column prop="title" label="主标题" min-width="200" show-overflow-tooltip fixed="left" />
        <el-table-column label="封面" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.img && row.img !== '0'"
              :src="row.img"
              :preview-src-list="getImageList(row.img)"
              :preview-teleported="true"
              fit="contain"
              class="thumb-image"
            />
            <span v-else>暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="是否免费" width="100">
          <template #default="{ row }">
            <span>{{ getFreeText(row.is_free) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="是否上新" width="100">
          <template #default="{ row }">
            <span>{{ getNewText(row.is_new) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status_name" label="状态" width="100" />
        <el-table-column prop="created_at" label="创建时间" min-width="170" show-overflow-tooltip />
        <el-table-column prop="sequence" label="排序" width="90" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link :icon="Edit" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link :icon="Delete" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 添加/编辑弹窗 -->
    <OneiromancyDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.oneiromancy-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.thumb-image {
  width: 72px;
  height: 40px;
  border-radius: 8px;
}
</style>
