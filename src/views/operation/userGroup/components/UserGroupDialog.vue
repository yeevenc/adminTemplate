<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import {
  addUserGroup,
  editUserGroup,
  getUserGroupCategory,
  getUserGroupInfo,
} from '@/api/operation'
import { getSkuList } from '@/api/config'
import {
  USER_GROUP_AGE_OPTIONS,
  USER_GROUP_CHANNEL_OPTIONS,
  selectListData,
  type SelectOption,
} from '@/utils/useConfig'

interface UserGroupFormState {
  id?: number | string
  title: string
  remark: string
  sensors_channel: number[]
  vip_tag_ids: number[]
  active_day_min: number | null
  active_day_max: number | null
  remain_day_min: number | null
  remain_day_max: number | null
  expire_day_min: number | null
  expire_day_max: number | null
  age: number[]
  shield_sku: number[]
}

interface VipTagItem {
  name: string
  value: number
}

const emit = defineEmits<{ success: [] }>()

const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const vipTagOptions = ref<VipTagItem[]>([])
const skuOptions = ref<SelectOption[]>([])

const title = computed(() => {
  if (dialogMode.value === 'edit') return '修改分群'
  if (dialogMode.value === 'copy') return '复制分群'
  return '添加分群'
})

const CHANNEL_VALUES = USER_GROUP_CHANNEL_OPTIONS.map((item) => item.value as number)
const AGE_VALUES = USER_GROUP_AGE_OPTIONS.map((item) => item.value as number)

const getDefaultForm = (): UserGroupFormState => ({
  title: '',
  remark: '',
  sensors_channel: [],
  vip_tag_ids: [],
  active_day_min: null,
  active_day_max: null,
  remain_day_min: null,
  remain_day_max: null,
  expire_day_min: null,
  expire_day_max: null,
  age: [],
  shield_sku: [],
})

const form = reactive<UserGroupFormState>(getDefaultForm())

const rules: FormRules<UserGroupFormState> = {
  title: [{ required: true, message: '请输入群组名称', trigger: 'blur' }],
  sensors_channel: [
    { required: true, message: '请选择渠道', trigger: 'change', type: 'array', min: 1 },
  ],
  vip_tag_ids: [
    { required: true, message: '请选择人群', trigger: 'change', type: 'array', min: 1 },
  ],
  age: [
    { required: true, message: '请选择年龄段', trigger: 'change', type: 'array', min: 1 },
  ],
}

// 渠道全选联动，提交前再转回后端定义的“全部”特殊值
const channelAllChecked = computed<boolean>({
  get: () => form.sensors_channel.length === CHANNEL_VALUES.length,
  set: (checked) => {
    form.sensors_channel = checked ? [...CHANNEL_VALUES] : []
  },
})

const channelIndeterminate = computed(
  () => form.sensors_channel.length > 0 && form.sensors_channel.length < CHANNEL_VALUES.length,
)

// 年龄全选联动
const ageAllChecked = computed<boolean>({
  get: () => form.age.length === AGE_VALUES.length,
  set: (checked) => {
    form.age = checked ? [...AGE_VALUES] : []
  },
})

const ageIndeterminate = computed(
  () => form.age.length > 0 && form.age.length < AGE_VALUES.length,
)

// 人群标签全选联动
const vipTagAllChecked = computed<boolean>({
  get: () =>
    vipTagOptions.value.length > 0 &&
    form.vip_tag_ids.length === vipTagOptions.value.length,
  set: (checked) => {
    form.vip_tag_ids = checked ? vipTagOptions.value.map((item) => item.value) : []
  },
})

const vipTagIndeterminate = computed(
  () =>
    form.vip_tag_ids.length > 0 && form.vip_tag_ids.length < vipTagOptions.value.length,
)

// 每次打开弹窗前重置表单
const resetForm = () => {
  Object.assign(form, getDefaultForm())
  formRef.value?.clearValidate()
}

// 人群标签为固定依赖数据，打开弹窗时按需加载
const fetchVipTagList = async () => {
  if (vipTagOptions.value.length) return
  const response = await getUserGroupCategory()
  vipTagOptions.value = (response.data || []) as VipTagItem[]
}

// 屏蔽商品依赖 sku 配置列表，打开弹窗时按需加载
const fetchSkuOptions = async () => {
  if (skuOptions.value.length) return
  const response = await getSkuList()
  skuOptions.value = selectListData(response.data)
}

// 详情统一抽取，供编辑和复制场景复用
const fetchDetail = async (id: number | string) => {
  const response = await getUserGroupInfo(id)
  return (response.data || {}) as Partial<UserGroupFormState>
}

