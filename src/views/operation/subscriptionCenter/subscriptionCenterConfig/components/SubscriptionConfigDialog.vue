<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { computed, reactive, ref } from 'vue'
import { getSkuList } from '@/api/config'
import {
  getSubscriptionCenterInfo,
  addSubscriptionCenter,
  editSubscriptionCenter,
  getUserGroupList,
} from '@/api/operation'
import {
  CHANNEL_OPTIONS,
  USER_GROUP_AGE_OPTIONS,
  type SelectOption,
  selectListData,
} from '@/utils/useConfig'
import uploadImage from '@/components/upload/uploadImage.vue'

type ResourceEnv = 'produce' | 'mirror'

interface SkuMemoItem {
  sku_id: number | string
  sku?: string
  checked: boolean
  background_default: string
  background_checked: string
  sort: number | string
}

interface SubscriptionFormState {
  id?: number | string
  title: string
  env: ResourceEnv
  channel: string[]
  age: number[]
  status: 0 | 1
  position: number
  min_version: string
  max_version: string
  user_group_id: number | string
  sku_memo: SkuMemoItem[]
}

const ENV_OPTIONS: Array<{ label: string; value: ResourceEnv }> = [
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

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const currentId = ref<number | string | null>(null)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const userGroupOptions = ref<SelectOption[]>([])
const skuOptions = ref<SelectOption[]>([])
const checkedSkuIndex = ref(0)

const title = computed(() => {
  if (dialogMode.value === 'edit') return '修改订阅配置'
  if (dialogMode.value === 'copy') return '复制订阅配置'
  return '添加订阅配置'
})

const createEmptySku = (): SkuMemoItem => ({
  sku_id: '',
  checked: false,
  background_default: '',
  background_checked: '',
  sort: '',
})

const getDefaultForm = (): SubscriptionFormState => ({
  title: '',
  env: 'mirror',
  channel: [],
  age: [],
  status: 1,
  position: 1,
  min_version: '',
  max_version: '',
  user_group_id: '',
  sku_memo: [createEmptySku(), createEmptySku()],
})

const form = reactive<SubscriptionFormState>(getDefaultForm())

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  dialogMode.value = 'create'
  checkedSkuIndex.value = 0
}

const fetchBaseOptions = async () => {
  const [userGroupRes, skuRes] = await Promise.all([
    getUserGroupList(),
    getSkuList(),
  ])
  const groupList = (userGroupRes.data as { list?: Array<{ id: number | string; title: string }> })?.list
  userGroupOptions.value = Array.isArray(groupList)
    ? groupList.map((item) => ({ label: `${item.id}-${item.title}`, value: item.id }))
    : []
  skuOptions.value = selectListData(skuRes.data)
}

const fillForm = (data: Record<string, unknown>) => {
  Object.assign(form, data)
  form.channel = Array.isArray(data.channel)
    ? (data.channel as Array<number | string>).map(String)
    : typeof data.channel === 'string' && data.channel
      ? data.channel.split(',').map((item) => item.trim()).filter(Boolean)
      : []
  form.age = Array.isArray(data.age)
    ? (data.age as Array<number | string>).map(Number)
    : []
  if (!Array.isArray(form.sku_memo) || form.sku_memo.length === 0) {
    form.sku_memo = [createEmptySku(), createEmptySku()]
  }
  const idx = form.sku_memo.findIndex((item) => item.checked)
  checkedSkuIndex.value = idx >= 0 ? idx : 0
}

const openCreate = async () => {
  resetForm()
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchBaseOptions()
  } finally {
    detailLoading.value = false
  }
}

const openEdit = async (row: Record<string, unknown>) => {
  resetForm()
  dialogMode.value = 'edit'
  currentId.value = row.id as number | string
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchBaseOptions()
    const response = await getSubscriptionCenterInfo(row.id as number | string) as {
      data: Record<string, unknown>
    }
    fillForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

const openCopy = async (row: Record<string, unknown>) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchBaseOptions()
    const response = await getSubscriptionCenterInfo(row.id as number | string) as {
      data: Record<string, unknown>
    }
    fillForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleCheckedChange = (index: number) => {
  checkedSkuIndex.value = index
  form.sku_memo.forEach((item, i) => {
    item.checked = i === index
  })
}

const addSku = () => {
  form.sku_memo.push(createEmptySku())
}

const removeSku = (index: number) => {
  form.sku_memo.splice(index, 1)
  if (checkedSkuIndex.value >= form.sku_memo.length) {
    checkedSkuIndex.value = form.sku_memo.length - 1
  }
}

const handleSubmit = async () => {
  form.sku_memo.forEach((item, i) => {
    item.checked = i === checkedSkuIndex.value
  })

  submitLoading.value = true
  try {
    if (dialogMode.value === 'edit' && currentId.value) {
      await editSubscriptionCenter(currentId.value, form)
      ElMessage.success('修改成功')
    } else {
      await addSubscriptionCenter(form)
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
      v-loading="detailLoading"
      :model="form"
      label-width="auto"
      label-position="left"
    >
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="环境">
        <el-radio-group v-model="form.env">
          <el-radio v-for="item in ENV_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="平台">
        <el-checkbox-group v-model="form.channel">
          <el-checkbox
            v-for="item in CHANNEL_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="年龄">
        <el-checkbox-group v-model="form.age">
          <el-checkbox
            v-for="item in USER_GROUP_AGE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio v-for="item in STATUS_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="位置">
        <el-radio-group v-model="form.position">
          <el-radio v-for="item in POSITION_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="最小版本号">
        <el-input v-model="form.min_version" placeholder="请输入最小版本号" style="width: 200px" />
      </el-form-item>

      <el-form-item label="最大版本号">
        <el-input v-model="form.max_version" placeholder="请输入最大版本号" style="width: 200px" />
      </el-form-item>

      <el-form-item label="选择分群">
        <el-select-v2
          v-model="form.user_group_id"
          :options="userGroupOptions"
          filterable
          clearable
          placeholder="请选择分群"
          style="width: 50%"
        />
      </el-form-item>

      <el-form-item label="sku展示" />

      <el-radio-group v-model="checkedSkuIndex" @change="handleCheckedChange" style="width: 100%">
        <el-card
          v-for="(item, index) in form.sku_memo"
          :key="index"
          shadow="hover"
          class="sku-card"
        >
          <el-form-item label="skuId">
            <el-select-v2
              v-model="item.sku_id"
              :options="skuOptions"
              filterable
              clearable
              placeholder="选择产品"
              style="width: 60%"
            />
          </el-form-item>

          <el-form-item label="默认选中">
            <el-radio :value="index">选中</el-radio>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选中图">
                <uploadImage v-model="item.background_checked" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="未选中图">
                <uploadImage v-model="item.background_default" size="small" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="排序">
            <el-input v-model="item.sort" placeholder="请输入" style="width: 200px" />
          </el-form-item>

          <el-button
            v-if="form.sku_memo.length > 2"
            type="danger"
            link
            class="sku-card-delete"
            @click="removeSku(index)"
          >
            删除
          </el-button>
        </el-card>
      </el-radio-group>

      <el-button
        :icon="Plus"
        type="primary"
        plain
        class="m-t-10"
        style="display: block; margin-left: auto; margin-right: auto;"
        @click="addSku"
      >
        添加sku
      </el-button>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.sku-card {
  position: relative;
  margin-bottom: 16px;
}

.sku-card-delete {
  position: absolute;
  right: 16px;
  top: 16px;
}
</style>
