<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CopyDocument,
  Delete,
  Edit,
  Plus,
  Promotion,
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ApiResponseData } from '@/utils/request'
import {
  addObStrategyConfig,
  delObStrategyItem,
  editObStrategyConfig,
  getObStrategyInfoByIds,
  getObSubConfigInfo,
  getUserGroupList,
  releaseObStrategyTest,
} from '@/api/operation'
import {
  USER_GROUP_AGE_OPTIONS,
  USER_GROUP_CHANNEL_OPTIONS,
  CHANNEL_OPTIONS,
} from '@/utils/useConfig'
import { SENSORS_KEY_OPTIONS, parseStrategyMemo } from './types'
import type {
  ObStrategyItem,
  ObStrategyDetail,
  ResourceEnv,
  UserGroupItem,
} from './types'
import StrategyFormDialog from './StrategyFormDialog.vue'

type DialogMode = 'create' | 'edit' | 'copy'

interface ObFormState {
  title: string
  remark: string
  scene: 1 | 2
  env: ResourceEnv
  is_silent: string[]
  channel: string[]
  sensors_channel: number[]
  age: number[]
  status: 0 | 1 | ''
  group_id: number | string | ''
}

const USER_OPTIONS = [
  { label: '新增用户', value: '0' },
  { label: '沉默用户', value: '1' },
]
const USER_ALL_VALUES = USER_OPTIONS.map((item) => String(item.value))
const CHANNEL_ALL_VALUES = CHANNEL_OPTIONS.map((item) => String(item.value))
const SENSORS_CHANNEL_OPTIONS = USER_GROUP_CHANNEL_OPTIONS
const SENSORS_CHANNEL_ALL_VALUES = SENSORS_CHANNEL_OPTIONS.map((item) => Number(item.value))
const AGE_OPTIONS = USER_GROUP_AGE_OPTIONS
const AGE_ALL_VALUES = AGE_OPTIONS.map((item) => Number(item.value))

const SCENE_OPTIONS = [
  { label: '旧OB', value: 1 },
  { label: '二次OB', value: 2 },
]

const ENV_OPTIONS: Array<{ label: string; value: ResourceEnv }> = [
  { label: '正式', value: 'produce' },
  { label: '测试', value: 'mirror' },
]

const STATUS_OPTIONS = [
  { label: '下线', value: 0 },
  { label: '上线', value: 1 },
]

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const dialogMode = ref<DialogMode>('create')
const currentId = ref<number | string | null>(null)

const formRef = ref<FormInstance>()
const strategyIds = ref<Array<number | string>>([])
const strategyList = ref<ObStrategyDetail[]>([])
const strategyLoading = ref(false)
const userGroupOptions = ref<UserGroupItem[]>([])

const strategyDialogRef = ref<InstanceType<typeof StrategyFormDialog>>()

const releaseDialogVisible = ref(false)
const releaseLoading = ref(false)
const releaseTarget = ref<ObStrategyDetail | null>(null)
const releaseType = ref<1 | 2 | ''>('')

const title = computed(() => {
  if (dialogMode.value === 'edit') return '修改OB策略'
  if (dialogMode.value === 'copy') return '复制OB策略'
  return '添加OB策略'
})

const getDefaultForm = (): ObFormState => ({
  title: '',
  remark: '',
  scene: 1,
  env: 'produce',
  is_silent: [],
  channel: [],
  sensors_channel: [],
  age: [],
  status: '',
  group_id: '',
})

const form = reactive<ObFormState>(getDefaultForm())

const isSilentAll = computed({
  get: () => form.is_silent.length === USER_ALL_VALUES.length,
  set: (checked: boolean) => {
    form.is_silent = checked ? [...USER_ALL_VALUES] : []
  },
})
const isSilentIndeterminate = computed(
  () => form.is_silent.length > 0 && form.is_silent.length < USER_ALL_VALUES.length,
)

const channelAll = computed({
  get: () => form.channel.length === CHANNEL_ALL_VALUES.length,
  set: (checked: boolean) => {
    form.channel = checked ? [...CHANNEL_ALL_VALUES] : []
  },
})
const channelIndeterminate = computed(
  () => form.channel.length > 0 && form.channel.length < CHANNEL_ALL_VALUES.length,
)

