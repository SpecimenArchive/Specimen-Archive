/** Exact observer origins, including explicitly configured SSH-forward ports. */
export function observerOrigins(port:number,extra=''){
  const origins=new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]);
  for(const value of extra.split(',').map(s=>s.trim()).filter(Boolean)){
    const url=new URL(value);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.origin!==value)throw new Error('Observer origins must be exact HTTP(S) origins without paths or credentials');
    origins.add(value);
  }
  return origins;
}
