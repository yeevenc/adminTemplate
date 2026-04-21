<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { ApiResponseData } from '@/utils/request'
import {
  getRetainConfigList,
  addRetainConfig,
  editRetainConfig,
} from '@/api/operation'
import uploadImage from '@/components/upload/uploadImage.vue'

interface RetainItem {
  id: number | string
  image_url: string
  status: 0 | 1
  created_at: string
}

interface RetainListResponse {
  list: RetainItem[]
  total: number
}

const STATUS_OPTIONS = [
  { label: '下线', value: 0 },
  { label: '上线', value: 1 },
]

const drawerVisible = ref(false)
const loading = ref(false)
const tableData = ref<RetainItem[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 表单弹窗
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const formRef = ref()

const defaultForm = (): { id?: number | string; image_url: string; status: 0 | 1 } => ({
  image_url: '',
  status: 0,
})
const form = reactive(defaultForm())

const dialogTitle = computed(() => (isEdit.value ? '编辑挽留配置' : '添加挽留配置'))

const fetchTableData = async () => {
  loading.value = true
  try {
    const res = await getRetainConfigList({
      page: pagination.page,
      page_size: pagination.pageSize,
    }) as ApiResponseData<RetainListResponse>
    tableData.value = Array.isArray(res.data?.list) ? res.data.list : []
    pagination.total = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchTableData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

const openCreate = () => {
  isEdit.value = false
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

const openEdit = (row: RetainItem) => {
  isEdit.value = true
  Object.assign(form, { id: row.id, image_url: row.image_url, status: row.status })
  dialogVisible.value = true
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  Object.assign(form, defaultForm())
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  submitLoading.value = true
  try {
    if (isEdit.value && form.id !== undefined) {
      await editRetainConfig(form.id, { image_url: form.image_url, status: form.status })
      ElMessage.success('修改成功')
    } else {
      await addRetainConfig({ image_url: form.image_url, status: form.status })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchTableData()
  } finally {
    submitLoading.value = false
  }
}

const open = () => {
  drawerVisible.value = true
  fetchTableData()
}

defineExpose({ open })
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="订阅中心挽留配置"
    size="80%"
    destroy-on-close
  >
    <div class="retain-drawer">
      <el-button :icon="Plus" type="primary" plain @click="openCreate">添加</el-button>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        class="m-t-10"
        style="height: calc(100vh - 240px)"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="挽留图片" min-width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.image_url"
              :src="row.image_url"
              :preview-src-list="[row.image_url]"
              preview-teleported
              style="height: 48px; width: 48px; object-fit: scale-down;"
            />
            <span v-else>暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '上线中' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="175" />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="m-t-10"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[30, 50, 100]"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-drawer>

  <!-- 新增/编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    @close="handleDialogClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      label-width="auto"
      label-position="left"
    >
      <el-form-item
        label="挽留图片"
        prop="image_url"
        :rules="[{ required: true, message: '请上传挽留图片', trigger: 'change' }]"
      >
        <uploadImage v-model="form.image_url" size="small" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio
            v-for="item in STATUS_OPTIONS"
            :key="item.value"
            :value="item.value"
          >{{ item.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.retain-drawer {
  display: flex;
  flex-direction: column;
}
</style>
