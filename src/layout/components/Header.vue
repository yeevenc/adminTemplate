<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme, THEMES, setCustomPrimary } from '../../stores/theme'

const { state, currentPreset, setMode } = useTheme()

const showUserMenu = ref(false)
const pickerColor = ref(currentPreset.value.color)

// Sync picker when preset changes from outside
watch(() => currentPreset.value.color, (val) => { pickerColor.value = val })

function toggleMode() {
  setMode(state.mode === 'dark' ? 'light' : 'dark')
}

function onColorChange(color: string | null) {
  if (color) setCustomPrimary(color)
}

const presetColors = THEMES.map(t => t.color)
</script>

<template>
  <div class="layout-header">
    <!-- Right: controls -->
    <div class="header-right">
      <!-- Element Plus color picker -->
      <div class="color-picker-wrap" aria-label="主题颜色选择器">
        <el-color-picker
          v-model="pickerColor"
          size="small"
          :predefine="presetColors"
          color-format="hex"
          @change="onColorChange"
        />
      </div>

      <div class="header-divider" aria-hidden="true" />

      <!-- Dark / Light toggle -->
      <button
        class="mode-toggle"
        :aria-label="state.mode === 'dark' ? '切换到明亮模式' : '切换到暗黑模式'"
        :title="state.mode === 'dark' ? '明亮模式' : '暗黑模式'"
        @click="toggleMode"
      >
        <!-- Sun icon (light mode) -->
        <svg v-if="state.mode === 'dark'" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 11H1v2h3v-2zm9-9h-2v2.99h2V2zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 11v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
        </svg>
        <!-- Moon icon (dark mode) -->
        <svg v-else viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span class="mode-label">{{ state.mode === 'dark' ? 'Light' : 'Dark' }}</span>
      </button>

      <div class="header-divider" aria-hidden="true" />

      <!-- User avatar -->
      <div class="user-area" @click="showUserMenu = !showUserMenu" @keydown.enter="showUserMenu = !showUserMenu">
        <div class="avatar" :style="{ background: `linear-gradient(135deg, ${currentPreset.color}, ${currentPreset.light})` }" aria-label="用户头像" role="button" tabindex="0">
          <span>P</span>
        </div>
        <div class="user-info">
          <span class="user-name">Panda</span>
          <span class="user-role">超级管理员</span>
        </div>
        <svg class="chevron" viewBox="0 0 24 24" fill="currentColor" width="12" height="12" :class="{ rotated: showUserMenu }" aria-hidden="true">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>

        <!-- Dropdown -->
        <Transition name="dropdown">
          <div v-if="showUserMenu" class="user-dropdown" role="menu">
            <button class="dropdown-item" role="menuitem">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              个人中心
            </button>
            <button class="dropdown-item" role="menuitem">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              账号设置
            </button>
            <div class="dropdown-divider" />
            <button class="dropdown-item danger" role="menuitem">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              退出登录
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--glass-border);
}

/* Right */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Color picker wrapper */
.color-picker-wrap {
  display: flex;
  align-items: center;
}

/* Override el-color-picker trigger appearance for glass theme */
.color-picker-wrap :deep(.el-color-picker__trigger) {
  border: 1px solid var(--glass-border) !important;
  background: var(--glass-bg) !important;
  border-radius: 8px !important;
  padding: 2px !important;
  transition: all 0.2s ease;
}

.color-picker-wrap :deep(.el-color-picker__trigger):hover {
  background: var(--glass-hover) !important;
  box-shadow: 0 0 10px var(--color-glow) !important;
}

.color-picker-wrap :deep(.el-color-picker__color) {
  border-radius: 5px !important;
  border: none !important;
}

/* Divider */
.header-divider {
  width: 1px;
  height: 20px;
  background: var(--divider);
  flex-shrink: 0;
}

/* Dark/Light toggle */
.mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  outline: none;
}

.mode-toggle:hover {
  background: var(--glass-hover);
  color: var(--text-primary);
  box-shadow: 0 0 12px var(--color-glow);
}

.mode-toggle:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.mode-label { letter-spacing: 0.3px; }

/* User area */
.user-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border-radius: 24px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  user-select: none;
}

.user-area:hover {
  background: var(--glass-hover);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px var(--color-glow);
  transition: background 0.4s ease, box-shadow 0.4s ease;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1;
}

.chevron {
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.chevron.rotated { transform: rotate(-180deg); }

/* Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  z-index: 200;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
  outline: none;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: var(--glass-hover);
  color: var(--text-primary);
}

.dropdown-item:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.dropdown-item.danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #EF4444;
}

.dropdown-divider {
  height: 1px;
  margin: 4px 6px;
  background: var(--divider);
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
