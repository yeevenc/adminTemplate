<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@element-plus/icons-vue'

defineOptions({ name: 'manual' })

const loading = ref(true)
</script>

<template>
  <div class="manual-page">
    <div v-if="loading" class="manual-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>页面加载中...</span>
    </div>
    <iframe
      src="https://rmevkugaca.feishu.cn/wiki/JeRswZ9BbiCzcqkWUgycFM4MnUf?fromScene=spaceOverview"
      class="manual-iframe"
      :class="{ hidden: loading }"
      frameborder="0"
      allowfullscreen
      @load="loading = false"
    />
  </div>
</template>

<style scoped>
.manual-page {
  margin: -24px;
  height: calc(100vh - 104px);
  overflow: hidden;
  position: relative;
}

.manual-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted, #909399);
  font-size: 14px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.6));
  z-index: 1;
}

.loading-icon {
  font-size: 32px;
  color: var(--color-primary, #6366f1);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.manual-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.manual-iframe.hidden {
  visibility: hidden;
}
</style>
