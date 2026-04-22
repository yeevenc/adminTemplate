<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { ApiResponseData } from '@/utils/request'
import {
  addObStrategyItem,
  editObStrategyItem,
  getObPageIdList,
  getObStrategyList,
} from '@/api/operation'
import {
  EXPERIMENT_OPTIONS,
  PAY_SWITCH_OPTIONS,
  SENSORS_KEY_OPTIONS,
} from './types'
import type {
  ObPageIdItem,
  ObStrategyDetail,
  ResourceEnv,
  SecondaryObItem,
} from './types'
import {selectListData, type SelectOption} from '@/utils/useConfig'
type DialogMode = 'create' | 'edit' | 'copy'

interface StrategyFormState {
  id?: number | string
  title: string
  remark: string
  experiment_status: 0 | 1 | ''
  sensors_key: number | string | ''
  line_rate: number | string | ''
  scene_id: number | string | ''
  ob_id: number | string | ''
  first_cancel_id: number | string | ''
  two_cancel_id: number | string | ''
  ali_pay_switch: 1 | 2 | ''
  test_scene_id: number | string | ''
  test_ob_id: number | string | ''
  test_first_cancel_id: number | string | ''
  test_two_cancel_id: number | string | ''
  test_ali_pay_switch: 1 | 2 | ''
}


interface OptionBundle {
  subscription: SelectOption[]
  retain: SelectOption[]
  secondaryOb: SelectOption[]
}

const emit = defineEmits<{
  created: [id: number | string]
  updated: []
}>()

const dialogVisible = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const dialogMode = ref<DialogMode>('create')

const formRef = ref<FormInstance>()

const env = ref<ResourceEnv>('produce')
// 二次 OB 随 env 变化，订阅页 / 挽留页选项与 env 无关；整体按 env 缓存一份即可命中大多数场景
const optionsCache = new Map<ResourceEnv, OptionBundle>()

const subscriptionOptions = ref<SelectOption[]>([])
const retainOptions = ref<SelectOption[]>([])
const secondaryObOptions = ref<SelectOption[]>([])

const title = computed(() => {
  if (dialogMode.value === 'edit') return '修改策略'
  if (dialogMode.value === 'copy') return '复制策略'
  return '添加策略'
})

const getDefaultForm = (): StrategyFormState => ({
  title: '',
  remark: '',
  experiment_status: '',
  sensors_key: '',
  line_rate: '',
  scene_id: '',
  ob_id: '',
  first_cancel_id: '',
  two_cancel_id: '',
  ali_pay_switch: '',
  test_scene_id: '',
  test_ob_id: '',
  test_first_cancel_id: '',
  test_two_cancel_id: '',
  test_ali_pay_switch: '',
})

const form = reactive<StrategyFormState>(getDefaultForm())

const isExperiment = computed(() => Number(form.experiment_status) === 1)

const validateLineRate = (_rule: unknown, value: unknown, callback: (err?: Error) => void) => {
  if (value === '' || value === null || value === undefined) {
    callback(new Error('请输入流量比例'))
    return
  }
  const num = Number(value)
  if (!Number.isInteger(num) || num < 0 || num > 100) {
    callback(new Error('请输入 0-100 的整数'))
    return
  }
  callback()
}

const rules: FormRules<StrategyFormState> = {
  title: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  experiment_status: [{ required: true, message: '请选择是否实验', trigger: 'change' }],
  line_rate: [{ required: true, validator: validateLineRate, trigger: 'blur' }],
  sensors_key: [{ required: true, message: '请选择神策key值', trigger: 'change' }],
  ob_id: [{ required: true, message: '请选择订阅页配置id', trigger: 'change' }],
  first_cancel_id: [{ required: true, message: '请选择挽留页配置id（第1次）', trigger: 'change' }],
  two_cancel_id: [{ required: true, message: '请选择挽留页配置id（第2次）', trigger: 'change' }],
  ali_pay_switch: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  test_ob_id: [{ required: true, message: '请选择实验组订阅页配置id', trigger: 'change' }],
  test_first_cancel_id: [
    { required: true, message: '请选择实验组挽留页配置id（第1次）', trigger: 'change' },
  ],
  test_two_cancel_id: [
    { required: true, message: '请选择实验组挽留页配置id（第2次）', trigger: 'change' },
  ],
}

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  dialogMode.value = 'create'
  formRef.value?.clearValidate()
}

