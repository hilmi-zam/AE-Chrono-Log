const CACHE_PREFIX = 'chrono-log-mvp-'
const CACHE_VERSION = new URL(self.location.href).searchParams.get('version') || 'legacy'
const BUILD_ID = new URL(self.location.href).searchParams.get('build') || 'legacy'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}-${BUILD_ID}`
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.svg']
const BUILD_MANIFEST = '/.vite/manifest.json'

function precacheAssets(manifest) {
  const entries = Object.values(manifest)
  if (!entries.some((entry) => entry.isEntry)) {
    throw new Error('Build manifest does not contain an application entry.')
  }

  const assets = new Set()
  for (const entry of entries) {
    if (entry.file && (entry.file.endsWith('.js') || entry.file.endsWith('.css') || entry.isAsset)) {
      assets.add(`/${entry.file}`)
    }
    for (const file of [...(entry.css ?? []), ...(entry.assets ?? [])]) {
      assets.add(`/${file}`)
    }
  }
  return [...assets]
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch(BUILD_MANIFEST, { cache: 'no-store' })
        if (!response.ok) throw new Error('Unable to load the production asset manifest.')
        const assets = precacheAssets(await response.json())
        const cache = await caches.open(CACHE_NAME)
        await cache.addAll([...new Set([...APP_SHELL, ...assets])])
      } catch (error) {
        await caches.delete(CACHE_NAME)
        throw error
      }
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)

    if (request.mode === 'navigate') {
      try {
        return await fetch(request)
      } catch {
        const cachedShell = await cache.match('/')
        if (cachedShell) return cachedShell
        throw new Error('App shell belum tersimpan untuk akses offline.')
      }
    }

    try {
      const response = await fetch(request)
      if (response.ok) await cache.put(request, response.clone())
      return response
    } catch (error) {
      const cachedResponse = await cache.match(request, { ignoreVary: true })
      if (cachedResponse) return cachedResponse
      throw error
    }
  })())
})
