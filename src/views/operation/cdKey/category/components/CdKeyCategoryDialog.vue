<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { getSkuList } from '@/api/config'
import {
  addCodeCategory,
  editCodeCategory,
  getCodeCategoryInfo,
} from '@/api/operation'
import { selectListData, type SelectOption } from '@/utils/useConfig'

interface CdKeyCategoryFormState {
  title: string
  sku_id: number | string
  sort: number | null
}

interface SkuItem {
  id?: number | string
  title?: string
  name?: string
  discount_price?: number | string
}

const emit = defineEmits<{
  success: []
}>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const currentId = ref<number | string | null>(null)
const formRef = ref<FormInstance>()
const skuOptions = ref<SelectOption[]>([])

const form = reactive<CdKeyCategoryFormState>({
  title: '',
  sku_id: '',
  sort: 1,
})

const rules: FormRules<CdKeyCategoryFormState> = {
  title: [{ required: true, message: '请输入兑换码名称', trigger: 'blur' }],
  sku_id: [{ required: true, message: '请选择sku', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
}

// 重置表单，避免新增和编辑之间残留旧数据
const resetForm = () => {
  currentId.value = null
  form.title = ''
  form.sku_id = ''
  form.sort = 1
  formRef.value?.clearValidate()
}

// sku 下拉是固定依赖项，打开弹窗时按需拉取
const fetchSkuOptions = async () => {
  if (skuOptions.value.length) return
  const response = await getSkuList()
  skuOptions.value = selectListData(response.data as SkuItem[])
}

// 新增场景只依赖 sku 选项
const openCreate = async () => {
  resetForm()
  dialogVisible.value = true
  await fetchSkuOptions()
}

// 编辑时先准备 sku 选项，再取详情回填表单
const openEdit = async (id: number | string) => {
  resetForm()
  currentId.value = id
  dialogVisible.value = true
  detailLoading.value = true

  try {
    await fetchSkuOptions()
    const response = await getCodeCategoryInfo(id) as { data: Record<string, unknown> }
    Object.assign(form, response.data || {})
  } finally {
    detailLoading.value = false
  }
}

// 关闭弹窗并清空表单
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 提交时统一整理 payload，保证只提交后端需要的字段
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true

  try {
    const payload = {
      title: form.title.trim(),
      sku_id: form.sku_id,
      sort: form.sort,
    }

    if (currentId.value) {
      await editCodeCategory(currentId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await addCodeCategory(payload)
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
    title="配置"
    width="50%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-position="left"
      label-width="auto"
    >
      <el-form-item label="名称" prop="title">
        <el-input v-model="form.title" maxlength="20" placeholder="请输入标识" />
      </el-form-item>

      <el-form-item label="skuID" prop="sku_id">
        <el-select-v2
          v-model="form.sku_id"
          :options="skuOptions"
          placeholder="选择sku"
          clearable
          filterable
        />
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="1" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
