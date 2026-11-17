import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // /uploads 由后端直接提供静态文件；代理目标从 API 地址推导，
  // 换后端端口只改 .env.development 一处，不必同步改这里。
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const uploadsTarget = apiBase.replace(/\/api\/?$/, '')

  return {
    plugins: [vue(), VueDevTools()],
    base: './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1200,
      sourcemap: false,
    },
    server: {
      host: true,
      port: 5173,
      open: false,
      proxy: {
        '/uploads': {
          target: uploadsTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
