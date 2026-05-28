<script setup lang="ts" name="refundOrders">
defineOptions({ name: 'refundOrders' })

import { Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getRefundOrders } from '@/api/orderConfig'
import ChallengeRefundDialog from './components/ChallengeRefundDialog.vue'
import MemberRefundDialog from './components/MemberRefundDialog.vue'
import ManualRefundDialog from './components/ManualRefundDialog.vue'

interface RefundOrderItem {
  uid: number | string
  phone: string
  order_id: string
  pay_status: number
  order_title: string
  pay_price: number | string
  sku_id: number | string
  duration: number
  pay_sn: string
  refund_amount: number | string
  platform: string
  channel: string
  pay_type: number
  mark?: string
  pay_time: string
  created_at: string
  is_refund: number
  complaint?: string
  refund_twice?: number
  complain_event_id?: string
}

interface RefundListResponse {
  list?: RefundOrderItem[]
  data?: RefundOrderItem[]
  total?: number | string
}

const REFUND_TYPE_OPTIONS = [
  { label: '会员退款', value: 0 },
  { label: '挑战赛成功退款', value: 1 },
]

const loading = ref(false)
const tableData = ref<RefundOrderItem[]>([])
const challengeDialogRef = ref<InstanceType<typeof ChallengeRefundDialog>>()
const memberDialogRef = ref<InstanceType<typeof MemberRefundDialog>>()
const manualDialogRef = ref<InstanceType<typeof ManualRefundDialog>>()

const queryForm = reactive({
  refund_type: 0 as number,
  uid: '',
  order_id: '',
  pay_sn: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  uid: queryForm.uid.trim(),
  order_id: queryForm.order_id.trim(),
  pay_sn: queryForm.pay_sn.trim(),
  refund_type: queryForm.refund_type,
})

const resolveList = (data: RefundListResponse | RefundOrderItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (
  data: RefundListResponse | RefundOrderItem[] | undefined,
  list: RefundOrderItem[]
) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getRefundOrders(getListParams())) as ApiResponseData<
      RefundListResponse | RefundOrderItem[]
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

const openChallengeRefund = (row: RefundOrderItem) => {
  challengeDialogRef.value?.open({
    order_id: row.order_id,
    pay_sn: row.pay_sn,
    pay_time: row.pay_time,
    pay_price: row.pay_price,
  })
}

const openMemberRefund = (row: RefundOrderItem, times: 1 | 2) => {
  memberDialogRef.value?.open(
    {
      order_id: row.order_id,
      pay_price: row.pay_price,
      complain_event_id: row.complain_event_id,
    },
    times
  )
}

const openManualRefund = (row: RefundOrderItem) => {
  manualDialogRef.value?.open({
    order_id: row.order_id,
    pay_price: row.pay_price,
    uid: row.uid,
  })
}

const formatComplaint = (text?: string) => {
  if (!text) return ''
  return text.includes('/未撤诉') ? text.split('/') : [text]
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="refund-orders-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
          <el-form-item label="退款类型">
            <el-select
              v-model="queryForm.refund_type"
              placeholder="退款类型"
              style="width: 160px"
              @change="handleSearch"
            >
              <el-option
                v-for="item in REFUND_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
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
          <el-form-item label="订单号">
            <el-input
              v-model="queryForm.order_id"
              clearable
              placeholder="以sleep开头的单号"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="支付流水号">
            <el-input
              v-model="queryForm.pay_sn"
              clearable
              placeholder="以数字开头的单号"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="width: 100%; height: calc(100vh - 340px);"
      >
        <el-table-column prop="uid" label="用户ID" width="90" fixed="left" />
        <el-table-column prop="phone" label="用户手机号" width="120" fixed="left" />
        <el-table-column prop="order_id" label="订单号" width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.pay_status === 0 ? 'info' : 'success'">
              {{ row.pay_status === 0 ? '待支付' : '已支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_title" label="订单标题" width="240" show-overflow-tooltip />
        <el-table-column prop="pay_price" label="单价" width="80" />
        <el-table-column prop="sku_id" label="产品ID" width="90" />
        <el-table-column label="会员时长(天)" width="110">
          <template #default="{ row }">
            <span style="color: #409eff">{{ row.duration / 24 / 60 / 60 }}</span>
          </template>
        </el-table-column>
        <el-table-column
           
          prop="pay_sn"
          label="支付流水号"
          width="170"
          show-overflow-tooltip
        />
        <el-table-column
           
          prop="refund_amount"
          label="退款金额"
          width="100"
        />
        <el-table-column   prop="platform" label="平台" width="90" />
        <el-table-column   prop="channel" label="渠道" width="90" />
        <el-table-column prop="pay_type_name"  label="支付方式" width="110">
        </el-table-column>
        <el-table-column
           
          prop="mark"
          label="备注信息"
          width="240"
          show-overflow-tooltip
        />
        <el-table-column prop="pay_time" label="支付时间" width="180" />
        <el-table-column   prop="created_at" label="创建时间" width="180" />
        <el-table-column   label="是否已退款" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_refund === 0 ? 'waring' : 'danger'">
              {{ row.is_refund === 0 ? '否' : '是' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
           
          label="是否支付宝投诉/是否撤诉"
          width="200"
        >
          <template #default="{ row }">
            <template v-if="formatComplaint(row.complaint).length === 2">
              {{ formatComplaint(row.complaint)[0] }}/<span style="color: red">{{
                formatComplaint(row.complaint)[1]
              }}</span>
            </template>
            <template v-else>{{ row.complaint }}</template>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="260"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="queryForm.refund_type === 1"
              link
              type="primary"
              @click="openChallengeRefund(row)"
            >
              挑战赛退款
            </el-button>
            <template v-else>
              <el-button link type="primary" @click="openMemberRefund(row, 1)">
                会员退款
              </el-button>
              <el-button
                v-if="row.refund_twice === 1"
                link
                type="primary"
                @click="openMemberRefund(row, 2)"
              >
                再次退款
              </el-button>
              <el-button link type="warning" @click="openManualRefund(row)">
                手动退款
              </el-button>
            </template>
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

    <ChallengeRefundDialog ref="challengeDialogRef" @success="fetchTableData" />
    <MemberRefundDialog ref="memberDialogRef" @success="fetchTableData" />
    <ManualRefundDialog ref="manualDialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.refund-orders-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

</style>
