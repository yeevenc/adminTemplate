<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import {
  addSubscriptionAbTest,
  editSubscriptionAbTest,
  getSubscriptionAbTestInfo,
  getSubscriptionAbTestSenceKey,
  getSubscriptionAbTestVipList,
} from '@/api/operation'

type SubscriptionAbTestEnv = 'product' | 'mirror'

interface SelectOption {
  label: string
  value: number | string
}

interface VipOptionItem {
  id: number | string
  title?: string
  name?: string
}

interface SensorOptionItem {
  key?: number | string
  value?: string
  label?: string
}

interface SubscriptionAbTestVipResponse {
  vip?: VipOptionItem[]
  svip?: VipOptionItem[]
}

interface SubscriptionAbTestFormState {
  id?: number | string
  title: string
  env: SubscriptionAbTestEnv
  status: '1' | '2'
  vip_on_line_id: number | string | ''
  svip_on_line_id: number | string | ''
  vip_test_id: number | string | ''
  svip_test_id: number | string | ''
  sensor_key: number | string | ''
}

const emit = defineEmits<{ success: [] }>()

const ENV_OPTIONS: Array<{ label: string; value: SubscriptionAbTestEnv }> = [
  { label: '正式', value: 'product' },
  { label: '测试', value: 'mirror' },
]

const STATUS_OPTIONS = [
  { label: '上线', value: '1' },
  { label: '下线', value: '2' },
]

const dialogVisible = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const dialogMode = ref<'create' | 'edit'>('create')
const currentId = ref<number | string | null>(null)
const vipOptions = ref<SelectOption[]>([])
const svipOptions = ref<SelectOption[]>([])
const sensorOptions = ref<SelectOption[]>([])

const title = computed(() => (dialogMode.value === 'edit' ? '编辑配置' : '添加配置'))

const getDefaultForm = (): SubscriptionAbTestFormState => ({
  title: '',
  env: 'product',
  status: '1',
  vip_on_line_id: '',
  svip_on_line_id: '',
  vip_test_id: '',
  svip_test_id: '',
  sensor_key: '',
})

const form = reactive<SubscriptionAbTestFormState>(getDefaultForm())

const rules: FormRules<SubscriptionAbTestFormState> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  env: [{ required: true, message: '请选择环境', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

// 每次打开弹窗前先重置，避免上一次编辑数据污染新增场景
const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  dialogMode.value = 'create'
  formRef.value?.clearValidate()
}

// 详情回填时按表单字段逐项赋值，避免把无关接口字段带进表单
const fillForm = (data: Record<string, unknown>) => {
  form.title = String(data.title || '')
  form.env = (data.env as SubscriptionAbTestEnv) || 'product'
  form.status = String(data.status || '1') as '1' | '2'
  form.vip_on_line_id = (data.vip_on_line_id as number | string) ?? ''
  form.svip_on_line_id = (data.svip_on_line_id as number | string) ?? ''
  form.vip_test_id = (data.vip_test_id as number | string) ?? ''
  form.svip_test_id = (data.svip_test_id as number | string) ?? ''
  form.sensor_key = (data.sensor_key as number | string) ?? ''
}

// 点击添加/编辑时再获取会员方案，避免页面层重复预加载
const fetchVipOptions = async () => {
  const response = await getSubscriptionAbTestVipList()
  const data = (response.data || {}) as SubscriptionAbTestVipResponse

  vipOptions.value = (data.vip || []).map((item) => ({
    label: `${item.title || item.name || item.id}-${item.id}`,
    value: item.id,
  }))

  svipOptions.value = (data.svip || []).map((item) => ({
    label: `${item.title || item.name || item.id}-${item.id}`,
    value: item.id,
  }))
}

// 神策 key 改成单独接口获取，弹窗打开时一并初始化
const fetchSensorOptions = async () => {
  const response = await getSubscriptionAbTestSenceKey()
  const list = (response.data || []) as SensorOptionItem[]

  sensorOptions.value = Array.isArray(list)
    ? list.map((item) => ({
        label: item.value || item.label || String(item.key ?? ''),
        value: item.key ?? item.value ?? '',
      }))
    : []
}

const fetchFormOptions = async () => {
  await Promise.all([fetchVipOptions(), fetchSensorOptions()])
}

const openCreate = (env?: SubscriptionAbTestEnv) => {
  resetForm()
  dialogVisible.value = true
  detailLoading.value = true
  fetchFormOptions()
    .finally(() => {
      if (env) form.env = env
      detailLoading.value = false
    })
}

const openEdit = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'edit'
  currentId.value = id
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchFormOptions()
    const response = await getSubscriptionAbTestInfo(id)
    fillForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 提交时去掉 id，只保留接口真正需要的配置字段
const getSubmitPayload = () => {
  const { id, ...rest } = form
  void id
  return rest
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (dialogMode.value === 'edit' && currentId.value) {
      await editSubscriptionAbTest(currentId.value, getSubmitPayload())
      ElMessage.success('修改成功')
    } else {
      await addSubscriptionAbTest(getSubmitPayload())
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
    :title="title"
    width="620px"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" maxlength="50" show-word-limit />
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

      <el-divider content-position="left">线上组</el-divider>

      <el-form-item label="普通会员">
        <el-select-v2
          v-model="form.vip_on_line_id"
          :options="vipOptions"
          clearable
          filterable
          placeholder="请选择普通会员方案"
        />
      </el-form-item>

      <el-form-item label="超级会员">
        <el-select-v2
          v-model="form.svip_on_line_id"
          :options="svipOptions"
          clearable
          filterable
          placeholder="请选择超级会员方案"
        />
      </el-form-item>

      <el-divider content-position="left">实验组</el-divider>

      <el-form-item label="普通会员">
        <el-select-v2
          v-model="form.vip_test_id"
          :options="vipOptions"
          clearable
          filterable
          placeholder="请选择普通会员方案"
        />
      </el-form-item>

      <el-form-item label="超级会员">
        <el-select-v2
          v-model="form.svip_test_id"
          :options="svipOptions"
          clearable
          filterable
          placeholder="请选择超级会员方案"
        />
      </el-form-item>

      <el-form-item v-if="sensorOptions.length" label="神策Key">
        <el-radio-group v-model="form.sensor_key">
          <el-space wrap>
            <el-radio
              v-for="item in sensorOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-space>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
