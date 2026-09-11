import { randomUUID,timingSafeEqual } from 'node:crypto';

/** Worker ownership only; this module never selects browser actions. */
export class WorkerLease {
  readonly bootId=randomUUID();
  private active:{id:string;expires:number;sequence:number}|null=null;
  constructor(readonly token:string,readonly ttlMs=20000,readonly clock=()=>Date.now()){
    if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Worker token must contain 32 random bytes encoded as hex');
  }
  authorize(header:string|undefined){
    const actual=Buffer.from(header??''),expected=Buffer.from(`Bearer ${this.token}`);
    return actual.length===expected.length&&timingSafeEqual(actual,expected);
  }
  expired(){return !!this.active&&this.clock()>=this.active.expires;}
  acquire(){
    // An expired browser must be stopped by the owner before reacquisition.
    if(this.active)throw new Error('Worker already leased; wait for cleanup');
    this.active={id:randomUUID(),expires:this.clock()+this.ttlMs,sequence:0};
    return {leaseId:this.active.id,bootId:this.bootId,ttlMs:this.ttlMs};
  }
  verify(id:string,bootId:string){
    if(!this.active||this.expired()||this.active.id!==id||this.bootId!==bootId)throw new Error('Expired or foreign worker lease');
  }
  heartbeat(id:string,bootId:string){this.verify(id,bootId);this.active!.expires=this.clock()+this.ttlMs;}
  command(id:string,bootId:string,sequence:number){
    this.verify(id,bootId);
    if(!Number.isSafeInteger(sequence)||sequence!==this.active!.sequence+1)throw new Error('Stale or out-of-order worker request');
    this.active!.sequence=sequence;
  }
  release(){this.active=null;}
}
