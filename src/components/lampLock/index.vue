<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isLocked = ref(false)
const isClosing = ref(false)
const isPulling = ref(false)

const pullCord = () => {
  if (isPulling.value || isLocked.value) return
  isPulling.value = true
  setTimeout(() => {
    isPulling.value = false
    isLocked.value = true
    isClosing.value = false
  }, 250)
}

const unlock = () => {
  if (isClosing.value) return
  isClosing.value = true
  setTimeout(() => {
    isLocked.value = false
    isClosing.value = false
  }, 480)
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isLocked.value && !isClosing.value) unlock()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
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
      :class="{ closing: isClosing }"
      @click="unlock"
    >
      <div class="lamp-wrap" @click.stop>
        <!-- 台灯 SVG，只含灯罩+灯柱顶部，顶部挂灯样式 -->
        <svg
          width="200"
          height="160"
          viewBox="0 0 200 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="lamp-svg"
        >
          <!-- 灯柱顶部（短节，延伸向下接光束区域） -->
          <rect x="97" y="100" width="6" height="60" rx="3" fill="#5B21B6"/>

          <!-- 灯罩（梯形，顶窄底宽） -->
          <path
            d="M68,100 L132,100 L148,62 L52,62 Z"
            fill="#FCD34D"
            stroke="#92400E"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <!-- 灯罩内侧高光 -->
          <path
            d="M72,100 L128,100 L143,65 L57,65 Z"
            fill="#FDE68A"
            opacity="0.4"
          />

          <!-- 灯罩顶部封口 -->
          <rect x="52" y="58" width="96" height="8" rx="4" fill="#92400E"/>

          <!-- 眼睛（闭合弧线） -->
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

      <!-- 全高光束：从灯罩底部向下铺满屏幕 -->
      <div class="full-beam"></div>
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
  overflow: hidden;
  /* 深色夜空底色 + 丰富星点层 */
  background:
    /* 大亮星 */
    radial-gradient(circle at 8%  10%, rgba(255,255,255,1)   0 2px,   transparent 3px),
    radial-gradient(circle at 91%  7%, rgba(255,255,255,1)   0 2px,   transparent 3px),
    radial-gradient(circle at 50%  4%, rgba(255,255,255,1)   0 1.5px, transparent 2.5px),
    radial-gradient(circle at 24% 19%, rgba(255,255,255,1)   0 1.5px, transparent 2.5px),
    radial-gradient(circle at 71% 17%, rgba(196,181,253,1)   0 1.5px, transparent 2.5px),
    radial-gradient(circle at 37% 31%, rgba(255,255,255,0.95)0 1.5px, transparent 2.5px),
    radial-gradient(circle at 83% 34%, rgba(255,255,255,0.95)0 1.5px, transparent 2.5px),
    radial-gradient(circle at 14% 44%, rgba(196,181,253,0.9) 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 63% 50%, rgba(255,255,255,0.9) 0 1.5px, transparent 2.5px),
    /* 中等星 */
    radial-gradient(circle at 56% 46%, rgba(196,181,253,0.85)0 1px,   transparent 2px),
    radial-gradient(circle at 89% 51%, rgba(255,255,255,0.8) 0 1px,   transparent 2px),
    radial-gradient(circle at 34% 57%, rgba(255,255,255,0.8) 0 1px,   transparent 2px),
    radial-gradient(circle at 69% 61%, rgba(196,181,253,0.8) 0 1px,   transparent 2px),
    radial-gradient(circle at 11% 70%, rgba(255,255,255,0.85)0 1px,   transparent 2px),
    radial-gradient(circle at 77% 74%, rgba(255,255,255,0.8) 0 1px,   transparent 2px),
    radial-gradient(circle at 46% 81%, rgba(196,181,253,0.75)0 1px,   transparent 2px),
    radial-gradient(circle at 27% 87%, rgba(255,255,255,0.75)0 1px,   transparent 2px),
    radial-gradient(circle at 61% 91%, rgba(255,255,255,0.75)0 1px,   transparent 2px),
    radial-gradient(circle at 94% 93%, rgba(196,181,253,0.7) 0 1px,   transparent 2px),
    radial-gradient(circle at 18% 96%, rgba(255,255,255,0.7) 0 1px,   transparent 2px),
    /* 小星点 */
    radial-gradient(circle at  4% 37%, rgba(255,255,255,0.65)0 0.5px, transparent 1px),
    radial-gradient(circle at 43% 14%, rgba(255,255,255,0.65)0 0.5px, transparent 1px),
    radial-gradient(circle at 74% 27%, rgba(255,255,255,0.6) 0 0.5px, transparent 1px),
    radial-gradient(circle at 19% 54%, rgba(196,181,253,0.6) 0 0.5px, transparent 1px),
    radial-gradient(circle at 57% 67%, rgba(255,255,255,0.6) 0 0.5px, transparent 1px),
    radial-gradient(circle at 86% 41%, rgba(255,255,255,0.6) 0 0.5px, transparent 1px),
    radial-gradient(circle at 31% 77%, rgba(196,181,253,0.55)0 0.5px, transparent 1px),
    radial-gradient(circle at 93% 64%, rgba(255,255,255,0.55)0 0.5px, transparent 1px),
    radial-gradient(circle at 48% 94%, rgba(255,255,255,0.55)0 0.5px, transparent 1px),
    /* 紫色氛围光晕 */
    radial-gradient(ellipse at 50% 0%,   rgba(139,92,246,0.28) 0%, transparent 55%),
    radial-gradient(circle   at 15% 25%, rgba(139,92,246,0.15) 0%, transparent 35%),
    radial-gradient(circle   at 85% 75%, rgba(109,40,217,0.12) 0%, transparent 35%),
    /* 深夜空底色 */
    linear-gradient(180deg, #040210 0%, #090522 45%, #070418 100%);
  /* 滑入动画：多步 keyframe 强回弹 */
  animation: slideDown 0.8s ease-out forwards;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

@keyframes slideDown {
  0%   { transform: translateY(-100%); }
  60%  { transform: translateY(12%); }   /* 强力冲过底部 */
  72%  { transform: translateY(-5%); }   /* 第一次回弹 */
  82%  { transform: translateY(3%); }    /* 第二次弹落 */
  90%  { transform: translateY(-1.5%); } /* 第三次小弹 */
  96%  { transform: translateY(0.5%); }
  100% { transform: translateY(0); }
}

/* ── 台灯容器（顶部居中） ── */
.lamp-wrap {
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
  position: relative;
  z-index: 1;
}

/* ── 全高光束：从灯罩底部向下铺满屏幕 ── */
.full-beam {
  position: absolute;
  top: 100px; /* 灯罩底部开口的屏幕 y 坐标 */
  left: 0;
  right: 0;
  bottom: 0;
  /* 锥形裁切：顶部约 22% 宽，向下扩散至全宽 */
  clip-path: polygon(39% 0%, 61% 0%, 97% 100%, 3% 100%);
  background: linear-gradient(
    180deg,
    rgba(253, 230, 138, 0.55) 0%,
    rgba(253, 230, 138, 0.22) 35%,
    rgba(253, 230, 138, 0.07) 65%,
    transparent 100%
  );
  animation: flicker 2.5s ease-in-out infinite;
  pointer-events: none;
}

/* ── 光束闪烁动画 ── */@keyframes flicker {
  0%, 100% { opacity: 1; }
  40%       { opacity: 0.55; }
  70%       { opacity: 0.85; }
}

.lock-overlay.closing {
  animation: slideUp 0.45s ease-in forwards;
  pointer-events: none;
}

@keyframes slideUp {
  from { transform: translateY(0); }
  to   { transform: translateY(-100%); }
}
</style>
