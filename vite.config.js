import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const BASE = '/SDSHC-games-hub/'

// Stamp each build so the client can tell when the deployed assets changed and
// re-run the offline warm-up exactly once per new build.
const BUILD_ID = Date.now().toString()

// Media that is NOT precached (kept out of the service-worker install so the SW
// installs/updates in ~1s instead of choking on ~109 MB). These are cached at
// runtime (StaleWhileRevalidate) and bulk-prefetched by the offline warm-up.
const MEDIA_RE = /\.(?:svg|webp|png|gif|jpe?g|JPG)$/

// After the build, enumerate every media file in dist into asset-manifest.json.
// The app fetches this list while online and warms the runtime cache so the
// installed PWA is fully offline-capable (the kiosk's offline guarantee) without
// precaching the media up front. JSON isn't in the precache globs, so emitting
// it here does not bloat the service-worker install.
const emitAssetManifest = {
  name: 'emit-asset-manifest',
  apply: 'build',
  closeBundle() {
    const distDir = 'dist'
    const files = []
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else if (MEDIA_RE.test(name)) files.push(BASE + relative(distDir, full).split('\\').join('/'))
      }
    }
    try {
      walk(distDir)
      writeFileSync(join(distDir, 'asset-manifest.json'), JSON.stringify(files))
      // eslint-disable-next-line no-console
      console.log(`[asset-manifest] ${files.length} media files listed for offline warm-up`)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[asset-manifest] failed to emit manifest:', err)
    }
  },
}

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
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
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
    emitAssetManifest,
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      workbox: {
        // Precache the app SHELL only (code + fonts + html). Media is handled at
        // runtime below so the service worker install stays tiny and updates
        // apply reliably on phones — the old setup precached ~109 MB up front,
        // which routinely failed to install on mobile and left stale builds.
        globPatterns: ['**/*.{js,css,html,ico,woff2,ttf,webmanifest}'],
        cleanupOutdatedCaches: true,
        // Media: serve from cache instantly (works offline), refresh in the
        // background when online so renamed-in-place assets still update.
        runtimeCaching: [
          {
            urlPattern: /\.(?:svg|webp|png|gif|jpe?g|JPG)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sdshc-media',
              expiration: {
                maxEntries: 700,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
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
