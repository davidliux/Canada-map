import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5001,  // 匹配package.json中的端口设置
    open: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 5001
  },
  build: {
    // 禁用代码分割，将所有代码打包到一个文件中
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // 生成单个文件
        inlineDynamicImports: true
      }
    },
    // 生成相对路径的资源引用
    assetsDir: 'assets',
    // 不启用sourcemap
    sourcemap: false,
    // 使用esbuild压缩，不需要额外安装
    minify: 'esbuild'
  },
  base: './'  // 确保使用相对路径
}) 