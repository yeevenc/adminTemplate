<script setup lang="ts" name="refundReviews">
defineOptions({ name: 'refundReviews' })

import { Search, Check, Close, SetUp, Finished, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import {
  batchReviewRefundOrder,
  getQiYuMessageList,
  getRefundReviewLimit,
  getRefundReviewList,
  reviewRefundOrder,
  setRefundReviewLimit,
} from '@/api/orderConfig'

interface RefundReviewItem {
  id: number | string
  oid: string
  uid: number | string
  retention_price: number | string
  refund_price: number | string
  type_name: string
  source_name: string
  refund_source_id: number | string
  created_at: string
  state_name: string
  refund_state: number
  complaint: string
  [key: string]: unknown
}

interface RefundReviewListResponse {
  list?: RefundReviewItem[]
  data?: RefundReviewItem[]
  total?: number | string
}

interface QiYuMessageItem {
  from: number
  day: string
  msg: string
  staffName?: string
  userName?: string
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
const tableData = ref<RefundReviewItem[]>([])
const selectedRows = ref<RefundReviewItem[]>([])
const limitDialogVisible = ref(false)
const limitLoading = ref(false)
const chatDialogVisible = ref(false)
const messageList = ref<QiYuMessageItem[]>([])

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

const limitForm = reactive({
  conf_value: '',
})

const currentLimit = ref<string | number>('')

// 默认按待审核查询，其他条件为空时表示不过滤
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  order_id: queryForm.order_id.trim(),
  uid: queryForm.uid.trim(),
  retention_type: queryForm.retention_type,
  refund_source: queryForm.refund_source,
  state: queryForm.state,
})

