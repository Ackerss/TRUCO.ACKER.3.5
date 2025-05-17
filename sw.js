// Service Worker para funcionalidade offline do Marcador de Truco

const CACHE_NAME = 'truco-marker-cache-v2.1'; // VERSÃO DO CACHE ATUALIZADA

const urlsToCache = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'sw.js',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Evento Install:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto. Cacheando arquivos essenciais...');
        const cachePromises = urlsToCache.map(urlToCache => {
            return fetch(urlToCache, {cache: "reload"})
                .then(response => {
                     if (!response.ok) {
                        console.warn(`[SW] Falha ao buscar ${urlToCache} para cache: ${response.status} ${response.statusText}`);
                        return undefined;
                     }
                     return cache.put(urlToCache, response);
                })
                .catch(err => {
                    console.warn(`[SW] Erro de rede ao tentar cachear ${urlToCache}:`, err);
                    return undefined;
                });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
          console.log("[SW] Recursos essenciais cacheados.");
          return self.skipWaiting();
      })
      .catch(error => {
          console.error("[SW] Falha na instalação:", error);
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(
          networkResponse => {
            if(!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => { cache.put(event.request, responseToCache); });
            return networkResponse;
          }
        ).catch(error => {
            console.warn('[SW] Erro de fetch (Offline?):', event.request.url, error);
        });
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Evento Activate:', CACHE_NAME);
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[SW] Caches antigos limpos.');
        return self.clients.claim();
    })
  );
});
