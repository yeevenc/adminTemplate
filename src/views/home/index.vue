<script setup lang="ts" name="dashboard">
defineOptions({ name: 'dashboard' })

// 随机生成的星星坐标，首次渲染后保持不变，避免抖动
const stars = Array.from({ length: 90 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 70}%`,
  size: `${Math.random() * 2 + 1}px`,
  delay: `${Math.random() * 3}s`,
  duration: `${Math.random() * 2 + 2}s`,
}))

// 飘浮 Z 字母：从底部向上缓慢飘出，错开位置和时间
const zLetters = Array.from({ length: 8 }, (_, index) => ({
  left: `${8 + index * 11}%`,
  size: `${20 + (index % 4) * 6}px`,
  delay: `${index * 1.2}s`,
  duration: `${9 + (index % 3) * 2}s`,
}))

// 远景飘过的云朵，用不同高度和动画时长制造层次
const clouds = [
  { top: '18%', duration: '50s', delay: '0s', scale: 1 },
  { top: '35%', duration: '70s', delay: '-20s', scale: 0.75 },
  { top: '55%', duration: '60s', delay: '-40s', scale: 0.9 },
]
</script>

<template>
  <div class="sleep-scene">
    <!-- 夜空渐变背景 -->
    <div class="sleep-scene__sky" />

    <!-- 星星图层：数量多且尺寸小 -->
    <div class="sleep-scene__stars">
      <span
        v-for="(star, index) in stars"
        :key="index"
        class="star"
        :style="{
          left: star.left,
          top: star.top,
          width: star.size,
          height: star.size,
          animationDelay: star.delay,
          animationDuration: star.duration,
        }"
      />
    </div>

    <!-- 飘过的云朵 -->
    <div class="sleep-scene__clouds">
      <svg
        v-for="(cloud, index) in clouds"
        :key="index"
        class="cloud"
        viewBox="0 0 180 60"
        :style="{
          top: cloud.top,
          animationDuration: cloud.duration,
          animationDelay: cloud.delay,
          transform: `scale(${cloud.scale})`,
        }"
      >
        <path
          d="M30 40 Q30 20 50 20 Q55 5 75 10 Q90 0 105 12 Q125 8 130 25 Q155 25 155 40 Z"
          fill="rgba(255,255,255,0.14)"
        />
      </svg>
    </div>

    <!-- 月亮 + 光晕 -->
    <div class="sleep-scene__moon">
      <div class="moon-glow" />
      <svg class="moon-shape" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="moonGrad" cx="30%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#fff8d4" />
            <stop offset="100%" stop-color="#f2c94c" />
          </radialGradient>
        </defs>
        <path
          d="M70 12 A40 40 0 1 0 70 88 A30 30 0 1 1 70 12 Z"
          fill="url(#moonGrad)"
        />
      </svg>
    </div>

    <!-- 中央呼吸光球：模拟 4-7-8 呼吸节律 -->
    <div class="sleep-scene__breath">
      <div class="breath-ring breath-ring--1" />
      <div class="breath-ring breath-ring--2" />
      <div class="breath-ring breath-ring--3" />
      <div class="breath-core" />
    </div>

    <!-- 飘动的 Z 字 -->
    <div class="sleep-scene__zs">
      <span
        v-for="(z, index) in zLetters"
        :key="index"
        class="z-letter"
        :style="{
          left: z.left,
          fontSize: z.size,
          animationDelay: z.delay,
          animationDuration: z.duration,
        }"
      >
        Z
      </span>
    </div>

    <!-- 底部文字 -->
    <div class="sleep-scene__text">
      <h1 class="title">晚安，做个好梦</h1>
      <p class="subtitle">Sweet dreams are made of quiet nights</p>
    </div>
  </div>
</template>

<style scoped>
.sleep-scene {
  position: relative;
  width: 100%;
  height: calc(100vh - 145px);
  min-height: 620px;
  overflow: hidden;
  border-radius: 16px;
  color: #fff;
}

/* ── 夜空背景 ── */
.sleep-scene__sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 70% 10%, rgba(120, 120, 220, 0.35) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 90%, rgba(90, 80, 180, 0.25) 0%, transparent 55%),
    linear-gradient(180deg, #0f1044 0%, #1b1550 45%, #0a0b2e 100%);
}

/* ── 星星 ── */
.sleep-scene__stars {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.9);
  animation: twinkle ease-in-out infinite alternate;
}

@keyframes twinkle {
  from {
    opacity: 0.25;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1.3);
  }
}

/* ── 云朵 ── */
.sleep-scene__clouds {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cloud {
  position: absolute;
  width: 200px;
  height: 70px;
  left: -220px;
  animation: cloud-drift linear infinite;
  filter: blur(2px);
}

@keyframes cloud-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(120vw);
  }
}

/* ── 月亮 ── */
.sleep-scene__moon {
  position: absolute;
  top: 9%;
  right: 12%;
  width: 150px;
  height: 150px;
  animation: moon-float 6s ease-in-out infinite alternate;
}

.moon-shape {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 28px rgba(255, 230, 120, 0.55));
}

.moon-glow {
  position: absolute;
  inset: -35%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 230, 140, 0.3) 0%, transparent 60%);
  animation: moon-glow-pulse 4s ease-in-out infinite alternate;
}

@keyframes moon-float {
  from { transform: translateY(0); }
  to { transform: translateY(-14px); }
}

@keyframes moon-glow-pulse {
  from { opacity: 0.55; transform: scale(1); }
  to { opacity: 1; transform: scale(1.12); }
}

/* ── 呼吸光球 ── */
.sleep-scene__breath {
  position: absolute;
  left: 50%;
  top: 54%;
  transform: translate(-50%, -50%);
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.breath-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(160, 180, 255, 0.5);
  animation: breath 6s ease-in-out infinite;
}

.breath-ring--1 { width: 55%; height: 55%; animation-delay: 0s; }
.breath-ring--2 { width: 75%; height: 75%; animation-delay: 0.4s; }
.breath-ring--3 { width: 100%; height: 100%; animation-delay: 0.8s; }

.breath-core {
  width: 38%;
  height: 38%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(200, 210, 255, 0.95) 0%,
    rgba(120, 140, 230, 0.4) 60%,
    transparent 100%
  );
  animation: breath-core 6s ease-in-out infinite;
}

@keyframes breath {
  0%, 100% { transform: scale(0.85); opacity: 0.35; }
  50% { transform: scale(1.1); opacity: 0.95; }
}

@keyframes breath-core {
  0%, 100% {
    transform: scale(0.88);
    box-shadow: 0 0 30px rgba(200, 210, 255, 0.4);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 70px rgba(200, 210, 255, 0.85);
  }
}

/* ── 飘动 Z 字 ── */
.sleep-scene__zs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.z-letter {
  position: absolute;
  bottom: -10%;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 700;
  font-family: 'Raleway', serif;
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.4);
  animation: z-float linear infinite;
}

@keyframes z-float {
  0% {
    bottom: -10%;
    opacity: 0;
    transform: translateX(0) rotate(-10deg);
  }
  15% { opacity: 0.8; }
  85% { opacity: 0.6; }
  100% {
    bottom: 110%;
    opacity: 0;
    transform: translateX(60px) rotate(18deg);
  }
}

/* ── 底部文字 ── */
.sleep-scene__text {
  position: absolute;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%);
  text-align: center;
  animation: fade-up 2s ease-out;
}

.title {
  font-size: 36px;
  font-weight: 300;
  margin: 0 0 10px;
  letter-spacing: 6px;
  text-shadow: 0 0 24px rgba(200, 210, 255, 0.6);
}

.subtitle {
  font-size: 13px;
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  letter-spacing: 2px;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translate(-50%, 24px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
