import type {BrowserContext,Page} from '@playwright/test';
import type {ExhibitRecord} from '../../shared/exhibit';

export const STATION_SCHEDULE=Object.freeze({version:'station-tabs-v1',dashboardUrl:'http://127.0.0.1:4317/?display=workstation',dashboardSeconds:180,readingUrl:'https://elifesciences.org/articles/97964'});
/** Tab focus is recorded supervision. Only the task Page reaches the decoder's
 * executor; public reading tabs never receive autonomous clicks or form input. */
export async function prepareStationTabs(context:BrowserContext,record:ExhibitRecord,viewport={width:1280,height:720}){
  const events:NonNullable<ExhibitRecord['orchestration']>=[];record.orchestration=events;record.stationSchedule={...STATION_SCHEDULE};
  const note=(action:string,tab:string,detail:string)=>events.push({actor:'supervisor',action,tab,detail,timestamp:new Date().toISOString()});
  const dashboard=await context.newPage();await dashboard.setViewportSize(viewport);
  await dashboard.goto(STATION_SCHEDULE.dashboardUrl,{waitUntil:'domcontentloaded'});
  note('open','dashboard','Same observation backend reached through VM loopback; recursive captures suppressed.');
  const reading=await context.newPage();await reading.setViewportSize(viewport);
  try{await reading.goto(STATION_SCHEDULE.readingUrl,{waitUntil:'domcontentloaded',timeout:10000});note('open','primary-reference','Public reading page; no controller inputs are dispatched to this tab.');}
  catch{note('unavailable','primary-reference','Public source could not load; retained as a failed setup operation.');}
  return {dashboard,reading,note,async focus(page:Page,tab:string){await page.bringToFront();note('focus',tab,'Orchestration, not a decoded neural action.');}};
}
