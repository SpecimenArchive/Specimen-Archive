import type { Page } from '@playwright/test';
import type { BrowserCommand } from './decoder';
import type { BrowserEvent } from '../../shared/browser';
import { BROWSER_CONFIG as C } from './config';
export class BrowserExecutor {
  cursor={...C.cursorStart};
  constructor(readonly page:Page){}
  async execute(command:BrowserCommand){
    const from={...this.cursor},startedAt=new Date().toISOString();
    const eventOffset=await this.page.evaluate(()=>(window as any).__events.length);
    if(command.kind==='move'){
      this.cursor={x:Math.max(10,Math.min(C.width-10,from.x+command.dx)),y:from.y};
      await this.page.mouse.move(this.cursor.x,this.cursor.y);
    }else if(command.kind==='click'){
      // Activate at the current cursor. No locator, coordinates or snapping.
      await this.page.mouse.down();await this.page.mouse.up();
    }
    const events=await this.page.evaluate(offset=>(window as any).__events.slice(offset),eventOffset) as BrowserEvent[];
    return {kind:command.kind,from,to:{...this.cursor},startedAt,completedAt:new Date().toISOString(),events};
  }
}
