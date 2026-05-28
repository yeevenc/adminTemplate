<script setup lang="ts" name="newUserConversion">
defineOptions({ name: 'newUserConversion' })

import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { addInvestmentAmount, getNewUserConversionData } from '@/api/statistics'
import {PLATFORM_OPTIONS,CHANNEL_OPTIONS} from "@/utils/useConfig"
interface ConversionRow {
  date: string | number
  put_in_total: number | string
  ios_roi?: number | string
  android_roi?: number | string
  new: number | string
  day1_order: number | string
  day1_income: number | string
  day1_rate: string
  day1_roi: number | string
  day7_order: number | string
  day7_income: number | string
  day7_rate: string
  day7_roi: number | string
  day30_order: number | string
  day30_income: number | string
  day30_rate: string
  day30_roi: number | string
  day90_order: number | string
  day90_income: number | string
  day90_rate: string
  day90_roi: number | string
  day180_order: number | string
  day180_income: number | string
  day180_rate: string
  day180_roi: number | string
}

interface ConversionListResponse {
  list: ConversionRow[]
  total?: number
}

type StatisticsType = 0 | 1

const STATISTICS_OPTIONS: Array<{ value: StatisticsType; label: string }> = [
  { value: 0, label: '日统计' },
  { value: 1, label: '月统计' },
]

/** 生成 N 天前到今天的日期区间（YYYY-MM-DD） */
const getDateRange = (days: number): [Date, Date] => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return [start, end]
}

/** 生成 N 月前到本月的月份区间 */
const getMonthRange = (months: number): [Date, Date] => {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - months)
  return [start, end]
}

const dateShortcuts = [
  { text: '最近7天', value: () => getDateRange(6) },
  { text: '最近14天', value: () => getDateRange(13) },
  { text: '最近30天', value: () => getDateRange(29) },
]

const monthShortcuts = [
  { text: '本月', value: () => [new Date(), new Date()] as [Date, Date] },
  { text: '近3个月', value: () => getMonthRange(2) },
  { text: '近6个月', value: () => getMonthRange(5) },
  { text: '近12个月', value: () => getMonthRange(11) },
]

const loading = ref(false)
const tableData = ref<ConversionRow[]>([])
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const queryForm = reactive({
  type: 0 as StatisticsType,
  channel: '' as string,
  dateRange: [] as string[],
  monthRange: [] as string[],
  platform: '' as string,
})

const dialogVisible = ref(false)
const roiForm = reactive({
  date: '' as string | number,
  ios_roi: '' as string | number,
  android_roi: '' as string | number,
})

const roiTotal = computed(() =>
  (Number(roiForm.ios_roi || 0) + Number(roiForm.android_roi || 0)).toFixed(2),
)

const getRangeParams = () => {
  const range = queryForm.type === 0 ? queryForm.dateRange : queryForm.monthRange
  return {
    start_time: range?.[0] || '',
    end_time: range?.[1] || '',
  }
}

const buildParams = () => ({
  type: queryForm.type,
  channel: queryForm.channel,
  ...getRangeParams(),
})

/** 将 YYYYMMDD 转为 YYYY-MM-DD，月统计为 YYYYMM → YYYY-MM */
const formatDate = (date: string | number) => {
  const str = String(date)
  if (str.length === 8) return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
  if (str.length === 6) return `${str.slice(0, 4)}-${str.slice(4, 6)}`
  return str
}

/** 百分比字符串转数字 */
const rateToNumber = (rate?: string) => Number((rate || '').toString().replace('%', '')) || 0

const renderChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  const xAxis = tableData.value.map(row => formatDate(row.date))
  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['当日转化率', '7日转化率', '30日转化率'], top: 10 },
    grid: { left: 40, right: 20, top: 50, bottom: 40 },
    xAxis: { type: 'category', boundaryGap: false, data: xAxis },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [
      { name: '当日转化率', type: 'line', data: tableData.value.map(r => rateToNumber(r.day1_rate)) },
      { name: '7日转化率', type: 'line', data: tableData.value.map(r => rateToNumber(r.day7_rate)) },
      { name: '30日转化率', type: 'line', data: tableData.value.map(r => rateToNumber(r.day30_rate)) },
    ],
  }, true)
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const response = await getNewUserConversionData(buildParams()) as ApiResponseData<ConversionListResponse>
    tableData.value = response.data?.list || []
    renderChart()
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchTableData()
}

