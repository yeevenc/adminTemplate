<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { addAbTest, editAbTest, getAbTestInfo } from '@/api/operation'
import type { SelectOption } from '@/utils/useConfig'

type AbTestEnv = 'produce' | 'mirror'

interface AbTestFormState {
  id?: number | string
  env: AbTestEnv | ''
  title: string
  on_line_id: (number | string)[]
  test_id: (number | string)[]
  on_line_bottom_id: (number | string)[]
  test_bottom_id: (number | string)[]
  alert_type: number | ''
  status: number | ''
  rate: number
  sensor_key: number | string | ''
}

// 弹窗里的环境切换（和列表筛选区分开，label 更简短）
const ENV_FORM_OPTIONS: Array<{ label: string; value: AbTestEnv }> = [
  { label: '测试', value: 'mirror' },
  { label: '线上', value: 'produce' },
]

const AD_TYPE_OPTIONS: SelectOption[] = [
  { label: '全屏', value: 1 },
  { label: '底部条', value: 2 },
]

const STATUS_OPTIONS: SelectOption[] = [
  { label: '进行', value: 1 },
  { label: '下架', value: 2 },
]

const props = defineProps<{
  sensorOptions: SelectOption[]
  experimentOptions: SelectOption[]
}>()

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const formRef = ref<FormInstance>()

const title = computed(() => {
  if (dialogMode.value === 'edit') return '修改'
  if (dialogMode.value === 'copy') return '复制'
  return '添加'
})

const getDefaultForm = (): AbTestFormState => ({
  env: '',
  title: '',
  on_line_id: [],
  test_id: [],
  on_line_bottom_id: [],
  test_bottom_id: [],
  alert_type: '',
  status: '',
  rate: 0,
  sensor_key: '',
})

const form = reactive<AbTestFormState>(getDefaultForm())

const rules: FormRules<AbTestFormState> = {
  env: [{ required: true, message: '请选择生效环境', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  on_line_id: [{ required: true, message: '请选择线上ID', trigger: 'change' }],
  test_id: [{ required: true, message: '请选择实验ID', trigger: 'change' }],
  alert_type: [{ required: true, message: '请选择广告类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择实验状态', trigger: 'change' }],
}

// 后端可能返回 string / number / array，统一归一成数组，避免 select-v2 类型告警
const toArray = (value: unknown): (number | string)[] => {
  if (Array.isArray(value)) return value
  if (value === undefined || value === null || value === '') return []
  return [value as number | string]
}

// 每次打开弹窗前重置表单，避免新增/编辑/复制之间相互污染
const resetForm = () => {
  Object.assign(form, getDefaultForm())
  formRef.value?.clearValidate()
}

// 详情回填时按表单字段逐个覆盖，避免把无关接口字段带进响应式对象
const fillForm = (row: Record<string, unknown>) => {
  form.env = (row.env as AbTestEnv) ?? ''
  form.title = (row.title as string) ?? ''
  form.on_line_id = toArray(row.on_line_id)
  form.test_id = toArray(row.test_id)
  form.on_line_bottom_id = toArray(row.on_line_bottom_id)
  form.test_bottom_id = toArray(row.test_bottom_id)
  form.alert_type = (row.alert_type as number) ?? ''
  form.status = (row.status as number) ?? ''
  form.rate = Number(row.rate) || 0
  form.sensor_key = (row.sensor_key as number | string) ?? ''
}

// 新增场景支持带入当前筛选的环境，减少手动选择
const openCreate = (env?: AbTestEnv) => {
  resetForm()
  dialogMode.value = 'create'
  dialogVisible.value = true
  if (env) form.env = env
}

// 详情单独抽取，编辑和复制场景共用
const fetchDetail = async (id: number | string) => {
  const response = await getAbTestInfo(id)
  return (response.data || {}) as Record<string, unknown>
}

// 编辑时保留 id，保存走修改接口
const openEdit = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'edit'
  dialogVisible.value = true
  const detail = await fetchDetail(id)
  form.id = id
  fillForm(detail)
}

// 复制沿用详情回填，但不保留 id，保存走新增接口
const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  const detail = await fetchDetail(id)
  fillForm(detail)
}

// 关闭弹窗时同步重置
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 广告类型非全屏（1）时，清空底部条字段避免误提交
const handleAlertTypeChange = (value: number | '') => {
  if (value !== 1) {
    form.on_line_bottom_id = []
    form.test_bottom_id = []
  }
}

// 提交前去掉 id，只保留后端真正需要的配置字段
const getSubmitPayload = () => {
  const { id, ...rest } = form
  void id
  return rest
}

// 编辑场景走修改接口，其余场景统一走新增接口
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (dialogMode.value === 'edit' && form.id) {
      await editAbTest(form.id, getSubmitPayload())
      ElMessage.success('修改成功')
    } else {
      await addAbTest(getSubmitPayload())
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
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" label-position="left">
      <el-form-item label="生效环境" prop="env">
        <el-radio-group v-model="form.env">
          <el-radio
            v-for="item in ENV_FORM_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" style="width: 60%" />
      </el-form-item>

      <el-form-item label="线上ID" prop="on_line_id">
        <el-select-v2
          v-model="form.on_line_id"
          :options="props.experimentOptions"
          placeholder="请选择线上ID"
          filterable
          clearable
          multiple
          :multiple-limit="3"
          style="width: 60%"
        />
      </el-form-item>

      <el-form-item label="实验ID" prop="test_id">
        <el-select-v2
          v-model="form.test_id"
          :options="props.experimentOptions"
          placeholder="请选择实验ID"
          filterable
          clearable
          multiple
          :multiple-limit="3"
          style="width: 60%"
        />
      </el-form-item>

      <el-form-item label="广告类型" prop="alert_type">
        <el-select
          v-model="form.alert_type"
          placeholder="请选择广告类型"
          clearable
          style="width: 60%"
          @change="handleAlertTypeChange"
        >
          <el-option
            v-for="item in AD_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 广告类型为全屏时才需要补充底部条的线上/实验ID -->
      <el-form-item v-if="form.alert_type === 1" label="底部条线上ID">
        <el-select-v2
          v-model="form.on_line_bottom_id"
          :options="props.experimentOptions"
          placeholder="请选择底部条线上ID"
          filterable
          clearable
          multiple
          :multiple-limit="3"
          style="width: 60%"
        />
      </el-form-item>

      <el-form-item v-if="form.alert_type === 1" label="底部条实验ID">
        <el-select-v2
          v-model="form.test_bottom_id"
          :options="props.experimentOptions"
          placeholder="请选择底部条实验ID"
          filterable
          clearable
          multiple
          :multiple-limit="3"
          style="width: 60%"
        />
      </el-form-item>

      <el-form-item label="实验状态" prop="status">
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

      <el-form-item label="实验比例" prop="rate">
        <el-slider v-model="form.rate" show-input style="width: 60%" />
      </el-form-item>

      <el-form-item label="神策上报" prop="sensor_key">
        <el-radio-group v-model="form.sensor_key">
          <el-space wrap>
          <el-radio
            v-for="item in props.sensorOptions"
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
