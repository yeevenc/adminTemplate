<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { addOneiromancy, getOneiromancyDetail, updateOneiromancy } from '@/api/content'
import UploadImage from '@/components/upload/uploadImage.vue'

interface OneiromancyFormState {
  title: string
  img: string
  moral: string
  directive: string
  url: string
  is_free: number
  is_new: number
  status: number
  sequence: number
  home_page_seq: number
}

const emit = defineEmits<{
  success: []
}>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()

/** 表单默认值 */
const getDefaultForm = (): OneiromancyFormState => ({
  title: '',
  img: '',
  moral: '',
  directive: '',
  url: '',
  is_free: 1,
  is_new: 1,
  status: 1,
  sequence: 0,
  home_page_seq: 0,
})

const form = reactive<OneiromancyFormState>(getDefaultForm())

/** 表单校验规则 */
const rules: FormRules<OneiromancyFormState> = {
  title: [{ required: true, message: '请输入主标题', trigger: 'blur' }],
  img: [{ required: true, message: '请上传封面图', trigger: 'change' }],
}

/** 重置表单 */
const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  formRef.value?.clearValidate()
}

/** 打开新增弹窗 */
const openCreate = () => {
  resetForm()
  dialogVisible.value = true
}

/** 打开编辑弹窗，调用详情接口回显数据 */
const openEdit = async (id: number) => {
  resetForm()
  currentId.value = id
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const response = await getOneiromancyDetail(id) as { data: Record<string, unknown> }
    const detail = response.data || {}
    Object.assign(form, detail)
  } finally {
    detailLoading.value = false
  }
}

/** 关闭弹窗 */
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

/** 提交表单 */
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const params = { ...form }
    if (currentId.value) {
      await updateOneiromancy(currentId.value, params)
      ElMessage.success('修改成功')
    } else {
      await addOneiromancy(params)
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
    :title="currentId ? '修改解梦' : '添加解梦'"
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
      <el-form-item label="主标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入主标题" />
      </el-form-item>

      <el-form-item label="封面图" prop="img">
        <UploadImage v-model="form.img" />
      </el-form-item>

      <el-form-item label="寓意" prop="moral">
        <el-input  show-word-limit     :rows="4"
    type="textarea" v-model="form.moral" placeholder="请输入寓意" />
      </el-form-item>

      <el-form-item label="指示" prop="directive">
        <el-input show-word-limit     :rows="4"
    type="textarea" v-model="form.directive" placeholder="请输入指示" />
      </el-form-item>

      <el-form-item label="文章链接" prop="url">
        <el-input v-model="form.url" placeholder="请输入文章链接" />
      </el-form-item>

      <el-form-item label="是否免费" prop="is_free">
        <el-radio-group v-model="form.is_free">
          <el-radio :value="1">免费</el-radio>
          <el-radio :value="2">付费</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="是否上新" prop="is_new">
        <el-radio-group v-model="form.is_new">
          <el-radio :value="1">上新</el-radio>
          <el-radio :value="2">不上新</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">正常</el-radio>
          <el-radio :value="2">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sequence">
        <el-input-number :min="0" v-model="form.sequence" placeholder="请输入排序值（数字）" />
      </el-form-item>

      <el-form-item label="首页展示排序" prop="home_page_seq">
        <el-input-number :min="0" v-model="form.home_page_seq" placeholder="请输入首页展示排序（数字）" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
