<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import uploadImage from '@/components/upload/uploadImage.vue'
import { addTemplate, editTemplate, getTemplateInfo } from '@/api/operation'

type DialogMode = 'create' | 'edit' | 'copy'

interface RetainForm {
  id?: number | string
  title: string
  remark: string
  type: 2
  close_img: string
  top_banner: string
  bottom_bg_color: string
  bottom_img: string
}

const emit = defineEmits<{ success: [] }>()

const visible = ref(false)
const mode = ref<DialogMode>('create')
const submitLoading = ref(false)
const detailLoading = ref(false)
const formRef = ref<FormInstance>()

const defaultForm = (): RetainForm => ({
  title: '',
  remark: '',
  type: 2,
  close_img: '',
  top_banner: '',
  bottom_bg_color: '',
  bottom_img: '',
})

const form = reactive<RetainForm>(defaultForm())

const dialogTitle = computed(() => {
  if (mode.value === 'edit') return '修改挽留模板'
  if (mode.value === 'copy') return '复制挽留模板'
  return '添加挽留模板'
})

const formRules = {
  title: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  top_banner: [{ required: true, message: '请上传顶部图片', trigger: 'change' }],
  bottom_bg_color: [{ required: true, message: '请输入底部背景色', trigger: 'blur' }],
}

const openCreate = () => {
  mode.value = 'create'
  Object.assign(form, defaultForm())
  visible.value = true
}

// 挽留模板详情改成组件内部调用，接口新增 type=2
const openEdit = async (id: number | string) => {
  mode.value = 'edit'
  visible.value = true
  detailLoading.value = true
  try {
    const response = await getTemplateInfo(id, { type: 2 })
    Object.assign(form, defaultForm(), response.data || {}, { type: 2 as const })
  } finally {
    detailLoading.value = false
  }
}

// 复制同样走详情接口，保存时仍然按新增处理
const openCopy = async (id: number | string) => {
  mode.value = 'copy'
  visible.value = true
  detailLoading.value = true
  try {
    const response = await getTemplateInfo(id, { type: 2 })
    Object.assign(form, defaultForm(), response.data || {}, { type: 2 as const })
    delete (form as any).id
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  Object.assign(form, defaultForm())
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  submitLoading.value = true
  try {
    const payload = { ...form, type: 2 }
    if (mode.value === 'edit' && form.id !== undefined) {
      await editTemplate(form.id, payload)
      ElMessage.success('修改成功')
    } else {
      const submitData = { ...payload }
      delete (submitData as any).id
      await addTemplate(submitData)
      ElMessage.success(mode.value === 'copy' ? '复制成功' : '添加成功')
    }
    visible.value = false
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

defineExpose({ openCreate, openEdit, openCopy })
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="formRules"
      label-width="auto"
      label-position="left"
    >
      <el-form-item label="模板名称" prop="title">
        <el-input v-model.trim="form.title" placeholder="请输入" clearable />
      </el-form-item>

      <el-form-item label="详情描述">
        <el-input v-model="form.remark" placeholder="请输入" clearable />
      </el-form-item>

      <el-form-item label="挽留关闭">
        <uploadImage v-model="form.close_img" size="small" />
      </el-form-item>

      <el-form-item label="顶部图片" prop="top_banner">
        <uploadImage v-model="form.top_banner" size="small" />
      </el-form-item>

      <el-form-item label="底部背景色" prop="bottom_bg_color">
        <el-color-picker v-model="form.bottom_bg_color" />
      </el-form-item>

      <el-form-item label="sku下文案图">
        <uploadImage v-model="form.bottom_img" size="small" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
