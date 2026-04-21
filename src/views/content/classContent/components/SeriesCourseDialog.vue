<script setup lang="ts">
import { ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getSeriesCourseList } from '@/api/content'
import { Plus } from '@element-plus/icons-vue'
import SeriesCourseFormDialog from './SeriesCourseFormDialog.vue'

interface SeriesCourseItem {
  id: number | string
  title: string
  audio_url: string
  is_vip: number | string
  sequence: number | string
  created_at: string
}

interface SeriesCourseListResponse {
  list?: SeriesCourseItem[]
  data?: SeriesCourseItem[]
}

const dialogVisible = ref(false)
const loading = ref(false)
const tableData = ref<SeriesCourseItem[]>([])
const seriesTitle = ref('')
const course_id = ref<number | string>('')
const formDialogRef = ref<InstanceType<typeof SeriesCourseFormDialog>>()

const resolveList = (data: SeriesCourseListResponse | SeriesCourseItem[] | undefined) => {
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

const getVipText = (value: number | string) => {
  return Number(value) === 1 ? '免费' : Number(value) === 2 ? '付费' : '-'
}

const open = async (courseId: number | string, title: string) => {
  dialogVisible.value = true
  seriesTitle.value = title
  course_id.value = courseId
  loading.value = true

  try {
    const response = await getSeriesCourseList({
      course_id: courseId,
    }) as ApiResponseData<SeriesCourseListResponse | SeriesCourseItem[]>

    tableData.value = resolveList(response.data)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  tableData.value = []
  seriesTitle.value = ''
  course_id.value = ''
}

const handleAdd = () => {
  formDialogRef.value?.openCreate(seriesTitle.value, course_id.value)
}

const handleEdit = (row: SeriesCourseItem) => {
  formDialogRef.value?.openEdit(Number(row.id), seriesTitle.value, course_id.value)
}

const handleRefresh = async (currentCourseId: number | string) => {
  await open(currentCourseId, seriesTitle.value)
}

defineExpose({
  open,
})
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="`${seriesTitle}系列课程`"
    width="80%"
    destroy-on-close
    @close="handleClose"
  >
    <el-button
      :icon="Plus"
      type="primary"
      class="m-b-10"
      @click="handleAdd"
    >
      添加课程
    </el-button>

    <el-table
      v-loading="loading"
      border
      stripe
      :data="tableData"
      style="width: 100%;"
    >
      <el-table-column prop="id" label="课程ID" width="90" />
      <el-table-column prop="title" label="课程名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="audio_url" label="音频" min-width="320">
        <template #default="{ row }">
          <audio
            v-if="row.audio_url"
            controls
            controlslist="nodownload noplaybackrate"
            class="audio-player"
          >
            <source :src="row.audio_url" />
          </audio>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="是否免费" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="Number(row.is_vip) === 1 ? 'success' : 'warning'">
            {{ getVipText(row.is_vip) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sequence" label="排序" width="90" />
      <el-table-column prop="created_at" label="添加时间" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <SeriesCourseFormDialog ref="formDialogRef" @success="handleRefresh" />
  </el-dialog>
</template>

<style scoped>
.audio-player {
  width: 280px;
  height: 34px;
}
</style>
