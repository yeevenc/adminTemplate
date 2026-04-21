<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { challengeRefundOrder } from '@/api/orderConfig'

interface ChallengeRefundFormState {
  order_id: string
  pay_sn: string
  pay_time: string
  pay_price: number | string
  reason: string
}

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const submitLoading = ref(false)

const form = reactive<ChallengeRefundFormState>({
  order_id: '',
  pay_sn: '',
  pay_time: '',
  pay_price: '',
  reason: '',
})

const resetForm = () => {
  form.order_id = ''
  form.pay_sn = ''
  form.pay_time = ''
  form.pay_price = ''
  form.reason = ''
}

const open = (row: Partial<ChallengeRefundFormState>) => {
  resetForm()
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleSubmit = async () => {
  submitLoading.value = true
  try {
    await challengeRefundOrder({
      order_id: form.order_id,
      price: form.pay_price,
      reason: form.reason,
      refund_type: 1,
    })
    ElMessage.success('退款成功')
    handleClose()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    title="挑战赛退款"
    width="50%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form :model="form" label-width="120px" label-position="right">
      <el-form-item label="订单号">
        <el-input v-model="form.order_id" disabled />
      </el-form-item>
      <el-form-item label="支付流水号">
        <el-input v-model="form.pay_sn" disabled placeholder="暂无" />
      </el-form-item>
      <el-form-item label="支付时间">
        <el-input v-model="form.pay_time" disabled />
      </el-form-item>
      <el-form-item label="支付金额">
        <el-input v-model="form.pay_price" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="退款原因">
        <el-input v-model="form.reason" placeholder="请输入退款原因" />
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
