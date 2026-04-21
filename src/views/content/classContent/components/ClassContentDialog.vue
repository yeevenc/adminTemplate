<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import {getSkuList} from '@/api/config'
import { addCourse, getCourseDetail, updateCourse } from '@/api/content'
import { getMediaDuration } from '@/utils/media'
import { selectListData, type SelectListItem, type SelectOption } from '@/utils/useConfig'

interface CourseTypeItem {
  id: number | string
  name: string
}

interface CourseFormState {
  title: string
  subtitle: string
  type_subcat: string
  video_url: string
  thumb_img: string
  main_duration: number | string
  pre_duration: number | string
  type: number | string
  small_type: number | string
  course_introduce: string
  small_img: string
  color_value: string
  is_free: number
  is_new: number
  user_scene: number
  status: number
  display_time: string
  sku_id: string
  sequence: number
}

const props = defineProps<{
  courseTypeOptions: CourseTypeItem[]
}>()

const emit = defineEmits<{
  success: []
}>()

const SMALL_TYPE_MAP: Record<number, SelectListItem[]> = {
  3: [
    { id: 1, name: '疗愈钢琴' },
    { id: 2, name: '雨的旋律' },
    { id: 3, name: '摇篮曲' },
    { id: 4, name: '催眠音乐' },
    { id: 5, name: '竖琴' },
  ],
  4: [
    { id: 1, name: '大自然声' },
    { id: 2, name: '雨声' },
    { id: 3, name: 'ASMR' },
    { id: 4, name: '动物' },
    { id: 5, name: '城市' },
    { id: 6, name: '生活之声' },
    { id: 7, name: '电子噪音' },
    { id: 8, name: '哄睡' },
    { id: 9, name: '课堂' },
  ],
  5: [
    { id: 1, name: '童话故事' },
    { id: 2, name: '旅行游记' },
    { id: 3, name: '奇幻之旅' },
    { id: 4, name: '国风古韵' },
    { id: 5, name: '治愈梦境' },
  ],
}

const getDefaultForm = (): CourseFormState => ({
  title: '',
  subtitle: '',
  type_subcat: 'singles',
  video_url: '',
  thumb_img: '',
  main_duration: '',
  pre_duration: '',
  type: 1,
  small_type: 1,
  course_introduce: '',
  small_img: '',
  color_value: '',
  is_free: 1,
  is_new: 1,
  user_scene: 1,
  status: 1,
  display_time: '',
  sku_id: '',
  sequence: 0 ,
})

const dialogVisible = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)
const currentId = ref<number | string | null>(null)
const dialogMode = ref<'create' | 'edit' | 'copy'>('create')
const formRef = ref<FormInstance>()
const form = reactive<CourseFormState>(getDefaultForm())
const skuOptions = ref<SelectOption[]>([])
const smallTypeOptions = ref<SelectOption[]>(selectListData(SMALL_TYPE_MAP[1]))

const hasSmallType = computed(() => [3, 4, 5].includes(Number(form.type)))
const isSingles = computed(() => form.type_subcat === 'singles')
const isWhiteNoise = computed(() => Number(form.type) === 4)
const courseTypeOptionsData = computed<SelectOption[]>(() => selectListData(props.courseTypeOptions))

const rules: FormRules<CourseFormState> = {
  title: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  video_url: [
    {
      validator: (_rule, value, callback) => {
        if (form.type_subcat === 'singles' && !String(value || '').trim()) {
          callback(new Error('请上传音频'))
          return
        }

        callback()
      },
      trigger: 'change',
    },
  ],
}

// 重置表单，避免新增和编辑之间残留旧数据
const resetForm = () => {
  Object.assign(form, getDefaultForm())
  currentId.value = null
  dialogMode.value = 'create'
  smallTypeOptions.value = selectListData(SMALL_TYPE_MAP[Number(form.type)] || [])
  formRef.value?.clearValidate()
}

// 获取 SKU 列表后直接用 selectListData 处理成虚拟选择器选项
const fetchSkuOptions = async () => {
  const response = await getSkuList()
  skuOptions.value = response.data
}

// 课程类型切换后，直接按你给的小分类模板更新小分类选项
const handleTypeChange = () => {
  smallTypeOptions.value = selectListData(SMALL_TYPE_MAP[Number(form.type)] || [])
}

// 新增时先获取 SKU 列表，再打开弹窗
const openCreate = async () => {
  resetForm()
  dialogMode.value = 'create'
  await fetchSkuOptions()
  dialogVisible.value = true
}

// 编辑时先获取 SKU 列表，再获取详情
const openEdit = async (id: number | string) => {
  resetForm()
  currentId.value = id
  dialogMode.value = 'edit'
  detailLoading.value = true

  try {
    await fetchSkuOptions()
    dialogVisible.value = true
    const response = await getCourseDetail(Number(id)) as { data: Record<string, unknown> }
    Object.assign(form, response.data || {})
    handleTypeChange()
  } finally {
    detailLoading.value = false
  }
}

