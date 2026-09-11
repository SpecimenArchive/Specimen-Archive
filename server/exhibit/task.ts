import type { TaskLayout } from './config';
// These coordinates are harness-only. Neither controller nor decoder imports this file.
export function placement(seed:number,page:number,layout:TaskLayout){
  return {x:112+((seed*37+page*173)%408),y:(layout==='offset'?480:350)+((seed*19+page*71)%144)};
}
export function exhibitTask(seed:number,page:number,layout:TaskLayout){
  const p=placement(seed,page,layout),green=layout==='low-contrast'?'#667968':'#36ba6a';
  return `<!doctype html><html><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#152328;color:#dde5df;font:18px system-ui;min-height:1100px}header{padding:24px 30px;border-bottom:1px solid #33484b}small{font:12px monospace;letter-spacing:.12em;color:#a8c2bb}h1{font-size:26px;font-weight:500;margin:12px 0}p{line-height:1.5}article{padding:20px 30px;color:#aabbb6;font-size:17px;width:90%}.target{position:absolute;left:${p.x-52}px;top:${p.y-32}px;width:104px;height:64px;border:0;border-radius:7px;background:${green};color:#0b2418;text-decoration:none;display:grid;place-items:center;font:17px system-ui;cursor:pointer}#cursor{position:fixed;border:3px solid #00ffff;width:17px;height:17px;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:10}#guide{position:fixed;bottom:12px;right:22px;color:#edb547;font:26px monospace}#done{position:fixed;bottom:45px;left:30px;font-size:22px;color:#e0e6dc}footer{position:absolute;top:960px;padding:30px;color:#aabbb6}</style>
  <header><small>SPECIMEN ARCHIVE / CONTROLLED PAGE ${page+1}</small><h1>${page===0?'Locate the field notes':'Register the observation'}</h1></header>
  <article>${page===0?'A visible green link opens the next page.':'A visible green button changes this page.'}<p>Scroll to bring it into the cursor’s lane.</p></article>
  ${page===0?`<a class="target" href="/ledger">Field notes ↗</a>`:`<button class="target" id="activate">Record</button>`}
  <span id="cursor"></span><span id="guide">↓</span><span id="done"></span><footer>End of the controlled observation sheet.</footer>
  <script>
  const cursor=document.getElementById('cursor');let xy=JSON.parse(sessionStorage.getItem('cursor')||'{"x":320,"y":216}');
  function draw(){cursor.style.left=xy.x+'px';cursor.style.top=xy.y+'px'}draw();
  addEventListener('mousemove',e=>{xy={x:e.clientX,y:e.clientY};sessionStorage.setItem('cursor',JSON.stringify(xy));draw()});
  function guide(){const r=document.querySelector('.target')?.getBoundingClientRect();document.getElementById('guide').style.display=r&&r.top>innerHeight?'block':'none'}addEventListener('scroll',guide);guide();
  window.__outcome={activated:false,activationCount:0};document.getElementById('activate')?.addEventListener('click',e=>{window.__outcome.activated=true;window.__outcome.activationCount++;e.target.style.background='#526360';e.target.disabled=true;document.getElementById('done').textContent='Observation registered';document.getElementById('guide').style.display='none'});
  </script></html>`;
}
