<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { addXiaohongshuConfig, editXiaohongshuConfig, getXiaohongshuInfo } from '@/api/activity'

interface XiaohongshuDetailResponse {
  id: number
  title?: string
  remark?: string
  topic?: string
  cover_url?: string
  subplot_url?: string | string[]
  status?: number
}

interface XiaohongshuFormState {
  title: string
  remark: string
  topic: string
  cover_url: string
  subplot_url: string[]
  status: 0 | 1
}

const emit = defineEmits<{
  success: []
}>()

const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const submitLoading = ref(false)
const currentId = ref<number | null>(null)

const form = reactive<XiaohongshuFormState>({
  title: '',
  remark: '',
  topic: '',
  cover_url: '',
  subplot_url: [],
  status: 1,
})

const rules: FormRules<XiaohongshuFormState> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  topic: [{ required: true, message: '请输入话题', trigger: 'blur' }],
  cover_url: [{ required: true, message: '请上传封面图', trigger: 'change' }],
  subplot_url: [{ required: true, message: '请上传幅图', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function normalizeImageList(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function resetForm() {
  currentId.value = null
  form.title = ''
  form.remark = ''
  form.topic = ''
  form.cover_url = ''
  form.subplot_url = []
  form.status = 1
  formRef.value?.clearValidate()
}

function getSubmitParams() {
  return {
    title: form.title.trim(),
    remark: form.remark.trim(),
    topic: form.topic.trim(),
    cover_url: form.cover_url,
    subplot_url: form.subplot_url,
    status: form.status,
  }
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

async function openEdit(id: number) {
  resetForm()
  currentId.value = id

  const response = await getXiaohongshuInfo(id) as { data: XiaohongshuDetailResponse }
  const detail = response.data || {}

  form.title = detail.title || ''
  form.remark = detail.remark || ''
  form.topic = detail.topic || ''
  form.cover_url = detail.cover_url || ''
  form.subplot_url = normalizeImageList(detail.subplot_url)
  form.status = detail.status === 0 ? 0 : 1
  dialogVisible.value = true
}

function handleClose() {
  dialogVisible.value = false
  resetForm()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  submitLoading.value = true

  try {
    const params = getSubmitParams()

    if (currentId.value) {
      await editXiaohongshuConfig(currentId.value, params)
      ElMessage.success('修改成功')
    } else {
      await addXiaohongshuConfig(params)
      ElMessage.success('新增成功')
    }

    handleClose()
    emit('success')
  } finally {
    submitLoading.value = false
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
    :title="currentId ? '编辑配置' : '新增配置'"
    width="56%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="left" label-width="auto">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" maxlength="15" show-word-limit placeholder="请输入标题" />
      </el-form-item>

      <el-form-item label="内容" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          placeholder="请输入内容"
        />
      </el-form-item>

      <el-form-item label="话题" prop="topic">
        <el-input v-model="form.topic" placeholder="请输入话题" />
      </el-form-item>

      <el-form-item label="封面图" prop="cover_url">
        <uploadImage
          v-model="form.cover_url"
          :limit="1"
          :file-size="600"
        />
      </el-form-item>

      <el-form-item label="幅图" prop="subplot_url">
        <uploadImage
          v-model="form.subplot_url"
          multiple
          :limit="5"
          :file-size="400"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">上线</el-radio>
          <el-radio :value="0">下线</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
