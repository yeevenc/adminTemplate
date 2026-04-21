<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { addCode, getCodeInfo } from '@/api/operation'

interface CdKeyCategoryOption {
  id: number | string
  title: string
}

interface CdKeyFormState {
  id?: number | string
  title: string
  config_id: number | string | ''
  number: number
  start_date: string
  end_date: string
}

type CodeType = 1 | 2

interface CdKeyDetailResponse {
  id?: number | string
  title?: string
  config_id?: number | string
  number?: number | string
  start_date?: string
  end_date?: string
}

const props = defineProps<{
  categoryOptions: CdKeyCategoryOption[]
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const dialogMode = ref<'create' | 'edit'>('create')
const dialogVisible = ref(false)
const submitLoading = ref(false)
const codeType = ref<CodeType>(1)
const codeTime = ref<[string, string] | []>([])
const formRef = ref<FormInstance>()

const form = reactive<CdKeyFormState>({
  id: undefined,
  title: '',
  config_id: '',
  number: 1,
  start_date: '',
  end_date: '',
})

const title = computed(() => (dialogMode.value === 'edit' ? '编辑兑换码' : '添加兑换码'))

const rules = computed<FormRules<CdKeyFormState>>(() => ({
  title: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  config_id: [{ required: true, message: '请选择兑换码名称', trigger: 'change' }],
  number: [{ required: true, message: '请输入兑换码数量', trigger: 'blur' }],
}))

const resetForm = () => {
  form.id = undefined
  form.title = ''
  form.config_id = ''
  form.number = 1
  form.start_date = ''
  form.end_date = ''
  codeType.value = 1
  codeTime.value = []
  formRef.value?.clearValidate()
}

// 单个 / 多个切换，重置数量默认值
const handleCodeTypeChange = (val: CodeType) => {
  form.number = val === 1 ? 1 : 2
}

const openCreate = () => {
  resetForm()
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 编辑场景预留，接口完善后可直接复用
const openEdit = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'edit'
  dialogVisible.value = true

  const response = await getCodeInfo(id)
  const detail = (response.data || {}) as CdKeyDetailResponse

  form.id = detail.id ?? id
  form.title = detail.title ?? ''
  form.config_id = detail.config_id ?? ''
  form.number = Number(detail.number) || 1
  form.start_date = detail.start_date ?? ''
  form.end_date = detail.end_date ?? ''
  codeType.value = Number(detail.number) > 1 ? 2 : 1
  codeTime.value = detail.start_date && detail.end_date ? [detail.start_date, detail.end_date] : []
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const getSubmitPayload = () => {
  const { id, ...rest } = form
  void id
  return rest
}

const handleSubmit = async () => {
  if (!codeTime.value || codeTime.value.length !== 2) {
    ElMessage.warning('请选择兑换时间')
    return
  }

  form.start_date = codeTime.value[0]
  form.end_date = codeTime.value[1]

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await addCode(getSubmitPayload())
    ElMessage.success('添加成功')
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
    :title="title"
    width="60%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      label-position="left"
    >
      <el-form-item label="名称" prop="title">
        <el-input v-model="form.title" maxlength="20" placeholder="请输入名称" />
      </el-form-item>

      <el-form-item label="兑换码名称" prop="config_id">
        <el-select v-model="form.config_id" placeholder="请选择兑换码分类" clearable style="width: 100%;">
          <el-option
            v-for="item in props.categoryOptions"
            :key="item.id"
            :label="item.title"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="兑换码数量">
        <el-radio-group v-model="codeType" @change="handleCodeTypeChange">
          <el-radio :value="1">单个</el-radio>
          <el-radio :value="2">多个</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="codeType === 2" label="兑换码数量" prop="number">
        <el-input-number v-model="form.number" :min="1" placeholder="请输入兑换码数量" />
      </el-form-item>

      <el-form-item label="兑换时间" required>
        <el-date-picker
          v-model="codeTime"
          type="daterange"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
