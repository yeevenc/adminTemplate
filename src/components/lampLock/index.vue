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
      <div class="lamp-wrap" @click.stop>
        <!-- 台灯 SVG，200×280px viewBox -->
        <svg
          width="200"
          height="280"
          viewBox="0 0 200 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="lamp-svg"
        >
          <!-- ① 定向光束（锥形，从灯罩底部向下扩散） -->
          <defs>
            <linearGradient id="lamplock-beamGrad" x1="100" y1="100" x2="100" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#FDE68A" stop-opacity="0"/>
            </linearGradient>
            <filter id="lamplock-beamBlur" x="-20%" y="-5%" width="140%" height="120%">
              <feGaussianBlur stdDeviation="5"/>
            </filter>
            <radialGradient id="lamplock-floorGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#FDE68A" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- 光束锥形 -->
          <polygon
            points="78,100 122,100 155,255 45,255"
            fill="url(#lamplock-beamGrad)"
            filter="url(#lamplock-beamBlur)"
            class="beam"
          />

          <!-- 地面光斑 -->
          <ellipse cx="100" cy="260" rx="55" ry="14" fill="url(#lamplock-floorGlow)" class="beam"/>

          <!-- ② 底座 -->
          <ellipse cx="100" cy="248" rx="34" ry="10" fill="#3B1F6A" stroke="#6D28D9" stroke-width="1.5"/>

          <!-- ③ 灯柱 -->
          <rect x="97" y="130" width="6" height="120" rx="3" fill="#5B21B6"/>

          <!-- ④ 灯罩（梯形，顶窄底宽） -->
          <path
            d="M68,100 L132,100 L148,62 L52,62 Z"
            fill="#FCD34D"
            stroke="#92400E"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <!-- 灯罩内侧阴影 -->
          <path
            d="M72,100 L128,100 L143,65 L57,65 Z"
            fill="#FDE68A"
            opacity="0.4"
          />

          <!-- ⑤ 灯罩顶部封口 -->
          <rect x="52" y="58" width="96" height="8" rx="4" fill="#92400E"/>

          <!-- ⑥ 眼睛（闭合弧线，对称居中于灯罩正面） -->
          <!-- 左眼 -->
          <path
            d="M82,80 Q88,75 94,80"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            fill="none"
          />
          <!-- 右眼 -->
          <path
            d="M106,80 Q112,75 118,80"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      </div>
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

/* ── 全屏遮罩 ── */
.lock-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000; /* 必须 > cord-wrap(9999) */
  cursor: pointer;
  /* 深蓝夜空背景，与项目主题一致 */
  background:
    /* 星点层 */
    radial-gradient(circle at 15% 25%, rgba(255,255,255,0.8) 0 1px, transparent 2px),
    radial-gradient(circle at 75% 15%, rgba(196,181,253,0.6) 0 1px, transparent 2px),
    radial-gradient(circle at 45% 70%, rgba(255,255,255,0.7) 0 1px, transparent 2px),
    radial-gradient(circle at 85% 55%, rgba(196,181,253,0.5) 0 1px, transparent 2px),
    radial-gradient(circle at 30% 85%, rgba(255,255,255,0.6) 0 1px, transparent 2px),
    radial-gradient(circle at 60% 40%, rgba(196,181,253,0.4) 0 1px, transparent 2px),
    radial-gradient(circle at 10% 60%, rgba(255,255,255,0.5) 0 1px, transparent 2px),
    radial-gradient(circle at 90% 80%, rgba(196,181,253,0.6) 0 1px, transparent 2px),
    /* 氛围光晕层（增加景深） */
    radial-gradient(circle at 20% 30%, rgba(139,92,246,0.18) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(109,40,217,0.12) 0%, transparent 50%),
    linear-gradient(160deg, #0b0620 0%, #130b36 50%, #0e082a 100%);
  /* 滑入动画：从顶部滑下，cubic-bezier 含回弹 */
  animation: slideDown 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to   { transform: translateY(0); }
}

/* ── 台灯容器 ── */
.lamp-wrap {
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
}

/* ── 光束与光斑：闪烁动画 ── */
.beam {
  animation: flicker 2.5s ease-in-out infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  40%       { opacity: 0.55; }
  70%       { opacity: 0.85; }
}
</style>
