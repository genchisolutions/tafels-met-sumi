const CACHE='sumi-v6';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./sumi-character.png','./sumi-home.png','./mood-happy.png','./mood-thinking.png','./mood-oops.png','./mood-party.png','./mood-sleep.png','./mood-adventure.png','./room-pink.png','./room-blue.png','./bg-village.png','./bg-castle.png','./bg-forest.png','./bg-lake.png','./bg-waterfall.png','./bg-aurora.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{let c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))));
