import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    // 生成相对路径的资源引用
    assetsDir: 'assets',
    // 不启用sourcemap
    sourcemap: false,
    // 使用esbuild压缩，不需要额外安装
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  base: './'  // 确保使用相对路径
}) 