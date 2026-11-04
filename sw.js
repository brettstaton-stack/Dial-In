/* Dial-In service worker. App files: network first (so edits arrive fast), cache fallback (so it opens with no signal). */
const V='tul-1793758344';
const SHELL=['./','./index.html','./config.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function timeout(ms){return new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))}
async function networkFirst(req){
  const c=await caches.open(V);
  try{
    const r=await Promise.race([fetch(req),timeout(4000)]);
    if(r&&r.ok)c.put(req,r.clone());
    return r;
  }catch(e){
    return (await c.match(req,{ignoreSearch:true}))||(req.mode==='navigate'?await c.match('./index.html'):undefined)||Response.error();
  }
}
async function swr(req){
  const c=await caches.open(V),hit=await c.match(req);
  const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(()=>hit);
  return hit||net;
}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin)e.respondWith(networkFirst(r));
  else if(/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))e.respondWith(swr(r));
});
