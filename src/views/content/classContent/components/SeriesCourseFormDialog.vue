<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import {
  addSeriesCourse,
  getSeriesCourseDetail,
  updateSeriesCourse,
} from '@/api/content'
import { getMediaDuration } from '@/utils/media'

interface SeriesCourseFormState {
  title: string
  audio_url: string
  main_duration: string
  thumb_img: string
  is_vip: 1 | 2
  display_time: string
  is_display: 1 | 2
  sequence: number
}

const emit = defineEmits<{
  success: [courseId: number | string]
}>()

const dialogVisible = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const currentId = ref<number | null>(null)
const courseId = ref<number | string>('')
const seriesTitle = ref('')
const formRef = ref<FormInstance>()

const form = reactive<SeriesCourseFormState>({
  title: '',
  audio_url: '',
  main_duration: '',
  thumb_img: '',
  is_vip: 1,
  display_time: '',
  is_display: 1,
  sequence: 0,
})

const rules: FormRules<SeriesCourseFormState> = {
  title: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  audio_url: [{ required: true, message: '请上传音视频地址', trigger: 'change' }],
  is_vip: [{ required: true, message: '请选择是否免费', trigger: 'change' }],
  display_time: [{ required: true, message: '请选择上线时间', trigger: 'change' }],
  is_display: [{ required: true, message: '请选择是否显示', trigger: 'change' }],
}

const resetForm = () => {
  currentId.value = null
  form.title = ''
  form.audio_url = ''
  form.main_duration = ''
  form.thumb_img = ''
  form.is_vip = 1
  form.display_time = ''
  form.is_display = 1
  form.sequence = 0
  formRef.value?.clearValidate()
}

const openCreate = (title: string, id: number | string) => {
  resetForm()
  seriesTitle.value = title
  courseId.value = id
  dialogVisible.value = true
}

const openEdit = async (id: number, title: string, currentCourseId: number | string) => {
  resetForm()
  currentId.value = id
  seriesTitle.value = title
  courseId.value = currentCourseId
  dialogVisible.value = true
  detailLoading.value = true

  try {
    const response = await getSeriesCourseDetail(id) as { data: Record<string, unknown> }
    Object.assign(form, response.data || {})
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const getSubmitData = () => {
  return {
    ...form,
    course_id: courseId.value,
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  submitLoading.value = true

  try {
    const data = getSubmitData()

    if (currentId.value) {
      await updateSeriesCourse(currentId.value, data)
      ElMessage.success('修改成功')
    } else {
      await addSeriesCourse(data)
      ElMessage.success('添加成功')
    }

    handleClose()
    emit('success', courseId.value)
  } finally {
    submitLoading.value = false
  }
}

// 上传音视频成功后自动回填时长
const handleMediaUploadSuccess = async (file: any) => {
  try {
    const source = file?.raw || file?.response?.data || file?.url

    if (!source) {
      return
    }

    form.main_duration = String(await getMediaDuration(source))
  } catch {
    ElMessage.warning('未能自动获取音视频时长，请手动填写')
  }
}

defineExpose({
  openCreate,
  openEdit,
})
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="currentId ? '编辑系列课程' : '添加系列课程'"
    width="70%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-width="auto"
      label-position="left"
    >
      <el-form-item label="系列课名称">
        <div class="series-title">{{ seriesTitle }}</div>
      </el-form-item>

      <el-form-item label="小课名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入名称" />
      </el-form-item>

      <el-form-item label="音视频地址" prop="audio_url">
        <uploadFile
          v-model="form.audio_url"
          @file-change="handleMediaUploadSuccess"
          @success="handleMediaUploadSuccess"
        />
      </el-form-item>

      <el-form-item label="音视频时长" prop="main_duration">
        <el-input v-model="form.main_duration" placeholder="请输入音视频时长" />
      </el-form-item>

      <el-form-item label="课程封面图">
        <uploadImage v-model="form.thumb_img" :fileSize="600" />
      </el-form-item>

      <el-form-item label="是否免费" prop="is_vip">
        <el-radio-group v-model="form.is_vip">
          <el-radio :value="1">免费</el-radio>
          <el-radio :value="2">付费</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="上线时间" prop="display_time">
        <el-date-picker
          v-model="form.display_time"
          type="datetime"
          placeholder="选择日期"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="是否显示" prop="is_display">
        <el-radio-group v-model="form.is_display">
          <el-radio :value="1">显示</el-radio>
          <el-radio :value="2">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sequence">
        <el-input-number :min="0" v-model="form.sequence" placeholder="请填写课程排序" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.series-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
}
</style>
