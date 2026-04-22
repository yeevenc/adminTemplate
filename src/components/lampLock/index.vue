<script setup lang="ts">
import { ref } from 'vue'

const isLocked = ref(false)
const isPulling = ref(false)

const pullCord = () => {
  if (isPulling.value || isLocked.value) return
  isPulling.value = true
  setTimeout(() => {
    isPulling.value = false
    isLocked.value = true
  }, 250)
}

const unlock = () => {
  isLocked.value = false
}
</script>

<template>
  <!-- 灯绳入口：固定在页面顶部中央，始终可见 -->
  <div
    class="cord-wrap"
    :class="{ pulling: isPulling }"
    @click="pullCord"
    title="拉灯绳"
  >
    <svg
      width="22"
      height="54"
      viewBox="0 0 22 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="cord-svg"
    >
      <!-- 灯线 -->
      <line x1="11" y1="0" x2="11" y2="36" stroke="#C4B5FD" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 绳结圆圈 -->
      <circle cx="11" cy="42" r="5" stroke="#C4B5FD" stroke-width="1.5" fill="rgba(139,92,246,0.18)"/>
      <!-- 绳结小节 -->
      <line x1="11" y1="47" x2="11" y2="53" stroke="#C4B5FD" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </div>

  <!-- 全屏遮罩（Teleport 到 body） -->
  <Teleport to="body">
    <div
      v-if="isLocked"
      class="lock-overlay"
      @click="unlock"
    >
      <!-- 台灯插画占位，Task 2 填充 -->
    </div>
  </Teleport>
</template>

<style scoped>
/* ── 灯绳入口 ── */
.cord-wrap {
  position: fixed;
  top: 0;
  left: 50%;
  /* 水平居中初始值；swing 关键帧每帧必须保留 translateX(-50%) 以维持居中 */
  transform: translateX(-50%);
  z-index: 9999;
  cursor: pointer;
  transform-origin: top center;
  animation: swing 1.5s ease-in-out infinite;
  transition: filter 0.2s;
}

.cord-wrap:hover {
  filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.7));
}

.cord-wrap.pulling .cord-svg {
  animation: pull 0.25s ease forwards;
}

@keyframes swing {
  0%, 100% { transform: translateX(-50%) rotate(-4deg); }
  50%       { transform: translateX(-50%) rotate(4deg); }
}

@keyframes pull {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(1.2); }
  100% { transform: scaleY(1); }
}
</style>
