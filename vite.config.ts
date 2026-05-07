import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const ignoredDirs = ['**/.superpowers/**', '**/.github/**', '**/.claude/**', '**/docs/**']

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      watch: {
        // 非业务目录不参与本地监听，减少无关文件触发
        ignored: ignoredDirs,
      },
      proxy: env.VITE_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_PROXY_TARGET,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    build: {
      // element-plus / echarts 本身体积较大，调高阈值避免无意义警告
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // 将第三方库单独分割，内容不变则 hash 不变，充分利用浏览器缓存
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              if (id.includes('echarts') || id.includes('zrender')) return 'vendor-echarts'
              if (id.includes('@wangeditor')) return 'vendor-editor'
              if (id.includes('element-plus')) return 'vendor-element'
              if (['vue', 'vue-router', 'pinia'].some((pkg) => id.includes(`node_modules/${pkg}/`)))
                return 'vendor-vue'
            }
          },
        },
      },
    },
  }
})
