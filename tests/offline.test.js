'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto('file:///D:/garden/fashion-studio/fashion-studio-demo-v2.html');await page.waitForFunction(()=>window.fashionApp);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 assert.equal(await page.locator('.floor-pin').count(),6);await page.screenshot({path:path.join(__dirname,'screenshots','offline-mobile-map.png')});
 await page.locator('#mobile-nav [data-view="work"]').tap();assert.equal(await page.locator('.cell').count(),36);
 // Actual touch input uses a non-scrolling pointer drag.
 const a=await page.locator('.cell[data-index="15"]').boundingBox(),b=await page.locator('.cell[data-index="14"]').boundingBox();
 const client=await page.context().newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2}]});
 for(let i=1;i<=10;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+a.width/2+(b.x-a.x)*i/10,y:a.y+a.height/2+(b.y-a.y)*i/10}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>fashionApp.game.state.merges),1);await page.waitForTimeout(450);
 // A real skin purchase and floor application through the UI.
 await page.locator('#mobile-nav [data-view="shop"]').tap();assert.equal(await page.locator('[data-action="shop-tab"]').count(),3);await page.locator('[data-action="shop-tab"][data-tab="decor"]').tap();
 await page.locator('[data-action="buy-decor"][data-theme="natural"][data-zone="橱窗"]').tap();
 await page.locator('[data-action="use-decor"][data-theme="natural"][data-zone="橱窗"]').tap();
 await page.locator('[data-action="apply-style"][data-theme="natural"]').tap();assert.equal(await page.evaluate(()=>fashionApp.game.state.decorations['1:橱窗']),'natural');
 await page.locator('.modal-close').tap();await page.locator('.scene-tool').tap();await page.locator('[data-action="advanced-confirm"]').tap();assert.equal(await page.evaluate(()=>fashionApp.game.state.level),12);await page.locator('[data-action="advanced"]').tap();assert.equal(await page.evaluate(()=>fashionApp.game.state.level),32);
 for(const f of [2,3,4,5]){await page.locator(`.floor-pin[data-f="${f}"]`).tap();await page.locator('[data-action="unlock-floor"]').tap();await page.locator('.modal-close').tap();}
 assert.equal(await page.evaluate(()=>fashionApp.game.state.floors.length),6);
 // Keyboard/ESC closes the native modal; reset is not applied before confirmation.
 await page.locator('.scene-tool').tap();await page.locator('[data-action="reset-confirm"]').tap();assert.equal(await page.evaluate(()=>fashionApp.game.state.level),32);await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').evaluate(d=>d.open),false);
 for(const v of ['map','work','shop','catalog','contest']){await page.locator(`#mobile-nav [data-view="${v}"]`).tap();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));}
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 fs.writeFileSync(path.join(__dirname,'offline-results.json'),JSON.stringify({pass:true,checks:['offline file opening','all artwork embedded','no network requests','real touch merge','decoration purchase and application','advanced mode confirmation','all six floors unlock','reset confirmation is non-destructive','ESC modal dismissal','five mobile views'],errors,network},null,2));
 console.log('Offline/touch journey passed: no network, true touch merge, decorations, six floors and confirmation safety.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

