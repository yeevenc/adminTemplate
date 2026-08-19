<script setup lang="ts" name="skuConfig">
defineOptions({ name: 'skuConfig' })

import { CopyDocument, Edit, Plus, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getSkuList } from '@/api/operation'
import {getConfigList} from '@/api/config'
import {type SelectOption} from '@/utils/useConfig'
import SkuConfigDialog from './components/SkuConfigDialog.vue'

interface SkuItem {
  id: number | string
  title: string
  pre_title: string
  subtitle: string
  sku_tips: string
  order_title: string
  type_name: string
  vip_type: number
  price: number | string
  first_price: number | string
  renew_price: number | string
  duration: number | string
  renew_duration: number | string
  give_sku_id: number | string
  wx_sku: string
  up_status: number
  InAppID: string
  AliPayId: string
  created_at: string
  [key: string]: unknown
}

interface SkuListResponse {
  list?: SkuItem[]
  data?: SkuItem[]
  total?: number | string
}

const vipTypeOptions = ref<SelectOption[]>([])
const loading = ref(false)
const tableData = ref<SkuItem[]>([])
const dialogRef = ref<InstanceType<typeof SkuConfigDialog>>()

const queryForm = reactive({
  title: '',
  id: '',
  price: '',
  duration: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

// 统一组装列表查询参数，避免分页和筛选条件在多个入口重复拼接
const getListParams = () => ({
  page: pagination.page,
  page_size: pagination.pageSize,
  title: queryForm.title.trim(),
  id: queryForm.id.trim(),
  price: queryForm.price.trim(),
  duration: queryForm.duration.trim(),
})

// 列表接口兼容数组 / list / data 三种返回结构
const resolveList = (data: SkuListResponse | SkuItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}
// 分页总数优先取后端返回，兜底使用当前列表长度
const resolveTotal = (data: SkuListResponse | SkuItem[] | undefined, list: SkuItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

// 获取 sku 列表并同步分页数据
const fetchTableData = async () => {
  loading.value = true
  try {
    const response = (await getSkuList(getListParams())) as ApiResponseData<
      SkuListResponse | SkuItem[]
    >
    const list = resolveList(response.data)
    tableData.value = list
    pagination.total = resolveTotal(response.data, list)
  } finally {
    loading.value = false
  }
}

// 搜索时重置页码，避免保留旧分页导致空页
const handleSearch = () => {
  pagination.page = 1
  fetchTableData()
}

// 分页大小变化后回到第一页重新查询
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

// 打开新增弹窗
const openCreate = () => {
  dialogRef.value?.openCreate()
}

// 打开编辑弹窗
const handleEdit = (row: SkuItem) => {
  dialogRef.value?.openEdit(row.id)
}

// 打开复制弹窗，复制场景内部仍走新增接口
const handleCopy = (row: SkuItem) => {
  dialogRef.value?.openCopy(row.id)
}

const getVipTypeText = (value: number) => {
  const target = vipTypeOptions.value.find((item) => Number(item.value) === Number(value))
  return target?.label || '-'
}

const getConfigData = async () => {
  try {
    const response = await getConfigList()
    vipTypeOptions.value = response.data?.vip_type_list || []
  } catch (error) {
    console.error('获取配置数据失败：', error)
  }
}
onMounted(async() => {
  await getConfigData()
  await fetchTableData()
})
</script>

<template>
  <div class="sku-config-page">
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
        <el-form-item label="skuId">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="skuId"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="价格">
          <el-input
            v-model="queryForm.price"
            clearable
            placeholder="价格"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="会员时长">
          <el-input
            v-model="queryForm.duration"
            clearable
            placeholder="会员时长"
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
        <el-button :icon="Plus" plain type="primary" @click="openCreate">添加</el-button>
      <el-table
        v-loading="loading"
        stripe
        border
        :data="tableData"
        style="width: 100%; height: calc(100vh - 350px);"
        class="m-t-10"
      >
        <el-table-column prop="id" label="skuID" width="90" fixed="left" />
        <el-table-column prop="title" label="标题" width="160" fixed="left" show-overflow-tooltip />
        <el-table-column prop="pre_title" label="优惠标题" width="160" show-overflow-tooltip />
        <el-table-column prop="subtitle" label="副标题" width="160" show-overflow-tooltip />
        <el-table-column prop="sku_tips" label="sku说明" width="160" show-overflow-tooltip />
        <el-table-column prop="order_title" label="内部展示标题" width="160" show-overflow-tooltip />
        <el-table-column prop="type_name" label="类型" width="100" />
        <el-table-column label="权益" width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.vip_type === 1 ? 'info' : row.vip_type === 2 ? 'success' : row.vip_type === 4 ? 'warning' : 'primary'"
            >
              {{ getVipTypeText(row.vip_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="现价" width="90" />
        <el-table-column prop="first_price" label="首次优惠价" width="100" />
        <el-table-column prop="renew_price" label="续订价" width="90" />
        <el-table-column prop="duration" label="会员时长(天)" width="110">
        </el-table-column>
        <el-table-column prop="renew_duration" label="续订时长(天)" width="110">
        </el-table-column>
        <el-table-column prop="give_sku_id" label="赠送Sku" width="100" />
        <el-table-column prop="wx_sku" label="微信Sku" width="100" />
        <el-table-column label="是否升级" width="90">
          <template #default="{ row }">
            <el-tag :type="row.up_status === 1 ? 'danger' : 'warning'">
              {{ row.up_status === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="InAppID" label="inAppId" width="200" show-overflow-tooltip />
         <el-table-column prop="harmony_product_id" label="ohosId" width="200" show-overflow-tooltip />
        <el-table-column prop="AliPayId" label="支付宝ID" width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180" />
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

    <SkuConfigDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.sku-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}

.vip-highlight {
  color: #f56c6c;
}
</style>
