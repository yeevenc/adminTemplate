<script setup lang="ts" name="advertising">
defineOptions({ name: 'advertising' })

import { CopyDocument, Edit, Plus, Search,View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getResourceList, upDownResource } from '@/api/operation'
import {getConfigList} from '@/api/config'
import AdvertisingDialog from '@/views/operation/resource/advertising/components/AdvertisingDialog.vue'
import  { CHANNEL_OPTIONS,type SelectOption,selectListData,getLabelText } from '@/utils/useConfig'
import AdPreviewDialog from '@/components/prviewDialog/adIndex.vue'
type ResourceEnv = 'produce' | 'mirror'

interface AdvertisingItem {
  id: number | string
  title: string
  banner: string
  lessions_id: string
  status_name: string
  status: 0 | 1
  end_time: string
  sequence: number | string
  channel: string[]
  alert_name: string
  env: ResourceEnv
  updated_at: string
  alert_type: number
}

interface AdvertisingListResponse {
  list?: AdvertisingItem[]
  data?: AdvertisingItem[]
  total?: number | string
}

const ENV_OPTIONS: Array<{ label: string; value: ResourceEnv }> = [
  { label: '正式', value: 'produce' },
  { label: '测试(mirror)', value: 'mirror' },
]
const channelList = CHANNEL_OPTIONS
const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '进行中', value: 1 },
  { label: '已下架', value: 0 },
]
const alertList = ref<SelectOption[]>([])
const loading = ref(false)
const tableData = ref<AdvertisingItem[]>([])
const dialogRef = ref<InstanceType<typeof AdvertisingDialog>>()
const previewDialogRef = ref<InstanceType<typeof AdPreviewDialog>>()

const queryForm = reactive({
  env: 'produce' as ResourceEnv,
  keyword: '',
  channel: '',
  status: '' as number | '',
  alertType: '' as number | '',
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
  key_words: queryForm.keyword.trim(),
  channel: queryForm.channel,
  status: queryForm.status,
  alert_type: queryForm.alertType,
})

const resolveList = (data: AdvertisingListResponse | AdvertisingItem[] | undefined) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

const resolveTotal = (data: AdvertisingListResponse | AdvertisingItem[] | undefined, list: AdvertisingItem[]) => {
  if (Array.isArray(data)) return data.length
  return Number(data?.total) || list.length
}

const getEnvText = (value: ResourceEnv) => value === 'produce' ? '正式' : '测试(mirror)'

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getResourceList(getListParams()) as ApiResponseData<
      AdvertisingListResponse | AdvertisingItem[]
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

const openCreate = () => dialogRef.value?.openCreate()
const handleEdit = (row: AdvertisingItem) => dialogRef.value?.openEdit(row.id)
const handleCopy = (row: AdvertisingItem) => dialogRef.value?.openCopy(row.id)
const handlePreview = (row: AdvertisingItem) => previewDialogRef.value?.open(row.id)

const handleToggleStatus = async (row: AdvertisingItem, nextStatus: 0 | 1) => {
  const actionText = nextStatus === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定${actionText}【${row.id}：${row.title}】吗？`, `${actionText}提示`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    ElMessage.info('已取消操作')
    return
  }

  await upDownResource(row.id, {
    status: nextStatus,
  })
  ElMessage.success('修改成功')
  fetchTableData()
}
const fetchConfigData = async ()=>{
  const res = await getConfigList()
  alertList.value = selectListData(res.data.alert_type_list || [])
}
onMounted(async() => {
  await fetchConfigData()
  await fetchTableData()
})
</script>

<template>
  <div class="advertising-page">
    <el-card shadow="never" class="glass-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="环境">
          <el-radio-group v-model="queryForm.env" @change="handleSearch">
            <el-radio-button
              v-for="item in ENV_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="标题">
          <el-input
            v-model="queryForm.keyword"
            clearable
            placeholder="标题"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="平台">
          <el-select
            v-model="queryForm.channel"
            clearable
            placeholder="选择平台"
            @change="handleSearch"
            @clear="handleSearch"
            style="width: 160px"
          >
           <el-option
              v-for="item in channelList"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            clearable
            placeholder="选择状态"
            @change="handleSearch"
            @clear="handleSearch"
             style="width: 160px"
          >
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="类型">
          <el-select-v2
          :options="alertList"
          v-model="queryForm.alertType"
          clearable
          placeholder="选择资源位类型"
          @change="handleSearch"
          filterable
          style="width: 200px;"
          >
          </el-select-v2>
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
        style=" height: calc(100vh - 360px);"
        class="m-t-10"
      >
        <el-table-column prop="id" label="ID" width="90" fixed="left" />
        <el-table-column prop="title" label="标题" min-width="220" fixed="left" />
        <el-table-column label="图片" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.banner"
              :src="row.banner"
              :preview-src-list="[row.banner]"
              :preview-teleported="true"
              fit="contain"
              style="width: 72px; height: 40px;"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="lessions_id" label="跳转地址(sku_id)" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '进行中' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="下架时间" min-width="180" />
        <el-table-column prop="sequence" label="排序" width="90" />
        <el-table-column label="平台" min-width="220">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-for="item in row.channel" :key="item" size="small">
                {{ getLabelText(item, CHANNEL_OPTIONS) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="alert_name" label="资源位类型" min-width="160" />
        <el-table-column label="环境" width="120">
          <template #default="{ row }"> 
            <el-tag :type="row.env === 'produce' ? 'success' : 'warning'">
                {{ getEnvText(row.env) }}
                </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.alert_type === 1" link type="success" :icon="View" @click="handlePreview(row)">预览</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" :icon="CopyDocument" @click="handleCopy(row)">复制</el-button>
            <el-button
              v-if="row.status === 0"
              link
              type="danger"
              @click="handleToggleStatus(row, 1)"
            >
              上架
            </el-button>
            <el-button
              v-else
              link
              type="success"
              @click="handleToggleStatus(row, 0)"
            >
              下架
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

    <AdvertisingDialog ref="dialogRef" @success="fetchTableData" />
    <AdPreviewDialog ref="previewDialogRef" />
  </div>
</template>
