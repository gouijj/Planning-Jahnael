/* Petit programme qui permet à l'appli de s'ouvrir sans internet et d'afficher les notifications.
   À chaque changement de ce fichier, augmenter le numéro de CACHE_NAME. */
const CACHE_NAME = 'rythme-v43';
const PAGE_KEY = './index.html';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];
/* Fichiers facultatifs : gardés en copie s'ils existent, ignorés sinon (polices, images du personnage : ils peuvent être ajoutés plus tard) */
const OPTIONAL_ASSETS = ['./fonts/Lexend-VariableFont_wght.ttf', './fonts/Fredoka-VariableFont_wdth,wght.ttf', './perso/salut.png', './perso/bravo.png', './perso/weekend.png', './perso/p2/salut.png', './perso/p2/bravo.png', './perso/p2/weekend.png'];
const PAGE_TIMEOUT_MS = 3000;

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      /* cache: 'reload' = on prend la version du site, pas une ancienne copie gardée par le navigateur */
      return cache.addAll(ASSETS.map(function (u) { return new Request(u, { cache: 'reload' }); })).then(function () {
        return Promise.all(OPTIONAL_ASSETS.map(function (u) {
          return fetch(u, { cache: 'reload' }).then(function (r) { if (r && r.ok) return cache.put(u, r); }).catch(function () {});
        }));
      });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
        );
      }),
      self.clients.claim()
    ])
  );
});

function offlinePage() {
  return new Response('<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><p style="font-family:sans-serif;padding:24px;">Pas de connexion pour le moment. Réessaie dans un instant.</p>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/* Page de l'appli : le site d'abord (toujours la dernière version), mais
   - si le site ne répond pas en 3 secondes, on ouvre la copie gardée sur l'appareil (plus d'écran blanc sur mauvais réseau) ;
   - seule une BONNE réponse remplace la copie : une page d'erreur du site ne l'écrase plus ;
   - sans internet : la copie. */
function fetchPage(event) {
  const cachedP = caches.match(PAGE_KEY);
  let putP = Promise.resolve();
  const netP = fetch(event.request, { cache: 'no-store' }).then(function (response) {
    if (response && response.ok) {
      const copy = response.clone();
      putP = caches.open(CACHE_NAME).then(function (cache) { return cache.put(PAGE_KEY, copy); }).catch(function () {});
      return response;
    }
    return cachedP.then(function (c) { return c || response; });
  }, function () {
    return cachedP.then(function (c) { return c || offlinePage(); });
  });
  /* On laisse le temps à la copie de s'enregistrer, même si la page a déjà été servie */
  event.waitUntil(netP.then(function () { return putP; }).catch(function () {}));
  const slowP = new Promise(function (resolve) { setTimeout(resolve, PAGE_TIMEOUT_MS); })
    .then(function () { return cachedP; })
    .then(function (c) { return c || netP; });
  return Promise.race([netP, slowP]);
}

/* Polices chargées chez Google : la copie d'abord, sinon on va la chercher et on la garde.
   Résultat : après une première ouverture avec internet, les polices marchent aussi hors connexion. */
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
function fetchFont(event) {
  return caches.match(event.request).then(function (hit) {
    if (hit) return hit;
    return fetch(event.request).then(function (response) {
      /* type « opaque » = réponse d'un autre site lue sans autorisation spéciale : normal pour la feuille de style Google */
      if (response && (response.ok || response.type === 'opaque')) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.put(event.request, copy); }).catch(function () {}));
      }
      return response;
    });
  });
}

/* - Polices Google : voir fetchFont.
   - Requêtes vers la base de données (autre domaine) et requêtes d'écriture : jamais interceptées.
   - Page de l'appli : voir fetchPage.
   - Images, manifest, polices : la copie d'abord ; s'il n'y en a pas, on va la chercher et on la garde. */
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (FONT_HOSTS.indexOf(url.hostname) !== -1) { event.respondWith(fetchFont(event)); return; }
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isPage) { event.respondWith(fetchPage(event)); return; }
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (response) {
        if (response && response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.put(req, copy); }).catch(function () {}));
        }
        return response;
      });
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