const openRoiDialog = (row: ConversionRow) => {
  if (queryForm.type !== 0) return
  roiForm.date = row.date
  roiForm.ios_roi = row.ios_roi ?? ''
  roiForm.android_roi = row.android_roi ?? ''
  dialogVisible.value = true
}

const submitRoi = async () => {
  await addInvestmentAmount({ ...roiForm })
  ElMessage.success('修改成功')
  dialogVisible.value = false
  fetchTableData()
}

const handleResize = () => chartInstance?.resize()

watch(() => queryForm.type, () => {
  queryForm.dateRange = []
  queryForm.monthRange = []
})

onMounted(() => {
  fetchTableData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div class="conversion-page">
    <el-card shadow="never" class="glass-card tip-card">
      <div class="tip-title">备注</div>
      <div>时间跨度最大支持 30 天，如需更长维度请联系服务端处理。</div>
      <div>如需只查看某日数据，请双击日历中的某一天后确定即可。</div>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-form inline :model="queryForm">
        <el-form-item label="统计方式">
          <el-select v-model="queryForm.type" style="width: 140px" @change="handleSearch">
            <el-option
              v-for="item in STATISTICS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
         <el-form-item label="平台">
          <el-select v-model="queryForm.platform" style="width: 160px" placeholder="请选择渠道">
            <el-option
              v-for="item in PLATFORM_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="queryForm.channel" style="width: 160px" placeholder="请选择渠道">
            <el-option
              v-for="item in CHANNEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="queryForm.type === 0" label="日期">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item v-else label="月份">
          <el-date-picker
            v-model="queryForm.monthRange"
            type="monthrange"
            value-format="YYYY-MM"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            :shortcuts="monthShortcuts"
          />
        </el-form-item>
        <el-form-item>
          <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card">
      <div ref="chartRef" v-loading="loading" class="chart-box" />
    </el-card>

    <el-card shadow="never" class="glass-card">
      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%" height="500">
        <el-table-column prop="date" label="日期" width="110" fixed="left" />
        <el-table-column label="投放金额" width="120" fixed="left">
          <template #default="{ row }">
            <el-button
              v-if="queryForm.type === 0"
              link
              type="primary"
              @click="openRoiDialog(row)"
            >
              {{ Number(row.put_in_total) === 0 ? '请输入' : row.put_in_total }}
            </el-button>
            <span v-else>{{ row.put_in_total }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="new" label="新增激活用户" width="110" />
        <el-table-column prop="day1_order" label="当日订单" width="100" />
        <el-table-column prop="day1_income" label="当日收入" width="100" />
        <el-table-column prop="day1_rate" label="当日转化率" width="110" />
        <el-table-column prop="day1_roi" label="当日ROI" width="100" />
        <el-table-column prop="day7_order" label="7日订单" width="100" />
        <el-table-column prop="day7_income" label="7日收入" width="100" />
        <el-table-column prop="day7_rate" label="7日转化率" width="110" />
        <el-table-column prop="day7_roi" label="7日ROI" width="100" />
        <el-table-column prop="day30_order" label="30日订单" width="100" />
        <el-table-column prop="day30_income" label="30日收入" width="100" />
        <el-table-column prop="day30_rate" label="30日转化率" width="110" />
        <el-table-column prop="day30_roi" label="30日ROI" width="100" />
        <el-table-column prop="day90_order" label="90日订单" width="100" />
        <el-table-column prop="day90_income" label="90日收入" width="100" />
        <el-table-column prop="day90_rate" label="90日转化率" width="110" />
        <el-table-column prop="day90_roi" label="90日ROI" width="100" />
        <el-table-column prop="day180_order" label="180日订单" width="100" />
        <el-table-column prop="day180_income" label="180日收入" width="100" />
        <el-table-column prop="day180_rate" label="180日转化率" width="110" />
        <el-table-column prop="day180_roi" label="180日ROI" width="100" />
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="设置投放金额" width="480px">
      <el-form :model="roiForm" label-width="90px">
        <el-form-item label="日期">
          <span>{{ roiForm.date }}</span>
        </el-form-item>
        <el-form-item label="iOS 投放">
          <el-input v-model="roiForm.ios_roi" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="安卓投放">
          <el-input v-model="roiForm.android_roi" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="总额">
          <span>{{ roiTotal }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRoi">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.conversion-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tip-card .tip-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.chart-box {
  width: 100%;
  height: 340px;
}
</style>
