<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { ElMessageBox } from 'element-plus'
/**
 * 线上版本检测（基于拉取 index.html 对比构建产物指纹）
 * 思路：定时请求 /index.html（no-store），从 html 中提取 assets 文件名集合（通常包含 hash），
 * 与本地保存的指纹对比；若变化则提示刷新。
 */
const VERSION_KEY = 'app_build_fingerprint'
const CHECK_INTERVAL_MS = 2 * 60 * 1000 // 2 分钟
let timer: number | undefined
let inChecking = false

function extractFingerprintFromHtml(html: string): string {
  const matches = html.match(/\/(?:assets|static)\/[^"'\s>]+/g) || []
  return Array.from(new Set(matches)).sort().join('|')
}

async function fetchIndexHtml(): Promise<string> {
  // 通过时间戳规避任何代理/浏览器缓存；同时显式 no-store
  const url = `${import.meta.env.BASE_URL}index.html?__v=${Date.now()}`
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  })
  return await res.text()
}

async function checkForNewVersion() {
  if (inChecking) return
  inChecking = true
  try {
    const html = await fetchIndexHtml()
    const fingerprint = extractFingerprintFromHtml(html)
    if (!fingerprint) return

    const last = localStorage.getItem(VERSION_KEY)
    // 首次进入：记录当前指纹，不弹窗
    if (!last) {
      localStorage.setItem(VERSION_KEY, fingerprint)
      return
    }
    if (last === fingerprint) return

    // 无论用户选择刷新还是稍后，都把指纹写回，避免下一轮轮询反复打扰
    let shouldReload = false
    try {
      await ElMessageBox.confirm(
        '检测到系统已发布新版本，建议立即刷新以获得最新功能。',
        '发现新版本',
        {
          confirmButtonText: '刷新',
          cancelButtonText: '稍后',
          type: 'warning',
          closeOnClickModal: false,
          closeOnPressEscape: false,
        },
      )
      shouldReload = true
    } catch {
      // 用户点击"稍后"或关闭：同一版本不再重复提示
    }

    localStorage.setItem(VERSION_KEY, fingerprint)
    if (shouldReload) {
      window.location.reload()
    }
  } catch {
    // 静默失败：避免因网络波动频繁打扰
  } finally {
    inChecking = false
  }
}

// 切回前台比轮询更及时；顶层声明便于统一注销
const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    void checkForNewVersion()
  }
}

onMounted(() => {
  if (!import.meta.env.PROD) return
  void checkForNewVersion()
  timer = window.setInterval(() => {
    void checkForNewVersion()
  }, CHECK_INTERVAL_MS)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>
<template></template>