const sensorsChannelAll = computed({
  get: () => form.sensors_channel.length === SENSORS_CHANNEL_ALL_VALUES.length,
  set: (checked: boolean) => {
    form.sensors_channel = checked ? [...SENSORS_CHANNEL_ALL_VALUES] : []
  },
})
const sensorsChannelIndeterminate = computed(
  () =>
    form.sensors_channel.length > 0 &&
    form.sensors_channel.length < SENSORS_CHANNEL_ALL_VALUES.length,
)

const ageAll = computed({
  get: () => form.age.length === AGE_ALL_VALUES.length,
  set: (checked: boolean) => {
    form.age = checked ? [...AGE_ALL_VALUES] : []
  },
})
const ageIndeterminate = computed(
  () => form.age.length > 0 && form.age.length < AGE_ALL_VALUES.length,
)

const shouldShowGroup = computed(
  () => form.is_silent.includes('1') || form.is_silent.length === USER_ALL_VALUES.length,
)

const rules: FormRules<ObFormState> = {
  title: [{ required: true, message: '请输入OB配置名称', trigger: 'blur' }],
  scene: [{ required: true, message: '请选择OB', trigger: 'change' }],
  env: [{ required: true, message: '请选择环境', trigger: 'change' }],
  is_silent: [{ required: true, type: 'array', min: 1, message: '请选择用户', trigger: 'change' }],
  channel: [{ required: true, type: 'array', min: 1, message: '请选择平台', trigger: 'change' }],
  sensors_channel: [
    { required: true, type: 'array', min: 1, message: '请选择渠道', trigger: 'change' },
  ],
  age: [{ required: true, type: 'array', min: 1, message: '请选择年龄段', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  dialogMode.value = 'create'
  strategyIds.value = []
  strategyList.value = []
  formRef.value?.clearValidate()
}

const fetchUserGroups = async () => {
  const res = (await getUserGroupList()) as ApiResponseData<{ list?: UserGroupItem[] }>
  const list = Array.isArray(res.data?.list) ? res.data.list : []
  userGroupOptions.value = list
}

const refreshStrategyList = async () => {
  if (!strategyIds.value.length) {
    strategyList.value = []
    return
  }
  strategyLoading.value = true
  try {
    const res = (await getObStrategyInfoByIds({ ids: strategyIds.value })) as ApiResponseData<
      ObStrategyDetail[]
    >
    strategyList.value = Array.isArray(res.data) ? res.data : []
  } finally {
    strategyLoading.value = false
  }
}

const fillForm = (data: Record<string, unknown>) => {
  form.title = String(data.title || '')
  form.remark = String(data.remark || '')
  form.scene = (data.scene as 1 | 2) || 1
  form.env = (data.env as ResourceEnv) || 'produce'
  form.status = (data.status as 0 | 1) ?? ''
  form.group_id = (data.group_id as number | string | '') ?? ''
  form.is_silent = Array.isArray(data.is_silent) ? (data.is_silent as string[]).map(String) : []
  form.channel = Array.isArray(data.channel)
    ? (data.channel as Array<number | string>).map(String)
    : typeof data.channel === 'string' && data.channel
      ? data.channel.split(',').map((item) => item.trim()).filter(Boolean)
      : []
  form.sensors_channel = Array.isArray(data.sensors_channel)
    ? (data.sensors_channel as Array<number | string>).map(Number)
    : []
  form.age = Array.isArray(data.age) ? (data.age as Array<number | string>).map(Number) : []

  strategyIds.value = parseStrategyMemo(data.strategy_memo)
}

const openCreate = async () => {
  resetForm()
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchUserGroups()
  } finally {
    detailLoading.value = false
  }
}

const openEdit = async (row: ObStrategyItem) => {
  resetForm()
  dialogMode.value = 'edit'
  currentId.value = row.id
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const [, infoRes] = await Promise.all([
      fetchUserGroups(),
      getObSubConfigInfo(row.id) as Promise<ApiResponseData<Record<string, unknown>>>,
    ])
    fillForm(infoRes.data || {})
    await refreshStrategyList()
  } finally {
    detailLoading.value = false
  }
}

const openCopy = async (row: ObStrategyItem) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const [, infoRes] = await Promise.all([
      fetchUserGroups(),
      getObSubConfigInfo(row.id) as Promise<ApiResponseData<Record<string, unknown>>>,
    ])
    fillForm(infoRes.data || {})
    await refreshStrategyList()
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleStrategyAdded = (id: number | string) => {
  if (!strategyIds.value.includes(id)) {
    strategyIds.value.push(id)
  }
  refreshStrategyList()
}

