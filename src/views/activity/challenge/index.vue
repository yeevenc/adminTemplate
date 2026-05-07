<script setup lang="ts" name="challenge">
defineOptions({ name: 'challenge' })

import { Search ,View} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getChallengeList, getUserChallengeList, handleChallengeMakeup } from '@/api/activity'

interface ChallengeItem {
  id: number | string
  uid: number | string
  username: string
  title: string
  start_time: string
  end_time: string
  consequence: number | string
  is_refund: number | string
  pay_type: number | string
  active_id: number | string
  order_no: string
  choose_type: number | string
}

interface ChallengeListResponse {
  list?: ChallengeItem[]
  data?: ChallengeItem[]
  total?: number | string
}

interface ChallengeRecordItem {
  id: number | string
  clockin_date: string
  minutes?: number | string
  success: number | string | boolean
  time_capsule_id?: number | string
}

interface ChallengeRecordResponse {
  list?: ChallengeRecordItem[]
  data?: ChallengeRecordItem[]
  active_id?: number | string
  uid?: number | string
  start_time?: string
  end_time?: string
  time_capsule_id?: number | string
}

const PAY_TYPE_MAP: Record<string, string> = {
  '1': '支付宝',
  '2': '微信',
  '3': 'iOS',
}

const CHOOSE_TYPE_MAP: Record<string, string> = {
  '0': '待选择',
  '1': '退款',
  '2': '送会员',
}

function getSuccessStatus(row: ChallengeItem) {
  const consequence = Number(row.consequence)
  const isRefund = Number(row.is_refund)
  if (consequence === 1) return { label: '成功', type: 'success' }
  if (consequence === 0 && isRefund === 0) return { label: '失败', type: 'danger' }
  return { label: '失败', type: 'danger' }
}

const loading = ref(false)
const detailLoadingId = ref<number | string | null>(null)
const makeUpLoading = ref(false)
const tableData = ref<ChallengeItem[]>([])
const detailDialogVisible = ref(false)
const detailTableData = ref<ChallengeRecordItem[]>([])

const queryForm = reactive({
  uid: '',
})

const detailState = reactive({
  rowId: '',
  activeId: '',
  uid: '',
  startTime: '',
  endTime: '',
  selectedDate: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    uid: queryForm.uid.trim(),
  }
}

function resolveList(data: ChallengeListResponse | ChallengeItem[] | undefined): ChallengeItem[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list!
  if (Array.isArray((data as any)?.data)) return (data as any).data
  return []
}

function resolveTotal(data: ChallengeListResponse | ChallengeItem[] | undefined, list: ChallengeItem[]): number {
  if (Array.isArray(data)) return data.length
  return Number((data as ChallengeListResponse)?.total) || list.length
}

