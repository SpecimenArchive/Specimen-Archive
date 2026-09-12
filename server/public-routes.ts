import {posix} from 'node:path';
/** QA HTML remains in source/evidence storage, never anonymous production HTML. */
export function privateReviewPath(path:string){try{return /^\/docs\/previews(?:\/|$)/i.test(posix.normalize(decodeURIComponent(path).replace(/\\/g,'/')));}catch{return true;}}
