<script setup lang="ts" name="orderList">
defineOptions({ name: 'orderList' })

import { Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getOrderList } from '@/api/orderConfig'
import OrderListDialog from './components/OrderListDialog.vue'

interface OrderItem {
  uid: number | string
  phone: string
  order_id: string
  pay_status: number
  order_title: string
  pay_price: number | string
  sku_id: number | string
  duration: number
  pay_sn: string
  is_transfer: number
  is_refund: number
  refund_amount: number | string
  platform: string
  channel: string
  pay_type: number
  mark?: string
  pay_time: string
  created_at: string
}

interface OrderListResponse {
  list?: OrderItem[]
  data?: OrderItem[]
  total?: number | string
}

const PAY_STATUS_FILTER = [
  { label: '全部', value: '' },
  { label: '未支付', value: 0 },
  { label: '已支付', value: 1 },
]

const loading = ref(false)
const tableData = ref<OrderItem[]>([])
const dialogRef = ref<InstanceType<typeof OrderListDialog>>()

const queryForm = reactive({
  uid: '',
  phone: '',
  order_id: '',
  pay_sn: '',
  pay_status: 1 as number | '',
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
  phone: queryForm.phone.trim(),
  order_id: queryForm.order_id.trim(),
  pay_sn: queryForm.pay_sn.trim(),
  pay_status: queryForm.pay_status,
})

const resolveList = (data: OrderListResponse | OrderItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (data: OrderListResponse | OrderItem[] | undefined, list: OrderItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getOrderList(getListParams())) as ApiResponseData<
      OrderListResponse | OrderItem[]
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

const openCreate = () => {
  dialogRef.value?.openCreate()
}

const handleEdit = (row: OrderItem) => {
  dialogRef.value?.openEdit({ order_id: row.order_id })
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="order-list-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <div class="filter-row">
          <el-form-item label="用户ID">
            <el-input
              v-model="queryForm.uid"
              clearable
              placeholder="用户ID"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="手机号" >
            <el-input
              v-model="queryForm.phone"
              clearable
              placeholder="用户手机号"
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
          <el-form-item label="支付状态">
            <el-select v-model="queryForm.pay_status" placeholder="支付状态" clearable style="width: 120px;" @change="handleSearch" @clear="handleSearch">
              <el-option
                v-for="item in PAY_STATUS_FILTER"
                :key="String(item.value)"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card table-card">
        <el-button :icon="Plus" plain type="primary" @click="openCreate">添加</el-button>
      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="width: 100%; height: calc(100vh - 350px);"
        class="m-t-10"
      >
        <el-table-column prop="uid" label="用户ID" width="90" fixed="left" />
        <el-table-column prop="phone" label="用户手机号" width="120" fixed="left" />
        <el-table-column prop="order_id" label="订单号" width="210" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.pay_status === 0 ? 'info' : 'success'">
              {{ row.pay_status === 0 ? '未支付' : '已支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_title" label="订单标题" width="160" show-overflow-tooltip />
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
        <el-table-column  label="是否转账" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_transfer === 0 ? 'info' : 'warning'">
              {{ row.is_transfer === 0 ? '否' : '是' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column  label="退款" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_refund === 0 ? 'info' : 'danger'">
              {{ row.is_refund === 0 ? '否' : '是' }}
            </el-tag>
          </template>
        </el-table-column>
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
        <el-table-column
          prop="pay_time"
          label="支付时间"
          width="180"
        />
        <el-table-column
           
          prop="created_at"
          label="创建时间"
          width="180"
        />
        <el-table-column
           
          label="操作"
          width="100"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">
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

    <OrderListDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.order-list-page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>
