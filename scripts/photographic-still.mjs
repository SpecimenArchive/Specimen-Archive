import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1100,height:960},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4317/photographic-study.html',{waitUntil:'networkidle'});
await page.locator('#specimen-still img').evaluate(img=>img.decode());
await page.locator('#specimen-still').screenshot({path:'docs/screenshots/photographic-still-v1-panel.png'});
await page.screenshot({path:'docs/screenshots/photographic-still-v1-review.png',fullPage:true});
console.log(await page.locator('#specimen-still').boundingBox());await browser.close();
