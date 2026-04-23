<script setup lang="ts" name="makeUpSKu">
defineOptions({ name: 'makeUpSKu' })

import { CopyDocument, Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getSubscriptionSkuList } from '@/api/operation'
import { CHANNEL_OPTIONS, USER_GROUP_AGE_OPTIONS, getLabelText } from '@/utils/useConfig'
import MakeUpSkuDialog from './components/MakeUpSkuDialog.vue'

interface MakeUpSkuItem {
  id: number | string
  title: string
  channel: string[]
  position: 1 | 2
  age: number[]
  status: 0 | 1
  sku_memo: Array<{ sku_id: number | string }>
  created_at: string
  sequence: number | string
}

interface MakeUpSkuListResponse {
  list?: MakeUpSkuItem[]
  data?: MakeUpSkuItem[]
  total?: number | string
}

const STATUS_OPTIONS = [
  { value: 1, label: '上线' },
  { value: 0, label: '下线' },
]

const POSITION_OPTIONS = [
  { value: 1, label: '普通会员' },
  { value: 2, label: '超级会员' },
]

const ENV_OPTIONS = [
  { label: '正式', value: 'produce' },
  { label: '测试', value: 'mirror' },
]

const loading = ref(false)
const tableData = ref<MakeUpSkuItem[]>([])
const dialogRef = ref<InstanceType<typeof MakeUpSkuDialog>>()

const queryForm = reactive({
  env: 'produce',
  age: '',
  status: '',
  position: '',
  id: '',
  title: '',
  channel: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  env: queryForm.env,
  age: queryForm.age,
  status: queryForm.status,
  position: queryForm.position,
  id: queryForm.id.trim(),
  title: queryForm.title.trim(),
  channel: queryForm.channel,
})

const resolveList = (data: MakeUpSkuListResponse | MakeUpSkuItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (data: MakeUpSkuListResponse | MakeUpSkuItem[] | undefined, list: MakeUpSkuItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

const getPositionText = (value: 1 | 2) => value === 1 ? '普通会员' : '超级会员'

const fetchTableData = async () => {
  loading.value = true

  try {
    const response = await getSubscriptionSkuList(getListParams()) as ApiResponseData<
      MakeUpSkuListResponse | MakeUpSkuItem[]
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

const handleEnvChange = () => {
  handleSearch()
}

const openCreate = () => dialogRef.value?.openCreate()
const handleEdit = (row: MakeUpSkuItem) => dialogRef.value?.openEdit(row.id)
const handleCopy = (row: MakeUpSkuItem) => dialogRef.value?.openCopy(row.id)

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div>
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="环境">
          <el-radio-group v-model="queryForm.env" @change="handleEnvChange">
            <el-radio-button
              v-for="item in ENV_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="年龄">
          <el-select
            v-model="queryForm.age"
            placeholder="选择年龄"
            clearable
            @change="handleSearch"
            @clear="handleSearch"
            style="width: 180px;"
          >
            <el-option
              v-for="item in USER_GROUP_AGE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="上线状态">
          <el-select
            v-model="queryForm.status"
            placeholder="选择上线状态"
            clearable
            @change="handleSearch"
            @clear="handleSearch"
            style="width: 180px;"
          >
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="展示位置">
          <el-select
            v-model="queryForm.position"
            placeholder="选择展示位置"
            clearable
            @change="handleSearch"
            @clear="handleSearch"
            style="width: 180px;"
          >
            <el-option
              v-for="item in POSITION_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="ID">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="标题">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="标题"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="平台">
          <el-select
            v-model="queryForm.channel"
            placeholder="选择平台"
            clearable
            @change="handleSearch"
            @clear="handleSearch"
            style="width: 180px;"
          >
            <el-option
              v-for="item in CHANNEL_OPTIONS"
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

    <el-card shadow="never" class="glass-card m-t-10">
      <el-button :icon="Plus" plain type="primary" @click="openCreate">添加</el-button>
      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="width: 100%; height: calc(100vh - 400px);"
        class="m-t-10"
      >
        <el-table-column prop="id" label="ID" width="90" fixed="left" />
        <el-table-column prop="title" label="标题" min-width="200" fixed="left" />
        <el-table-column label="平台" min-width="180">
          <template #default="{ row }">
            <el-space wrap v-if="Array.isArray(row.channel)">
              <el-tag
                v-for="item in row.channel"
                type="success"
                :key="item"
              >
                {{ getLabelText(item, CHANNEL_OPTIONS) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="展示位置" width="120">
          <template #default="{ row }">
            {{ getPositionText(row.position) }}
          </template>
        </el-table-column>
        <el-table-column label="年龄" min-width="220">
          <template #default="{ row }">
             <el-space wrap size="small">
              <el-tag v-for="age in row.age" :key="age" type="warning">
                {{ getLabelText(age, USER_GROUP_AGE_OPTIONS) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="上线状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '上线中' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="sku_id" min-width="180">
          <template #default="{ row }">
            <span v-for="item in row.sku_memo" :key="item.sku_id" class="m-r-4">
              {{ item.sku_id }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">修改</el-button>
            <el-button link type="warning" :icon="CopyDocument" @click="handleCopy(row)">复制</el-button>
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

    <MakeUpSkuDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>