const applyOptions = (bundle: OptionBundle) => {
  subscriptionOptions.value = bundle.subscription
  retainOptions.value = bundle.retain
  secondaryObOptions.value = bundle.secondaryOb
}

const loadOptions = async () => {
  const cached = optionsCache.get(env.value)
  if (cached) {
    applyOptions(cached)
    return
  }
  const [subRes, retainRes, secondaryRes] = await Promise.all([
    getObPageIdList({ type: 1 }) as Promise<ApiResponseData<{ list?: ObPageIdItem[] } | ObPageIdItem[]>>,
    getObPageIdList({ type: 2 }) as Promise<ApiResponseData<{ list?: ObPageIdItem[] } | ObPageIdItem[]>>,
    getObStrategyList({ page: 1, page_size: 1000, scene: 2, env: env.value }) as Promise<
      ApiResponseData<{ list?: SecondaryObItem[] }>
    >,
  ])

  const subList = Array.isArray(subRes.data) ? subRes.data : subRes.data?.list || []
  const retainList = Array.isArray(retainRes.data) ? retainRes.data : retainRes.data?.list || []
  const secondaryList = Array.isArray(secondaryRes.data?.list) ? secondaryRes.data.list : []

  const bundle: OptionBundle = {
    subscription: selectListData(subList),
    retain: selectListData(retainList),
    secondaryOb: selectListData(secondaryList)
  }
  optionsCache.set(env.value, bundle)
  applyOptions(bundle)
}

const fillForm = (row: ObStrategyDetail) => {
  form.title = String(row.title || '')
  form.remark = String(row.remark || '')
  form.experiment_status = (row.experiment_status as 0 | 1) ?? ''
  form.sensors_key = row.sensors_key ?? ''
  form.line_rate = row.line_rate ?? ''
  form.scene_id = row.scene_id ?? ''
  form.ob_id = row.ob_id ?? ''
  form.first_cancel_id = row.first_cancel_id ?? ''
  form.two_cancel_id = row.two_cancel_id ?? ''
  form.ali_pay_switch = (row.ali_pay_switch as 1 | 2) ?? ''
  form.test_scene_id = row.test_scene_id ?? ''
  form.test_ob_id = row.test_ob_id ?? ''
  form.test_first_cancel_id = row.test_first_cancel_id ?? ''
  form.test_two_cancel_id = row.test_two_cancel_id ?? ''
  form.test_ali_pay_switch = (row.test_ali_pay_switch as 1 | 2) ?? ''
}

const openDialog = async (
  mode: DialogMode,
  payload?: { row?: ObStrategyDetail; env?: ResourceEnv },
) => {
  resetForm()
  dialogMode.value = mode
  if (payload?.env) {
    env.value = payload.env
  }
  if (payload?.row) {
    fillForm(payload.row)
    if (mode === 'edit') {
      form.id = payload.row.id
    }
  }
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await loadOptions()
  } finally {
    detailLoading.value = false
  }
}

// 切换回"否"时清空实验组字段，避免脏数据提交
const handleExperimentChange = (value: number | string | boolean) => {
  if (Number(value) === 0) {
    form.sensors_key = ''
    form.test_scene_id = ''
    form.test_ob_id = ''
    form.test_first_cancel_id = ''
    form.test_two_cancel_id = ''
    form.test_ali_pay_switch = ''
  }
}

