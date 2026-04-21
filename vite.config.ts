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
  }
})
