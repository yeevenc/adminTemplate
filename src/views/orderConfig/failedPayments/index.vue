<script setup lang="ts">
defineOptions({ name: 'failedPayments' })

import { Edit, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import {
  getFailedPaymentList,
  getOrderByOrderId,
  updateFailedPaymentUser,
} from '@/api/orderConfig'

interface FailedPaymentItem {
  id: number | string
  uid: number | string
  phone: string
  diff_day: number | string
  vip_name: string
  status_name: string
  customer: number
  order_id: string
  created_at: string
  [key: string]: unknown
}

interface FailedPaymentListResponse {
  list?: FailedPaymentItem[]
  data?: FailedPaymentItem[]
  total?: number | string
}

interface OrderDetailItem {
  uid: number | string
  order_title: string
  sku_id: number | string
  duration: number
  platform: string
  pay_price: number | string
  pay_time: string
  pay_type: number
  pay_status: number
  mark: string
  [key: string]: unknown
}

const CALL_STATUS_OPTIONS = [
  { label: '未打电话', value: 0 },
  { label: '已打电话', value: 1 },
]

const CUSTOMER_OPTIONS = [
  { label: '罗献娇', value: 100 },
  { label: '柳国强', value: 101 },
  { label: '拜笑鸽', value: 102 },
]

const CUSTOMER_MAP: Record<number, string> = {
  0: '暂无',
  100: '罗献娇',
  101: '柳国强',
  102: '拜笑鸽',
}

const PAY_TYPE_MAP: Record<number, string> = {
  1: '支付宝',
  2: '微信',
  3: 'inapp_ios',
}

const loading = ref(false)
const tableData = ref<FailedPaymentItem[]>([])

const queryForm = reactive({
  uid: '',
  order_id: '',
  phone: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 下单详情弹窗
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const orderDetail = ref<OrderDetailItem | null>(null)

// 编辑弹窗
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editLoadingId = ref<number | string | null>(null)
const editFormRef = ref<FormInstance>()
const editForm = reactive({
  id: null as number | string | null,
  status: 0,
  customer: 100,
})

const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  uid: queryForm.uid.trim(),
  order_id: queryForm.order_id.trim(),
  phone: queryForm.phone.trim(),
})

const resolveList = (data: FailedPaymentListResponse | FailedPaymentItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (
  data: FailedPaymentListResponse | FailedPaymentItem[] | undefined,
  list: FailedPaymentItem[],
) => {
  if (Array.isArray(data)) return list.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getFailedPaymentList(getListParams())) as ApiResponseData<
      FailedPaymentListResponse | FailedPaymentItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
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

// 查看下单详情
const handleViewDetail = async (orderId: string) => {
  detailDialogVisible.value = true
  detailLoading.value = true
  orderDetail.value = null
  try {
    const response = (await getOrderByOrderId({
      page: 1,
      page_size: 1,
      order_id: orderId,
    })) as ApiResponseData<{ list?: OrderDetailItem[]; data?: OrderDetailItem[] }>
    const resData = response.data as { list?: OrderDetailItem[]; data?: OrderDetailItem[] }
    const list = Array.isArray(resData?.list) ? resData.list : Array.isArray(resData?.data) ? resData.data : []
    orderDetail.value = list[0] || null
  } finally {
    detailLoading.value = false
  }
}

// 打开编辑弹窗
const handleEdit = (row: FailedPaymentItem) => {
  editLoadingId.value = row.id
  editForm.id = row.id
  editForm.status = typeof row.status === 'number' ? row.status : 0
  editForm.customer = typeof row.customer === 'number' ? row.customer : 100
  editDialogVisible.value = true
  editLoadingId.value = null
}

const handleEditClose = () => {
  editDialogVisible.value = false
  editFormRef.value?.clearValidate()
}

const handleEditSubmit = async () => {
  if (!editForm.id) return
  editLoading.value = true
  try {
    await updateFailedPaymentUser(editForm.id, {
      status: editForm.status,
      customer: editForm.customer,
    })
    ElMessage.success('保存成功')
    handleEditClose()
    fetchTableData()
  } finally {
    editLoading.value = false
  }
}

const getCustomerName = (customer: number) => CUSTOMER_MAP[customer] ?? '暂无'

const getPayTypeName = (payType: number) => PAY_TYPE_MAP[payType] ?? '-'

const getDuration = (seconds: number) => {
  if (!seconds) return '-'
  return `${Math.round(seconds / 86400)} 天`
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div>
    <el-card shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="用户ID">
          <el-input
            v-model="queryForm.uid"
            clearable
            placeholder="请输入用户ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="订单号">
          <el-input
            v-model="queryForm.order_id"
            clearable
            placeholder="请输入订单号"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="用户手机号">
          <el-input
            v-model="queryForm.phone"
            clearable
            placeholder="请输入用户手机号"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="m-t-10">
      <el-table v-loading="loading" :data="tableData" border stripe style="height: calc(100vh - 330px);">
        <el-table-column prop="uid" label="用户ID" width="100" />
        <el-table-column prop="phone" label="用户手机号" width="130" />
        <el-table-column prop="diff_day" label="注册距今(天)" width="130" />
        <el-table-column prop="vip_name" label="会员身份" width="120" />
        <el-table-column label="是否联系过用户" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.status_name === '是'" style="color: #4dca6a">是</span>
            <span v-else style="color: #f56c6c">否</span>
          </template>
        </el-table-column>
        <el-table-column label="联系人" width="110">
          <template #default="{ row }">
            {{ getCustomerName(row.customer) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="handleViewDetail(row.order_id)"
            >
              下单详情
            </el-button>
            <el-button
              link
              type="warning"
              :icon="Edit"
              :loading="editLoadingId === row.id"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
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
    </el-card>

    <!-- 下单详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="下单详情" width="500px">
      <div v-loading="detailLoading">
        <el-descriptions v-if="orderDetail" :column="1" border label-width="100px">
          <el-descriptions-item label="用户ID">{{ orderDetail.uid }}</el-descriptions-item>
          <el-descriptions-item label="订单标题">{{ orderDetail.order_title }}</el-descriptions-item>
          <el-descriptions-item label="产品ID">{{ orderDetail.sku_id }}</el-descriptions-item>
          <el-descriptions-item label="会员时长">{{ getDuration(orderDetail.duration) }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ orderDetail.platform }}</el-descriptions-item>
          <el-descriptions-item label="支付金额">¥{{ orderDetail.pay_price }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ orderDetail.pay_time }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPayTypeName(orderDetail.pay_type) }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <span v-if="orderDetail.pay_status === 0" style="color: #f56c6c">失败</span>
            <span v-else style="color: #4dca6a">成功</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ orderDetail.mark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else-if="!detailLoading" description="暂无数据" />
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑" width="420px" @close="handleEditClose">
      <el-form
        ref="editFormRef"
        :model="editForm"
        label-width="auto"
        label-position="left"
      >
        <el-form-item label="是否打电话">
          <el-radio-group v-model="editForm.status">
            <el-radio
              v-for="item in CALL_STATUS_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="操作人">
          <el-radio-group v-model="editForm.customer">
            <el-radio
              v-for="item in CUSTOMER_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleEditClose">取消</el-button>
        <el-button :loading="editLoading" type="primary" @click="handleEditSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
