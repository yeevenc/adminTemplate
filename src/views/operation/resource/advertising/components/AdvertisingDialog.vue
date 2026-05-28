<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import { computed, reactive, ref } from 'vue'
import { getSkuList,getConfigList } from '@/api/config'
import {
  addResource,
  editResource,
  getResourceInfo,
  getResourceList,
  getSubscriptionSkuList,
  getUserGroupList,
} from '@/api/operation'
import { CHANNEL_OPTIONS, selectListData, type SelectOption } from '@/utils/useConfig'
import uploadImage from '@/components/upload/uploadImage.vue'

type ResourceEnv = 'produce' | 'mirror'

interface UserGroupItem {
  id: number | string
  title: string
}

interface SubscriptionSkuItem {
  id: number | string
  title: string
}

interface FullscreenAdvertItem {
  id: number | string
  title: string
}

// 单个 SKU 卡片的结构（多 SKU 配置的核心）
interface SkuCardItem {
  sku_id: number | string | ''
  checked: boolean
  background_default: string // 未选中图
  background_checked: string // 选中图
}

interface ResourceFormState {
  id?: number | string
  title: string
  alert_type: number | ''
  type: number | string | ''
  upgrade_id: number | string | ''
  vip_img: string
  no_vip_img: string
  full_type: 0 | 1
  style: 0 | 1
  memo: SkuCardItem[]
  bottom_img: string
  small_img: string
  user_group_id: number | string | ''
  banner: string
  content_bg_color: string
  link_type: number | string | ''
  lessions_id: number | string
  is_cancel: 0 | 1
  is_second_full: 0 | 1
  second_full_id: number | string | ''
  cancel_sku_id: number | string | ''
  cancel_image: string
  cancel_color: string
  cancel_close_img: string
  close_img: string
  motion_img: string
  motion_num: number
  label: 0 | 1
  channel: string[]
  status: 0 | 1
  env: ResourceEnv
  start_time: string
  end_time: string
  sequence: number | null
  rate_num: number | null
  day_show_times: number | null
}

const ENV_OPTIONS: Array<{ label: string; value: ResourceEnv }> = [
  { label: '测试', value: 'mirror' },
  { label: '线上', value: 'produce' },
]

const SWITCH_OPTIONS = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
]

const STYLE_OPTIONS = [
  { label: '竖版', value: 0 },
  { label: '横版', value: 1 },
]

const LABEL_OPTIONS = [
  { label: '无', value: 0 },
  { label: 'CBTI', value: 1 },
]

// 单个 SKU 的默认值，新增行和重置共用
const createEmptySku = (): SkuCardItem => ({
  sku_id: '',
  checked: false,
  background_default: '',
  background_checked: '',
})

// memo 数量上限，新增时防止无限增加
const SKU_MAX_COUNT = 5

const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const currentId = ref<number | string | null>(null)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const formRef = ref<FormInstance>()

const adTypeList = ref<SelectOption[]>([])
const typeOptions = ref<SelectOption[]>([])
const userGroupOptions = ref<SelectOption[]>([])
const jumpTypeOptions = ref<SelectOption[]>([])
const skuOptions = ref<SelectOption[]>([])
const upgradeSkuOptions = ref<SelectOption[]>([])
const fullscreenAdvertOptions = ref<SelectOption[]>([])

const title = computed(() => {
  if (dialogMode.value === 'edit') return '编辑广告配置'
  if (dialogMode.value === 'copy') return '复制广告配置'
  return '添加广告配置'
})

// 当前广告类型是否为全屏（1），多个地方复用这个判断
const isFullscreen = computed(() => form.alert_type === 1)

// 当前广告类型是否为会员卡片（按后端返回的 alert_type 文案匹配）
const isMembershipCard = computed(() => {
  const current = adTypeList.value.find((item) => item.value === form.alert_type)
  return current?.label?.includes('会员卡片') ?? false
})

// 动效相关字段仅在 alert_type === 3（动效类）时出现
const isMotionType = computed(() => form.alert_type === 3)

