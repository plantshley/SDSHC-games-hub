import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = '/SDSHC-games-hub/'

// Rewrite hardcoded /assets/ paths to include the base prefix.
// Vite 7+ serves public/ at the base URL (not server root), so all
// absolute /assets/ references must be prefixed with /SDSHC-games-hub/.
const rewriteAssetUrls = {
  name: 'rewrite-asset-urls',
  transform(code, id) {
    if (!id.includes('/src/') && !id.includes('\\src\\')) return null
    if (!/\.(js|css)$/.test(id)) return null
    // Match quote-delimited /assets/ paths in JS strings and CSS url()
    return code.replace(/(['"`])\/assets\//g, `$1${BASE}assets/`)
  },
}

export default defineConfig({
  base: BASE,
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true,
    port: 5173,
    strictPort: true,
  },
  plugins: [
    rewriteAssetUrls,
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,JPG}']
      },
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'SDSHC Games Hub',
        short_name: 'SDSHC Games',
        description: 'Interactive educational games for SDSHC',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'assets/sdshc-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/sdshc-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
