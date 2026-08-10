/* Service worker — funcionamento offline (cache-first).
   A chave do cache vem do versao.js, o único lugar onde a versão do
   aplicativo é escrita: a versão "1.1" vira o cache "ra-1.1". Trocar a
   versão lá é o que faz os navegadores baixarem os arquivos novos —
   sem isso, quem já abriu o aplicativo continua recebendo a tela
   antiga. Aqui não há número a lembrar de atualizar. */
importScripts("./versao.js");
const VERSAO = "ra-" + APP.versao;
const ARQUIVOS = [
  "./",
  "./index.html",
  "./versao.js",
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
