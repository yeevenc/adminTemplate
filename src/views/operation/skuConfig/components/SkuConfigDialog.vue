<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import {
  getConfigList,
  getSkuList as getAllSkuList,
  getWeChatSubscriptionList,
} from '@/api/config'
import { addSku, editSku, getSkuInfo } from '@/api/operation'
import { selectListData, type SelectOption } from '@/utils/useConfig'

interface SkuFormState {
  id?: number | string
  title: string
  pay_title: string
  pre_title: string
  order_title: string
  subtitle: string
  sku_tips: string
  up_status: number
  free_status: number
  type: string
  is_change: number
  vip_type: number | ''
  give_sku_id: number | string
  price: string
  first_price: string
  renew_price: string
  duration: string | number
  renew_duration: number | string
  InAppID: string
  harmony_product_id: string
  AliPayId: string
  wx_sku: string
  plan_id: string
  sku_offer_tag_url: string
  course_default_img: string
  course_checked_img: string
}

interface WeChatPlanItem {
  plan_id: string
  price: number | string
}

const BOOL_OPTIONS: SelectOption[] = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
]

const RENEW_DURATION_MAP: Record<string, number | ''> = {
  month_automatic: 31,
  quarter_automatic: 93,
  half_year_automatic: 183,
  year_automatic: 365,
}

const SECONDS_PER_DAY = 86400

const CHALLENGE_OPTIONS: SelectOption[] = [
  { label: '否', value: 0 },
  { label: '21天挑战赛', value: 1004 },
  { label: '36天挑战赛', value: 1000 },
]

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const formRef = ref<FormInstance>()

const skuTypeOptions = ref<SelectOption[]>([])
const giveSkuOptions = ref<SelectOption[]>([])
const weChatPlanOptions = ref<SelectOption[]>([])
const skuTitleOptions = ref<SelectOption[]>([])
const vipTypeOptions = ref<SelectOption[]>([])

const title = computed(() => {
  if (dialogMode.value === 'edit') return '修改sku'
  if (dialogMode.value === 'copy') return '复制sku'
  return '添加sku'
})

const getDefaultForm = (): SkuFormState => ({
  title: '',
  pay_title: '',
  pre_title: '',
  order_title: '',
  subtitle: '',
  sku_tips: '',
  up_status: 0,
  free_status: 0,
  type: '',
  is_change: 0,
  vip_type: '',
  give_sku_id: '',
  price: '',
  first_price: '',
  renew_price: '',
  duration: '',
  renew_duration: '',
  InAppID: '',
  harmony_product_id: '',
  AliPayId: '',
  wx_sku: '',
  plan_id: '',
  sku_offer_tag_url: '',
  course_default_img: '',
  course_checked_img: '',
})

const form = reactive<SkuFormState>(getDefaultForm())

