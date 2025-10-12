// service-worker.js
const CACHE_NAME = 'my-site-cache-v1'; // поменяй при обновлениях
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/icons/192.png',
  '/icons/512.png'
];

// УСТАНОВКА (install): кэшируем критические ресурсы
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// АКТИВАЦИЯ (activate): удаляем старые кэши
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) {
          console.log('[SW] Removing old cache', k);
          return caches.delete(k);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// FETCH: отдаём из кэша, если нет сети
self.addEventListener('fetch', event => {
  // только GET-запросы (не POST, PUT и т.д.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // кэш найден — отдаём его сразу
        return cached;
      }

      // иначе пробуем загрузить из сети
      return fetch(event.request)
        .then(resp => {
          // успешный ответ — кладём в кэш и отдаём
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        })
        .catch(() => {
          // офлайн — отдаём оффлайн-страницу (только для HTML)
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});
