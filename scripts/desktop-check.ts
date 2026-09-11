import { mkdirSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { DesktopSession } from '../server/exhibit/desktop';
import { exhibitTask } from '../server/exhibit/task';
import { PNG } from 'pngjs';
// Separate, explicitly operator-driven optical calibration, never neural evidence.
const directory=resolve('runtime/desktop-optics');mkdirSync(directory,{recursive:true});
const session=await DesktopSession.open();
try{
  const context=await session.browser.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
  await context.route('http://specimen.test/**',route=>route.fulfill({contentType:'text/html',body:exhibitTask(101,route.request().url().endsWith('ledger')?1:0,'standard')}));
  const page=await context.newPage();for(const c of session.browser.contexts())if(c!==context)for(const p of c.pages())await p.close();
  await session.arrange(page);await page.goto('http://specimen.test/');await page.mouse.move(320,216);
  const records=[];
  for(const [index,theme] of ['dark','light'].entries()){
    if(theme==='light')await page.addStyleTag({content:'body{background:#f4f4ef;color:#222c2c}header{border-color:#bec8c5}article,small{color:#485955}'});
    await page.waitForTimeout(100);
    const png=await page.screenshot({animations:'disabled'});const capturedAt=new Date().toISOString();writeFileSync(resolve(directory,`page-${theme}.png`),png);
    assert.deepEqual([PNG.sync.read(png).width,PNG.sync.read(png).height],[640,360]);
    const capture=await session.capture(directory,index,`page-${theme}.png`,capturedAt,{x:320,y:216});
    // Match the page crop in real framebuffer bytes. This checks scaling,
    // chrome offsets and clipping without supplying privileged data to a model.
    const {readFileSync}=await import('node:fs');const root=PNG.sync.read(readFileSync(resolve(directory,capture.path))),input=PNG.sync.read(png);
    let best={x:0,y:0,error:Infinity};
    for(let y=70;y<=150;y++)for(let x=150;x<=170;x++){
      let error=0;for(let j=3;j<360;j+=9)for(let i=3;i<640;i+=11)for(let c=0;c<3;c++)error+=Math.abs(root.data[((y+j)*root.width+x+i)*4+c]-input.data[(j*640+i)*4+c]);
      if(error<best.error)best={x,y,error};
    }
    assert.equal(best.error,0,'Captured desktop must contain the exact sensory viewport, at 1:1 scale');
    for(let y=0;y<360;y++)assert.deepEqual(root.data.subarray(((best.y+y)*root.width+best.x)*4,((best.y+y)*root.width+best.x+640)*4),input.data.subarray(y*640*4,(y+1)*640*4),'Every sensory pixel is present unchanged inside the native browser');
    records.push({theme,...capture,pageCrop:best,identicalPixels:640*360});
  }
  writeFileSync(resolve(directory,'calibration.json'),JSON.stringify({purpose:'Operator-driven optical QA, not a controller trial',records},null,2));console.log(records);
  await context.close();await session.browser.close();
}finally{await session.close();}
