// Abre rápido e funciona offline: serve do cache e atualiza em segundo plano.
// Para forçar limpeza total do cache, troque VERSAO.
const VERSAO = 'meumei-v3-1';
const ARQUIVOS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSAO).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const rede = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(rede); return hit; }
    return (await rede) || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
  }));
});
