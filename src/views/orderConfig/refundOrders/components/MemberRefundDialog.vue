<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  firstRefundOrder,
  getRefundOperators,
  secondRefundOrder,
} from '@/api/orderConfig'
import type { SelectOption } from '@/utils/useConfig'

interface MemberRefundFormState {
  order_id: string
  pay_price: number | string
  refund_source: number | ''
  refund_source_id: string
  retention_type: number | ''
  retention_method: number | ''
  retention_price: number | string
  admin_uid: number | ''
  complain_event_id?: string
}

interface AdminItem {
  value: number
  name: string
}

const REFUND_SOURCE_OPTIONS: SelectOption[] = [
  { label: '支付宝投诉', value: 1 },
  { label: '七鱼用户反馈退款', value: 2 },
  { label: '工商投诉', value: 3 },
  { label: '黑猫投诉', value: 4 },
  { label: '微信投诉', value: 5 },
  { label: '用户电话', value: 6 },
  { label: '邮件反馈', value: 7 },
  { label: '其他', value: 8 },
]

const REFUND_SOURCE_PLACEHOLDERS: Record<number, string> = {
  1: '请输入支付宝投诉交易号',
  2: '请输入七鱼会话号',
  3: '请输入用户手机号',
  4: '请输入黑猫投诉号',
  5: '请输入微信投诉号',
  6: '请输入用户电话号码',
  7: '请输入邮箱地址',
  8: '请输入会话id或者用户手机号等',
}

const RETENTION_TYPE_OPTIONS: SelectOption[] = [
  { label: '全额挽单', value: 1 },
  { label: '挽留半年', value: 2 },
  { label: '挽留一个月', value: 3 },
  { label: '挽留季卡', value: 4 },
  { label: '半价挽全年', value: 5 },
  { label: '全额退款', value: 9 },
]

const RETENTION_METHOD_OPTIONS: SelectOption[] = [
  { label: '会员', value: 1 },
  { label: '挑战赛', value: 2 },
]

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const refundTimes = ref<1 | 2>(1)
const adminList = ref<AdminItem[]>([])

const getDefaultForm = (): MemberRefundFormState => ({
  order_id: '',
  pay_price: '',
  refund_source: '',
  refund_source_id: '',
  retention_type: '',
  retention_method: '',
  retention_price: '',
  admin_uid: '',
  complain_event_id: '',
})

const form = reactive<MemberRefundFormState>(getDefaultForm())

const sourceIdDisabled = computed(() => Boolean(form.complain_event_id))

const sourceIdPlaceholder = computed(() =>
  form.refund_source ? REFUND_SOURCE_PLACEHOLDERS[Number(form.refund_source)] : '请输入'
)

const title = computed(() => (refundTimes.value === 2 ? '再次退款' : '会员退款'))

const rules: FormRules<MemberRefundFormState> = {
  refund_source: [{ required: true, message: '请选择退款原因', trigger: 'change' }],
  refund_source_id: [{ required: true, message: '请输入退款来源id', trigger: 'blur' }],
  retention_type: [{ required: true, message: '请选择挽单类型', trigger: 'change' }],
  retention_method: [{ required: true, message: '请选择挽单方案', trigger: 'change' }],
  retention_price: [{ required: true, message: '请输入挽单金额', trigger: 'blur' }],
  admin_uid: [{ required: true, message: '请选择操作者', trigger: 'change' }],
}

const fetchAdminList = async () => {
  if (adminList.value.length) return
  const response = (await getRefundOperators({})) as { data?: AdminItem[] }
  adminList.value = response.data || []
}

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  refundTimes.value = 1
  formRef.value?.clearValidate()
}

const handleRetentionTypeChange = (value: number | '') => {
  if (value === 1) {
    form.retention_price = form.pay_price
  } else if (value === 5) {
    form.retention_price = 59
  } else if (value === 9) {
    form.retention_price = 0
  } else {
    form.retention_price = ''
  }
}

const open = async (row: Partial<MemberRefundFormState>, times: 1 | 2) => {
  resetForm()
  refundTimes.value = times
  Object.assign(form, row)

  if (form.complain_event_id) {
    form.refund_source = 1
    form.refund_source_id = form.complain_event_id
  }

  await fetchAdminList()
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
    const submit = refundTimes.value === 2 ? secondRefundOrder : firstRefundOrder
    await submit({ ...form })
    ElMessage.success('退款成功')
    handleClose()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchAdminList()
})

defineExpose({ open })
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="title"
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
      <el-form-item label="退款原因" prop="refund_source">
        <el-radio-group v-model="form.refund_source" :disabled="sourceIdDisabled">
          <el-radio
            v-for="item in REFUND_SOURCE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="退款来源id" prop="refund_source_id">
        <el-input
          v-model="form.refund_source_id"
          :placeholder="sourceIdPlaceholder"
          :disabled="sourceIdDisabled"
        />
      </el-form-item>
      <el-form-item label="挽单类型" prop="retention_type">
        <el-radio-group v-model="form.retention_type" @change="handleRetentionTypeChange">
          <el-radio
            v-for="item in RETENTION_TYPE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="挽单方案" prop="retention_method">
        <el-radio-group v-model="form.retention_method">
          <el-radio
            v-for="item in RETENTION_METHOD_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
        <div class="tip">注：此挑战赛非活动挑战赛，为客服线下管理的挑战赛，用于上报神策标记</div>
      </el-form-item>
      <el-form-item label="挽单金额" prop="retention_price">
        <el-input v-model="form.retention_price" placeholder="请输入" style="width: 60%" />
        <span class="tip tip-inline">挽单金额=支付金额-退款金额</span>
      </el-form-item>
      <el-form-item label="操作者" prop="admin_uid">
        <el-radio-group v-model="form.admin_uid">
          <el-radio
            v-for="item in adminList"
            :key="item.value"
            :value="item.value"
          >
            {{ item.name }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">
        {{ refundTimes === 2 ? '确定再次退款' : '确定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.tip {
  color: #f56c6c;
  font-size: 12px;
}

.tip-inline {
  margin-left: 12px;
}
</style>
