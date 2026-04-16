<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTabs, type TabItem } from '@/stores/tabs'

const router = useRouter()
const { tabs, activeTabName, removeTab, setActive } = useTabs()

function onTabClick(tab: TabItem) {
  if (tab.name !== activeTabName.value) {
    setActive(tab.name)   // immediate visual update
    router.push(tab.path) // async navigation
  }
}

function onTabClose(tab: TabItem) {
  removeTab(tab.name)
}
</script>

<template>
  <nav class="tag-bar" aria-label="已打开的页面">
    <div class="tag-bar-inner" role="tablist">
      <el-tag
        v-for="tab in tabs"
        :key="tab.name"
        role="tab"
        :aria-selected="tab.name === activeTabName"
        :title="tab.title"
        :closable="tab.closable"
        :effect="tab.name === activeTabName ? 'dark' : 'plain'"
        :type="tab.name === activeTabName ? 'primary' : 'info'"
        round
        class="tab-tag"
        :class="{ 'is-active': tab.name === activeTabName }"
        @click="onTabClick(tab)"
        @close="onTabClose(tab)"
      >
        {{ tab.title }}
      </el-tag>
    </div>
  </nav>
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
  flex: 1;
  min-width: 0;
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
