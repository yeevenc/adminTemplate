# Layout Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor admin layout to el-container components, replace breadcrumb with an el-tag pill tab bar below the header, and add keep-alive + el-fade-in-linear page transitions.

**Architecture:** New `stores/tabs.ts` tracks open tabs reactively; `TagBar.vue` renders el-tag pills in a dedicated row; `layout/index.vue` uses `el-container → el-aside + el-container(vertical) → el-header + TagBar + el-main` with KeepAlive wrapping RouterView; `Sidebar.vue` migrates from custom buttons to `el-menu` with CSS-var theming.

**Tech Stack:** Vue 3, TypeScript, Element Plus 2.13, Vue Router 5 — no Pinia (module-level `ref` pattern), no test framework (verify with `npx vue-tsc --noEmit` + `npm run build`).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/stores/tabs.ts` | Reactive tab list, cachedViews computed, addTab/removeTab/setActive |
| Modify | `src/router/index.ts` | Ensure all layout child routes have `name` |
| Modify | `src/views/home/index.vue` | Add `defineOptions({ name: 'dashboard' })` |
| Create | `src/layout/components/TagBar.vue` | el-tag pill row, reads tabs store |
| Modify | `src/layout/components/Header.vue` | Remove breadcrumb left section; change root to `<div>` |
| Modify | `src/layout/index.vue` | el-container shell + watch route → addTab + KeepAlive + transition |
| Modify | `src/layout/components/Sidebar.vue` | Migrate to el-menu + el-menu-item + el-sub-menu |

---

## Task 1: Create tabs store

**Files:**
- Create: `src/stores/tabs.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/stores/tabs.ts
import { ref, computed } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import router from '../router'

export interface TabItem {
  name: string
  title: string
  path: string
  closable: boolean
}

const DASHBOARD_TAB: TabItem = {
  name: 'dashboard',
  title: '数据概览',
  path: '/',
  closable: false,
}

const tabs = ref<TabItem[]>([DASHBOARD_TAB])
const activeTabName = ref<string>('dashboard')

