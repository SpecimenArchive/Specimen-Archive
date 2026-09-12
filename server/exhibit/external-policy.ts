export const EXTERNAL_POLICY=Object.freeze({version:'external-exploration-v1',initial:'https://www.ponsfamily.com/launchpad',maximumUnchanged:3,maximumEncounterDecisions:8,researchAfterCoins:4,displayIntervalMs:250,windowWallMs:1200,inputMaximumAgeMs:6000,decisionWindows:48});
export const RESEARCH_PAGES=[
 'https://elifesciences.org/articles/97964',
 'https://elifesciences.org/articles/26000',
 'https://elifesciences.org/articles/02730',
 'https://jekelylab.github.io/Platynereis_connectome/'
];
export function approvedPage(value:string){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
  if(u.origin==='https://www.ponsfamily.com')return /^\/launchpad(?:\/0x[a-fA-F0-9]{40})?\/?$/.test(u.pathname)&&!u.search;
  return RESEARCH_PAGES.includes(u.origin+u.pathname)&&!u.search;
 }catch{return false;}
}
export function coinAddress(value:string){try{const u=new URL(value);return u.origin==='https://www.ponsfamily.com'&&/^\/launchpad\/0x[a-fA-F0-9]{40}\/?$/.test(u.pathname)?u.pathname.split('/')[2]:undefined;}catch{return undefined;}}
export function restrictionReason(url:string,text:string,status?:number){
 if(status===403||status===429)return `Access restricted (HTTP ${status}); automatic interaction stopped.`;
 if(/\/blocked(?:\?|$)|\/challenge(?:\?|$)/i.test(url)||/unavailable in your region|verify (that )?you are human|checking your browser|access denied|complete the captcha/i.test(text))return 'The site reports an access restriction; automatic interaction stopped.';
 return undefined;
}
/** Explicit environment selection, never a motor decoder or allegedly neural target. */
export class EncounterPlanner {
 readonly visits=new Map<string,number>();readonly coins=new Map<string,string>();private research=0;private completedCoins=0;
 ponsBlocked:string|undefined;
 constructor(readonly researchOnly=false){if(researchOnly)this.ponsBlocked='Pons unavailable through permitted access; research environment selected.';}
 discover(links:{url:string;title:string}[]){for(const link of links)if(approvedPage(link.url)&&coinAddress(link.url)&&this.coins.size<2000)this.coins.set(link.url,link.title.slice(0,160));}
 entered(url:string){this.visits.set(url,(this.visits.get(url)??0)+1);if(coinAddress(url))this.completedCoins++;}
 next(current?:string){
  if(this.ponsBlocked)return RESEARCH_PAGES[this.research++%RESEARCH_PAGES.length];
  if(!current)return EXTERNAL_POLICY.initial;
  if(this.completedCoins>=EXTERNAL_POLICY.researchAfterCoins){this.completedCoins=0;return RESEARCH_PAGES[this.research++%RESEARCH_PAGES.length];}
  if(current!==EXTERNAL_POLICY.initial)return EXTERNAL_POLICY.initial;
  // Coverage order responds to the currently discovered listing and visit history.
  // No market metric, random coin, fallback neural click or target coordinate is used.
  return [...this.coins.keys()].sort((a,b)=>(this.visits.get(a)??0)-(this.visits.get(b)??0)||a.localeCompare(b))[0]??EXTERNAL_POLICY.initial;
 }
}