const getDefaultForm = (): ResourceFormState => ({
  title: '',
  alert_type: '',
  type: '',
  upgrade_id: '',
  vip_img: '',
  no_vip_img: '',
  full_type: 0,
  style: 0,
  memo: [createEmptySku()],
  bottom_img: '',
  small_img: '',
  user_group_id: '',
  banner: '',
  content_bg_color: '',
  link_type: '',
  lessions_id: '',
  is_cancel: 0,
  is_second_full: 0,
  second_full_id: '',
  cancel_sku_id: '',
  cancel_image: '',
  cancel_color: '',
  cancel_close_img: '',
  close_img: '',
  motion_img: '',
  motion_num: 0,
  label: 0,
  channel: [],
  status: 1,
  env: 'mirror',
  start_time: '',
  end_time: '',
  sequence: 1,
  rate_num: 0,
  day_show_times: 0,
})

const form = reactive<ResourceFormState>(getDefaultForm())

const rules: FormRules<ResourceFormState> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  alert_type: [{ required: true, message: '请选择资源位类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  env: [{ required: true, message: '请选择生效环境', trigger: 'change' }],
}

const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  dialogMode.value = 'create'
  typeOptions.value = []
  formRef.value?.clearValidate()
}

// 根据当前 alert_type 同步二级类型下拉
const syncTypeOptions = () => {
  const current = adTypeList.value.find((item) => item.value === form.alert_type)
  typeOptions.value = Array.isArray(current?.value)
    ? current!.value!.map((item) => ({ label: item.name, value: item.type_id }))
    : []

  if (!typeOptions.value.some((item) => item.value === form.type)) {
    form.type = ''
  }
}

// 把用户分群列表转成 select-v2 需要的 { label, value }
const mapUserGroup = (list: UserGroupItem[] | undefined): SelectOption[] =>
  Array.isArray(list)
    ? list.map((item) => ({ label: `${item.id}-${item.title}`, value: item.id }))
    : []

// 把接口返回的 subscription sku 列表转成下拉选项
const mapSubscriptionSku = (list: SubscriptionSkuItem[] | undefined): SelectOption[] =>
  Array.isArray(list)
    ? list.map((item) => ({ label: `${item.id}-${item.title}`, value: item.id }))
    : []

// 把当前环境下的全屏广告列表转成下拉，用于「二次全屏ID」
const mapFullscreenAdvert = (list: FullscreenAdvertItem[] | undefined): SelectOption[] =>
  Array.isArray(list)
    ? list.map((item) => ({ label: `${item.id}-${item.title}`, value: item.id }))
    : []

// 打开弹窗前批量拉取依赖选项
const fetchBaseOptions = async () => {
  const [configRes, userGroupRes, skuRes] = await Promise.all([
    getConfigList(),
    getUserGroupList(),
    getSkuList(),
  ])

  const configData = configRes.data || {}
  adTypeList.value = selectListData(configData.alert_type_list)
  userGroupOptions.value = mapUserGroup((userGroupRes.data as { list?: UserGroupItem[] })?.list)
  jumpTypeOptions.value = selectListData(configData.link_list)
  skuOptions.value = selectListData(skuRes.data)
}

// 补差sku 和 二次全屏 依赖当前 env，切换环境后需要重新拉
const fetchEnvDependentOptions = async () => {
  const [subscriptionRes, fullscreenRes] = await Promise.all([
    getSubscriptionSkuList({ page: 1, page_size: 99999}),
    getResourceList({ page: 1, page_size: 99999, env: form.env, alert_type: 1 }),
  ])

  upgradeSkuOptions.value = mapSubscriptionSku((subscriptionRes.data as { list?: SubscriptionSkuItem[] })?.list)
  const fullscreenList = (fullscreenRes.data as { data?: FullscreenAdvertItem[] })?.data
  fullscreenAdvertOptions.value = mapFullscreenAdvert(fullscreenList)
}

