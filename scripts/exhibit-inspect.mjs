import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4317');await page.waitForSelector('.session-line[data-model-step]');await page.waitForTimeout(3000);await page.screenshot({path:'runtime/exhibit-integrated.png',fullPage:true});
await page.locator('.apparatus-heading button').click();await page.waitForTimeout(800);await page.locator('.apparatus-panel').screenshot({path:'runtime/apparatus-integrated.png'});
await page.setViewportSize({width:390,height:844});await page.locator('.apparatus-heading button').click();await page.screenshot({path:'runtime/exhibit-mobile.png',fullPage:true});
const result={errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),state:await page.locator('.session-line').innerText()};console.log(result);writeFileSync('runtime/exhibit-inspection.json',JSON.stringify(result,null,2));await browser.close();
