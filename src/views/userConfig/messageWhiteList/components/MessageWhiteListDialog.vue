<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { addSmsWhiteList, getSmsWhiteListDetail, updateSmsWhiteList } from '@/api/userConfig'

interface MessageWhiteListDetailResponse {
  id: number
  mobile?: string
  title?: string
  status?: number
}

interface MessageWhiteListFormState {
  mobile: string
  title: string
  status: 0 | 1
}

const emit = defineEmits<{
  success: []
}>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<MessageWhiteListFormState>({
  mobile: '',
  title: '',
  status: 0,
})

const rules: FormRules<MessageWhiteListFormState> = {
  mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

function resetForm() {
  currentId.value = null
  form.mobile = ''
  form.title = ''
  form.status = 0
  formRef.value?.clearValidate()
}

function getSubmitParams() {
  return {
    mobile: form.mobile.trim(),
    title: form.title.trim(),
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

  const response = await getSmsWhiteListDetail(id) as { data: MessageWhiteListDetailResponse }
  const detail = response.data || {}

  form.mobile = detail.mobile || ''
  form.title = detail.title || ''
  form.status = detail.status === 1 ? 1 : 0
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
      await updateSmsWhiteList(currentId.value, params)
      ElMessage.success('修改成功')
    } else {
      await addSmsWhiteList(params)
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
    title="配置"
    width="40%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="form.mobile" maxlength="11" placeholder="请输入手机号" />
      </el-form-item>

      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>

      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="0">开启</el-radio>
          <el-radio :value="1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