// 切换资源位类型：同步子类型、清空会员图和跳转 id，保持字段语义一致
const handleAdTypeChange = () => {
  syncTypeOptions()
  form.vip_img = ''
  form.no_vip_img = ''
  form.lessions_id = ''

  // 非全屏类型不需要挽留/二次全屏等全屏专属配置，一并重置
  if (!isFullscreen.value) {
    form.is_cancel = 0
    form.is_second_full = 0
    form.second_full_id = ''
    form.cancel_sku_id = ''
    form.cancel_image = ''
    form.cancel_color = ''
    form.cancel_close_img = ''
    form.upgrade_id = ''
  }
}

// 关闭挽留时清掉相关字段，避免保存时带上无效值
const handleCancelChange = (value: 0 | 1) => {
  if (value === 0) {
    form.cancel_sku_id = ''
    form.cancel_image = ''
    form.cancel_color = ''
    form.cancel_close_img = ''
  }
}


// ---- SKU 卡片动态增删 ----
const addSku = () => {
  if (form.memo.length >= SKU_MAX_COUNT) {
    ElMessage.warning(`最多支持 ${SKU_MAX_COUNT} 个 SKU`)
    return
  }
  form.memo.push(createEmptySku())
}

const removeSku = (index: number) => {
  form.memo.splice(index, 1)
}

// 切换「多个sku」为"是"时保证至少有一行，编辑回填空数组也能正常渲染
const handleFullTypeChange = (value: 0 | 1) => {
  if (value === 1 && form.memo.length === 0) {
    form.memo = [createEmptySku()]
  }
}

// ---- 弹窗入口 ----
const fetchDetail = async (id: number | string) => {
  const response = await getResourceInfo(id)
  return (response.data || {}) as Record<string, unknown>
}

const openCreate = async () => {
  resetForm()
  dialogVisible.value = true
  await Promise.all([fetchBaseOptions(), fetchEnvDependentOptions()])
}

const openEdit = async (id: number | string) => {
  resetForm()
  currentId.value = id
  dialogMode.value = 'edit'
  dialogVisible.value = true
  detailLoading.value = true

  try {
    await Promise.all([fetchBaseOptions(), fetchEnvDependentOptions()])
    const detail = await fetchDetail(id)
    Object.assign(form, detail)
    // 接口可能返回空 memo，兜底成默认条数保证模板能渲染
    if (!Array.isArray(form.memo) || form.memo.length === 0) {
      form.memo = [createEmptySku()]
    }
    syncTypeOptions()
  } finally {
    detailLoading.value = false
  }
}

