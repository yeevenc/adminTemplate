<script setup lang="ts" name="userCheckInDuration">
defineOptions({ name: 'userCheckInDuration' })

import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getUserCheckInDuration } from '@/api/userConfig'

interface UserCheckInDurationResult {
  uid: number | string
  date: string
  today_listen_minutes: number | string
}

const loading = ref(false)
const searchResult = ref<UserCheckInDurationResult | null>(null)

const queryForm = reactive({
  uid: '',
  date: '',
  activeId: '1000',
})

const getQueryParams = () => {
  return {
    uid: queryForm.uid.trim(),
    date: queryForm.date,
    active_id: queryForm.activeId.trim(),
  }
}

const handleSearch = async () => {
  if (!queryForm.uid.trim()) {
    ElMessage.warning('请输入用户ID')
    return
  }

  if (!queryForm.date) {
    ElMessage.warning('请选择日期')
    return
  }

  loading.value = true

  try {
    const response = await getUserCheckInDuration(getQueryParams()) as ApiResponseData<UserCheckInDurationResult>
    searchResult.value = response.data || null
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryForm.uid = ''
  queryForm.date = ''
  queryForm.activeId = '1000'
  searchResult.value = null
}
</script>

<template>
  <div class="user-check-in-duration-page">
    <div class="page-header glass-card">
      <div>
        <h2 class="page-title">用户打卡查询</h2>
        <p class="page-subtitle">按用户、日期和活动查询当天练习时长，页面只保留最核心查询结果。</p>
      </div>
    </div>

    <el-card shadow="never" class="glass-card filter-card">
      <el-form :model="queryForm" class="filter-form" label-position="top">
        <div class="filter-row">
          <el-form-item label="用户ID" class="filter-item">
            <el-input
              v-model="queryForm.uid"
              clearable
              placeholder="请输入用户ID"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="日期" class="filter-item">
            <el-date-picker
              v-model="queryForm.date"
              type="date"
              value-format="YYYYMMDD"
              placeholder="请选择日期"
            />
          </el-form-item>

          <el-form-item label="活动ID" class="filter-item">
            <el-input
              v-model="queryForm.activeId"
              clearable
              placeholder="请输入活动ID"
            />
          </el-form-item>

          <el-form-item class="filter-actions">
            <el-button :icon="Search" type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="glass-card result-card">
      <template v-if="searchResult">
        <div class="result-banner">
          <span>查询结果：</span>
          <span class="result-highlight">用户 {{ searchResult.uid }}</span>
          <span>在</span>
          <span class="result-highlight">{{ searchResult.date }}</span>
          <span>练习时长为：</span>
          <span class="result-minutes">{{ searchResult.today_listen_minutes }} 分钟</span>
        </div>
      </template>

      <el-empty
        v-else
        :description="loading ? '查询中...' : '请输入条件后查询用户打卡时长'"
      />
    </el-card>
  </div>
</template>

<style scoped>
.user-check-in-duration-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
}

.page-title {
  margin: 0 0 8px;
  color: var(--text-primary);
  font-size: 26px;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.filter-card,
.result-card {
  border: none;
}

.filter-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  width: 220px;
  margin-bottom: 0;
}

.filter-actions {
  margin-bottom: 0;
}

.result-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.result-highlight {
  color: #f56c6c;
}

.result-minutes {
  color: #e6a23c;
}

@media (max-width: 768px) {
  .page-header,
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    width: 100%;
  }

  .result-banner {
    font-size: 16px;
  }
}
</style>