const buildPayload = (): Record<string, unknown> => {
  const basePayload: Record<string, unknown> = {
    title: form.title,
    remark: form.remark,
    experiment_status: form.experiment_status,
    line_rate: form.line_rate,
    scene_id: form.scene_id || '',
    ob_id: form.ob_id,
    first_cancel_id: form.first_cancel_id,
    two_cancel_id: form.two_cancel_id,
    ali_pay_switch: form.ali_pay_switch,
  }

  if (isExperiment.value) {
    return {
      ...basePayload,
      sensors_key: form.sensors_key,
      test_scene_id: form.test_scene_id || '',
      test_ob_id: form.test_ob_id,
      test_first_cancel_id: form.test_first_cancel_id,
      test_two_cancel_id: form.test_two_cancel_id,
      test_ali_pay_switch: form.test_ali_pay_switch,
    }
  }

  return {
    ...basePayload,
    sensors_key: '',
    experiment_address: '',
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = buildPayload()
    if (dialogMode.value === 'edit' && form.id) {
      await editObStrategyItem(form.id, payload)
      ElMessage.success('修改成功')
      emit('updated')
    } else {
      const res = (await addObStrategyItem(payload)) as ApiResponseData<{ id: number | string }>
      const newId = res.data?.id
      if (newId !== undefined) {
        emit('created', newId)
      }
      ElMessage.success(dialogMode.value === 'copy' ? '复制成功' : '添加成功')
    }
    dialogVisible.value = false
    resetForm()
  } finally {
    submitLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const openCreate = (parentEnv: ResourceEnv) => openDialog('create', { env: parentEnv })
const openEdit = (row: ObStrategyDetail, parentEnv: ResourceEnv) =>
  openDialog('edit', { row, env: parentEnv })
const openCopy = (row: ObStrategyDetail, parentEnv: ResourceEnv) =>
  openDialog('copy', { row, env: parentEnv })

defineExpose({ openCreate, openEdit, openCopy })
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="title"
    width="60%"
    top="6vh"
    append-to-body
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
      <el-form-item label="策略名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="详情描述">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="是否实验" prop="experiment_status">
        <el-radio-group v-model="form.experiment_status" @change="handleExperimentChange">
          <el-radio v-for="item in EXPERIMENT_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="isExperiment" label="神策key值" prop="sensors_key">
        <el-select-v2
          v-model="form.sensors_key"
          :options="SENSORS_KEY_OPTIONS"
          filterable
          placeholder="请选择神策key值"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="流量比例" prop="line_rate">
        <el-input v-model.number="form.line_rate" placeholder="请输入 0-100 整数" style="width: 200px" />
        <span class="unit">%</span>
      </el-form-item>

      <!-- 线上组配置：所有策略都需要 -->
      <el-divider content-position="left">线上组</el-divider>

      <el-form-item label="选择二次OB">
        <el-select-v2
          v-model="form.scene_id"
          :options="secondaryObOptions"
          clearable
          filterable
          placeholder="请选择二次OB"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="订阅页配置id" prop="ob_id">
        <el-select-v2
          v-model="form.ob_id"
          :options="subscriptionOptions"
          clearable
          filterable
          placeholder="请选择订阅页id"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="挽留页配置id(第1次)" prop="first_cancel_id">
        <el-select-v2
          v-model="form.first_cancel_id"
          :options="retainOptions"
          clearable
          filterable
          placeholder="请选择挽留页id"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="挽留页配置id(第2次)" prop="two_cancel_id">
        <el-select-v2
          v-model="form.two_cancel_id"
          :options="retainOptions"
          clearable
          filterable
          placeholder="请选择挽留页id"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="支付方式切换" prop="ali_pay_switch">
        <el-radio-group v-model="form.ali_pay_switch">
          <el-radio v-for="item in PAY_SWITCH_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 实验组配置：仅实验策略显示 -->
      <template v-if="isExperiment">
        <el-divider content-position="left">实验组</el-divider>

        <el-form-item label="选择二次OB">
          <el-select-v2
            v-model="form.test_scene_id"
            :options="secondaryObOptions"
            clearable
            filterable
            placeholder="请选择二次OB"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="订阅页配置id" prop="test_ob_id">
          <el-select-v2
            v-model="form.test_ob_id"
            :options="subscriptionOptions"
            clearable
            filterable
            placeholder="请选择订阅页id"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="挽留页配置id(第1次)" prop="test_first_cancel_id">
          <el-select-v2
            v-model="form.test_first_cancel_id"
            :options="retainOptions"
            clearable
            filterable
            placeholder="请选择挽留页id"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="挽留页配置id(第2次)" prop="test_two_cancel_id">
          <el-select-v2
            v-model="form.test_two_cancel_id"
            :options="retainOptions"
            clearable
            filterable
            placeholder="请选择挽留页id"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="支付方式切换">
          <el-radio-group v-model="form.test_ali_pay_switch">
            <el-radio v-for="item in PAY_SWITCH_OPTIONS" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.unit {
  margin-left: 6px;
  color: var(--el-text-color-regular);
}
</style>