const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  dialogVisible.value = true
  detailLoading.value = true

  try {
    await Promise.all([fetchBaseOptions(), fetchEnvDependentOptions()])
    const detail = await fetchDetail(id)
    Object.assign(form, detail)
    if (!Array.isArray(form.memo) || form.memo.length === 0) {
      form.memo = [createEmptySku()]
    }
    syncTypeOptions()
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 非多sku场景不提交 memo，避免无效数据落库
const getSubmitPayload = () => {
  const { id, ...rest } = form
  void id
  return {
    ...rest,
    memo: form.full_type === 1 ? form.memo : [],
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = getSubmitPayload()
    if (dialogMode.value === 'edit' && currentId.value) {
      await editResource(currentId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await addResource(payload)
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
    top="1%"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-width="auto"
      label-position="left"
    >
      <!-- 基础信息 -->
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" style="width: 70%" />
      </el-form-item>

      <el-form-item label="资源位类型" prop="alert_type">
        <el-select-v2
          v-model="form.alert_type"
          :options="adTypeList"
          placeholder="请选择资源位类型"
          clearable
          filterable
          style="width: 70%"
          @change="handleAdTypeChange"
        >
        </el-select-v2>
      </el-form-item>

      <el-form-item v-if="typeOptions.length" label="配置类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio
            v-for="item in typeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 全屏独有：补差 sku -->
      <el-form-item v-if="isFullscreen" label="补差sku">
        <el-select-v2
          v-model="form.upgrade_id"
          :options="upgradeSkuOptions"
          placeholder="请选择补差sku"
          clearable
          filterable
          style="width: 60%"
        />
      </el-form-item>

      <!-- 会员卡片图 -->
      <template v-if="isMembershipCard">
        <el-form-item label="会员图">
          <uploadImage v-model="form.vip_img" :fileSize="500"  />
        </el-form-item>
        <el-form-item label="非会员图">
          <uploadImage v-model="form.no_vip_img" :fileSize="500"  />
        </el-form-item>
      </template>

      <!-- 多 SKU 配置 -->
      <el-divider content-position="left">是否有sku</el-divider>
      <el-form-item label="是否有sku">
        <el-radio-group v-model="form.full_type" @change="handleFullTypeChange">
          <el-radio
            v-for="item in SWITCH_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.full_type === 1">
        <el-form-item label="横竖版">
          <el-radio-group v-model="form.style">
            <el-radio
              v-for="item in STYLE_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- SKU 列表：每个 SKU 一张 el-card，内部按行拆分（skuId / 选中状态 / 两张图），删除在卡片右上角 -->
        <el-form-item label="SKU 列表">
          <div class="sku-list">
            <el-card
              v-for="(sku, index) in form.memo"
              :key="index"
              class="sku-card"
            >
              <template #header>
                <div class="sku-card__header">
                  <span class="sku-card__title">sku{{ index + 1 }}</span>
                  <el-button
                    v-if="form.memo.length > 1"
                    link
                    type="danger"
                    :icon="Delete"
                    @click="removeSku(index)"
                  >
                    删除
                  </el-button>
                </div>
              </template>

              <!-- 第一行：sku 配置，复用 config.ts 的 getSkuList 拉取下拉 -->
              <el-form-item label="skuId">
                <el-select-v2
                  v-model="sku.sku_id"
                  :options="skuOptions"
                  placeholder="请选择sku"
                  clearable
                  filterable
                  style="width: 100%"
                />
              </el-form-item>

              <!-- 第二行：选中状态 -->
              <el-form-item label="选中状态"  class="m-t-10">
                <el-radio-group v-model="sku.checked">
                  <el-radio :value="true">选中</el-radio>
                  <el-radio :value="false">未选中</el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 第三行：未选中图 + 选中图 -->
              <el-form-item label="配图"  class="m-t-10">
                <div class="sku-card__images">
                  <div class="sku-card__image">
                    <uploadImage v-model="sku.background_default" size="small" />
                    <span class="sku-card__caption">未选中图</span>
                  </div>
                  <div class="sku-card__image">
                    <uploadImage v-model="sku.background_checked" size="small" />
                    <span class="sku-card__caption">选中图</span>
                  </div>
                </div>
              </el-form-item>
            </el-card>

            <!-- 添加按钮放在底部，不占满宽度 -->
            <div class="sku-list__footer">
              <el-button
                v-if="form.memo.length < SKU_MAX_COUNT"
                type="primary"
                plain
                :icon="Plus"
                @click="addSku"
              >
                添加 SKU
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="底部配图">
          <uploadImage v-model="form.bottom_img" :fileSize="500"  />
        </el-form-item>
        <el-form-item label="小图标配图">
          <uploadImage v-model="form.small_img" />
        </el-form-item>
      </template>

      <!-- 通用配置 -->
      <el-divider content-position="left">通用配置</el-divider>
      <el-form-item label="选择分群">
        <el-select-v2
          v-model="form.user_group_id"
          :options="userGroupOptions"
          placeholder="请选择分群"
          clearable
          filterable
          style="width: 60%"
        />
      </el-form-item>

      <el-form-item label="背景图">
        <uploadImage v-model="form.banner" :fileSize="700" />
      </el-form-item>

      <el-form-item label="背景色">
        <el-color-picker v-model="form.content_bg_color" />
      </el-form-item>

      <el-form-item label="标签">
        <el-radio-group v-model="form.label">
          <el-radio
            v-for="item in LABEL_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 跳转配置：全屏用 sku 下拉，其它类型用跳转类型 + 跳转地址 -->
      <el-form-item v-if="isFullscreen" label="sku_id">
        <el-select-v2
          v-model="form.lessions_id"
          :options="skuOptions"
          placeholder="请选择sku"
          clearable
          filterable
          style="width: 70%"
        />
      </el-form-item>

      <template v-else>
        <el-form-item label="跳转类型">
          <el-radio-group v-model="form.link_type">
            <el-radio
              v-for="item in jumpTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="跳转方式">
          <el-input
            v-model="form.lessions_id"
            placeholder="课程/活动ID 或完整网址"
            style="width: 70%"
          />
        </el-form-item>
      </template>

      <!-- 全屏专属：挽留 / 二次全屏 -->
      <template v-if="isFullscreen">
        <el-divider content-position="left">挽留与二次全屏</el-divider>
        <el-form-item label="是否有挽留">
          <el-radio-group v-model="form.is_cancel" @change="handleCancelChange">
            <el-radio :value="1">有</el-radio>
            <el-radio :value="0">没有</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.is_cancel === 1">
          <el-form-item label="挽留SKU">
            <el-select-v2
              v-model="form.cancel_sku_id"
              :options="skuOptions"
              placeholder="请选择挽留sku"
              clearable
              filterable
              style="width: 60%"
            />
          </el-form-item>
          <el-form-item label="挽留图片">
            <uploadImage v-model="form.cancel_image" :fileSize="700"  />
          </el-form-item>
          <el-form-item label="挽留底部背景色">
            <el-color-picker v-model="form.cancel_color" />
          </el-form-item>
          <el-form-item label="挽留关闭图">
            <uploadImage v-model="form.cancel_close_img" />
          </el-form-item>
        </template>

        <el-form-item label="是否有二次全屏">
          <el-radio-group v-model="form.is_second_full">
            <el-radio :value="1">有</el-radio>
            <el-radio :value="0">没有</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.is_second_full === 1" label="二次全屏ID">
          <el-select-v2
            v-model="form.second_full_id"
            :options="fullscreenAdvertOptions"
            placeholder="请选择二次全屏"
            clearable
            filterable
            style="width: 60%"
          />
        </el-form-item>

        <el-form-item label="全屏关闭图">
          <uploadImage v-model="form.close_img" />
        </el-form-item>
      </template>

      <!-- 动效（alert_type === 3） -->
      <template v-if="isMotionType">
        <el-divider content-position="left">动效配置</el-divider>
        <el-form-item label="动效">
          <uploadImage v-model="form.motion_img" />
        </el-form-item>
        <el-form-item label="动效循环次数">
          <el-input-number v-model="form.motion_num" :min="0" />
        </el-form-item>
      </template>

      <!-- 发布配置 -->
      <el-divider content-position="left">发布配置</el-divider>
      <el-form-item label="平台">
        <el-checkbox-group v-model="form.channel">
          <el-checkbox
            v-for="item in CHANNEL_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">进行中</el-radio>
          <el-radio :value="0">下架</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="生效环境" prop="env">
        <el-radio-group v-model="form.env" :options="ENV_OPTIONS" >
          <el-radio
            v-for="item in ENV_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="开始时间">
        <el-date-picker
          v-model="form.start_time"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择开始时间"
        />
      </el-form-item>

      <el-form-item label="结束时间">
        <el-date-picker
          v-model="form.end_time"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择结束时间"
        />
      </el-form-item>

      <el-form-item label="排序">
        <el-input-number v-model="form.sequence" :min="1" />
      </el-form-item>

      <!-- 全屏/底部条才有频次相关字段 -->
      <template v-if="form.alert_type === 1 || form.alert_type === 2">
        <el-form-item label="弹窗频次">
          <el-input-number v-model="form.rate_num" :min="0" :max="14" />
        </el-form-item>
        <el-form-item label="每日展示次数">
          <el-input-number v-model="form.day_show_times" :min="0" :max="14" />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.sku-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.sku-card {
  border-radius: 10px;
}

.sku-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sku-card__title {
  font-weight: 600;
  color: var(--el-color-primary);
}

.sku-card__images {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.sku-card__image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sku-card__caption {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sku-list__footer {
  display: flex;
  justify-content: flex-start;
}
</style>
