import { defineConfig } from 'vite'

export default defineConfig({
  base: '/SDSHC-games-hub/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true,
  },
})
