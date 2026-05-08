const CACHE = 'orcafacil-v2';

// Arquivos locais — obrigatórios no cache
const ASSETS_LOCAIS = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/app.js',
  './manifest.json'
];

// Bibliotecas externas — salvas na 1ª vez com internet
const ASSETS_CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

// ===== INSTALL: pré-cacheia tudo =====
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // Locais: falha crítica se não cachear
      cache.addAll(ASSETS_LOCAIS).then(() =>
        // CDN: best-effort — não impede instalação se offline
        Promise.allSettled(ASSETS_CDN.map(url => cache.add(url)))
      )
    ).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE: remove caches antigos =====
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ===== FETCH: Cache First com fallback de rede =====
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Servir do cache imediatamente se disponível
      if (cached) return cached;

      // Não está no cache: buscar na rede e armazenar para uso futuro
      return fetch(e.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const copia = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copia));
          return response;
        })
        .catch(() => {
          // Offline e não cacheado: retorna o app principal para navegação
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
