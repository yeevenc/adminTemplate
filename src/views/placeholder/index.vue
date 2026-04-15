<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="placeholder-page">
    <div class="placeholder-card glass-card">
      <div class="placeholder-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          <circle cx="16.5" cy="6.5" r="1.2" opacity="0.55" />
          <circle cx="18.5" cy="9.5" r="0.8" opacity="0.38" />
        </svg>
      </div>
      <h2 class="placeholder-title">{{ route.meta?.title ?? '页面' }}</h2>
      <p class="placeholder-sub">功能开发中，敬请期待</p>
      <div class="placeholder-badge">Coming Soon</div>
    </div>
  </div>
</template>

<style scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 56px 64px;
  border-radius: 24px;
  text-align: center;
  max-width: 380px;
  width: 100%;
}

.placeholder-icon {
  color: var(--color-primary);
  opacity: 0.85;
  margin-bottom: 4px;
}

.placeholder-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.placeholder-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}

.placeholder-badge {
  margin-top: 8px;
  padding: 6px 18px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  border: 1px solid var(--el-color-primary-light-7);
}
</style>
