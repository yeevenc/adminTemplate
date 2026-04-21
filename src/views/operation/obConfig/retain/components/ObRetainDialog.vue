<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { getSkuList } from '@/api/config'
import {
  addObRetain,
  editObRetain,
  getObRetainInfo,
  getTemplateList,
} from '@/api/operation'
import uploadImage from '@/components/upload/uploadImage.vue'
import { selectListData, type SelectOption } from '@/utils/useConfig'

interface TemplateItem {
  id: number | string
  title?: string
  name?: string
}

interface ObRetainSkuItem {
  sku_id: number | string
  checked: boolean
  background_default: string
  background_checked: string
  sku?: string
}

interface ObRetainFormState {
  id?: number | string
  title: string
  remark: string
  template_id: number | string | ''
  sku_memo: ObRetainSkuItem[]
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
  if (dialogMode.value === 'edit') return '修改挽留配置'
  if (dialogMode.value === 'copy') return '复制挽留配置'
  return '添加挽留配置'
})

const createEmptySku = (): ObRetainSkuItem => ({
  sku_id: '',
  checked: false,
  background_default: '',
  background_checked: '',
})

const getDefaultForm = (): ObRetainFormState => ({
  title: '',
  remark: '',
  template_id: '',
  sku_memo: [createEmptySku()],
})

const form = reactive<ObRetainFormState>(getDefaultForm())

// SKU 使用动态数组配置，至少保留一项，并要求每项的基础字段完整
const validateSkuMemo = (_rule: unknown, value: ObRetainSkuItem[], callback: (error?: Error) => void) => {
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

const rules: FormRules<ObRetainFormState> = {
  title: [{ required: true, message: '请输入挽留页名称', trigger: 'blur' }],
  template_id: [{ required: true, message: '请选择模板', trigger: 'change' }],
  sku_memo: [{ validator: validateSkuMemo, trigger: 'change' }],
}

// 重置弹窗状态，避免新增/编辑/复制之间互相污染
const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  dialogMode.value = 'create'
  checkedSkuIndex.value = 0
  formRef.value?.clearValidate()
}

// 模板和 SKU 选项在点击新增/编辑时获取，不在页面层提前初始化
const fetchBaseOptions = async () => {
  const [templateRes, skuRes] = await Promise.all([
    getTemplateList({ page: 1, page_size: 99999,type:2}),
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

// 详情回填时兼容后端返回的 checked 状态和 SKU 结构
const fillForm = (data: Record<string, unknown>) => {
  form.title = String(data.title || '')
  form.remark = String(data.remark || '')
  form.template_id = (data.template_id as number | string) ?? ''

  const skuMemo = Array.isArray(data.sku_memo) ? (data.sku_memo as ObRetainSkuItem[]) : []
  form.sku_memo = skuMemo.length
    ? skuMemo.map((item) => ({
        sku_id: item.sku_id || '',
        checked: Boolean(item.checked),
        background_default: item.background_default || '',
        background_checked: item.background_checked || '',
        sku: item.sku,
      }))
    : [createEmptySku()]

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

// 编辑时先拉模板和 SKU 相关配置，再拉详情做回填
const openEdit = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'edit'
  currentId.value = id
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchBaseOptions()
    const response = await getObRetainInfo(id)
    fillForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

// 复制沿用详情接口，但保存时仍然走新增接口
const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  detailLoading.value = true
  try {
    await fetchBaseOptions()
    const response = await getObRetainInfo(id)
    fillForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 默认选中项改成单选控制，提交前再统一回写到 sku_memo.checked
const handleCheckedChange = (index: number) => {
  checkedSkuIndex.value = index
  form.sku_memo.forEach((item, itemIndex) => {
    item.checked = itemIndex === index
  })
}

// SKU 配置去掉固定个数限制，改成按需动态添加
const addSkuItem = () => {
  form.sku_memo.push(createEmptySku())
}

const removeSkuItem = (index: number) => {
  if (form.sku_memo.length <= 1) return
  form.sku_memo.splice(index, 1)

  if (checkedSkuIndex.value >= form.sku_memo.length) {
    checkedSkuIndex.value = form.sku_memo.length - 1
  }

  handleCheckedChange(checkedSkuIndex.value)
}

// 提交前统一把默认选中项同步回数组，避免页面状态和接口数据不一致
const getSubmitPayload = () => {
  form.sku_memo.forEach((item, index) => {
    item.checked = index === checkedSkuIndex.value
  })

  const { id, ...rest } = form
  void id
  return rest
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = getSubmitPayload()

    if (dialogMode.value === 'edit' && currentId.value) {
      await editObRetain(currentId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await addObRetain(payload)
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
      <el-form-item label="挽留页名称" prop="title">
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
              v-if="form.sku_memo.length > 1"
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

      <el-button type="primary" plain @click="addSkuItem">添加SKU</el-button>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