const rules: FormRules<SkuFormState> = {
  title: [{ required: true, message: '请选择标题', trigger: 'change' }],
  price: [{ required: true, message: '请输入现价', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入会员时长', trigger: 'blur' }],
  vip_type: [{ required: true, message: '请选择权益', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

// 后端时长单位是秒，表单展示和填写统一使用天
const secondsToDays = (value: unknown) => {
  if (value === '' || value === undefined || value === null) return ''
  const seconds = Number(value)
  if (Number.isNaN(seconds)) return ''
  return seconds / SECONDS_PER_DAY
}

const daysToSeconds = (value: unknown) => {
  if (value === '' || value === undefined || value === null) return ''
  const days = Number(value)
  if (Number.isNaN(days)) return ''
  return Math.round(days * SECONDS_PER_DAY)
}

// 每次打开弹窗前重置表单，避免新增/编辑/复制之间相互污染
const resetForm = () => {
  Object.assign(form, getDefaultForm())
  formRef.value?.clearValidate()
}

// 详情回填时只覆盖表单定义过的字段，避免把无关接口字段带进响应式对象
const fillForm = (row: Record<string, unknown>) => {
  const defaults = getDefaultForm()
  ;(Object.keys(defaults) as Array<keyof SkuFormState>).forEach((key) => {
    const value = row[key as string]
    if (value !== undefined && value !== null) {
      ;(form as Record<string, unknown>)[key as string] = value
    }
  })
  form.duration = secondsToDays(row.duration)
  form.renew_duration = secondsToDays(row.renew_duration)
}

// 续订时长和 sku 类型绑定，切换类型后自动回填对应天数
const handleTypeChange = (value: string) => {
  form.renew_duration = RENEW_DURATION_MAP[value] ?? ''
}


// 打开弹窗前统一拉取依赖选项，保证下拉在详情回填前已经准备好
const fetchOptions = async () => {
  const [configRes, giveSkuRes, planRes] = await Promise.all([
    getConfigList(),
    getAllSkuList(),
    getWeChatSubscriptionList(),
  ])

  const configData = configRes.data || {}
  skuTitleOptions.value = selectListData(configData.sku_title || [])
  vipTypeOptions.value = selectListData(configData.vip_type_list || [])
  skuTypeOptions.value = configData.sku_type_list || []
  giveSkuOptions.value = selectListData(giveSkuRes.data)
  weChatPlanOptions.value = ((planRes.data || []) as WeChatPlanItem[]).map((item) => ({
    label: `${item.plan_id}-${item.price}`,
    value: item.plan_id,
  }))
}

// 新增场景只依赖选项数据，不需要详情
const openCreate = async () => {
  resetForm()
  dialogMode.value = 'create'
  dialogVisible.value = true
  await fetchOptions()
}

// 详情单独抽取，便于编辑和复制场景共用
const fetchSkuDetail = async (id: number | string) => {
  const response = await getSkuInfo(id)
  return (response.data || {}) as Record<string, unknown>
}

// 编辑时先取详情，再取依赖选项，最后做表单回填
const openEdit = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'edit'
  dialogVisible.value = true
  const detail = await fetchSkuDetail(id)
  await fetchOptions()
  form.id = id
  fillForm(detail)
}

// 复制沿用详情回填，但不保留 id，保存时走新增接口
const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  const detail = await fetchSkuDetail(id)
  await fetchOptions()
  fillForm(detail)
}

// 关闭弹窗时同步重置
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 提交前去掉 id，只保留后端真正需要的配置字段
const getSubmitPayload = () => {
  const { id, ...rest } = form
  void id
  return {
    ...rest,
    duration: daysToSeconds(form.duration),
    renew_duration: daysToSeconds(form.renew_duration),
  }
}

// 编辑场景走修改接口，其余场景统一走新增接口
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (dialogMode.value === 'edit' && form.id) {
      await editSku(form.id, getSubmitPayload())
      ElMessage.success('修改成功')
    } else {
      await addSku(getSubmitPayload())
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
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      label-position="left"
    >
      <el-form-item label="标题" prop="title">
        <el-select
          v-model="form.title"
          placeholder="请选择(用户订单的标题)"
          style="width: 60%"
        >
          <el-option
            v-for="item in skuTitleOptions"
            :key="String(item.value)"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="支付页面标题">
        <el-input v-model.trim="form.pay_title" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="优惠标题">
        <el-input
          v-model.trim="form.pre_title"
          placeholder="请输入(微信支付时使用，金额上方的标题)"
        />
      </el-form-item>

      <el-form-item label="内部标题">
        <el-input v-model.trim="form.order_title" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="副标题">
        <el-input
          v-model.trim="form.subtitle"
          placeholder="请输入(客服添加订单时使用，尽可能写详细)"
        />
      </el-form-item>

      <el-form-item label="sku说明">
        <el-input
          v-model.trim="form.sku_tips"
          placeholder="请输入(订阅中心价格下方的文案)"
        />
      </el-form-item>

      <el-form-item label="升级sku">
        <el-radio-group v-model="form.up_status">
          <el-radio
            v-for="item in BOOL_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="前几天免费订单">
        <el-radio-group v-model="form.free_status">
          <el-radio
            v-for="item in BOOL_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type" @change="handleTypeChange">
          <el-radio
            v-for="item in skuTypeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="是否是挑战赛">
        <el-radio-group v-model="form.is_change">
          <el-radio
            v-for="item in CHALLENGE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="权益" prop="vip_type">
        <el-radio-group v-model="form.vip_type">
          <el-radio
            v-for="item in vipTypeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="赠送SKU">
        <el-select-v2
          v-model="form.give_sku_id"
          :options="giveSkuOptions"
          placeholder="请选择赠送SKU"
          filterable
          clearable
          style="width: 60%"
        />
      </el-form-item>


      <el-form-item label="现价" prop="price">
        <el-input v-model.trim="form.price" placeholder="请输入" style="width: 60%" />
      </el-form-item>

      <el-form-item label="续订价格">
        <el-input v-model.trim="form.renew_price" placeholder="请输入" style="width: 60%" />
      </el-form-item>

      <el-form-item label="首次优惠价">
        <el-input v-model.trim="form.first_price" placeholder="请输入" style="width: 60%" />
      </el-form-item>

      <el-form-item label="会员时长" prop="duration">
        <el-input
          v-model.trim="form.duration"
          placeholder="请输入(天)"
          style="width: 60%"
        />
      </el-form-item>

      <el-form-item label="续订时长">
        <span v-if="form.renew_duration">{{ form.renew_duration }} 天</span>
        <span v-else>无</span>
      </el-form-item>

      <el-form-item label="InAppID">
        <el-input v-model.trim="form.InAppID" placeholder="请输入" style="width: 60%" />
      </el-form-item>
       <el-form-item label="ohosID">
        <el-input v-model.trim="form.harmony_product_id" placeholder="请输入" style="width: 60%" />
      </el-form-item>
      <el-form-item label="支付宝ID">
        <el-input v-model.trim="form.AliPayId" placeholder="请输入" style="width: 60%" />
      </el-form-item>

      <el-form-item label="微信Sku">
        <el-input v-model.trim="form.wx_sku" placeholder="请输入" style="width: 60%" />
      </el-form-item>

      <el-form-item label="微信订阅ID">
        <el-select
          v-model="form.plan_id"
          placeholder="请选择微信订阅ID"
          clearable
          style="width: 60%"
        >
          <el-option
            v-for="item in weChatPlanOptions"
            :key="String(item.value)"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="角标图">
        <uploadImage v-model="form.sku_offer_tag_url" />
      </el-form-item>

      <el-form-item label="课程未选中图">
        <uploadImage v-model="form.course_default_img" />
      </el-form-item>

      <el-form-item label="课程选中图">
        <uploadImage v-model="form.course_checked_img" />
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
