<script setup lang="ts" name="manualRefunds">
defineOptions({ name: 'manualRefunds' })

import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import {
  auditManualRefund,
  getManualRefundIp,
  getManualRefundList,
  setManualRefundIp,
} from '@/api/orderConfig'

interface ManualRefundItem {
  id: number | string
  order_id: string
  uid: number | string
  user_name: string
  user_id: string
  pay_price: number | string
  price: number | string
  source_name: string
  refund_source: number | string
  created_at: string
  state_name: string
  status: number
  [key: string]: unknown
}

interface ManualRefundListResponse {
  list?: ManualRefundItem[]
  data?: ManualRefundItem[]
  total?: number | string
}

const REFUND_SOURCE_OPTIONS = [
  { label: '支付宝投诉', value: 1 },
  { label: '七鱼用户反馈退款', value: 2 },
  { label: '工商投诉', value: 3 },
  { label: '黑猫投诉', value: 4 },
  { label: '微信投诉', value: 5 },
  { label: '用户电话', value: 6 },
  { label: '邮件反馈', value: 7 },
  { label: '其他', value: 8 },
]

const RETENTION_TYPE_OPTIONS = [
  { label: '全额挽单', value: 1 },
  { label: '挽留半年', value: 2 },
  { label: '挽留一个月', value: 3 },
  { label: '挽留季卡', value: 4 },
  { label: '半价挽全年', value: 5 },
  { label: '全额退款', value: 9 },
]

const REVIEW_STATUS_OPTIONS = [
  { label: '待审核', value: 0 },
  { label: '审核通过', value: 1 },
  { label: '审核不通过', value: 2 },
]

const loading = ref(false)
const ipDialogVisible = ref(false)
const ipLoading = ref(false)
const tableData = ref<ManualRefundItem[]>([])

const queryForm = reactive({
  order_id: '',
  uid: '',
  retention_type: '' as number | '',
  refund_source: '' as number | '',
  state: 0 as number | '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const ipForm = reactive({
  ip: '',
})

const currentIp = ref('')

// 默认按待审核查询，其他筛选为空时不过滤
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  order_id: queryForm.order_id.trim(),
  uid: queryForm.uid.trim(),
  retention_type: queryForm.retention_type,
  refund_source: queryForm.refund_source,
  state: queryForm.state,
})

const resolveList = (data: ManualRefundListResponse | ManualRefundItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (
  data: ManualRefundListResponse | ManualRefundItem[] | undefined,
  list: ManualRefundItem[],
) => {
  if (Array.isArray(data)) return list.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getManualRefundList(getListParams())) as ApiResponseData<
      ManualRefundListResponse | ManualRefundItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

const fetchIp = async () => {
  const response = await getManualRefundIp() as ApiResponseData<{ conf_value?: string }>
  currentIp.value = response.data?.conf_value || ''
  ipForm.ip = response.data?.conf_value || ''
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

const handleApprove = async (row: ManualRefundItem) => {
  await auditManualRefund(row.id, { status: 1 })
  ElMessage.success('审核成功')
  fetchTableData()
}

const handleReject = async (row: ManualRefundItem) => {
  await auditManualRefund(row.id, { status: 2 })
  ElMessage.success('拒绝成功')
  fetchTableData()
}

const openIpDialog = async () => {
  await fetchIp()
  ipDialogVisible.value = true
}

const handleSaveIp = async () => {
  if (!ipForm.ip.trim()) {
    ElMessage.warning('请输入IP地址')
    return
  }

  ipLoading.value = true
  try {
    await setManualRefundIp({ ip: ipForm.ip.trim() })
    ElMessage.success('设置成功')
    ipDialogVisible.value = false
    await fetchIp()
  } finally {
    ipLoading.value = false
  }
}

onMounted(async () => {
  await fetchIp()
  fetchTableData()
})
</script>

<template>
  <div>
    <el-alert
      title="注意：当前默认展示所有待审核订单，要查看其他状态订单请按条件搜索。"
      type="warning"
      :closable="false"
    />

    <el-card shadow="never" class="m-t-10">
      <el-form :model="queryForm" inline>
        <el-form-item label="订单号">
          <el-input
            v-model="queryForm.order_id"
            clearable
            placeholder="订单号"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="用户ID">
          <el-input
            v-model="queryForm.uid"
            clearable
            placeholder="用户ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="挽单类型">
          <el-select
            v-model="queryForm.retention_type"
            clearable
            placeholder="挽单类型"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in RETENTION_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="退款原因">
          <el-select
            v-model="queryForm.refund_source"
            clearable
            placeholder="退款原因"
            style="width: 180px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in REFUND_SOURCE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="审核状态">
          <el-select
            v-model="queryForm.state"
            clearable
            placeholder="审核状态"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in REVIEW_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" plain @click="openIpDialog">设置IP限制</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="m-t-10">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="height: calc(100vh - 350px)"
      >
        <el-table-column prop="id" label="ID" width="80" fixed="left" />
        <el-table-column prop="order_id" label="订单ID" min-width="180" fixed="left" />
        <el-table-column prop="uid" label="用户ID" width="90" />
        <el-table-column prop="user_name" label="支付宝姓名" min-width="120" />
        <el-table-column prop="user_id" label="支付宝账号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="pay_price" label="支付金额" width="100" />
        <el-table-column prop="price" label="退款金额" width="100" />
        <el-table-column prop="source_name" label="退款原因" min-width="140" />
        <el-table-column prop="refund_source" label="退款来源ID" min-width="120" />
        <el-table-column prop="created_at" label="创建时间" min-width="170" />
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.state_name === '审核通过' ? 'success' : row.state_name === '审核不通过' ? 'danger' : 'warning'">
              {{ row.state_name || '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="Number(row.status) === 0">
              <el-button link type="primary" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" @click="handleReject(row)">拒绝</el-button>
            </template>
            <el-button v-else link type="info" disabled>已处理</el-button>
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
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog
      v-model="ipDialogVisible"
      title="设置IP限制"
      width="420px"
    >
      <el-form :model="ipForm" label-width="100px" label-position="left">
        <el-form-item label="IP地址">
          <el-input v-model="ipForm.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <div style="color: red;">当前IP：{{ currentIp || '-' }}</div>
      </el-form>
      <template #footer>
        <el-button @click="ipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ipLoading" @click="handleSaveIp">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
