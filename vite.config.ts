import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// 01）Milkdown 预构建白名单（避免 dev 模式下 Outdated Optimize Dep 504）
const milkdownOptimizeDeps = [
  '@milkdown/core',
  '@milkdown/ctx',
  '@milkdown/react',
  '@milkdown/transformer',
  '@milkdown/utils',
  '@milkdown/preset-commonmark',
  '@milkdown/preset-gfm',
  '@milkdown/theme-nord',
  '@milkdown/plugin-listener',
  '@milkdown/plugin-tooltip',
  '@milkdown/prose',
  'artplayer',
]

// 02）切换新旧项目（USE_REFACTORED）
// 设置为 true → 使用 src_refactored/
// 设置为 false → 使用 src/
const USE_REFACTORED = true

const sourceRoot = USE_REFACTORED ? 'src_refactored' : 'src'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, sourceRoot),
    },
  },
  optimizeDeps: {
    include: milkdownOptimizeDeps,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
