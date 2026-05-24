import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: milkdownOptimizeDeps,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})