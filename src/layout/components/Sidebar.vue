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
  const layoutRoute = router.options.routes.find(r => r.path === '/')
  const kids = (layoutRoute as RouteRecordRaw & { children?: RouteRecordRaw[] })?.children ?? []
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
        <el-menu-item v-if="!node.children" :index="node.fullPath">
          <span class="menu-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path :d="ICONS[node.icon] ?? ''" />
            </svg>
          </span>
          <template #title>{{ node.title }}</template>
        </el-menu-item>

        <el-sub-menu v-else :index="node.id">
          <template #title>
            <span class="menu-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path :d="ICONS[node.icon] ?? ''" />
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

.sidebar-menu.el-menu {
  border-right: none !important;
}

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

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%) !important;
  color: #fff !important;
  box-shadow: 0 4px 18px var(--color-glow) !important;
}

.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--color-primary-light) !important;
}

.sidebar-menu :deep(.el-sub-menu .el-menu) {
  background-color: transparent !important;
}

.child-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
  flex-shrink: 0;
  margin-right: 8px;
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 8px;
}

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
