<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { getSkuList } from '@/api/config'
import {
  addSubscriptionConfig,
  editSubscriptionConfig,
  getSubscriptionConfigInfo,
  getTemplateList,
} from '@/api/operation'
import uploadImage from '@/components/upload/uploadImage.vue'
import { selectListData, type SelectOption } from '@/utils/useConfig'

interface TemplateItem {
  id: number | string
  title?: string
  name?: string
}

interface SubscriptionSkuItem {
  sku_id: number | string
  checked: boolean
  background_default: string
  background_checked: string
}

interface ReduceMemo {
  sku_id: number | string
  background_checked: string
  background_default: string
}

interface SubscriptionFormState {
  id?: number | string
  title: string
  remark: string
  template_id: number | string | ''
  sku_type: number
  sku_memo: SubscriptionSkuItem[]
  is_reduce: number
  reduce_pop_img: string
  reduce_sku_img: string
  reduce_memo: ReduceMemo
}

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const currentId = ref<number | string | null>(null)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const formRef = ref<FormInstance>()
const templateOptions = ref<SelectOption[]>([])
const skuOptions = ref<SelectOption[]>([])
const checkedSkuIndex = ref(0)

const title = computed(() => {
  if (dialogMode.value === 'edit') return '修改订阅页配置'
  if (dialogMode.value === 'copy') return '复制订阅页配置'
  return '添加订阅页配置'
})

const createEmptySku = (checked = false): SubscriptionSkuItem => ({
  sku_id: '',
  checked,
  background_default: '',
  background_checked: '',
})

const createEmptyReduceMemo = (): ReduceMemo => ({
  sku_id: '',
  background_checked: '',
  background_default: '',
})

const getDefaultForm = (): SubscriptionFormState => ({
  title: '',
  remark: '',
  template_id: '',
  sku_type: 1,
  sku_memo: [createEmptySku(true), createEmptySku()],
  is_reduce: 0,
  reduce_pop_img: '',
  reduce_sku_img: '',
  reduce_memo: createEmptyReduceMemo(),
})

const form = reactive<SubscriptionFormState>(getDefaultForm())

const validateSkuMemo = (_rule: unknown, value: SubscriptionSkuItem[], callback: (error?: Error) => void) => {
  if (!Array.isArray(value) || value.length === 0) {
    callback(new Error('请至少添加一个SKU配置'))
    return
  }
  const invalidItem = value.find(
    (item) => !item.sku_id || !item.background_default || !item.background_checked,
  )
  if (invalidItem) {
    callback(new Error('请完善每个SKU的产品和图片配置'))
    return
  }
  callback()
}

const rules: FormRules<SubscriptionFormState> = {
  title: [{ required: true, message: '请输入订阅页名称', trigger: 'blur' }],
  template_id: [{ required: true, message: '请选择模板', trigger: 'change' }],
  sku_type: [{ required: true, message: '请选择SKU样式', trigger: 'change' }],
  sku_memo: [{ validator: validateSkuMemo, trigger: 'change' }],
}

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  dialogMode.value = 'create'
  checkedSkuIndex.value = 0
  formRef.value?.clearValidate()
}

// 先获取模板和SKU配置数据，再获取详情
const fetchBaseOptions = async () => {
  const [templateRes, skuRes] = await Promise.all([
    getTemplateList({ page: 1, page_size: 99999, type: 1 }),
    getSkuList(),
  ])

  const templateData = templateRes.data as { list?: TemplateItem[]; data?: TemplateItem[] } | TemplateItem[]
  const templateList = Array.isArray(templateData)
    ? templateData
    : templateData?.list || templateData?.data || []

  templateOptions.value = templateList.map((item) => ({
    label: `${item.id}-${item.title || item.name || item.id}`,
    value: item.id,
  }))

  skuOptions.value = selectListData(skuRes.data)
}