const resolveList = (data: RefundReviewListResponse | RefundReviewItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (
  data: RefundReviewListResponse | RefundReviewItem[] | undefined,
  list: RefundReviewItem[],
) => {
  if (Array.isArray(data)) return list.length
  return Number(data?.total) || list.length
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getRefundReviewList(getListParams())) as ApiResponseData<
      RefundReviewListResponse | RefundReviewItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

const fetchRefundLimit = async () => {
  const response = await getRefundReviewLimit() as ApiResponseData<{ conf_value?: string | number }>
  currentLimit.value = response.data?.conf_value || ''
  limitForm.conf_value = String(response.data?.conf_value || '')
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

const handleSelectionChange = (rows: RefundReviewItem[]) => {
  selectedRows.value = rows
}

const getSelectedIds = () => selectedRows.value.map((item) => item.id)

const handleReview = async (row: RefundReviewItem, status: 'accept' | 'reject') => {
  await reviewRefundOrder({
    id: row.id,
    type: status,
  })
  ElMessage.success(status === 'accept' ? '审核通过成功' : '审核拒绝成功')
  fetchTableData()
}

const handleApprove = async (row: RefundReviewItem) => {
  await handleReview(row, 'accept')
}

const handleReject = async (row: RefundReviewItem) => {
  await handleReview(row, 'reject')
}

const handleBatchReview = async (status: 'accept' | 'reject') => {
  const ids = getSelectedIds()
  if (!ids.length) {
    ElMessage.warning('请先选择要操作的订单')
    return
  }

  await batchReviewRefundOrder({
    ids,
    type: status,
  })
  ElMessage.success(status === 'accept' ? '批量通过成功' : '批量拒绝成功')
  fetchTableData()
}

const openLimitDialog = async () => {
  await fetchRefundLimit()
  limitDialogVisible.value = true
}

const handleSaveLimit = async () => {
  if (!limitForm.conf_value) {
    ElMessage.warning('请输入退款限额')
    return
  }

  limitLoading.value = true
  try {
    await setRefundReviewLimit({
      conf_value: limitForm.conf_value,
    })
    ElMessage.success('保存成功')
    limitDialogVisible.value = false
    await fetchRefundLimit()
  } finally {
    limitLoading.value = false
  }
}

const openQiYuDialog = async (row: RefundReviewItem) => {
  const response = await getQiYuMessageList({
    refund_source_id: row.refund_source_id,
  }) as ApiResponseData<QiYuMessageItem[]>
  messageList.value = Array.isArray(response.data) ? response.data : []
  chatDialogVisible.value = true
}

// 七鱼消息里可能混有 JSON、图片链接和普通文本，这里统一做展示兼容
const IMG_TYPES = ['JPEG', 'JPG', 'PNG', 'GIF', 'WEBP']

const formatMessage = (msg: unknown) => {
  if (typeof msg !== 'string') return String(msg ?? '')

  try {
    const parsed = JSON.parse(msg) as Record<string, unknown>
    if (typeof parsed === 'object' && parsed) {
      // type=text 且有 content
      if (parsed.type === 'text' && parsed.content) {
        const content = parsed.content as Record<string, unknown>
        return String(typeof content === 'object' ? (content.text ?? parsed.content) : parsed.content)
      }
      // 直接有 text 字段
      if (parsed.text) return String(parsed.text)
      // 有 content 字段
      if (parsed.content) {
        const content = parsed.content as Record<string, unknown>
        if (typeof content === 'object' && content.text) return String(content.text)
        return String(parsed.content)
      }
      // 图片/附件（含 url + type）
      if (parsed.url && parsed.type) {
        if (IMG_TYPES.includes(String(parsed.type).toUpperCase())) {
          return `<img src="${parsed.url}" class="chat-img" />`
        }
        return `<a href="${parsed.url}" target="_blank">附件：${parsed.name || '下载文件'}</a>`
      }
      // 仅有 url（无 type）
      if (parsed.url) return `<a href="${parsed.url}" target="_blank">查看附件</a>`
      // 满意度评价消息（含 message 字段）
      if (parsed.message) {
        const parts = [String(parsed.message)]
        if (parsed.remarks) parts.push(`备注：${parsed.remarks}`)
        return parts.join('<br>')
      }
      // 卡片消息（type=cardMessage，含 cards 数组）
      if (parsed.type === 'cardMessage' && Array.isArray(parsed.cards)) {
        const parts = (parsed.cards as Array<Record<string, unknown>>)
          .map((card) => {
            const content = String(card.content ?? '').trim()
            if (!content) return ''
            // rich 类型直接渲染内容，换行转 br
            return content.replace(/\n/g, '<br>')
          })
          .filter(Boolean)
        return parts.length ? parts.join('<hr style="margin:6px 0;border-color:var(--el-border-color-light)">') : '[卡片消息]'
      }
      // 七鱼系统消息（含 cmd 字段）
      if ('cmd' in parsed) return JSON.stringify(parsed, null, 2)
      // 其他 JSON 对象兜底格式化展示
      return JSON.stringify(parsed, null, 2)
    }
  } catch {
    // 非 JSON，直接处理换行
  }

  return msg.replace(/\n/g, '<br>')
}

const formatComplaint = (value: string) => {
  if (!value) return '-'
  return value
}

onMounted(async () => {
  await fetchRefundLimit()
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
          <el-button type="primary" plain :icon="SetUp" @click="openLimitDialog">设置退款限额</el-button>
        </el-form-item>
      </el-form>

    </el-card>

    <el-card shadow="never" class="m-t-10">
      <el-button type="primary" plain :icon="Check" @click="handleBatchReview('accept')">批量通过</el-button>
        <el-button type="danger" plain :icon="Close" @click="handleBatchReview('reject')">批量拒绝</el-button>
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        class="m-t-10"
        @selection-change="handleSelectionChange"
         style="height: calc(100vh - 450px)"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="id" label="ID" width="80" fixed="left" />
        <el-table-column prop="oid" label="订单ID" min-width="180" fixed="left" />
        <el-table-column prop="uid" label="用户ID" width="100" />
        <el-table-column prop="retention_price" label="挽单金额" width="100" />
        <el-table-column prop="refund_price" label="退款金额" width="100" />
        <el-table-column prop="type_name" label="挽单类型" min-width="120" />
        <el-table-column prop="source_name" label="退款原因" min-width="140" />
        <el-table-column prop="refund_source_id" label="退款来源ID" min-width="120" />
        <el-table-column prop="created_at" label="创建时间" min-width="170" />
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.state_name === '审核通过' ? 'success' : row.state_name === '审核不通过' ? 'danger' : 'warning'">
              {{ row.state_name || '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投诉/撤诉" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="warning"> {{ formatComplaint(row.complaint) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="Number(row.refund_state) === 0">
              <el-button :icon="Check" link type="primary" @click="handleApprove(row)">通过</el-button>
              <el-button :icon="Close" link type="danger" @click="handleReject(row)">拒绝</el-button>
            </template>
            <el-button v-else :icon="Finished" link type="info" disabled>已处理</el-button>
            <el-button :icon="View" link type="success" @click="openQiYuDialog(row)">客服记录</el-button>
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
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog
      v-model="limitDialogVisible"
      title="设置退款限额"
      width="420px"
    >
      <el-form :model="limitForm" label-width="100px" label-position="left">
         <el-alert :title="`当前金额：${ currentLimit || '-' }`" type="error" :closable="false" />
        <el-form-item label="金额" class="m-t-10">
          <el-input-number :min="0" v-model="limitForm.conf_value" placeholder="请输入，如 10000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="limitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="limitLoading" @click="handleSaveLimit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="chatDialogVisible"
      title="七鱼聊天记录"
      direction="ltr"
      size="40%"
    >
      <el-card class="glass-card">
      <div v-if="!messageList.length" class="chat-empty">
        <el-empty description="暂无聊天记录" />
      </div>
      <div v-else class="chat-container">
        <div
          v-for="(item, index) in messageList"
          :key="index"
          class="chat-item"
          :class="item.from === 0 ? 'chat-item--staff' : 'chat-item--user'"
        >
          <!-- 头像 -->
          <el-avatar class="chat-avatar" :size="36">
            {{ item.from === 0 ? (item.staffName || '客服').slice(0, 1) : (item.userName || '用户').slice(0, 1) }}
          </el-avatar>
          <!-- 消息体 -->
          <div class="chat-body">
            <div class="chat-meta">
              <span class="chat-name">{{ item.from === 0 ? item.staffName || '客服' : item.userName || '用户' }}</span>
              <span class="chat-time">{{ item.day }}</span>
            </div>
            <div class="chat-bubble" v-html="formatMessage(item.msg)" />
          </div>
        </div>
      </div>
      </el-card>
    </el-drawer>
  </div>
</template>

<style scoped>
/* 聊天记录容器 */
.chat-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

.chat-empty {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

/* 单条消息行 */
.chat-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

/* 用户消息：头像在右，内容靠右 */
.chat-item--user {
  flex-direction: row-reverse;
}

.chat-avatar {
  flex-shrink: 0;
}

/* 客服头像色 */
.chat-item--staff .chat-avatar {
  background-color: var(--el-color-primary);
}

/* 用户头像色 */
.chat-item--user .chat-avatar {
  background-color: var(--el-color-success);
}

.chat-body {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  align-items: flex-start;
}

.chat-item--user .chat-body {
  align-items: flex-end;
}

/* 元信息：名字 + 时间 */
.chat-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chat-item--user .chat-meta {
  flex-direction: row-reverse;
}

.chat-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 气泡 */
.chat-bubble {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

/* 客服气泡：左侧圆角平 */
.chat-item--staff .chat-bubble {
  background-color: var(--el-fill-color-light);
  border-top-left-radius: 2px;
  color: var(--el-text-color-primary);
  max-width: 100%;
}

/* 用户气泡：右侧圆角平，主色背景 */
.chat-item--user .chat-bubble {
  background-color: var(--el-color-primary-light-7);
  border-top-right-radius: 2px;
    max-width: 100%;
  color: var(--el-text-color-primary);
}

/* 气泡内图片（含富文本中带固定宽高属性的 img） */
.chat-bubble :deep(img) {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  display: block;
  border-radius: 4px;
  object-fit: contain;
}

/* 气泡内链接 */
.chat-bubble :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.chat-bubble :deep(a:hover) {
  text-decoration: underline;
}
</style>
