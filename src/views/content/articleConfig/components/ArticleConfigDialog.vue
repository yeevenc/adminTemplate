<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ref } from 'vue'
import {
  addArticleConfig,
  getArticleConfigDetail,
  updateArticleConfig,
} from '@/api/content'


interface ArticleFormState {
  title: string
  subtitle: string
  url: string
  img: string
  status: 1 | 2
  sequence: number
  home_page_seq: number
}

const emit = defineEmits<{
  success: []
}>()

const dialogVisible = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = ref<ArticleFormState>({
  title: '',
  subtitle: '',
  url: '',
  img: '',
  status: 1,
  sequence: 0,
  home_page_seq: 0,
})

const rules: FormRules<ArticleFormState> = {
  title: [{ required: true, message: '请输入主标题', trigger: 'blur' }],
  subtitle: [{ required: true, message: '请输入副标题', trigger: 'blur' }],
  url: [{ required: true, message: '请输入文章地址', trigger: 'blur' }],
  img: [{ required: true, message: '请上传封面图', trigger: 'change' }],
}

function resetForm() {
  currentId.value = null
  form.value = {
    title: '',
    subtitle: '',
    url: '',
    img: '',
    status: 1,
    sequence: 0,
    home_page_seq: 0,
  }
  formRef.value?.clearValidate()
}


function openCreate() {
  resetForm()
  dialogVisible.value = true
}

async function openEdit(id: number) {
  resetForm()
  currentId.value = id
  dialogVisible.value = true
  detailLoading.value = true

  try {
    const response = await getArticleConfigDetail(id)
     form.value = response.data 
  } finally {
    detailLoading.value = false
  }
}

function handleClose() {
  dialogVisible.value = false
  resetForm()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  submitLoading.value = true

  try {
    if (currentId.value) {
      await updateArticleConfig(currentId.value, form.value)
      ElMessage.success('修改成功')
    } else {
      await addArticleConfig(form.value)
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
    :title="currentId ? '修改文章' : '添加文章'"
    width="56%"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <el-form-item label="主标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入主标题" />
      </el-form-item>

      <el-form-item label="副标题" prop="subtitle">
        <el-input
          v-model="form.subtitle"
      
          placeholder="请输入副标题"
        />
      </el-form-item>

      <el-form-item label="文章地址" prop="url">
        <el-input v-model="form.url" placeholder="请输入文章地址" />
      </el-form-item>

      <el-form-item label="封面图" prop="img">
        <uploadImage
          v-model="form.img"
          :limit="1"
          :file-size="180"
        />
      </el-form-item>

      <el-form-item label="文章状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">正常</el-radio>
          <el-radio :value="2">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序">
        <el-input-number :min="0" v-model="form.sequence" placeholder="请输入排序" />
      </el-form-item>

      <el-form-item label="首页展示排序">
        <el-input-number :min="0" v-model="form.home_page_seq" placeholder="请输入首页展示排序" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