function resolveRecordList(data: ChallengeRecordResponse | ChallengeRecordItem[] | undefined): ChallengeRecordItem[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

function getRecordSuccessText(success: ChallengeRecordItem['success']) {
  const value = Number(success)
  if (value === 1) return '成功'
  if (value === 0) return '失败'
  return String(success || '-')
}

function getRecordSuccessType(success: ChallengeRecordItem['success']) {
  return Number(success) === 1 ? 'success' : 'danger'
}

function isListenMinutesVisible() {
  return String(detailState.activeId) === '1000'
}

function resetDetailState() {
  detailState.rowId = ''
  detailState.activeId = ''
  detailState.uid = ''
  detailState.startTime = ''
  detailState.endTime = ''
  detailState.selectedDate = ''
  detailTableData.value = []
}

async function handleView(row: ChallengeItem) {
  detailLoadingId.value = row.id

  try {
    const res = await getUserChallengeList({
      id: row.id,
      active_id: row.active_id,
    }) as ApiResponseData<ChallengeRecordResponse | ChallengeRecordItem[]>
    const list = resolveRecordList(res.data)

    detailState.rowId = String(row.id)
    detailState.activeId = String((res.data as ChallengeRecordResponse)?.active_id ?? row.active_id)
    detailState.uid = String((res.data as ChallengeRecordResponse)?.uid ?? row.uid)
    detailState.startTime = String((res.data as ChallengeRecordResponse)?.start_time ?? '')
    detailState.endTime = String((res.data as ChallengeRecordResponse)?.end_time ?? '')
    detailState.selectedDate = ''
    detailTableData.value = list
    detailDialogVisible.value = true
  } finally {
    detailLoadingId.value = null
  }
}

function handleCloseDetailDialog() {
  detailDialogVisible.value = false
  resetDetailState()
}

function getMatchedRecord() {
  return detailTableData.value.find((item) => String(item.clockin_date) === detailState.selectedDate)
}

async function handleMakeUpCheckin() {
  if (!detailState.selectedDate) {
    ElMessage.warning('请选择补签日期')
    return
  }

  const matchedRecord = getMatchedRecord()

  if (!matchedRecord?.time_capsule_id) {
    ElMessage.warning('当前日期未找到可补签记录')
    return
  }

  try {
    await ElMessageBox.confirm('此操作将补签，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    ElMessage.info('已取消操作')
    return
  }

  makeUpLoading.value = true

  try {
    await handleChallengeMakeup({
      id: detailState.rowId,
      active_id: detailState.activeId,
      check_date: detailState.selectedDate,
      time_capsule_id: matchedRecord.time_capsule_id,
    })
    ElMessage.success('补签成功')
    await handleView({
      id: Number(detailState.rowId) || detailState.rowId,
      uid: detailState.uid,
      username: '',
      title: '',
      start_time: detailState.startTime,
      end_time: detailState.endTime,
      consequence: 0,
      is_refund: 0,
      pay_type: 0,
      active_id: detailState.activeId,
      order_no: '',
      choose_type: 0,
    })
    fetchTableData()
  } finally {
    makeUpLoading.value = false
  }
}

async function fetchTableData() {
  loading.value = true
  try {
    const res = await getChallengeList(getListParams()) as ApiResponseData<ChallengeListResponse | ChallengeItem[]>
    const list = resolveList(res.data)
    tableData.value = list
    pagination.total = resolveTotal(res.data, list)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchTableData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchTableData()
}

function handleCurrentPageChange(page: number) {
  pagination.page = page
  fetchTableData()
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="challenge-page">
    <el-card shadow="never" class="glass-card ">
      <el-form :model="queryForm" inline >
          <el-form-item label="UID" >
            <el-input
              v-model="queryForm.uid"
              clearable
              placeholder="请输入 UID"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item >
            <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-table v-loading="loading" stripe border :data="tableData" style="height: calc(100vh - 300px);">
        <el-table-column prop="id" fixed label="ID" min-width="80" show-overflow-tooltip />
        <el-table-column prop="uid" fixed label="UID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" min-width="130" show-overflow-tooltip />
        <el-table-column prop="title" label="订单名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="active_id" label="活动ID" min-width="100" show-overflow-tooltip />
        <el-table-column prop="order_no" label="订单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="start_time" label="开始打卡" min-width="160" show-overflow-tooltip />
        <el-table-column prop="end_time" label="结束打卡" min-width="160" show-overflow-tooltip />
        <el-table-column label="是否成功" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getSuccessStatus(row).type as any" size="small">
              {{ getSuccessStatus(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" min-width="100" align="center">
          <template #default="{ row }">
            {{ PAY_TYPE_MAP[String(row.pay_type)] ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="结算方式" min-width="100" align="center">
          <template #default="{ row }">
            {{ CHOOSE_TYPE_MAP[String(row.choose_type)] ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="是否退款" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.is_refund) === 1 ? 'warning' : 'info'" size="small">
              {{ Number(row.is_refund) === 1 ? '已退款' : '未退款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :loading="detailLoadingId === row.id"
              @click="handleView(row)"
              :icon="View"
            >
              查看
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
        :page-sizes="[30, 50, 100,300]"
        :total="pagination.total"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </el-card>

    <el-dialog
      :model-value="detailDialogVisible"
      title="挑战赛打卡记录"
      width="70%"
      destroy-on-close
      @close="handleCloseDetailDialog"
    >
      <div class="detail-toolbar">
        <el-date-picker
          v-model="detailState.selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择补签日期"
        />
        <el-button :loading="makeUpLoading" type="primary" @click="handleMakeUpCheckin">补签</el-button>
      </div>

      <el-table stripe border :data="detailTableData">
        <el-table-column prop="id" label="ID"  min-width="80" />
        <el-table-column prop="clockin_date" label="日期" min-width="160" />
        <el-table-column v-if="isListenMinutesVisible()" prop="minutes" label="听课时长" min-width="120" />
        <el-table-column label="是否成功" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRecordSuccessType(row.success)">
              {{ getRecordSuccessText(row.success) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.challenge-page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
}

</style>
