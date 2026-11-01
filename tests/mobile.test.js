'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const CHROME='C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe';
const url='file:///D:/garden/fashion-studio/fashion-studio-demo-mobile-v3.html';
const out=path.join(__dirname,'mobile-v3-screenshots');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:CHROME});const report=[];
try{
 for(const [width,height] of [[1440,1000],[390,844],[375,667],[360,720],[320,568],[430,932],[768,1024]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width<600});const errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await page.goto(url);await page.waitForFunction(()=>window.fashionApp,{},{timeout:5000});await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  const shell=await page.locator('.app-shell').boundingBox();assert.ok(shell.width<=430.1);assert.equal(await page.locator('.sidebar').count(),0);assert.equal(await page.locator('#mobile-nav .nav-button').count(),5);
  const geometry=[];
  for(const view of ['map','work','shop','catalog','contest']){
   await page.locator(`#mobile-nav [data-view="${view}"]`).tap();assert.equal(await page.evaluate(()=>fashionApp.ui.view),view);
   const g=await page.evaluate(()=>{const r=s=>{const a=document.querySelector(s)?.getBoundingClientRect();return a?{x:a.x,y:a.y,width:a.width,height:a.height,bottom:a.bottom}:null;};return {overflow:document.documentElement.scrollWidth>innerWidth,main:r('#main'),nav:r('#mobile-nav'),hud:r('.topbar'),board:r('.board-frame'),generators:r('.generators'),task:r('.map-task-float'),columns:getComputedStyle(document.querySelector('.map-layout,.work-layout,.shop-grid,.catalog-grid,.contest-layout')).gridTemplateColumns};});
   assert.equal(g.overflow,false);assert.ok(g.nav.bottom<=height+1);assert.ok(g.nav.y>g.hud.bottom);if(view==='work')assert.equal(await page.locator('.cell').count(),36);geometry.push({view,...g});
   if([1440,390,375,320].includes(width))await page.screenshot({path:path.join(out,`${width}x${height}-${view}.png`)});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);report.push({width,height,frame:shell,geometry,errors,network});await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'mobile-v3-layout-results.json'),JSON.stringify({pass:true,report},null,2));console.log('Phone-only layout passed on seven viewport sizes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
