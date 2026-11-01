'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:"C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe"});
 const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const out=path.join(__dirname,'screenshots');fs.mkdirSync(out,{recursive:true});
 const nav=async(v,mobile=false)=>{await page.locator(`${mobile?'#mobile-nav':'#desktop-nav'} [data-view="${v}"]`).click();await page.waitForTimeout(80);};
 const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(window.fashionApp.game.state)));
 const overflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'horizontal overflow');
 await page.goto('http://127.0.0.1:8128');await page.waitForFunction(()=>window.fashionApp);
 await page.screenshot({path:path.join(out,'desktop-map.png')});await overflow();
 await page.locator('.map-task-float [data-action="task"]').click();assert.equal((await state()).task,1);assert.equal((await state()).coins,1000);await page.locator('#modal [data-action="close-modal"]').last().click();
 await nav('work');assert.equal(await page.locator('.cell').count(),36);await page.screenshot({path:path.join(out,'desktop-work.png')});
 await page.locator('.cell[data-index="15"]').click();await page.locator('.cell[data-index="14"]').click();assert.equal((await state()).merges,1);assert.equal((await state()).board[14].t,1);
 const resources=(await state());await page.locator('[data-action="generate"][data-c="2"]').click();assert.equal((await state()).energy,resources.energy-4);
 await page.locator('[data-action="deliver"][data-id="1"]').click();assert.equal((await state()).ordersDone,1);
 await nav('shop');await page.screenshot({path:path.join(out,'desktop-shop.png')});await page.locator('[data-action="gift"]').click();assert.equal((await state()).daily.gift,true);
 await page.locator('[data-action="buy-energy"]').click();assert.equal((await state()).energy,100);assert.equal((await state()).daily.energyBuys,1);
 await page.locator('[data-action="buy-item"]').first().click();assert.equal(Object.keys((await state()).daily.purchased).length,1);
 await nav('catalog');await page.screenshot({path:path.join(out,'desktop-catalog.png')});await page.locator('[data-action="catalog-item"][data-c="0"][data-t="1"]').click();let s=await state();await page.locator('[data-action="claim-item"]').click();assert.equal((await state()).gems,s.gems+2);assert.ok(await page.locator('[data-action="claim-item"]').isDisabled());await page.locator('.modal-close').click();
 await nav('contest');await page.screenshot({path:path.join(out,'desktop-contest.png')});await page.locator('[data-action="auto-outfit"]').click();let expected=await page.evaluate(()=>fashionApp.game.score().total);await page.locator('[data-action="enter-contest"]').click();assert.equal((await state()).contest.result.total,expected);await page.locator('.modal-close').click();await page.locator('[data-action="claim-contest"][data-id="0"]').click();assert.ok((await state()).contest.claimed.includes(0));
 const saved=await state();await page.reload();await page.waitForFunction(()=>window.fashionApp);assert.deepEqual((await state()).claimed,saved.claimed);assert.deepEqual((await state()).contest.claimed,saved.contest.claimed);assert.equal((await state()).coins,saved.coins);
 await page.setViewportSize({width:390,height:844});
 for(const v of ['map','work','shop','catalog','contest']){await nav(v,true);await overflow();await page.screenshot({path:path.join(out,'mobile-'+v+'.png')});}
 await page.setViewportSize({width:320,height:740});for(const v of ['map','work','shop','catalog','contest']){await nav(v,true);await overflow();}
 await page.setViewportSize({width:390,height:844});await nav('work',true);
 // Drag gesture through real pointer events (fresh empty target).
 let current=await state(),from=current.board.findIndex(Boolean),to=current.board.findIndex(x=>!x),a=await page.locator(`.cell[data-index="${from}"]`).boundingBox(),b=await page.locator(`.cell[data-index="${to}"]`).boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();assert.deepEqual((await state()).board[to],current.board[from]);assert.equal((await state()).board[from],null);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(__dirname,'browser-results.json'),JSON.stringify({pass:true,checks:['five desktop views','five mobile views','320px no overflow','map renovation','click merge','generator cost','order delivery','shop stock','free energy','catalog reward once','contest scoring and reward','reload persistence','pointer drag'],errors},null,2));
 console.log('Browser journey passed: five views, mobile layouts, purchase, merge, contest and persistence.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

