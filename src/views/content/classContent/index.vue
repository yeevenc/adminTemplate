<script setup lang="ts" name="classContent">
defineOptions({ name: 'classContent' })

import { CopyDocument, Edit, Plus, Search ,View} from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getCourseList, getCourseTypeList } from '@/api/content'
import { selectListData, type SelectOption } from '@/utils/useConfig'
import ClassContentDialog from './components/ClassContentDialog.vue'
import SeriesCourseDialog from './components/SeriesCourseDialog.vue'

interface CourseTypeItem {
  id: number | string
  name: string
}

interface CourseItem {
  id: number | string
  title: string
  subtitle?: string
  type: number | string
  type_name?: string
  type_subcat?: string
  video_url?: string
  thumb_img?: string
  small_img?: string
  small_type?: number | string
  color_value?: string
  course_introduce?: string
  is_free?: number | string
  is_new?: number | string
  user_scene?: number | string
  status?: number | string
  display_time?: string
  sequence?: number | string
  main_duration?: number | string
  pre_duration?: number | string
  sku_id?: string
}

interface CourseListResponse {
  list?: CourseItem[]
  data?: CourseItem[]
  total?: number | string
}

const loading = ref(false)
const tableData = ref<CourseItem[]>([])
const courseTypeOptions = ref<CourseTypeItem[]>([])
const courseTypeSelectOptions = ref<SelectOption[]>([])
const dialogRef = ref<InstanceType<typeof ClassContentDialog>>()
const seriesDialogRef = ref<InstanceType<typeof SeriesCourseDialog>>()
const copyLoadingId = ref<number | string | null>(null)
const viewLoadingId = ref<number | string | null>(null)

const queryForm = reactive({
  id: '',
  title: '',
  type: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

/** 构建列表查询参数 */
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  id: queryForm.id.trim(),
  key_words: queryForm.title.trim(),
  key_type: queryForm.type,
})

/** 解析列表数据，兼容多种返回格式 */
const resolveList = (data: CourseListResponse | CourseItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

/** 解析列表总数 */
const resolveTotal = (data: CourseListResponse | CourseItem[] | undefined, list: CourseItem[]) => {
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

/** 获取会员计划文本 */
const getSceneText = (value: number | string | undefined) =>
  Number(value) === 1 ? '不参与' : Number(value) === 2 ? '参与' : '-'

/** 获取状态文本 */
const getStatusText = (value: number | string | undefined) =>
  Number(value) === 1 ? '启用' : Number(value) === 2 ? '禁用' : '-'

/** 获取课程类型标签样式 */
const getTypeTagType = (type: number | string | undefined) => {
  const typeNumber = Number(type)

  if (typeNumber === 1) return 'primary'
  if (typeNumber === 2) return 'success'
  if (typeNumber === 3) return 'warning'
  if (typeNumber === 4) return 'danger'
  if (typeNumber === 5) return 'info'
  return 'primary'
}

/** 获取课程分类选项 */
const fetchTypeOptions = async () => {
  const response = await getCourseTypeList() as ApiResponseData<CourseTypeItem[] | { list?: CourseTypeItem[]; data?: CourseTypeItem[] }>
  const data = response.data

  if (Array.isArray(data)) {
    courseTypeOptions.value = data
  } else if (Array.isArray(data?.list)) {
    courseTypeOptions.value = data.list
  } else if (Array.isArray(data?.data)) {
    courseTypeOptions.value = data.data
  } else {
    courseTypeOptions.value = []
  }

  courseTypeSelectOptions.value = selectListData(courseTypeOptions.value)
}

/** 获取课程列表数据 */
const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getCourseList(getListParams()) as ApiResponseData<CourseListResponse | CourseItem[]>
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
const handleEdit = (row: CourseItem) => {
  dialogRef.value?.openEdit(row.id)
}

/** 复制课程，取详情回填后保存仍走添加接口 */
const handleCopy = async (row: CourseItem) => {
  copyLoadingId.value = row.id

  try {
    await dialogRef.value?.openCopy(row.id)
  } finally {
    copyLoadingId.value = null
  }
}

/** 查看系列课程，仅系列课可查看 */
const handleView = async (row: CourseItem) => {
  viewLoadingId.value = row.id

  try {
    await seriesDialogRef.value?.open(row.id, row.title)
  } finally {
    viewLoadingId.value = null
  }
}

onMounted(async () => {
  await fetchTypeOptions()
  fetchTableData()
})
</script>

<template>
  <div class="class-content-page">
    <el-card shadow="never" class="glass-card ">
      <el-form inline :model="queryForm">
        <el-form-item label="课程ID">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="请输入课程ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="名称">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="请输入课程名称"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="类型">
          <el-select-v2
            v-model="queryForm.type"
            :options="courseTypeSelectOptions"
            placeholder="请选择课程类型"
            clearable
            filterable
            @change="handleSearch"
            @clear="handleSearch"
            style="width: 200px;"
          />
        </el-form-item>

        <el-form-item class="filter-actions">
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-button :icon="Plus" plain type="primary" @click="handleAdd">添加课程</el-button>
      <el-table style="height: calc(100vh - 350px);" v-loading="loading" stripe border :data="tableData" class="m-t-10">
        <el-table-column prop="id" label="课程ID" width="90" fixed="left" />
        <el-table-column prop="title" label="课程名称" min-width="200" show-overflow-tooltip fixed="left" />
        <el-table-column prop="type_name" label="课程类型" min-width="120" show-overflow-tooltip />
        <el-table-column label="类型标记" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ row.type_name || row.type || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="封面图" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.thumb_img && row.thumb_img !== '0'"
              :src="row.thumb_img"
              :preview-src-list="getImageList(row.thumb_img)"
              :preview-teleported="true"
              fit="contain"
              class="thumb-image"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="白噪音色值" width="130">
          <template #default="{ row }">
            <span
              v-if="row.color_value"
              class="color-badge"
              :style="{ background: row.color_value }"
            >
              {{ row.color_value }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="是否免费" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.is_free) === 1 ? 'success' : Number(row.is_free) === 2 ? 'warning' : 'info'">
              {{ getFreeText(row.is_free) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否上新" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.is_new) === 1 ? 'success' : Number(row.is_new) === 2 ? 'info' : 'info'">
              {{ getNewText(row.is_new) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="会员计划" width="100">
          <template #default="{ row }">
            <span>{{ getSceneText(row.user_scene) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : Number(row.status) === 2 ? 'danger' : 'info'">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="display_time" label="上新结束时间" min-width="170" show-overflow-tooltip />
        <el-table-column prop="sequence" label="排序" width="90" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link :icon="Edit" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button
              link
              type="warning"
              :loading="copyLoadingId === row.id"
              @click="handleCopy(row)"
              :icon="CopyDocument"
            >
              复制
            </el-button>
            <el-button
              link
              type="success"
              :disabled="row.type_subcat !== 'subcat'"
              :loading="viewLoadingId === row.id"
              @click="handleView(row)"
              :icon="View"
            >
              查看
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
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </el-card>

    <ClassContentDialog
      ref="dialogRef"
      :course-type-options="courseTypeOptions"
      @success="fetchTableData"
    />

    <SeriesCourseDialog ref="seriesDialogRef" />
  </div>
</template>

<style scoped>
.class-content-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.thumb-image {
  width: 72px;
  height: 40px;
  border-radius: 8px;
}

.color-badge {
  display: inline-block;
  min-width: 72px;
  height: 28px;
  line-height: 28px;
  padding: 0 10px;
  color: #fff;
  text-align: center;
  border-radius: 8px;
}
</style>
