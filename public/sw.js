const SW_VERSION = "v1.0.0"
const STATIC_CACHE = `market-static-${SW_VERSION}`
const RUNTIME_CACHE = `market-runtime-${SW_VERSION}`

const STATIC_ASSETS = ["/", "/manifest.json", "/logo.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin
  if (!isSameOrigin) return

  const isNavigation = event.request.mode === "navigate"
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone))
          return networkResponse
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request)
          if (cachedPage) return cachedPage
          return caches.match("/")
        }),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type !== "opaque"
          ) {
            const clone = networkResponse.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone))
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || networkFetch
    }),
  )
})
