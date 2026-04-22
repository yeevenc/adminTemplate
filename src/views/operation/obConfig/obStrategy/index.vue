<script setup lang="ts">
defineOptions({ name: 'obStrategy' })

import { CopyDocument, Edit, Plus, Search, Top, Bottom,View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getObStrategyList, updateObStrategyStatus } from '@/api/operation'
import {
  USER_GROUP_AGE_OPTIONS,
  USER_GROUP_CHANNEL_OPTIONS,
  getLabelText,
  CHANNEL_OPTIONS
} from '@/utils/useConfig'
// ob表单配置
import ObStrategyDialog from './components/ObStrategyDialog.vue'
// 查看策略
import StrategyListPopover from './components/StrategyListPopover.vue'
import type { ObStrategyItem } from './components/types'

type ResourceEnv = 'produce' | 'mirror'

interface ListResponse {
  list: ObStrategyItem[]
  total: number
}

const ENV_OPTIONS: Array<{ label: string; value: ResourceEnv }> = [
  { label: '正式', value: 'produce' },
  { label: '测试', value: 'mirror' },
]

const SCENE_OPTIONS = [
  { label: '旧OB', value: 1 },
  { label: '二次OB', value: 2 },
]

const USER_OPTIONS = [
  { label: '新增用户', value: 0 },
  { label: '沉默用户', value: 1 },
]

const STATUS_OPTIONS = [
  { label: '上线', value: 1 },
  { label: '下线', value: 0 },
]

const SENSORS_CHANNEL_OPTIONS = USER_GROUP_CHANNEL_OPTIONS

const AGE_OPTIONS = USER_GROUP_AGE_OPTIONS

const getUserText = (value: number | string) => {
  return USER_OPTIONS.find((item) => String(item.value) === String(value))?.label || String(value)
}

const loading = ref(false)
const tableData = ref<ObStrategyItem[]>([])
const dialogRef = ref<InstanceType<typeof ObStrategyDialog>>()
// 策略 popover 由行 id 驱动：只有同一行会再次点击关闭，切换行时旧 popover 会自动关闭
const openPopoverId = ref<number | string | null>(null)

const queryForm = reactive({
  env: 'produce' as ResourceEnv,
  scene: 1 as 1 | 2,
  is_silent: '' as number | string | '',
  age: '' as number | '',
  status: '' as number | '',
  channel: '' as string,
  sensors_channel: '' as number | '',
  id: '',
  title: '',
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
  scene: queryForm.scene,
  is_silent: queryForm.is_silent,
  age: queryForm.age,
  status: queryForm.status,
  channel: queryForm.channel,
  sensors_channel: queryForm.sensors_channel,
  id: queryForm.id.trim(),
  title: queryForm.title.trim(),
})

