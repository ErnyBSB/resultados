/* Service worker — funcionamento offline (cache-first).
   Ao publicar uma nova versão do aplicativo, altere o número da VERSAO
   para que os navegadores baixem os arquivos atualizados. O número
   acompanha a tag do repositório: a tag v1.0 corresponde a "ra-1.0". */
const VERSAO = "ra-1.0";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./catalogo.js",
  "./rede.js",
  "./echarts.min.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (r) => r || fetch(e.request)
    )
  );
});
