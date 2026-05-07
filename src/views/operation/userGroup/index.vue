<script setup lang="ts" name="userGroup">
defineOptions({ name: 'userGroup' })

import { CopyDocument, Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getUserGroupList } from '@/api/operation'
import {
  getLabelText,
  USER_GROUP_CHANNEL_ALL_VALUE,
  USER_GROUP_CHANNEL_FILTER_OPTIONS,
  USER_GROUP_CHANNEL_OPTIONS,
} from '@/utils/useConfig'
import UserGroupDialog from './components/UserGroupDialog.vue'

interface UserGroupItem {
  id: number | string
  title: string
  sensors_channel: number[]
  vip_name: string
  active_day_min: number
  active_day_max: number
  remain_day_min: number
  remain_day_max: number
  expire_day_min: number
  expire_day_max: number
  age_name: string
  create_time: string
  [key: string]: unknown
}

interface UserGroupListResponse {
  list?: UserGroupItem[]
  data?: UserGroupItem[]
  total?: number | string
}

const loading = ref(false)
const tableData = ref<UserGroupItem[]>([])
const dialogRef = ref<InstanceType<typeof UserGroupDialog>>()

const queryForm = reactive({
  title: '',
  sensors_channel: '' as number | '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 统一组装列表查询参数，保证筛选和分页共用一套入参
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  title: queryForm.title.trim(),
  sensors_channel: queryForm.sensors_channel,
})

// 列表接口兼容数组 / list / data 三种返回结构
const resolveList = (data: UserGroupListResponse | UserGroupItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

// 总数优先以后端返回为准，兜底使用当前列表长度
const resolveTotal = (
  data: UserGroupListResponse | UserGroupItem[] | undefined,
  list: UserGroupItem[],
) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

// 获取用户分群列表
const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getUserGroupList(getListParams())) as ApiResponseData<
      UserGroupListResponse | UserGroupItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

// 搜索时回到第一页重新查询
const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchTableData()
}

// 页码切换
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTableData()
}

// 区间展示格式统一收口，避免模板里重复判断
const formatRange = (min: number, max: number) => {
  if (!min && !max) return '0'
  return `${min}-${max}`
}

// 打开新增弹窗
const openCreate = () => {
  dialogRef.value?.openCreate()
}

// 打开编辑弹窗
const handleEdit = (row: UserGroupItem) => {
  dialogRef.value?.openEdit(row.id)
}

// 打开复制弹窗
const handleCopy = (row: UserGroupItem) => {
  dialogRef.value?.openCopy(row.id)
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="user-group-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="标题">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="标题"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select
            v-model="queryForm.sensors_channel"
            clearable
            placeholder="渠道选择"
            style="width: 180px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="item in USER_GROUP_CHANNEL_FILTER_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-button :icon="Plus" type="primary" @click="openCreate">添加</el-button>

      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="width: 100%; height: calc(100vh - 350px)"
        class="m-t-10"
      >
        <el-table-column prop="id" label="群组id" width="100" fixed="left" />
        <el-table-column
          prop="title"
          label="群组名称"
          width="160"
          fixed="left"
          show-overflow-tooltip
        />
        <el-table-column label="渠道" width="260">
          <template #default="{ row }">
            <template v-if="row.sensors_channel?.includes(USER_GROUP_CHANNEL_ALL_VALUE)">
              <el-tag size="small" type="info">全部</el-tag>
            </template>
            <template v-else>
              <el-tag
                v-for="value in row.sensors_channel"
                :key="value"
                size="small"
                class="m-r-4"
              >
                {{ getLabelText(value, USER_GROUP_CHANNEL_OPTIONS) }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="用户身份" width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="success">{{ row.vip_name || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="激活天数" width="100">
          <template #default="{ row }">
            {{ formatRange(row.active_day_min, row.active_day_max) }}
          </template>
        </el-table-column>
        <el-table-column label="会员剩余天数" width="120">
          <template #default="{ row }">
            {{ formatRange(row.remain_day_min, row.remain_day_max) }}
          </template>
        </el-table-column>
        <el-table-column label="会员过期天数" width="120">
          <template #default="{ row }">
            {{ formatRange(row.expire_day_min, row.expire_day_max) }}
          </template>
        </el-table-column>
        <el-table-column label="年龄段" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="warning">{{ row.age_name || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="warning" :icon="CopyDocument" @click="handleCopy(row)">
              复制
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

    <UserGroupDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.user-group-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.m-r-4 {
  margin-right: 4px;
}
</style>