const handleStrategyUpdated = () => {
  refreshStrategyList()
}

const handleAddStrategy = () => {
  strategyDialogRef.value?.openCreate(form.env)
}

const handleEditStrategy = (row: ObStrategyDetail) => {
  strategyDialogRef.value?.openEdit(row, form.env)
}

const handleCopyStrategy = (row: ObStrategyDetail) => {
  strategyDialogRef.value?.openCopy(row, form.env)
}

const handleDeleteStrategy = async (row: ObStrategyDetail) => {
  try {
    await ElMessageBox.confirm(`确定删除策略【${row.title}】？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  await delObStrategyItem(row.id)
  strategyIds.value = strategyIds.value.filter((id) => id !== row.id)
  ElMessage.success('删除成功')
  await refreshStrategyList()
}

const openReleaseDialog = (row: ObStrategyDetail) => {
  releaseTarget.value = row
  releaseType.value = ''
  releaseDialogVisible.value = true
}

const submitReleaseTest = async () => {
  if (!releaseType.value || !releaseTarget.value) {
    ElMessage.error('请选择释放对象')
    return
  }
  const typeText = releaseType.value === 1 ? '实验组' : '线上组'
  try {
    await ElMessageBox.confirm(
      `释放${typeText}后立即生效，请再次确认`,
      '提示',
      { type: 'warning', confirmButtonText: '确定释放', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  releaseLoading.value = true
  try {
    await releaseObStrategyTest({
      releaseTestId: releaseTarget.value.id,
      releaseTestType: releaseType.value,
    })
    ElMessage.success(`释放${typeText}成功`)
    releaseDialogVisible.value = false
    await refreshStrategyList()
  } finally {
    releaseLoading.value = false
  }
}

const buildPayload = () => ({
  title: form.title,
  remark: form.remark,
  scene: form.scene,
  env: form.env,
  status: form.status,
  is_silent: form.is_silent,
  channel: form.channel,
  sensors_channel: form.sensors_channel,
  age: form.age,
  strategy_memo: strategyIds.value,
  group_id: shouldShowGroup.value ? form.group_id || 0 : 0,
})

const handleSubmit = async () => {
  if (!strategyIds.value.length) {
    ElMessage.warning('请先添加策略')
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = buildPayload()
    if (dialogMode.value === 'edit' && currentId.value) {
      await editObStrategyConfig(currentId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await addObStrategyConfig(payload)
      ElMessage.success(dialogMode.value === 'copy' ? '复制成功' : '添加成功')
    }
    dialogVisible.value = false
    resetForm()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

const getSensorsKeyText = (value: number | string | undefined) => {
  if (!value) return '—'
  return (
    SENSORS_KEY_OPTIONS.find((item) => Number(item.value) === Number(value))?.label || String(value)
  )
}

const getExperimentText = (value: number | string | undefined) => {
  return Number(value) === 1 || Number(value) === 2 ? '是' : '否'
}

const getAddressText = (value: number | string | undefined) => {
  if (Number(value) === 1) return '订阅页'
  if (Number(value) === 2) return '挽留页'
  return '—'
}

defineExpose({ openCreate, openEdit, openCopy })
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="title"
    width="82%"
    top="5vh"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="配置名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="选择OB" prop="scene">
        <el-radio-group v-model="form.scene">
          <el-radio v-for="item in SCENE_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="详情描述">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="环境" prop="env">
        <el-radio-group v-model="form.env">
          <el-radio v-for="item in ENV_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio v-for="item in STATUS_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="用户" prop="is_silent">
        <el-checkbox v-model="isSilentAll" :indeterminate="isSilentIndeterminate">
          全选
        </el-checkbox>
        <el-divider direction="vertical" />
        <el-checkbox-group v-model="form.is_silent">
          <el-checkbox v-for="item in USER_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="平台" prop="channel">
        <el-checkbox v-model="channelAll" :indeterminate="channelIndeterminate">全选</el-checkbox>
        <el-divider direction="vertical" />
        <el-checkbox-group v-model="form.channel">
          <el-checkbox v-for="item in CHANNEL_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="渠道" prop="sensors_channel">
        <el-checkbox v-model="sensorsChannelAll" :indeterminate="sensorsChannelIndeterminate">
          全选
        </el-checkbox>
        <el-divider direction="vertical" />
        <el-checkbox-group v-model="form.sensors_channel">
          <el-checkbox v-for="item in SENSORS_CHANNEL_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="年龄" prop="age">
        <el-checkbox v-model="ageAll" :indeterminate="ageIndeterminate">全选</el-checkbox>
        <el-divider direction="vertical" />
        <el-checkbox-group v-model="form.age">
          <el-checkbox v-for="item in AGE_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item v-if="shouldShowGroup" label="选择分群" prop="group_id">
        <el-select
          v-model="form.group_id"
          clearable
          filterable
          placeholder="请选择分群"
          style="width: 50%"
        >
          <el-option
            v-for="item in userGroupOptions"
            :key="item.id"
            :label="`${item.id}-${item.title}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <div class="strategy-section">
      <div class="strategy-header">
        <span class="strategy-title">策略列表</span>
        <el-button :icon="Plus" type="primary" @click="handleAddStrategy">添加策略</el-button>
      </div>

      <el-table
        v-loading="strategyLoading"
        :data="strategyList"
        stripe
        border
        class="m-t-10"
      >
        <el-table-column prop="id" label="策略ID" width="90" />
        <el-table-column prop="title" label="策略名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="remark" label="详细描述" min-width="140" show-overflow-tooltip />
        <el-table-column label="是否实验" width="90">
          <template #default="{ row }">
            <el-tag :type="getExperimentText(row.experiment_status) === '是' ? 'success' : 'info'">
              {{ getExperimentText(row.experiment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实验场景" width="100">
          <template #default="{ row }">
            {{ getAddressText(row.experiment_address) }}
          </template>
        </el-table-column>
        <el-table-column label="神策key" min-width="220">
          <template #default="{ row }">
            {{ getSensorsKeyText(row.sensors_key) }}
          </template>
        </el-table-column>

        <el-table-column label="订阅页配置id" min-width="160">
          <template #default="{ row }">
            <div class="id-line primary">线上：{{ row.ob_id || '—' }}</div>
            <div v-if="Number(row.experiment_status) === 1" class="id-line warning">
              实验：{{ row.test_ob_id || '—' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="挽留配置id(1)" min-width="160">
          <template #default="{ row }">
            <div class="id-line primary">线上：{{ row.first_cancel_id || '—' }}</div>
            <div v-if="Number(row.experiment_status) === 1" class="id-line warning">
              实验：{{ row.test_first_cancel_id || '—' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="挽留配置id(2)" min-width="160">
          <template #default="{ row }">
            <div class="id-line primary">线上：{{ row.two_cancel_id || '—' }}</div>
            <div v-if="Number(row.experiment_status) === 1" class="id-line warning">
              实验：{{ row.test_two_cancel_id || '—' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="line_rate" label="流量比例" width="90">
          <template #default="{ row }">{{ row.line_rate ? `${row.line_rate}%` : '—' }}</template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="175" />

        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEditStrategy(row)">修改</el-button>
            <el-button link type="warning" :icon="CopyDocument" @click="handleCopyStrategy(row)">复制</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDeleteStrategy(row)">删除</el-button>
            <el-button
              :disabled="!row.test_ob_id"
              link
              type="info"
              :icon="Promotion"
              @click="openReleaseDialog(row)"
            >
              释放实验
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>

    <el-dialog
      v-model="releaseDialogVisible"
      title="释放实验"
      width="420px"
      append-to-body
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="释放对象">
          <el-radio-group v-model="releaseType">
            <el-radio :value="1">实验组</el-radio>
            <el-radio :value="2">线上组</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="releaseDialogVisible = false">取消</el-button>
        <el-button :loading="releaseLoading" type="primary" @click="submitReleaseTest">确定</el-button>
      </template>
    </el-dialog>

    <StrategyFormDialog
      ref="strategyDialogRef"
      @created="handleStrategyAdded"
      @updated="handleStrategyUpdated"
    />
  </el-dialog>
</template>

<style scoped>
.strategy-section {
  margin-top: 10px;
}

.strategy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.strategy-title {
  font-size: 15px;
  font-weight: 600;
}

.id-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.id-line.primary {
  color: var(--el-color-primary);
}

.id-line.warning {
  color: var(--el-color-warning);
}
</style>
