<script setup lang="ts" name="version">
defineOptions({ name: 'version' })
import { Search, Plus, Edit } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { ApiResponseData } from '@/utils/request'
import VersionUpgradeEditDialog from '@/views/setting/version/components/VersionUpgradeEditDialog.vue'
import VersionMarketDialog from '@/views/setting/version/components/VersionMarketDialog.vue'
import { CHANNEL_OPTIONS } from '@/utils/useConfig'
import type {
  FilterFormItem,
  VersionUpgradeQueryForm,
  VersionUpgradeItem,
  VersionUpgradeLatestConfig,
  VersionUpgradeListResponse,
  VersionUpgradePayload,
  VersionUpgradeStatus,
} from '@/views/setting/version/types'
import {
  addVersionConfig,
  editVersionConfig,
  getVersionList,
  saveVersionMarketConfig,
} from '@/api/setting'

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '生产/Mirror 启用', value: '1' },
  { label: '不启用', value: '2' },
  { label: '仅 Mirror 环境启用', value: '3' },
]

const defaultConfigOptions = [
  { label: '全部类型', value: '' },
  { label: '最低兼容版本配置', value: '1' },
  { label: '普通升级配置', value: '2' },
]

// 顶部筛选通过配置驱动，后续扩展字段时无需重复堆模板
const filterFormItems: FilterFormItem[] = [
  {
    label: '版本号',
    field: 'appVersion',
    type: 'input',
    placeholder: '请输入版本号',
  },
  {
    label: '渠道',
    field: 'channel',
    type: 'select',
    placeholder: '请选择渠道',
    options: CHANNEL_OPTIONS,
  },
  {
    label: '状态',
    field: 'status',
    type: 'select',
    placeholder: '请选择状态',
    options: statusOptions,
  },
  {
    label: '配置类型',
    field: 'isDefaultConfig',
    type: 'select',
    placeholder: '请选择配置类型',
    options: defaultConfigOptions,
  },
]

const queryForm = reactive<VersionUpgradeQueryForm>({
  appVersion: '',
  channel: '',
  status: '',
  isDefaultConfig: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  total: 0,
})

const loading = ref(false)
const tableData = ref<VersionUpgradeItem[]>([])
const editDialogVisible = ref(false)
const marketDialogVisible = ref(false)
const currentEditItem = ref<VersionUpgradeItem | null>(null)
const marketConfig = ref<VersionUpgradeLatestConfig>({
  ios: '',
  huawei: '',
  other: '',
})

const statusTextMap: Record<VersionUpgradeStatus, string> = {
  1: '生产/Mirror 启用',
  2: '不启用',
  3: '仅 Mirror 环境启用',
}

const upgradeTypeTextMap: Record<number, string> = {
  1: '强制升级',
  2: '强提示升级',
  3: '弱提示升级',
  4: '不提示升级',
}

function getStatusText(status: VersionUpgradeStatus) {
  return statusTextMap[status]
}

function getListParams() {
  return {
    page: pagination.page,
    page_size: pagination.pageSize,
    app_version: queryForm.appVersion.trim(),
    channel: queryForm.channel,
    status: queryForm.status || '',
    is_default_config: queryForm.isDefaultConfig || '',
  }
}

async function fetchTableData() {
  loading.value = true

  try {
    const response = await getVersionList(getListParams()) as ApiResponseData<VersionUpgradeListResponse>
    const list = Array.isArray(response.data.list) ? response.data.list : []

    tableData.value = list
    pagination.total = response.data.count
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchTableData()
}

function handleFilterChange() {
  handleSearch()
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

function handleAdd() {
  currentEditItem.value = null
  editDialogVisible.value = true
}

function handleEdit(row: VersionUpgradeItem) {
  currentEditItem.value = row
  editDialogVisible.value = true
}

function getSubmitParams(payload: VersionUpgradePayload) {
  return {
    ...(payload.id ? { id: payload.id } : {}),
    channel: payload.channel,
    app_version: payload.appVersion,
    min_version: payload.minVersion,
    upgrade_type: payload.upgradeType,
    upgrade_title: payload.upgradeTitle,
    upgrade_tip: payload.upgradeTip,
    status: payload.status,
    is_default_config: payload.isDefaultConfig,
  }
}

async function handleSubmit(payload: VersionUpgradePayload) {
  if (payload.id) {
    await editVersionConfig(getSubmitParams(payload))
  } else {
    await addVersionConfig(getSubmitParams(payload))
  }

  ElMessage.success(payload.id ? '修改成功' : '新增成功')
  editDialogVisible.value = false
  fetchTableData()
}

async function handleOpenMarketDialog() {
  marketDialogVisible.value = true
}

async function handleSaveMarketConfig(payload: VersionUpgradeLatestConfig) {
  await saveVersionMarketConfig(payload)
  marketConfig.value = payload
  marketDialogVisible.value = false
  ElMessage.success('最新版本号配置已保存')
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="version-upgrade-page">
    <el-card shadow="never" class="glass-card filter-card">
      <el-form :model="queryForm" inline>
        <el-form-item
          v-for="item in filterFormItems"
          :key="item.field"
          :label="item.label"
        >
          <el-input
            v-if="item.type === 'input'"
            v-model="queryForm[item.field]"
            :placeholder="item.placeholder"
            clearable
            @change="handleFilterChange"
            @clear="handleFilterChange"
            @keyup.enter="handleSearch"
          />

          <el-select
            v-else
            v-model="queryForm[item.field]"
            :placeholder="item.placeholder"
            clearable
            style="width: 200px;"
            @change="handleFilterChange"
          >
            <el-option
              v-for="option in item.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="content-grid">
      <el-card shadow="never" class="glass-card">
          <el-button plain :icon="Plus" type="primary" @click="handleOpenMarketDialog">最新版本号配置</el-button>
          <el-button type="success" plain :icon="Plus" @click="handleAdd">新增升级配置</el-button>
        <el-table v-loading="loading" stripe border :data="tableData" class="m-t-10" style="height: calc(100vh - 350px);">
          <el-table-column prop="id" label="ID" fixed width="70" />
          <el-table-column prop="channel" label="渠道" min-width="140">
          </el-table-column>
          <el-table-column prop="appVersion" label="版本号" min-width="120" />
          <el-table-column prop="minVersion" label="最低兼容版本号" min-width="140" />
          <el-table-column label="升级类型" min-width="110">
            <template #default="{ row }">
              {{ upgradeTypeTextMap[row.upgradeType] }}
            </template>
          </el-table-column>
          <el-table-column prop="upgradeTitle" label="升级标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="upgradeTip" label="升级提示语" min-width="220" show-overflow-tooltip />
          <el-table-column label="状态" min-width="150">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'">
                {{ getStatusText(row.status as VersionUpgradeStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="配置类型" min-width="130">
            <template #default="{ row }">
              <el-tag :type="row.isDefaultConfig === 1 ? 'danger' : 'primary'" effect="light">
                {{ row.isDefaultConfig === 1 ? '最低兼容版本配置' : '普通升级配置' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" min-width="168" />
          <el-table-column label="操作" align="center" fixed="right" width="100">
            <template #default="{ row }">
              <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
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
    </div>

    <VersionUpgradeEditDialog
      v-model="editDialogVisible"
      :model-value-data="currentEditItem"
      @submit="handleSubmit"
    />

    <VersionMarketDialog
      v-model="marketDialogVisible"
      :config="marketConfig"
      @submit="handleSaveMarketConfig"
    />
  </div>
</template>

<style scoped>
.version-upgrade-page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

</style>
