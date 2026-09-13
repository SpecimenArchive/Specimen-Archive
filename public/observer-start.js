// Start the observer's first image requests while the application downloads.
// This reads the existing station. It never starts an episode or sends input.
(() => {
  const images = new Map(), decoded = new Map();
  const valid = path => /^exhibit_[A-Za-z0-9_-]+\/(?:view-\d+\.jpg|(?:frame|desktop)-\d+\.png)$/.test(path);
  const paths = live => ({desktop:live?.display ? live.display.runId+'/'+live.display.path : live?.desktop ? live.runId+'/'+live.desktop.path : null,input:live?.inputFrame??null});
  let cached = null;
  try { const saved=JSON.parse(sessionStorage.getItem('specimen-observer-frame-v1')||'null');
    if(saved&&Date.now()-saved.savedAt<30*60*1000&&saved.live?.sessionId&&saved.live?.snapshot&&saved.desktop?.startsWith('data:image/png;base64,'))cached=saved;
  } catch {}
  const savedPaths=paths(cached?.live);
  function image(path) {
    if(!valid(path))return Promise.reject(new Error('Invalid capture path'));
    if(images.has(path))return images.get(path);
    const promise=new Promise((resolve,reject)=>{const img=new Image();img.fetchPriority=path.includes('/frame-')?'low':'high';img.onload=()=>img.decode().then(()=>{if(images.has(path))decoded.set(path,img);resolve(img);},reject);img.onerror=()=>reject(new Error('Capture unavailable'));
      img.src=path===savedPaths.desktop?cached.desktop:path===savedPaths.input&&cached.input?cached.input:'/api/exhibit/artifacts/'+path;
    });
    images.set(path,promise);if(images.size>24){const oldest=images.keys().next().value;images.delete(oldest);decoded.delete(oldest);}promise.catch(()=>{images.delete(path);decoded.delete(path);});return promise;
  }
  function prime(live){if(live)start.current=live;const p=paths(live);for(const path of [p.desktop,p.input])if(path)void image(path).catch(()=>{});return live;}
  const start={cached,current:cached?.live??null,images,decoded,image,ready:null};window.__specimenStart=start;
  if(cached)prime(cached.live);
  start.ready=fetch('/api/exhibit/live',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(prime).catch(()=>null);
})();
