const CACHE_NAME = "docente-pwa-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./report-search.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if(event.data?.tipo === "ACTIVAR_ACTUALIZACION"){
    self.skipWaiting();
  }
});

async function agregarMejorasAlHtml(response){
  const tipo = response.headers.get("content-type") || "";
  if(!tipo.includes("text/html")) return response;

  const html = await response.text();
  const actualizado = html.includes("report-search.js")
    ? html
    : html.replace("</body>", '<script src="./report-search.js"></script>\n</body>');

  return new Response(actualizado, {
    status:response.status,
    statusText:response.statusText,
    headers:response.headers
  });
}

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const esArchivoDeLaApp = url.origin === self.location.origin;

  if(esArchivoDeLaApp){
    event.respondWith(
      fetch(event.request, {cache:"no-store"})
        .then(agregarMejorasAlHtml)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