// 新增只依赖基础选项数据，不需要详情
const openCreate = async () => {
  resetForm()
  dialogMode.value = 'create'
  dialogVisible.value = true
  await Promise.all([fetchVipTagList(), fetchSkuOptions()])
}

// 编辑场景：详情和依赖数据都准备好后再回填
const openEdit = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'edit'
  dialogVisible.value = true
  const [detail] = await Promise.all([
    fetchDetail(id),
    fetchVipTagList(),
    fetchSkuOptions(),
  ])
  Object.assign(form, detail)
  form.id = id
}

// 复制场景：沿用详情，但不保留原 id
const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  const [detail] = await Promise.all([
    fetchDetail(id),
    fetchVipTagList(),
    fetchSkuOptions(),
  ])
  Object.assign(form, detail)
  delete form.id
}

// 关闭弹窗并清空表单
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}


// 编辑走修改接口，新增和复制统一走新增接口
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (dialogMode.value === 'edit' && form.id) {
      await editUserGroup(form.id, form)
      ElMessage.success('修改成功')
    } else {
      await addUserGroup(form)
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
      <el-form-item label="群组名称" prop="title">
        <el-input v-model.trim="form.title" placeholder="请输入" style="width: 94%" />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model.trim="form.remark" placeholder="请输入" style="width: 94%" />
      </el-form-item>

      <el-form-item label="渠道" prop="sensors_channel">
        <el-checkbox
          v-model="channelAllChecked"
          :indeterminate="channelIndeterminate"
        >
          全选
        </el-checkbox>
        <el-checkbox-group v-model="form.sensors_channel" class="m-l-20">
          <el-space wrap>
          <el-checkbox
            v-for="item in USER_GROUP_CHANNEL_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="人群" prop="vip_tag_ids">
        <el-checkbox
          v-model="vipTagAllChecked"
          :indeterminate="vipTagIndeterminate"
        >
          全选
        </el-checkbox>
        <el-checkbox-group v-model="form.vip_tag_ids" class="m-l-20 vip-tag-group">
          <el-space wrap>
          <el-checkbox
            v-for="item in vipTagOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.name }}
          </el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="用户分群">
        <span class="range-label">激活天数</span>
        <el-input-number
          v-model="form.active_day_min"
          :min="0"
          placeholder="请输入"
          class="range-input"
        />
        <span class="range-sep">至</span>
        <el-input-number
          v-model="form.active_day_max"
          :min="0"
          placeholder="请输入"
          class="range-input"
        />
      </el-form-item>

      <el-form-item label="">
        <span class="range-label">会员剩余天数</span>
        <el-input-number
          v-model="form.remain_day_min"
          :min="0"
          placeholder="请输入"
          class="range-input"
        />
        <span class="range-sep">至</span>
        <el-input-number
          v-model="form.remain_day_max"
          :min="0"
          placeholder="请输入"
          class="range-input"
        />
      </el-form-item>

      <el-form-item label="">
        <span class="range-label">会员过期天数</span>
        <el-input-number
          v-model="form.expire_day_min"
          :min="0"
          placeholder="请输入"
          class="range-input"
        />
        <span class="range-sep">至</span>
        <el-input-number
          v-model="form.expire_day_max"
          :min="0"
          placeholder="请输入"
          class="range-input"
        />
      </el-form-item>

      <div class="range-tip">
        1、有开始天数和结束天数，表示这一段时间， 比如：2 ~ 7，表示 2 ~ 7 天的用户<br />
        2、有开始时间，无结束时间，表示大于这个数字的全部用户，比如：30，表示大于 30 天的用户<br />
        3、无开始，有结束，表示截止到这个数字的用户， 比如：15，表示 15 天内的用户<br />
        4、两个相同，表示这个数字对应的当天
      </div>

      <el-form-item label="年龄" prop="age">
        <el-checkbox v-model="ageAllChecked" :indeterminate="ageIndeterminate">
          全选
        </el-checkbox>
        <el-checkbox-group v-model="form.age" class="m-l-20">
          <el-space wrap>
          <el-checkbox
            v-for="item in USER_GROUP_AGE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="屏蔽商品">
        <el-select-v2
          v-model="form.shield_sku"
          :options="skuOptions"
          placeholder="请选择屏蔽商品"
          filterable
          clearable
          multiple
          style="width: 94%"
        />
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

<style scoped>
.m-l-20 {
  display: inline-block;
  margin-left: 20px;
}


.range-label {
  display: inline-block;
  min-width: 90px;
  margin-right: 10px;
}

.range-input {
  width: 30%;
  margin: 0 10px;
}

.range-sep {
  margin: 0 6px;
}

.range-tip {
  margin: 12px 150px 20px;
  color: #f56c6c;
  line-height: 1.6;
}
</style>
