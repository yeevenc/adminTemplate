<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { manualRefundOrder } from '@/api/orderConfig'
import type { SelectOption } from '@/utils/useConfig'

interface ManualRefundFormState {
  order_id: string
  pay_price: number | string
  refund_reason: number | ''
  refund_source: string
  price: number | string
  uid: number | string
  user_name: string
  user_id: string
  is_challenge: number | ''
  is_retained: number | ''
}

const REFUND_REASON_OPTIONS: SelectOption[] = [
  { label: '支付宝投诉', value: 1 },
  { label: '七鱼用户反馈退款', value: 2 },
  { label: '工商投诉', value: 3 },
  { label: '黑猫投诉', value: 4 },
  { label: '微信投诉', value: 5 },
  { label: '用户电话', value: 6 },
  { label: '邮件反馈', value: 7 },
  { label: '其他', value: 8 },
]

const ORDER_TYPE_OPTIONS: SelectOption[] = [
  { label: '会员订单', value: 2 },
  { label: '挑战赛订单', value: 1 },
]

const RETAIN_OPTIONS: SelectOption[] = [
  { label: '保留权益', value: 1 },
  { label: '删除权益', value: 0 },
]

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const getDefaultForm = (): ManualRefundFormState => ({
  order_id: '',
  pay_price: '',
  refund_reason: '',
  refund_source: '',
  price: '',
  uid: '',
  user_name: '',
  user_id: '',
  is_challenge: '',
  is_retained: '',
})

const form = reactive<ManualRefundFormState>(getDefaultForm())

const rules: FormRules<ManualRefundFormState> = {
  refund_reason: [{ required: true, message: '请选择退款原因', trigger: 'change' }],
  refund_source: [{ required: true, message: '请输入退款来源', trigger: 'blur' }],
  price: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  uid: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  user_name: [{ required: true, message: '请输入支付宝姓名', trigger: 'blur' }],
  user_id: [{ required: true, message: '请输入支付宝账号', trigger: 'blur' }],
  is_challenge: [{ required: true, message: '请选择订单类型', trigger: 'change' }],
  is_retained: [{ required: true, message: '请选择退款类型', trigger: 'change' }],
}

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  formRef.value?.clearValidate()
}

const open = (row: Partial<ManualRefundFormState>) => {
  resetForm()
  Object.assign(form, row)
}

const handleOpenWrapper = (row: Partial<ManualRefundFormState>) => {
  open(row)
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await manualRefundOrder({ ...form })
    ElMessage.success('提交成功')
    handleClose()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

defineExpose({ open: handleOpenWrapper })
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    title="手动退款"
    width="60%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="订单号">
        <el-input v-model="form.order_id" disabled />
      </el-form-item>
      <el-form-item label="支付金额">
        <el-input v-model="form.pay_price" disabled />
      </el-form-item>
      <el-form-item label="退款原因" prop="refund_reason">
        <el-radio-group v-model="form.refund_reason">
          <el-radio
            v-for="item in REFUND_REASON_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="退款来源id" prop="refund_source">
        <el-input v-model="form.refund_source" placeholder="退款来源id" />
      </el-form-item>
      <el-form-item label="退款金额" prop="price">
        <el-input v-model="form.price" placeholder="请输入退款金额" />
      </el-form-item>
      <el-form-item label="用户ID" prop="uid">
        <el-input v-model="form.uid" placeholder="请输入用户ID" />
      </el-form-item>
      <el-form-item label="支付宝姓名" prop="user_name">
        <el-input v-model="form.user_name" placeholder="请输入支付宝姓名" />
      </el-form-item>
      <el-form-item label="支付宝账号" prop="user_id">
        <el-input v-model="form.user_id" placeholder="请输入支付宝账号" />
      </el-form-item>
      <el-form-item label="订单类型" prop="is_challenge">
        <el-radio-group v-model="form.is_challenge">
          <el-radio
            v-for="item in ORDER_TYPE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="退款类型" prop="is_retained">
        <el-radio-group v-model="form.is_retained">
          <el-radio
            v-for="item in RETAIN_OPTIONS"
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
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
