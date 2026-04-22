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

      <!-- 全高光束 SVG：顶 8% 宽 → 底 13% 宽（扩张 5%），顶角圆润 -->
      <svg
        class="beam-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lamplock-beamG2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#FDE68A" stop-opacity="0.72"/>
            <stop offset="38%"  stop-color="#FDE68A" stop-opacity="0.28"/>
            <stop offset="72%"  stop-color="#FDE68A" stop-opacity="0.07"/>
            <stop offset="100%" stop-color="#FDE68A" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <!--
          梯形：顶 x=46~54（8%），底 x=43.5~56.5（13%）
          顶角用二次贝塞尔圆角，radius ≈ 3 单位
          M49,0  → Q54,0 54,3  → 右侧 → 底边 → 左侧 → Q46,0 49,0
        -->
        <path
          d="M49,0 L51,0 Q54,0 54,3 L56.5,100 L43.5,100 L46,3 Q46,0 49,0 Z"
          fill="url(#lamplock-beamG2)"
        />
      </svg>
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
  /* 滑入动画：逐帧 timing-function 丝滑强回弹 */
  animation: slideDown 1.1s linear forwards;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

@keyframes slideDown {
  /* 逐帧指定 timing-function，实现丝滑物理弹簧感 */
  0%   { transform: translateY(-100%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  52%  { transform: translateY(22%);   animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); } /* 强力冲底 */
  60%  { transform: translateY(18%);   animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  71%  { transform: translateY(-9%);   animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } /* 强力反弹 */
  80%  { transform: translateY(4%);    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } /* 二次落 */
  88%  { transform: translateY(-2%);   animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } /* 三次微弹 */
  94%  { transform: translateY(0.6%);  animation-timing-function: ease-in-out; }
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

/* ── 全高光束 SVG：顶角圆润的梯形，由上至下缓慢扩宽 ── */
.beam-svg {
  position: absolute;
  top: 100px;
  left: 0;
  width: 100%;
  height: calc(100% - 100px);
  pointer-events: none;
  animation: flicker 2.5s ease-in-out infinite;
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
