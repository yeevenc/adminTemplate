<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { addDailyMessage, getDailyMessageDetail, updateDailyMessage } from '@/api/content'

interface DailyMessageFormState {
  content: string
  author: string
  status: number
  sequence: number
}

const emit = defineEmits<{
  success: []
}>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const getDefaultForm = (): DailyMessageFormState => ({
  content: '',
  author: '',
  status: 1,
  sequence: 0,
})

const form = reactive<DailyMessageFormState>(getDefaultForm())

const rules: FormRules<DailyMessageFormState> = {
  content: [{ required: true, message: '请输入每日寄语', trigger: 'blur' }],
}

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  formRef.value?.clearValidate()
}

const openCreate = () => {
  resetForm()
  dialogVisible.value = true
}

const openEdit = async (id: number) => {
  resetForm()
  currentId.value = id
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const response = await getDailyMessageDetail(id) as { data: Record<string, unknown> }
    const detail = response.data || {}
    Object.assign(form, detail)
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const params = { ...form }
    if (currentId.value) {
      await updateDailyMessage(currentId.value, params)
      ElMessage.success('修改成功')
    } else {
      await addDailyMessage(params)
      ElMessage.success('添加成功')
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
    :title="currentId ? '修改寄语' : '添加寄语'"
    width="60%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      v-loading="detailLoading"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      label-position="left"
    >
      <el-form-item label="每日寄语" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          show-word-limit
          placeholder="请输入每日寄语"
        />
      </el-form-item>

      <el-form-item label="作者" prop="author">
        <el-input v-model="form.author" placeholder="请输入作者" />
      </el-form-item>

      <el-form-item label="寄语状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">展示</el-radio>
          <el-radio :value="2">不展示</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sequence">
        <el-input-number :min="0" v-model="form.sequence" placeholder="请输入排序值（数字）" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
