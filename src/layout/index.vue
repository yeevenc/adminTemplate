<script setup lang="ts">
import { useTheme } from '../stores/theme'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

const { state } = useTheme()
</script>

<template>
  <div class="admin-layout">
    <!-- Cloud gradient background -->
    <div class="bg-scene" aria-hidden="true">
      <!-- Primary-color nebula clouds -->
      <div class="cloud cp1" />
      <div class="cloud cp2" />
      <div class="cloud cp3" />
      <!-- White/silver wisp clouds -->
      <div class="cloud cw1" />
      <div class="cloud cw2" />
      <div class="cloud cw3" />
      <div class="cloud cw4" />
    </div>

    <Sidebar />

    <div class="layout-main" :class="{ collapsed: state.collapsed }">
      <Header />
      <main class="layout-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: var(--gradient-bg);
  background-attachment: fixed;
  z-index: 0;
  transition: background 0.55s ease;
}

.bg-scene {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* ── Cloud gradient background ── */
.cloud {
  position: absolute;
  transition: background 0.6s ease;
  animation: cloud-drift ease-in-out infinite;
}

/* Nebula clouds – primary color tint */
.cp1 {
  width: 1000px;
  height: 260px;
  top: -100px;
  left: -180px;
  background: radial-gradient(ellipse at 40% 50%, var(--color-primary) 0%, transparent 68%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(100px);
  border-radius: 60% 40% 55% 45% / 70% 50% 80% 40%;
  animation-duration: 40s;
  animation-delay: 0s;
}

.cp2 {
  width: 780px;
  height: 200px;
  bottom: 60px;
  right: -100px;
  background: radial-gradient(ellipse at 55% 50%, var(--color-primary-light) 0%, transparent 70%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(90px);
  border-radius: 45% 55% 40% 60% / 55% 65% 45% 70%;
  animation-duration: 33s;
  animation-delay: -12s;
}

.cp3 {
  width: 560px;
  height: 170px;
  top: 48%;
  left: 32%;
  background: radial-gradient(ellipse at 50% 60%, var(--color-primary) 0%, transparent 72%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(80px);
  border-radius: 50% 65% 42% 58% / 60% 42% 68% 50%;
  animation-duration: 46s;
  animation-delay: -24s;
}

/* White / silver wisps – the actual "cloud" texture */
.cw1 {
  width: 720px;
  height: 160px;
  top: 100px;
  left: 80px;
  background: radial-gradient(ellipse at 45% 50%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(65px);
  border-radius: 62% 38% 58% 42% / 52% 68% 42% 62%;
  animation-duration: 30s;
  animation-delay: -6s;
}

.cw2 {
  width: 520px;
  height: 130px;
  top: 220px;
  right: 180px;
  background: radial-gradient(ellipse at 50% 45%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(55px);
  border-radius: 48% 52% 60% 40% / 65% 38% 58% 48%;
  animation-duration: 26s;
  animation-delay: -18s;
}

.cw3 {
  width: 660px;
  height: 150px;
  bottom: 180px;
  left: 120px;
  background: radial-gradient(ellipse at 42% 55%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 68%);
  filter: blur(70px);
  border-radius: 55% 45% 50% 60% / 42% 62% 52% 70%;
  animation-duration: 38s;
  animation-delay: -9s;
}

.cw4 {
  width: 420px;
  height: 110px;
  top: 38%;
  right: 60px;
  background: radial-gradient(ellipse at 55% 50%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(50px);
  border-radius: 58% 42% 46% 54% / 50% 62% 45% 68%;
  animation-duration: 34s;
  animation-delay: -28s;
}

@keyframes cloud-drift {
  0%, 100% { transform: translate(0px,   0px)  scale(1); }
  20%       { transform: translate(18px,  -9px) scale(1.01); }
  40%       { transform: translate(34px,   6px) scale(0.99); }
  60%       { transform: translate(22px, -13px) scale(1.02); }
  80%       { transform: translate(6px,   10px) scale(0.98); }
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.layout-main.collapsed {
  margin-left: 64px;
}

.layout-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 0;
}
</style>
