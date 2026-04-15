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