const fillForm = (data: Record<string, unknown>) => {
  form.title = String(data.title || '')
  form.remark = String(data.remark || '')
  form.template_id = (data.template_id as number | string) ?? ''
  form.sku_type = Number(data.sku_type) || 1
  form.is_reduce = Number(data.is_reduce) || 0
  form.reduce_pop_img = String(data.reduce_pop_img || '')
  form.reduce_sku_img = String(data.reduce_sku_img || '')

  const reduceMemoRaw = (data.reduce_memo as ReduceMemo) || {}
  form.reduce_memo = {
    sku_id: reduceMemoRaw.sku_id || '',
    background_checked: reduceMemoRaw.background_checked || '',
    background_default: reduceMemoRaw.background_default || '',
  }

  const skuMemo = Array.isArray(data.sku_memo) ? (data.sku_memo as SubscriptionSkuItem[]) : []
  form.sku_memo = skuMemo.length
    ? skuMemo.map((item) => ({
        sku_id: item.sku_id || '',
        checked: Boolean(item.checked),
        background_default: item.background_default || '',
        background_checked: item.background_checked || '',
      }))
    : [createEmptySku(true), createEmptySku()]

  const checkedIndex = form.sku_memo.findIndex((item) => item.checked)
  checkedSkuIndex.value = checkedIndex >= 0 ? checkedIndex : 0
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

// 先拉配置数据，再拉详情回填
const openEdit = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'edit'
  currentId.value = id
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchBaseOptions()
    const response = await getSubscriptionConfigInfo(id)
    fillForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

// 复制使用详情接口回填，保存时走新增接口
const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchBaseOptions()
    const response = await getSubscriptionConfigInfo(id)
    fillForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleIsReduceChange = () => {
  form.reduce_pop_img = ''
  form.reduce_sku_img = ''
  form.reduce_memo = createEmptyReduceMemo()
}

const handleCheckedChange = (index: number) => {
  checkedSkuIndex.value = index
  form.sku_memo.forEach((item, itemIndex) => {
    item.checked = itemIndex === index
  })
}

const addSkuItem = () => {
  form.sku_memo.push(createEmptySku())
}

const removeSkuItem = (index: number) => {
  if (form.sku_memo.length <= 2) return
  form.sku_memo.splice(index, 1)

  if (checkedSkuIndex.value >= form.sku_memo.length) {
    checkedSkuIndex.value = form.sku_memo.length - 1
  }
  handleCheckedChange(checkedSkuIndex.value)
}

const getSubmitPayload = () => {
  form.sku_memo.forEach((item, index) => {
    item.checked = index === checkedSkuIndex.value
  })

  const { id, ...rest } = form
  void id

  if (rest.is_reduce === 0) {
    return { ...rest, reduce_pop_img: '', reduce_sku_img: '', reduce_memo: createEmptyReduceMemo() }
  }
  if (rest.is_reduce !== 1) {
    return { ...rest, reduce_pop_img: '' }
  }
  return rest
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = getSubmitPayload()

    if (dialogMode.value === 'edit' && currentId.value) {
      await editSubscriptionConfig(currentId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await addSubscriptionConfig(payload)
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
    width="72%"
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
      <el-form-item label="订阅页名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="详情描述" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="模板选择" prop="template_id">
        <el-select-v2
          v-model="form.template_id"
          :options="templateOptions"
          clearable
          filterable
          placeholder="请选择模板"
        />
      </el-form-item>

      <el-form-item label="SKU样式" prop="sku_type">
        <el-radio-group v-model="form.sku_type">
          <el-radio :value="1">上下排列</el-radio>
          <el-radio :value="2">左右排列</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="SKU配置" prop="sku_memo" />

      <el-card
        v-for="(item, index) in form.sku_memo"
        :key="index"
        class="m-b-10"
      >
        <template #header>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>{{ `SKU ${index + 1}` }}</span>
            <el-button
              v-if="form.sku_memo.length > 2"
              :icon="Delete"
              type="danger"
              @click="removeSkuItem(index)"
            >
              删除当前SKU
            </el-button>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品选择">
              <el-select-v2
                v-model="item.sku_id"
                :options="skuOptions"
                clearable
                filterable
                placeholder="请选择产品"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="默认选中">
              <el-radio
                :value="index"
                :model-value="checkedSkuIndex"
                @change="handleCheckedChange(index)"
              >
                选中
              </el-radio>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="未选中图">
              <uploadImage v-model="item.background_default" size="small" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="选中图">
              <uploadImage v-model="item.background_checked" size="small" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-button type="primary" plain class="m-b-10" @click="addSkuItem">添加SKU</el-button>

      <el-form-item label="OB降价" prop="is_reduce">
        <el-radio-group v-model="form.is_reduce" @change="handleIsReduceChange">
          <el-radio :value="0">不显示</el-radio>
          <el-radio :value="1">直接出现</el-radio>
          <el-radio :value="2">关闭/取消</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.is_reduce === 1">
        <el-form-item label="弹窗动画">
          <uploadImage v-model="form.reduce_pop_img" />
        </el-form-item>
      </template>

      <template v-if="form.is_reduce !== 0">
        <el-form-item label="SKU动画">
          <uploadImage v-model="form.reduce_sku_img" />
        </el-form-item>

        <el-form-item label="降价SKUID">
          <el-select-v2
            v-model="form.reduce_memo.sku_id"
            :options="skuOptions"
            clearable
            filterable
            placeholder="请选择产品"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="SKU未选中图">
              <uploadImage v-model="form.reduce_memo.background_default" size="small" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="SKU选中图">
              <uploadImage v-model="form.reduce_memo.background_checked" size="small" />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
