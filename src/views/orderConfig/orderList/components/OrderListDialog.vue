<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { addOrder, updateOrderStatus } from '@/api/orderConfig'
import { getSkuList } from '@/api/config'
import { PLATFORM_OPTIONS, selectListData, type SelectOption } from '@/utils/useConfig'

interface AddOrderFormState {
  old_id: string
  uid: string
  order_title: string
  sku_id: number | string
  duration: number | string
  platfrom: string
  pay_price: number | string
  pay_time: string
  pay_type: number | ''
  pay_status: number | ''
  mark: string
}

interface EditOrderFormState {
  order_id: string
  duration: number | string
  pay_status: 0 | 1
  is_transfer: 0 | 1
}

const PAY_TYPE_OPTIONS: SelectOption[] = [
  { label: '支付宝', value: 1 },
  { label: '微信', value: 2 },
  { label: 'ApplePay', value: 3 },
]

const PAY_STATUS_OPTIONS: SelectOption[] = [
  { label: '失败', value: 0 },
  { label: '成功', value: 1 },
]

const EXPIRE_OPTIONS: SelectOption[] = [
  { label: '失效', value: 0 },
  { label: '不失效', value: 1 },
]

const TRANSFER_OPTIONS: SelectOption[] = [
  { label: '未转账', value: 0 },
  { label: '已转账', value: 1 },
]

const emit = defineEmits<{
  success: []
}>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const skuOptions = ref<SelectOption[]>([])

const getDefaultAddForm = (): AddOrderFormState => ({
  old_id: '',
  uid: '',
  order_title: '',
  sku_id: '',
  duration: '',
  platfrom: '',
  pay_price: '',
  pay_time: '',
  pay_type: '',
  pay_status: '',
  mark: '',
})

const addForm = reactive<AddOrderFormState>(getDefaultAddForm())
const editForm = reactive<EditOrderFormState>({
  order_id: '',
  duration: '',
  pay_status: 1,
  is_transfer: 0,
})

const rules: FormRules<AddOrderFormState> = {
  uid: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  order_title: [{ required: true, message: '请输入订单标题', trigger: 'blur' }],
  pay_price: [{ required: true, message: '请输入支付金额', trigger: 'blur' }],
}

const fetchSkuOptions = async () => {
  const response = await getSkuList()
  skuOptions.value = selectListData(response.data)
}

const resetAddForm = () => {
  Object.assign(addForm, getDefaultAddForm())
  formRef.value?.clearValidate()
}

const resetEditForm = () => {
  editForm.order_id = ''
  editForm.duration = ''
  editForm.pay_status = 1
  editForm.is_transfer = 0
}

const openCreate = async () => {
  resetAddForm()
  dialogMode.value = 'create'
  await fetchSkuOptions()
  dialogVisible.value = true
}

const openEdit = (row: { order_id: string }) => {
  resetEditForm()
  dialogMode.value = 'edit'
  editForm.order_id = row.order_id
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  resetAddForm()
  resetEditForm()
}

const submitCreate = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const params = {
      ...addForm,
      duration: Number(addForm.duration) * 24 * 60 * 60,
    }
    await addOrder(params)
    ElMessage.success('添加成功')
    handleClose()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

const submitEdit = async () => {
  submitLoading.value = true
  try {
    await updateOrderStatus({ ...editForm })
    ElMessage.success('修改成功')
    handleClose()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

const handleSubmit = () => {
  if (dialogMode.value === 'create') {
    submitCreate()
  } else {
    submitEdit()
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
    :title="dialogMode === 'edit' ? '修改订单' : '添加订单'"
    :width="dialogMode === 'edit' ? '40%' : '70%'"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      v-if="dialogMode === 'create'"
      ref="formRef"
      :model="addForm"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="原订单号" prop="old_id">
        <el-input v-model="addForm.old_id" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="用户ID" prop="uid">
        <el-input v-model="addForm.uid" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="订单标题" prop="order_title">
        <el-input v-model="addForm.order_title" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="产品" prop="sku_id">
        <el-select-v2
          v-model="addForm.sku_id"
          :options="skuOptions"
          placeholder="请选择产品"
          filterable
          clearable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="会员时长" prop="duration">
        <el-input v-model="addForm.duration" placeholder="请输入(单位:天)" />
      </el-form-item>
      <el-form-item label="平台" prop="platfrom">
        <el-radio-group v-model="addForm.platfrom">
          <el-radio
            v-for="item in PLATFORM_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="支付金额" prop="pay_price">
        <el-input v-model="addForm.pay_price" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="支付时间" prop="pay_time">
        <el-date-picker
          v-model="addForm.pay_time"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择日期时间"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="支付方式" prop="pay_type">
        <el-radio-group v-model="addForm.pay_type">
          <el-radio
            v-for="item in PAY_TYPE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="支付状态" prop="pay_status">
        <el-radio-group v-model="addForm.pay_status">
          <el-radio
            v-for="item in PAY_STATUS_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="mark">
        <el-input v-model="addForm.mark" placeholder="请输入" />
      </el-form-item>
    </el-form>

    <el-form
      v-else
      :model="editForm"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="原订单号">
        <el-input v-model="editForm.order_id" disabled />
      </el-form-item>
      <el-form-item label="订单时长">
        <el-input v-model="editForm.duration" placeholder="请输入(天)" />
      </el-form-item>
      <el-form-item label="是否失效">
        <el-radio-group v-model="editForm.pay_status">
          <el-radio
            v-for="item in EXPIRE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="是否转账">
        <el-radio-group v-model="editForm.is_transfer">
          <el-radio
            v-for="item in TRANSFER_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
