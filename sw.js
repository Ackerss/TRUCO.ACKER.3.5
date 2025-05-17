// Service Worker para funcionalidade offline do Marcador de Truco

// Nome do cache (versão incrementada para forçar atualização, se necessário)
const CACHE_NAME = 'truco-marker-cache-v1.9'; // Mantenha ou atualize conforme suas necessidades

// Lista de arquivos essenciais para cachear na instalação
const urlsToCache = [
  '.', // Atalho para index.html na raiz
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'sw.js', // O próprio service worker
  'icon-192.png', // Ícone principal (verifique se este arquivo existe na raiz)
  'icon-512.png'  // Ícone maior (verifique se este arquivo existe na raiz)
];

// Evento 'install': Chamado quando o Service Worker é instalado.
self.addEventListener('install', event => {
  console.log('[SW] Evento Install:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto. Cacheando arquivos essenciais...');
        // Mapeia cada URL para uma promessa de fetch e cache
        const cachePromises = urlsToCache.map(urlToCache => {
            // Força a busca da rede para garantir que estamos cacheando a versão mais recente durante a instalação
            return fetch(urlToCache, {cache: "reload"})
                .then(response => {
                     if (!response.ok) {
                        // Se a resposta não for OK (ex: 404), não tenta cachear e avisa
                        console.warn(`[SW] Falha ao buscar ${urlToCache} para cache: ${response.status} ${response.statusText}`);
                        return undefined; // Retorna undefined para não quebrar Promise.all
                     }
                     // Se a resposta for OK, clona e armazena no cache
                     return cache.put(urlToCache, response);
                })
                .catch(err => {
                    // Erro de rede ao tentar buscar o arquivo
                    console.warn(`[SW] Erro de rede ao tentar cachear ${urlToCache}:`, err);
                    return undefined; // Retorna undefined para não quebrar Promise.all
                });
        });
        // Espera todas as promessas de cache serem resolvidas
        return Promise.all(cachePromises);
      })
      .then(() => {
          console.log("[SW] Recursos essenciais cacheados (ou tentativa de cachear concluída).");
          // Força o novo Service Worker a se tornar ativo imediatamente
          return self.skipWaiting();
      })
      .catch(error => {
          // Erro durante a abertura do cache ou outra falha na instalação
          console.error("[SW] Falha na instalação do Service Worker:", error);
      })
  );
});

// Evento 'fetch': Intercepta requisições da página.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET (ex: POST, PUT)
  if (event.request.method !== 'GET') return;

  // Estratégia: Cache first, then network (Primeiro tenta o cache, depois a rede)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log('[SW] Retornando do cache:', event.request.url);
          return cachedResponse; // Encontrado no cache, retorna a resposta cacheada
        }
        // Não está no cache, busca na rede
        // console.log('[SW] Buscando na rede:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Verifica se a resposta da rede é válida
            if(!networkResponse || networkResponse.status !== 200 /*|| networkResponse.type !== 'basic'*/) {
              // Não armazena respostas inválidas ou de outros domínios (se type basic for verificado)
              return networkResponse;
            }
            // Clona a resposta da rede para poder usá-la e armazená-la no cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache); // Armazena a resposta no cache
            });
            return networkResponse; // Retorna a resposta da rede para a página
          }
        ).catch(error => {
            // Erro ao buscar na rede (provavelmente offline)
            console.warn('[SW] Erro de fetch (Offline?):', event.request.url, error);
            // Opcional: Retornar uma resposta offline padrão (ex: uma página offline.html)
            // return caches.match('offline.html'); // Exemplo
        });
      })
  );
});

// Evento 'activate': Limpa caches antigos.
self.addEventListener('activate', event => {
  console.log('[SW] Evento Activate:', CACHE_NAME);
  // Lista de caches permitidos (whitelist), normalmente apenas o cache atual
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não estiver na whitelist, deleta-o
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[SW] Caches antigos limpos.');
        // Permite que o Service Worker ativado controle clientes (páginas) imediatamente
        // sem a necessidade de recarregar a página.
        return self.clients.claim();
    })
  );
});
