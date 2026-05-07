<script setup lang="ts" name="alipayMerchant">
defineOptions({ name: 'alipayMerchant' })
import { Edit ,Switch} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import {
  editAlipayMerchantConfig,
  getAlipayMerchantList,
  getAlipayMerchantNo,
  getSingleYearPayStatus,
  toggleSingleYearPayStatus,
} from '@/api/setting'

type PayType = '1' | '2'

interface MerchantItem {
  id: number
  conf_name_title: string
  conf_value: string
  merchantName: string
  updated_at: string
}

interface MerchantOption {
  auth_app_id: number | string
  merchantName: string
}

interface MerchantListResponse {
  list: MerchantItem[] | ''
  count?: number
  total?: number
}

interface EditForm {
  id: number
  title: string
  auth_app_id: number | string
}

interface PayStatusForm {
  status: 0 | 1
}

const tabList: Array<{ label: string; value: PayType }> = [
  { label: 'aliPay', value: '1' },
  { label: 'weChatPay', value: '2' },
]

const activeTab = ref<PayType>('1')
const loading = ref(false)
const tableData = ref<MerchantItem[]>([])
const shopList = ref<MerchantOption[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const editDialogVisible = ref(false)
const editSubmitLoading = ref(false)
const editForm = reactive<EditForm>({
  id: 0,
  title: '',
  auth_app_id: '',
})

const payDialogVisible = ref(false)
const payStatusLoading = ref(false)
const paySubmitLoading = ref(false)
const payForm = reactive<PayStatusForm>({
  status: 0,
})

// 重置编辑弹窗表单，避免不同商户之间残留上一次数据
const resetEditForm = () => {
  editForm.id = 0
  editForm.title = ''
  editForm.auth_app_id = ''
}

// 获取当前分页和支付类型下的商户配置列表
const fetchTableData = async () => {
  loading.value = true

  try {
    const response = await getAlipayMerchantList({
      page: pagination.page,
      page_size: pagination.pageSize,
      type: activeTab.value,
    }) as ApiResponseData<MerchantListResponse>

    const list = Array.isArray(response.data?.list) ? response.data.list : []
    tableData.value = list
    pagination.total = response.data?.count ?? response.data?.total ?? list.length
  } finally {
    loading.value = false
  }
}

// 获取当前 tab 对应的可选商户号列表
const fetchShopList = async () => {
  const response = await getAlipayMerchantNo({ type: activeTab.value }) as ApiResponseData<MerchantOption[]>
  shopList.value = Array.isArray(response.data) ? response.data : []
}

// 切换支付类型后，重置分页并重新拉取列表和商户号
const handleTabChange = () => {
  pagination.page = 1
  fetchTableData()
  fetchShopList()
}

// 分页大小变更
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchTableData()
}

// 当前页变更
const handleCurrentPageChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

// 打开编辑弹窗，并用当前行数据做基础回填
const handleEdit = (row: MerchantItem) => {
  editForm.id = row.id
  editForm.title = row.conf_name_title
  editForm.auth_app_id = row.conf_value ? Number(row.conf_value) : ''
  editDialogVisible.value = true
}

// 关闭编辑弹窗并重置表单
const handleCloseEdit = () => {
  editDialogVisible.value = false
  resetEditForm()
}

// 保存商户配置，只提交商户号和当前支付类型
const handleSubmitEdit = async () => {
  if (!editForm.auth_app_id) {
    ElMessage.warning('请选择商户号')
    return
  }

  editSubmitLoading.value = true

  try {
    await editAlipayMerchantConfig(editForm.id, {
      auth_app_id: editForm.auth_app_id,
      type: activeTab.value,
    })
    ElMessage.success('保存成功')
    handleCloseEdit()
    fetchTableData()
  } finally {
    editSubmitLoading.value = false
  }
}

// 打开单年支付切换弹窗前，先读取当前状态
const handleOpenPayDialog = async () => {
  payStatusLoading.value = true

  try {
    const response = await getSingleYearPayStatus({ type: activeTab.value }) as ApiResponseData<{ status: 0 | 1 }>
    payForm.status = (response.data?.status ?? 0) as 0 | 1
    payDialogVisible.value = true
  } finally {
    payStatusLoading.value = false
  }
}

// 关闭单年支付切换弹窗
const handleClosePayDialog = () => {
  payDialogVisible.value = false
}

// 保存单年支付开关状态
const handleSubmitPayStatus = async () => {
  paySubmitLoading.value = true

  try {
    await toggleSingleYearPayStatus({
      status: payForm.status,
      type: activeTab.value,
    })
    ElMessage.success('保存成功')
    handleClosePayDialog()
  } finally {
    paySubmitLoading.value = false
  }
}

onMounted(() => {
  fetchTableData()
  fetchShopList()
})
</script>

<template>
  <div class="alipay-merchant-page">
     <el-segmented v-model="activeTab" :options="tabList" @change="handleTabChange" />
    <el-card shadow="never" class="glass-card">
      <!-- <el-tabs v-model="activeTab" stretch type="border-card" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="item in tabList"
          :key="item.value"
          :label="item.label"
          :name="item.value"
        > -->
            <el-button type="primary" plain :icon="Switch" :loading="payStatusLoading" @click="handleOpenPayDialog">
              单年支付切换
            </el-button>
          <el-table v-loading="loading" stripe border :data="tableData"  class="m-t-10" style="height: calc(100vh - 310px);">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="conf_name_title" label="名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="conf_value" label="商户号" min-width="180" show-overflow-tooltip />
            <el-table-column prop="merchantName" label="商户名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="updated_at" label="更新时间" min-width="180" />
            <el-table-column label="操作" align="center" fixed="right" width="100">
              <template #default="{ row }">
                <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            class="m-t-10"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :page-sizes="[10, 20, 30, 50, 100]"
            :total="pagination.total"
            @size-change="handlePageSizeChange"
            @current-change="handleCurrentPageChange"
          />
        <!-- </el-tab-pane>
      </el-tabs> -->
    </el-card>

    <el-dialog
      :model-value="editDialogVisible"
      title="修改"
      width="50%"
      destroy-on-close
      @close="handleCloseEdit"
    >
      <el-form label-width="auto" position="left">
        <el-form-item label="名称">
          <el-tag>{{ editForm.title }}</el-tag>
        </el-form-item>
        <el-form-item label="商户号">
          <el-select
            v-model="editForm.auth_app_id"
            placeholder="请选择商户号"
            clearable
            style="width: 80%;"
          >
            <el-option
              v-for="item in shopList"
              :key="item.auth_app_id"
              :label="item.merchantName"
              :value="item.auth_app_id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseEdit">取消</el-button>
        <el-button :loading="editSubmitLoading" type="primary" @click="handleSubmitEdit">保存</el-button>
      </template>
    </el-dialog>    

    <el-dialog
      :model-value="payDialogVisible"
      title="单年支付切换"
      width="50%"
      destroy-on-close
      @close="handleClosePayDialog"
    >
      <el-alert
        :closable="false"
        title="开启单年支付，只是针对主商户被封后，切换单次支付"
        type="warning"
      />      
      <el-form label-width="120px" class="pay-form">
        <el-form-item label="状态">
          <el-radio-group v-model="payForm.status">
            <el-radio :value="0">关闭</el-radio>
            <el-radio :value="1">开启</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClosePayDialog">取消</el-button>
        <el-button :loading="paySubmitLoading" type="primary" @click="handleSubmitPayStatus">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.alipay-merchant-page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
 .el-segmented {
  --el-segmented-item-selected-bg-color: var(--el-color-primary);
  --el-border-radius-base: 16px;
}
</style>
