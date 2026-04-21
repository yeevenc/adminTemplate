<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import {
  addMakeUpSku,
  editMakeUpSku,
  getMakeUpSkuInfo,
} from '@/api/operation'
import { CHANNEL_OPTIONS, type SelectOption,USER_GROUP_AGE_OPTIONS } from '@/utils/useConfig'

interface MakeUpSkuFormState {
  title: string
  env: 'produce' | 'mirror' | ''
  channel: string[]
  age: number[]
  status: 0 | 1 | ''
  position: 1 | 2 | ''
  day_price: number
  min_days: number
  max_days: number
  checked_img: string
  default_img: string
}

const emit = defineEmits<{
  success: []
}>()

const ENV_OPTIONS = [
  { label: '线上', value: 'produce' },
  { label: '测试', value: 'mirror' },
]

const STATUS_OPTIONS = [
  { label: '下线', value: 0 },
  { label: '上线', value: 1 },
]

const POSITION_OPTIONS = [
  { label: '普通会员', value: 1 },
  { label: '超级会员', value: 2 },
]

const AGE_OPTIONS: SelectOption[] = USER_GROUP_AGE_OPTIONS

const dialogVisible = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const currentId = ref<number | string | null>(null)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const formRef = ref<FormInstance>()

const form = reactive<MakeUpSkuFormState>({
  title: '',
  env: '',
  channel: [],
  age: [],
  status: '',
  position: '',
  day_price: 0,
  min_days: 0,
  max_days: 0,
  checked_img: '',
  default_img: '',
})

const rules: FormRules<MakeUpSkuFormState> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  env: [{ required: true, message: '请选择环境', trigger: 'change' }],
  channel: [{ required: true, message: '请选择平台', trigger: 'change', type: 'array', min: 1 }],
  age: [{ required: true, message: '请选择年龄段', trigger: 'change', type: 'array', min: 1 }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  position: [{ required: true, message: '请选择位置', trigger: 'change' }],
  day_price: [{ required: true, message: '请输入每日价格', trigger: 'blur' }],
  min_days: [{ required: true, message: '请输入最小天数', trigger: 'blur' }],
  max_days: [{ required: true, message: '请输入最大天数', trigger: 'blur' }],
}

const title = ref('添加')

const resetForm = () => {
  currentId.value = null
  dialogMode.value = 'create'
  form.title = ''
  form.env = ''
  form.channel = []
  form.age = []
  form.status = ''
  form.position = ''
  form.day_price = 0
  form.min_days = 0
  form.max_days = 0
  form.checked_img = ''
  form.default_img = ''
  formRef.value?.clearValidate()
}

const openCreate = () => {
  resetForm()
  title.value = '添加'
  dialogVisible.value = true
}

const openEdit = async (id: number | string) => {
  resetForm()
  currentId.value = id
  dialogMode.value = 'edit'
  title.value = '修改'
  dialogVisible.value = true
  detailLoading.value = true

  try {
    const response = await getMakeUpSkuInfo(id) as { data: Record<string, unknown> }
    Object.assign(form, response.data || {})
  } finally {
    detailLoading.value = false
  }
}

const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  title.value = '复制'
  dialogVisible.value = true
  detailLoading.value = true

  try {
    const response = await getMakeUpSkuInfo(id) as { data: Record<string, unknown> }
    Object.assign(form, response.data || {})
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const getSubmitPayload = () => ({
  ...form,
})

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true

  try {
    const payload = getSubmitPayload()

    if (dialogMode.value === 'edit' && currentId.value) {
      await editMakeUpSku(currentId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await addMakeUpSku(payload)
      ElMessage.success(dialogMode.value === 'copy' ? '复制成功' : '添加成功')
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
  openCopy,
})
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="title"
    width="70%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="环境" prop="env">
        <el-radio-group v-model="form.env">
          <el-radio
            v-for="item in ENV_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="平台" prop="channel">
        <el-checkbox-group v-model="form.channel">
          <el-checkbox
            v-for="item in CHANNEL_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="年龄" prop="age">
        <el-checkbox-group v-model="form.age">
          <el-checkbox
            v-for="item in AGE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio
            v-for="item in STATUS_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="位置" prop="position">
        <el-radio-group v-model="form.position">
          <el-radio
            v-for="item in POSITION_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="每日价格" prop="day_price">
        <el-input-number v-model="form.day_price" :min="0" :precision="2" placeholder="请输入每日价格" />
      </el-form-item>

      <el-form-item label="最小天数" prop="min_days">
        <el-input-number v-model="form.min_days" :min="0" placeholder="请输入最小天数" />
      </el-form-item>

      <el-form-item label="最大天数" prop="max_days">
        <el-input-number v-model="form.max_days" :min="0" placeholder="请输入最大天数" />
      </el-form-item>

      <el-form-item label="选中图">
        <uploadImage v-model="form.checked_img" />
      </el-form-item>

      <el-form-item label="未选中图">
        <uploadImage v-model="form.default_img" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