const fetchTableData = async () => {
  loading.value = true
  try {
    const res = (await getObStrategyList(getListParams())) as ApiResponseData<ListResponse>
    tableData.value = Array.isArray(res.data?.list) ? res.data.list : []
    pagination.total = Number(res.data?.total) || 0
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

const handleAdd = () => {
  dialogRef.value?.openCreate()
}

const handleEdit = (row: ObStrategyItem) => {
  dialogRef.value?.openEdit(row)
}

const handleCopy = (row: ObStrategyItem) => {
  dialogRef.value?.openCopy(row)
}

const handleViewStrategies = (row: ObStrategyItem) => {
  openPopoverId.value = openPopoverId.value === row.id ? null : row.id
}

// 确认弹窗避免误操作导致线上配置被下架
const handleToggleStatus = async (row: ObStrategyItem) => {
  const nextStatus: 0 | 1 = row.status_name === '上线中' ? 0 : 1
  const action = nextStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确认${action}【${row.title}】？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  await updateObStrategyStatus(row.id, { status: nextStatus })
  ElMessage.success(`${action}成功`)
  fetchTableData()
}

onMounted(() => {
  fetchTableData()
})
</script>

<template>
  <div class="ob-strategy-page">
    <!-- 顶部筛选区：与运营中心其他页面保持一致 -->
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

        <el-form-item label="OB">
          <el-select
            v-model="queryForm.scene"
            placeholder="选择OB"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in SCENE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="用户">
          <el-select
            v-model="queryForm.is_silent"
            clearable
            placeholder="选择用户"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in USER_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="年龄">
          <el-select
            v-model="queryForm.age"
            clearable
            placeholder="选择年龄"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in AGE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="上线状态">
          <el-select
            v-model="queryForm.status"
            clearable
            placeholder="选择状态"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="平台">
          <el-select
            v-model="queryForm.channel"
            clearable
            placeholder="选择平台"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in CHANNEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="渠道">
          <el-select
            v-model="queryForm.sensors_channel"
            clearable
            placeholder="选择渠道"
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in SENSORS_CHANNEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="配置ID">
          <el-input
            v-model="queryForm.id"
            clearable
            placeholder="ob配置ID"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="配置名称">
          <el-input
            v-model="queryForm.title"
            clearable
            placeholder="ob配置名称"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区：只负责展示和转发操作到弹窗组件 -->
    <el-card shadow="never" class="glass-card m-t-10">
      <el-button :icon="Plus" type="primary" plain @click="handleAdd">添加</el-button>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        class="m-t-10"
        style="width: 100%;height: calc(100vh - 360px);"
      >
        <el-table-column prop="id" label="配置ID" width="90" fixed="left" />
        <el-table-column label="OB展示" width="90">
          <template #default="{ row }">
            {{ row.scene === 1 ? '旧OB' : '二次OB' }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="配置名称" min-width="160" show-overflow-tooltip fixed="left" />

        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <el-space wrap size="small">
              <el-tag v-for="item in row.is_silent" :key="item" type="info">
                {{ getUserText(item) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="平台" min-width="200">
          <template #default="{ row }">
            <el-space wrap size="small">
              <el-tag v-for="item in row.channel" :key="item" type="success">
                {{ getLabelText(item, CHANNEL_OPTIONS) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="渠道" min-width="230">
          <template #default="{ row }">
            <el-space wrap size="small">
              <el-tag v-for="item in row.sensors_channel" :key="item" type="primary">
                {{ getLabelText(item, SENSORS_CHANNEL_OPTIONS) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="年龄" min-width="280">
          <template #default="{ row }">
            <el-space wrap size="small">
              <el-tag v-for="item in row.age" :key="item" type="warning">
                {{ getLabelText(item, USER_GROUP_AGE_OPTIONS) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="上线状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status_name === '上线中' ? 'success' : 'danger'">
              {{ row.status_name === '上线中' ? '上线中' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="是否做过实验" width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_test === '做过实验' ? 'danger' : 'success'">
              {{ row.is_test || '—' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="experiment_name" label="实验状态" min-width="100" />

        <el-table-column label="策略信息" min-width="240">
          <template #default="{ row }">
            <el-popover
              v-if="Array.isArray(row.strategy_arr) && row.strategy_arr.length"
              placement="top"
              trigger="hover"
              :width="360"
            >
              <template #reference>
                <span class="strategy-preview">{{ row.strategy_arr[0] }} ...</span>
              </template>
              <div v-for="(text, idx) in row.strategy_arr" :key="idx" class="strategy-item">
                {{ text }}
              </div>
            </el-popover>
            <span v-else>—</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="175" />

        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <StrategyListPopover :row="row" :visible="openPopoverId === row.id">
              <el-button link type="primary" :icon="View" @click="handleViewStrategies(row)">策略</el-button>
            </StrategyListPopover>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">修改</el-button>
            <el-button
              v-if="row.status_name === '上线中'"
              link
              type="danger"
              :icon="Bottom"
              @click="handleToggleStatus(row)"
            >
              下架
            </el-button>
            <el-button
              v-else
              link
              type="success"
              :icon="Top"
              @click="handleToggleStatus(row)"
            >
              上架
            </el-button>
            <el-button
              v-if="row.scene === 1"
              link
              type="warning"
              :icon="CopyDocument"
              @click="handleCopy(row)"
            >
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

    <!-- OB 配置表单弹窗：由组件内部维护表单、策略列表、预览、释放实验等交互 -->
    <ObStrategyDialog ref="dialogRef" @success="fetchTableData" />
  </div>
</template>

<style scoped>
.ob-strategy-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.strategy-preview {
  cursor: pointer;
  color: var(--el-color-primary);
}

.strategy-item {
  padding: 2px 0;
  font-size: 13px;
}
</style>