export function useTabs() {
  const cachedViews = computed(() => tabs.value.map(t => t.name))

  function addTab(route: RouteLocationNormalizedLoaded): void {
    const name = String(route.name ?? '')
    if (!name || route.meta?.hidden) return
    const exists = tabs.value.find(t => t.name === name)
    if (!exists) {
      tabs.value.push({
        name,
        title: String(route.meta?.title ?? name),
        path: route.fullPath,
        closable: name !== 'dashboard',
      })
    }
    activeTabName.value = name
  }

  function removeTab(name: string): void {
    const idx = tabs.value.findIndex(t => t.name === name)
    if (idx === -1) return
    tabs.value.splice(idx, 1)
    if (activeTabName.value === name) {
      const nextTab = tabs.value[idx] ?? tabs.value[idx - 1]
      if (nextTab) {
        activeTabName.value = nextTab.name
        router.push(nextTab.path)
      }
    }
  }

  function setActive(name: string): void {
    activeTabName.value = name
  }

  return { tabs, activeTabName, cachedViews, addTab, removeTab, setActive }
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/stores/tabs.ts
git commit -m "feat: add tabs store for multi-tab navigation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Update router + add defineOptions to home view

**Files:**
- Modify: `src/router/index.ts` (no changes needed — `dashboard` already has `name`)
- Modify: `src/views/home/index.vue:1-2`

The router already has `name: 'dashboard'` on the only layout child. Any future route added under the layout must include a `name` field to participate in keep-alive.

- [ ] **Step 1: Add defineOptions to home/index.vue**

Open `src/views/home/index.vue`. After the opening `<script setup lang="ts">` line, add `defineOptions`:

```vue
<script setup lang="ts">
defineOptions({ name: 'dashboard' })
import { computed } from 'vue'
// ... rest of file unchanged
```

The `defineOptions({ name: 'dashboard' })` must match the route `name` exactly. KeepAlive's `:include` matches against this component name.

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/home/index.vue
git commit -m "feat: add defineOptions name to dashboard view for keep-alive

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Create TagBar component

**Files:**
- Create: `src/layout/components/TagBar.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- src/layout/components/TagBar.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTabs, type TabItem } from '../../stores/tabs'

const router = useRouter()
const { tabs, activeTabName, removeTab } = useTabs()

function onTabClick(tab: TabItem) {
  if (tab.name !== activeTabName.value) {
    router.push(tab.path)
  }
}

function onTabClose(tab: TabItem) {
  removeTab(tab.name)
}
</script>

<template>
  <div class="tag-bar">
    <div class="tag-bar-inner">
      <el-tag
        v-for="tab in tabs"
        :key="tab.name"
        :closable="tab.closable"
        :effect="tab.name === activeTabName ? 'dark' : 'plain'"
        :type="tab.name === activeTabName ? '' : 'info'"
        round
        class="tab-tag"
        :class="{ 'is-active': tab.name === activeTabName }"
        @click="onTabClick(tab)"
        @close="onTabClose(tab)"
      >
        {{ tab.title }}
      </el-tag>
    </div>
  </div>
</template>

<style scoped>
.tag-bar {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
  position: relative;
  z-index: 49;
}

.tag-bar-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tag-bar-inner::-webkit-scrollbar {
  display: none;
}

.tab-tag {
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12.5px;
  transition: all 0.2s ease;
  user-select: none;
}

.tab-tag.is-active {
  box-shadow: 0 2px 10px var(--color-glow);
}

.tab-tag:not(.is-active):hover {
  opacity: 0.85;
}
</style>
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/TagBar.vue
git commit -m "feat: add TagBar component with el-tag pill style

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Refactor Header — remove breadcrumb

**Files:**
- Modify: `src/layout/components/Header.vue`

- [ ] **Step 1: Replace entire Header.vue**

The root element changes from `<header>` to `<div>` (avoids nested `<header>` elements when wrapped by `el-header`). The breadcrumb left section is removed entirely. The header becomes right-controls only. `position: sticky` is removed since `el-header` handles positioning in the flex layout.

Replace the full content of `src/layout/components/Header.vue` with:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme, THEMES, setCustomPrimary } from '../../stores/theme'

const { state, currentPreset, setMode } = useTheme()

const showUserMenu = ref(false)
const pickerColor = ref(currentPreset.value.color)

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

      <button
        class="mode-toggle"
        :aria-label="state.mode === 'dark' ? '切换到明亮模式' : '切换到暗黑模式'"
        :title="state.mode === 'dark' ? '明亮模式' : '暗黑模式'"
        @click="toggleMode"
      >
        <svg v-if="state.mode === 'dark'" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 11H1v2h3v-2zm9-9h-2v2.99h2V2zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 11v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span class="mode-label">{{ state.mode === 'dark' ? 'Light' : 'Dark' }}</span>
      </button>

      <div class="header-divider" aria-hidden="true" />

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

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker-wrap {
  display: flex;
  align-items: center;
}

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

.header-divider {
  width: 1px;
  height: 20px;
  background: var(--divider);
  flex-shrink: 0;
}

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

.user-area:hover { background: var(--glass-hover); }

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
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/Header.vue
git commit -m "refactor: remove breadcrumb from header, keep controls only

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Refactor layout/index.vue to el-container

**Files:**
- Modify: `src/layout/index.vue`

- [ ] **Step 1: Replace entire layout/index.vue**

The bg-scene clouds are unchanged. The outer shell switches to `el-container`. The `el-aside` width is bound to `state.collapsed` and transitions via CSS. A `watch(route)` feeds the tabs store. KeepAlive wraps the RouterView with `el-fade-in-linear` transition.

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '../stores/theme'
import { useTabs } from '../stores/tabs'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import TagBar from './components/TagBar.vue'

const { state } = useTheme()
const route = useRoute()
const { cachedViews, addTab } = useTabs()

watch(route, (newRoute) => {
  addTab(newRoute)
}, { immediate: true })
</script>

<template>
  <div class="admin-layout">
    <!-- Nebula background (position:fixed, z-index:0) -->
    <div class="bg-scene" aria-hidden="true">
      <div class="cloud cp1" />
      <div class="cloud cp2" />
      <div class="cloud cp3" />
      <div class="cloud cw1" />
      <div class="cloud cw2" />
      <div class="cloud cw3" />
      <div class="cloud cw4" />
    </div>

    <el-container class="layout-container">
      <el-aside
        :width="state.collapsed ? '64px' : '240px'"
        class="layout-aside"
      >
        <Sidebar />
      </el-aside>

      <el-container direction="vertical">
        <el-header height="64px" class="layout-header-wrap">
          <Header />
        </el-header>

        <TagBar />

        <el-main class="layout-main">
          <router-view v-slot="{ Component }">
            <transition name="el-fade-in-linear" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.admin-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: var(--gradient-bg);
  background-attachment: fixed;
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

.cp1 {
  width: 1000px; height: 260px;
  top: -100px; left: -180px;
  background: radial-gradient(ellipse at 40% 50%, var(--color-primary) 0%, transparent 68%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(100px);
  border-radius: 60% 40% 55% 45% / 70% 50% 80% 40%;
  animation-duration: 40s; animation-delay: 0s;
}

.cp2 {
  width: 780px; height: 200px;
  bottom: 60px; right: -100px;
  background: radial-gradient(ellipse at 55% 50%, var(--color-primary-light) 0%, transparent 70%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(90px);
  border-radius: 45% 55% 40% 60% / 55% 65% 45% 70%;
  animation-duration: 33s; animation-delay: -12s;
}

.cp3 {
  width: 560px; height: 170px;
  top: 48%; left: 32%;
  background: radial-gradient(ellipse at 50% 60%, var(--color-primary) 0%, transparent 72%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(80px);
  border-radius: 50% 65% 42% 58% / 60% 42% 68% 50%;
  animation-duration: 46s; animation-delay: -24s;
}

.cw1 {
  width: 720px; height: 160px;
  top: 100px; left: 80px;
  background: radial-gradient(ellipse at 45% 50%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(65px);
  border-radius: 62% 38% 58% 42% / 52% 68% 42% 62%;
  animation-duration: 30s; animation-delay: -6s;
}

.cw2 {
  width: 520px; height: 130px;
  top: 220px; right: 180px;
  background: radial-gradient(ellipse at 50% 45%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(55px);
  border-radius: 48% 52% 60% 40% / 65% 38% 58% 48%;
  animation-duration: 26s; animation-delay: -18s;
}

.cw3 {
  width: 660px; height: 150px;
  bottom: 180px; left: 120px;
  background: radial-gradient(ellipse at 42% 55%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 68%);
  filter: blur(70px);
  border-radius: 55% 45% 50% 60% / 42% 62% 52% 70%;
  animation-duration: 38s; animation-delay: -9s;
}

.cw4 {
  width: 420px; height: 110px;
  top: 38%; right: 60px;
  background: radial-gradient(ellipse at 55% 50%, var(--cloud-wisp-color, rgba(255,255,255,0.09)) 0%, transparent 65%);
  filter: blur(50px);
  border-radius: 58% 42% 46% 54% / 50% 62% 45% 68%;
  animation-duration: 34s; animation-delay: -28s;
}

@keyframes cloud-drift {
  0%, 100% { transform: translate(0px,   0px)  scale(1); }
  20%       { transform: translate(18px,  -9px) scale(1.01); }
  40%       { transform: translate(34px,   6px) scale(0.99); }
  60%       { transform: translate(22px, -13px) scale(1.02); }
  80%       { transform: translate(6px,   10px) scale(0.98); }
}

/* ── el-container layout ── */
.layout-container {
  position: relative;
  z-index: 1;
  height: 100vh;
}

.layout-aside {
  transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden;
  height: 100%;
  flex-shrink: 0;
}

/* el-header resets */
.layout-header-wrap {
  padding: 0 !important;
  flex-shrink: 0;
}

/* el-main resets */
.layout-main {
  padding: 24px !important;
  overflow-y: auto !important;
  flex: 1;
  min-height: 0;
}
</style>
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layout/index.vue
git commit -m "refactor: migrate layout shell to el-container with keep-alive and fade transition

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Refactor Sidebar to el-menu

**Files:**
- Modify: `src/layout/components/Sidebar.vue`

- [ ] **Step 1: Replace entire Sidebar.vue**

The logo and collapse toggle are kept. The custom `<button>` menu is replaced with `el-menu` + `el-menu-item` + `el-sub-menu`. The `position: fixed` is removed — `el-aside` controls positioning now. CSS variables override el-menu defaults to match the glass theme. The `setMenuTitle` call is removed (tabs store provides current page context).

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute, type RouteRecordRaw } from 'vue-router'
import { useTheme } from '../../stores/theme'

const { state, toggleCollapse } = useTheme()
const router = useRouter()
const route = useRoute()

const ICONS: Record<string, string> = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  moon:      'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  users:     'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  device:    'M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z',
  book:      'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  chart:     'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
  settings:  'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
}

interface MenuNode {
  id: string
  title: string
  icon: string
  fullPath: string
  children?: MenuNode[]
}

function buildMenuTree(routes: RouteRecordRaw[], basePath = '/'): MenuNode[] {
  const nodes: MenuNode[] = []
  for (const r of routes) {
    if (!r.meta?.title || r.meta?.hidden) continue
    const seg = String(r.path)
    const fullPath = seg === '' ? basePath : basePath === '/' ? `/${seg}` : `${basePath}/${seg}`
    const rawKids = (r as { children?: RouteRecordRaw[] }).children ?? []
    const childNodes = rawKids.length ? buildMenuTree(rawKids, fullPath) : undefined
    nodes.push({
      id: String(r.name ?? r.path),
      title: String(r.meta.title),
      icon: String(r.meta.icon ?? ''),
      fullPath,
      children: childNodes?.length ? childNodes : undefined,
    })
  }
  return nodes
}

const menuTree = computed<MenuNode[]>(() => {
  const layoutRoute = router.options.routes[0]
  const kids = (layoutRoute as { children?: RouteRecordRaw[] }).children ?? []
  return buildMenuTree(kids)
})

const defaultOpeneds = computed(() =>
  menuTree.value
    .filter(n => n.children?.some(c => route.path === c.fullPath))
    .map(n => n.id)
)

function onSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <div class="sidebar-wrap">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
          <circle cx="16.5" cy="6.5" r="1.2" fill="currentColor" opacity="0.55" />
          <circle cx="18.5" cy="9.5" r="0.8" fill="currentColor" opacity="0.38" />
        </svg>
      </div>
      <Transition name="fade-slide">
        <span v-if="!state.collapsed" class="logo-text">Panda Sleep</span>
      </Transition>
    </div>

    <div class="sidebar-divider" />

    <!-- el-menu navigation -->
    <el-menu
      :default-active="route.path"
      :collapse="state.collapsed"
      :default-openeds="defaultOpeneds"
      class="sidebar-menu"
      @select="onSelect"
    >
      <template v-for="node in menuTree" :key="node.id">
        <!-- Leaf item -->
        <el-menu-item v-if="!node.children" :index="node.fullPath">
          <span class="menu-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path :d="ICONS[node.icon]" />
            </svg>
          </span>
          <template #title>{{ node.title }}</template>
        </el-menu-item>

        <!-- Group with children -->
        <el-sub-menu v-else :index="node.id">
          <template #title>
            <span class="menu-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path :d="ICONS[node.icon]" />
              </svg>
            </span>
            <span>{{ node.title }}</span>
          </template>
          <el-menu-item
            v-for="child in node.children"
            :key="child.id"
            :index="child.fullPath"
          >
            <span class="child-dot" />
            <template #title>{{ child.title }}</template>
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>

    <!-- Collapse toggle -->
    <div class="sidebar-footer">
      <button
        class="collapse-btn"
        :aria-label="state.collapsed ? '展开菜单' : '收起菜单'"
        @click="toggleCollapse"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="collapse-icon" :class="{ rotated: state.collapsed }" aria-hidden="true">
          <path d="M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z" />
        </svg>
        <Transition name="fade-slide">
          <span v-if="!state.collapsed" class="collapse-label">收起菜单</span>
        </Transition>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sidebar-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-right: 1px solid var(--glass-border);
  overflow: hidden;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  height: 64px;
  flex-shrink: 0;
}

.logo-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  color: var(--color-primary);
  filter: drop-shadow(0 0 10px var(--color-glow));
  transition: filter 0.4s ease;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  letter-spacing: 0.4px;
}

.sidebar-divider {
  height: 1px;
  margin: 0 14px;
  background: var(--divider);
  flex-shrink: 0;
}

/* ── el-menu overrides ── */
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  box-sizing: border-box;
  /* el-menu CSS vars */
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: var(--glass-hover);
  --el-menu-active-color: #fff;
  --el-menu-text-color: var(--text-secondary);
  --el-menu-item-height: 44px;
  --el-menu-sub-item-height: 40px;
  --el-menu-item-font-size: 13.5px;
  --el-menu-icon-width: 20px;
}

.sidebar-menu::-webkit-scrollbar { width: 3px; }
.sidebar-menu::-webkit-scrollbar-track { background: transparent; }
.sidebar-menu::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 2px;
}

/* Remove el-menu right border */
.sidebar-menu.el-menu {
  border-right: none !important;
}

/* Menu items base */
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  border-radius: 10px !important;
  margin: 2px 0 !important;
  color: var(--text-secondary) !important;
  background-color: transparent !important;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease !important;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: var(--glass-hover) !important;
  color: var(--text-primary) !important;
}

/* Active leaf item — gradient */
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%) !important;
  color: #fff !important;
  box-shadow: 0 4px 18px var(--color-glow) !important;
}

/* Active sub-menu title */
.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--color-primary-light) !important;
}

/* Sub-menu popup background (global — cannot be scoped) — handled via :deep */
.sidebar-menu :deep(.el-sub-menu .el-menu) {
  background-color: transparent !important;
}

/* Child item dot */
.child-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
  flex-shrink: 0;
  margin-right: 8px;
}

/* Icon span */
.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 8px;
}

/* Collapsed: hide margin-right from icon */
.sidebar-menu.el-menu--collapse :deep(.menu-icon) {
  margin-right: 0;
}

/* Footer */
.sidebar-footer {
  padding: 12px 8px;
  border-top: 1px solid var(--divider);
  flex-shrink: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  outline: none;
}

.collapse-btn:hover {
  background: var(--glass-hover);
  color: var(--text-primary);
}

.collapse-btn:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.collapse-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform 0.32s ease;
}

.collapse-icon.rotated { transform: rotate(180deg); }

.collapse-label {
  font-size: 12.5px;
  font-weight: 500;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/Sidebar.vue
git commit -m "refactor: migrate sidebar to el-menu with glass theme CSS overrides

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Final verification + build

**Files:** None modified.

- [ ] **Step 1: TypeScript check (full project)**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npx vue-tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Build**

```bash
cd /Users/vencyyee/pandaSleepAdmin2.0 && npm run build
```

Expected: `dist/` produced, zero errors. Warnings about bundle size are acceptable.

- [ ] **Step 3: Commit if any minor fixes were needed**

If build required any small fixes not covered in prior tasks, commit them:

```bash
git add -A
git commit -m "fix: resolve build issues from layout refactor

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Self-Review Notes

- **tabs.ts → tabs are scoped to the layout** — routes outside layout (`/login`, `/404`, `/500`) are excluded because `route.meta?.hidden` is `true` for them; no accidental tab leak.
- **KeepAlive include** — `cachedViews` returns all currently-open tab names. Components without a matching `defineOptions({ name })` won't be cached silently (no crash, just no caching). Only `home/index.vue` needs `defineOptions` today.
- **el-aside transition** — `transition: width ... !important` on `.layout-aside` animates the width change driven by the `:width` prop binding.
- **el-header padding** — el-header adds default padding; `.layout-header-wrap { padding: 0 !important }` ensures `Header.vue`'s inner div fills the full header bar.
- **el-main padding** — el-main has default padding; `.layout-main { padding: 24px !important }` overrides it to the design-specified value.
- **setMenuTitle** — still exists in theme store but is no longer called from Sidebar. No regression: the theme store export is unchanged, callers that don't call it see no change.