// 复制时同样取详情回填，但保存走添加接口
const openCopy = async (id: number | string) => {
  resetForm()
  dialogMode.value = 'copy'
  detailLoading.value = true

  try {
    await fetchSkuOptions()
    dialogVisible.value = true
    const response = await getCourseDetail(Number(id)) as { data: Record<string, unknown> }
    Object.assign(form, response.data || {})
    handleTypeChange()
  } finally {
    detailLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 提交前统一清理不同类型下无效的字段
const getSubmitData = () => {
  const data: Record<string, unknown> = { ...form }

  if (form.type_subcat === 'subcat') {
    data.video_url = ''
    data.main_duration = ''
    data.pre_duration = ''
  } else {
    data.course_introduce = ''
  }

  if (Number(form.type) !== 4) {
    data.small_img = ''
    data.color_value = ''
  }

  return data
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  submitLoading.value = true

  try {
    const data = getSubmitData()

    if (dialogMode.value === 'edit' && currentId.value) {
      await updateCourse(Number(currentId.value), data)
      ElMessage.success('修改成功')
    } else {
      await addCourse(data)
      ElMessage.success(dialogMode.value === 'copy' ? '复制成功' : '添加成功')
    }

    handleClose()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

const handleTypeSubcatChange = () => {
  if (form.type_subcat === 'subcat') {
    form.video_url = ''
    form.main_duration = ''
    form.pre_duration = ''
  }

  formRef.value?.validateField('video_url').catch(() => undefined)
}

// 上传音视频成功后自动回填时长
const handleMediaUploadSuccess = async (file: any) => {
  try {
    const source = file?.raw || file?.response?.data || file?.url

    if (!source) {
      return
    }

    form.main_duration = await getMediaDuration(source)
  } catch {
    ElMessage.warning('未能自动获取音视频时长，请手动填写')
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
    :title="dialogMode === 'edit' ? '修改课程' : dialogMode === 'copy' ? '复制课程' : '添加课程'"
    width="70%"
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
      <el-form-item label="课程名称" required prop="title">
        <el-input v-model="form.title" placeholder="请输入课程名称" />
      </el-form-item>

      <el-form-item label="副标题">
        <el-input v-model="form.subtitle" placeholder="请输入副标题" />
      </el-form-item>

      <el-form-item label="课程类型">
        <el-radio-group v-model="form.type" @change="handleTypeChange">
          <el-radio
            v-for="item in courseTypeOptionsData"
            :key="item.value"
            :value="item.value"
          >
            {{item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="课程子类型">
        <el-radio-group v-model="form.type_subcat" @change="handleTypeSubcatChange">
          <el-radio value="singles">单曲</el-radio>
          <el-radio value="subcat">合集</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="hasSmallType" label="小分类">
        <el-radio-group v-model="form.small_type">
          <el-radio
            v-for="item in smallTypeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="isSingles" label="音频文件" required prop="video_url">
        <uploadFile
          v-model="form.video_url"
          @file-change="handleMediaUploadSuccess"
          @success="handleMediaUploadSuccess"
        />
      </el-form-item>

      <el-form-item v-if="isSingles" label="音频时长(秒)">
        <el-input v-model="form.main_duration" placeholder="上传音频自动获取" />
      </el-form-item>

      <el-form-item v-if="isSingles" label="试听时长(秒)">
        <el-input v-model="form.pre_duration" placeholder="请输入试听时长" />
      </el-form-item>

      <el-form-item label="封面图">
        <uploadImage v-model="form.thumb_img" />
      </el-form-item>

      <el-form-item v-if="isWhiteNoise" label="白噪音图标">
        <uploadImage v-model="form.small_img" />
      </el-form-item>

      <el-form-item v-if="!isSingles" label="课程介绍图">
        <uploadImage v-model="form.course_introduce" />
      </el-form-item>

      <el-form-item v-if="isWhiteNoise" label="白噪音色值">
        <el-color-picker v-model="form.color_value" />
      </el-form-item>

      <el-form-item label="是否免费">
        <el-radio-group v-model="form.is_free">
          <el-radio :value="1">免费</el-radio>
          <el-radio :value="2">付费</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="SKU ID">
        <el-select-v2
          v-model="form.sku_id"
          :options="skuOptions"
          placeholder="请选择SKU"
          clearable
          filterable
        />
      </el-form-item>

      <el-form-item label="是否上新">
        <el-radio-group v-model="form.is_new">
          <el-radio :value="1">是</el-radio>
          <el-radio :value="2">否</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="上新结束时间">
        <el-date-picker
          v-model="form.display_time"
          type="datetime"
          placeholder="请选择上新结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="会员计划">
        <el-radio-group v-model="form.user_scene">
          <el-radio :value="1">不参与</el-radio>
          <el-radio :value="2">参与</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="2">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序">
        <el-input-number :min="0" v-model="form.sequence" placeholder="请输入排序值" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
</style>
