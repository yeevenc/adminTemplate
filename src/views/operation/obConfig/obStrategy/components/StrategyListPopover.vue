<script setup lang="ts">
import { ref, watch } from 'vue'
import { View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { ApiResponseData } from '@/utils/request'
import { getObStrategyInfoByIds } from '@/api/operation'
import { SENSORS_KEY_OPTIONS, parseStrategyMemo } from './types'
import type { ObStrategyItem, ObStrategyDetail } from './types'
import ObPreviewDrawer from '@/components/prviewDialog/ObPreviewDrawer.vue'

interface Props {
  row: ObStrategyItem
  visible: boolean
}

const props = defineProps<Props>()

const loading = ref(false)
const strategyList = ref<ObStrategyDetail[]>([])
const previewDrawerRef = ref<InstanceType<typeof ObPreviewDrawer>>()

const fetchStrategies = async () => {
  const ids = parseStrategyMemo(props.row.strategy_memo)
  if (!ids.length) {
    strategyList.value = []
    return
  }
  loading.value = true
  try {
    const res = (await getObStrategyInfoByIds({ ids })) as ApiResponseData<ObStrategyDetail[]>
    strategyList.value = Array.isArray(res.data) ? res.data : []
  } finally {
    loading.value = false
  }
}

// 可见性由父组件控制，打开时才拉取，关闭时清理数据避免下次闪烁
watch(
  () => props.visible,
  (next) => {
    if (next) {
      fetchStrategies()
    } else {
      strategyList.value = []
    }
  },
)

const handlePreview = (id: number | string | undefined, type: 1 | 2) => {
  if (!id) {
    ElMessage.warning('无可预览的配置')
    return
  }
  previewDrawerRef.value?.open(id, type)
}

const getSensorsKeyText = (value: number | string | undefined) => {
  if (!value) return '—'
  return (
    SENSORS_KEY_OPTIONS.find((item) => Number(item.value) === Number(value))?.label || String(value)
  )
}

const getExperimentText = (value: number | string | undefined) => {
  return Number(value) === 1 || Number(value) === 2 ? '是' : '否'
}
</script>

<template>
  <el-popover
    :visible="visible"
    placement="left"
    :width="760"
    trigger="manual"
    :popper-style="{ padding: '12px' }"
  >
    <template #reference>
      <slot />
    </template>

    <div class="strategy-popover">
      <div class="popover-title">【{{ row.title }}】策略列表</div>
      <el-table v-loading="loading" :data="strategyList" stripe border size="small" max-height="420">
        <el-table-column prop="id" label="策略ID" width="80" />
        <el-table-column prop="title" label="策略名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="是否实验" width="80">
          <template #default="{ row: strategy }">
            <el-tag :type="getExperimentText(strategy.experiment_status) === '是' ? 'success' : 'info'">
              {{ getExperimentText(strategy.experiment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="神策key" min-width="200">
          <template #default="{ row: strategy }">{{ getSensorsKeyText(strategy.sensors_key) }}</template>
        </el-table-column>

        <el-table-column label="订阅页配置id" min-width="170">
          <template #default="{ row: strategy }">
            <div class="id-line primary">
              线上：{{ strategy.ob_id || '—' }}
              <el-button
                v-if="strategy.ob_id"
                link
                type="primary"
                :icon="View"
                @click="handlePreview(strategy.ob_id, 1)"
              />
            </div>
            <div v-if="Number(strategy.experiment_status) === 1" class="id-line warning">
              实验：{{ strategy.test_ob_id || '—' }}
              <el-button
                v-if="strategy.test_ob_id"
                link
                type="warning"
                :icon="View"
                @click="handlePreview(strategy.test_ob_id, 1)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="挽留配置id(1)" min-width="170">
          <template #default="{ row: strategy }">
            <div class="id-line primary">
              线上：{{ strategy.first_cancel_id || '—' }}
              <el-button
                v-if="strategy.first_cancel_id"
                link
                type="primary"
                :icon="View"
                @click="handlePreview(strategy.first_cancel_id, 2)"
              />
            </div>
            <div v-if="Number(strategy.experiment_status) === 1" class="id-line warning">
              实验：{{ strategy.test_first_cancel_id || '—' }}
              <el-button
                v-if="strategy.test_first_cancel_id"
                link
                type="warning"
                :icon="View"
                @click="handlePreview(strategy.test_first_cancel_id, 2)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="挽留配置id(2)" min-width="170">
          <template #default="{ row: strategy }">
            <div class="id-line primary">
              线上：{{ strategy.two_cancel_id || '—' }}
              <el-button
                v-if="strategy.two_cancel_id"
                link
                type="primary"
                :icon="View"
                @click="handlePreview(strategy.two_cancel_id, 2)"
              />
            </div>
            <div v-if="Number(strategy.experiment_status) === 1" class="id-line warning">
              实验：{{ strategy.test_two_cancel_id || '—' }}
              <el-button
                v-if="strategy.test_two_cancel_id"
                link
                type="warning"
                :icon="View"
                @click="handlePreview(strategy.test_two_cancel_id, 2)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="line_rate" label="流量比例" width="80">
          <template #default="{ row: strategy }">
            {{ strategy.line_rate ? `${strategy.line_rate}%` : '—' }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ObPreviewDrawer ref="previewDrawerRef" />
  </el-popover>
</template>

<style scoped>
.strategy-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popover-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.id-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.id-line.primary {
  color: var(--el-color-primary);
}

.id-line.warning {
  color: var(--el-color-warning);
}
</style>
