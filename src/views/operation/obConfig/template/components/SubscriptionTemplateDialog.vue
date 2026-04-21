<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import uploadImage from '@/components/upload/uploadImage.vue'
import { addTemplate, editTemplate, getTemplateInfo } from '@/api/operation'

// 视频类型选项
const OB_VIDEO_OPTIONS = [
  { label: '女生视频', value: 0 },
  { label: '紫色娃娃头', value: 1 },
]

// 随时关闭秒数选项
const CLOSE_SECOND_OPTIONS = [
  { label: '0秒', value: 0 },
  { label: '1秒', value: 1 },
  { label: '2秒', value: 2 },
  { label: '3秒', value: 3 },
]

// 背景颜色选项
const BACKGROUND_TYPE_OPTIONS = [
  { label: '黑色', value: 0 },
  { label: '白色', value: 1 },
]

// 展示特惠选项
const PREFERENTIAL_OPTIONS = [
  { label: '展示', value: 1 },
  { label: '不展示', value: 0 },
]

// 是否解锁计划选项
const UNLOCK_PLAN_OPTIONS = [
  { label: '解锁', value: 1 },
  { label: '不解锁', value: 0 },
]

type DialogMode = 'create' | 'edit' | 'copy'

interface SubscriptionForm {
  id?: number | string
  title: string
  remark: string
  type: 1
  banner: string
  cancel_icon: string
  close_img: string
  ob_video: number
  close_second: number
  background_type: number
  is_preferential: number | ''
  preferential_check: string
  preferential_default: string
  is_unlock_plan: number | ''
  refund_img: string
  equity_img: string
  comment_memo: string[]
}

const emit = defineEmits<{ success: [] }>()

const visible = ref(false)
const mode = ref<DialogMode>('create')
const submitLoading = ref(false)
const detailLoading = ref(false)
const formRef = ref<FormInstance>()

const defaultForm = (): SubscriptionForm => ({
  title: '',
  remark: '',
  type: 1,
  banner: '',
  cancel_icon: '',
  close_img: '',
  ob_video: 0,
  close_second: 0,
  background_type: 0,
  is_preferential: '',
  preferential_check: '',
  preferential_default: '',
  is_unlock_plan: '',
  refund_img: '',
  equity_img: '',
  comment_memo: [],
})

const form = reactive<SubscriptionForm>(defaultForm())

const dialogTitle = computed(() => {
  if (mode.value === 'edit') return '修改订阅页模板'
  if (mode.value === 'copy') return '复制订阅页模板'
  return '添加订阅页模板'
})

const formRules = {
  title: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  banner: [{ required: true, message: '请上传标题图片', trigger: 'change' }],
  is_preferential: [{ required: true, message: '请选择展示特惠', trigger: 'change' }],
  is_unlock_plan: [{ required: true, message: '请选择是否解锁计划', trigger: 'change' }],
}

// 复制到 form 时保证 comment_memo 是数组
const assignForm = (data: Record<string, unknown>) => {
  Object.assign(form, defaultForm(), data, { type: 1 as const })
  if (!Array.isArray(form.comment_memo)) {
    form.comment_memo = []
  }
}

const openCreate = () => {
  mode.value = 'create'
  Object.assign(form, defaultForm())
  visible.value = true
}

// 订阅页模板详情改成在表单组件内部获取，接口新增 type=1
const openEdit = async (id: number | string) => {
  mode.value = 'edit'
  visible.value = true
  detailLoading.value = true
  try {
    const response = await getTemplateInfo(id, { type: 1 })
    assignForm((response.data || {}) as Record<string, unknown>)
  } finally {
    detailLoading.value = false
  }
}

// 复制同样走详情接口回填，但提交仍然走新增逻辑
const openCopy = async (id: number | string) => {
  mode.value = 'copy'
  visible.value = true
  detailLoading.value = true
  try {
    const response = await getTemplateInfo(id, { type: 1 })
    assignForm((response.data || {}) as Record<string, unknown>)
    delete (form as any).id
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  Object.assign(form, defaultForm())
}

const validate = (): string | null => {
  if (!form.title.trim()) return '请输入模板名称'
  if (!form.banner) return '请上传标题图片'
  if (form.is_preferential === '') return '请选择展示特惠'
  if (form.is_preferential === 1 && !form.preferential_check) return '请上传选中图'
  if (form.is_preferential === 1 && !form.preferential_default) return '请上传未选中图'
  if (form.is_unlock_plan === '') return '请选择是否解锁计划'
  if (!form.comment_memo || form.comment_memo.length === 0) return '评论卡片最少1张'
  return null
}

const handleSubmit = async () => {
  const errMsg = validate()
  if (errMsg) {
    ElMessage.warning(errMsg)
    return
  }

  submitLoading.value = true
  try {
    const payload = { ...form, type: 1 }
    if (mode.value === 'edit' && form.id !== undefined) {
      await editTemplate(form.id, payload)
      ElMessage.success('修改成功')
    } else {
      const submitData = { ...payload }
      delete (submitData as any).id
      await addTemplate(submitData)
      ElMessage.success(mode.value === 'copy' ? '复制成功' : '添加成功')
    }
    visible.value = false
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

defineExpose({ openCreate, openEdit, openCopy })
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="700px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="formRules"
      label-width="auto"
      label-position="left"
    >
      <el-form-item label="模板名称" prop="title">
        <el-input v-model.trim="form.title" placeholder="请输入" clearable />
      </el-form-item>

      <el-form-item label="详情描述">
        <el-input v-model="form.remark" placeholder="请输入" clearable />
      </el-form-item>

      <el-form-item label="标题图片" prop="banner">
        <uploadImage v-model="form.banner" size="small" />
      </el-form-item>

      <el-form-item label="随时取消icon">
        <uploadImage v-model="form.cancel_icon" size="small" />
      </el-form-item>

      <el-form-item label="ob关闭">
        <uploadImage v-model="form.close_img" size="small" />
      </el-form-item>

      <el-form-item label="视频类型">
        <el-radio-group v-model="form.ob_video">
          <el-radio v-for="item in OB_VIDEO_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="随时关闭秒数">
        <el-radio-group v-model="form.close_second">
          <el-radio v-for="item in CLOSE_SECOND_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="背景颜色">
        <el-radio-group v-model="form.background_type">
          <el-radio v-for="item in BACKGROUND_TYPE_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="展示特惠" prop="is_preferential">
        <el-radio-group v-model="form.is_preferential">
          <el-radio v-for="item in PREFERENTIAL_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.is_preferential === 1">
        <el-form-item label="选中图" prop="preferential_check">
          <uploadImage v-model="form.preferential_check" size="small" />
        </el-form-item>
        <el-form-item label="未选中图" prop="preferential_default">
          <uploadImage v-model="form.preferential_default" size="small" />
        </el-form-item>
      </template>

      <el-form-item label="是否解锁计划" prop="is_unlock_plan">
        <el-radio-group v-model="form.is_unlock_plan">
          <el-radio v-for="item in UNLOCK_PLAN_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="退款承诺图">
        <uploadImage v-model="form.refund_img" size="small" />
      </el-form-item>

      <el-form-item label="解锁权益图">
        <uploadImage v-model="form.equity_img" size="small" />
      </el-form-item>

      <el-form-item label="评论卡片">
        <div>
          <uploadImage
            v-model="form.comment_memo"
            size="small"
            :multiple="true"
            :limit="5"
          />
          <div class="tips-text">最少1张，最多5张</div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.tips-text {
  font-size: 12px;
  color: var(--el-color-danger);
  margin-top: 4px;
}
</style>
