'use strict';
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'v54-ui.cjs');
const base=fs.readFileSync(path.join(__dirname,'v53-ui.cjs'),'utf8').split('async function run()')[0].replaceAll('v53','v54')
 .replace("  if (await close.isVisible().catch(() => false)) await close.click();", "  await page.waitForFunction(()=>document.querySelector('#login-screen').hidden);\n  await close.waitFor({state:'visible'});\n  await close.click();\n  await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));");
const extra=String.raw`
const fixtures=require('./v54-fixtures.json');
async function loadedImages(page){await page.waitForFunction(()=>[...document.images].every(x=>x.complete),null,{timeout:10000});}
async function touchDrag(context,page,from,to){
 const a=await from.boundingBox(),b=await to.boundingBox();assert.ok(a&&b);
 const cdp=await context.newCDPSession(page),x=a.x+a.width/2,y=a.y+a.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(b.x+b.width/2-x)*i/8,y:y+(b.y+b.height/2-y)*i/8,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cdp.detach();await wait(80);
}
async function seedContext(browser,width,height,state,key='fashion.loop.mobile.v54'){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
 if(state)await context.addInitScript(({key,state})=>{if(!sessionStorage.getItem('fixture-seeded')){localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem('fixture-seeded','1');}},{key,state});
 return context;
}
async function semanticState(page){return page.evaluate(()=>{const a=JSON.parse(JSON.stringify(loopApp.game.state.atelier));for(const x of [...a.board,...a.inventory,...a.inbox])if(x?.kind==='producer'){delete x.charge;delete x.chargeAt;}return JSON.stringify(a);});}
async function modalFits(page){
 await page.waitForFunction(()=>document.querySelector('#modal').open,null,{timeout:3000});
 await page.locator('#modal').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})));});
 const g=await page.evaluate(()=>{const m=document.querySelector('#modal'),r=m.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:m.scrollWidth>m.clientWidth+1,close:!!m.querySelector('[data-action="close"]')};});
 assert.ok(g.left>=-1&&g.right<=g.width+1&&g.top>=-1&&g.bottom<=g.height+1,JSON.stringify(g));assert.equal(g.overflow,false);assert.equal(g.close,true);return g;
}
async function run(){
 const port=8140,server=await startServer(port),browser=await chromium.launch({executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 const url='http://127.0.0.1:'+port+'/fashion-studio-mobile-trial-v54.html',shots=path.join(__dirname,'v54-screenshots');fs.mkdirSync(shots,{recursive:true});
 try{
  for(const [width,height] of [[320,568],[360,640],[360,780],[390,844],[430,932],[1080,1920]]){
   const context=await seedContext(browser,width,height),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await login(page,url);await loadedImages(page);const g=await geometry(page);
   assert.deepEqual(g.overlap,[]);assert.deepEqual(g.outside,[]);assert.deepEqual(g.broken,[]);assert.equal(g.documentWidth,width);assert.equal(g.cells,63);assert.deepEqual(errors,[]);
   assert.equal(await page.locator('.is-producer-lock').count(),6);
   const lockStyle=await page.locator('.is-producer-lock').first().evaluate(e=>({border:getComputedStyle(e).borderStyle,filter:getComputedStyle(e.querySelector('img')).filter}));assert.equal(lockStyle.border,'dashed');assert.match(lockStyle.filter,/grayscale/);
   await page.screenshot({path:path.join(shots,width+'x'+height+'-work.png')});pass(width+'×'+height+': 六台锁定生产器清晰可见，工作台无重叠、无溢出，底部操作同屏',{geometry:g});
   await page.locator('.a52-cell[data-family="styling"]').tap();await loadedImages(page);assert.equal(await page.locator('[data-action="a52-unlock"]').isDisabled(),true);const mg=await modalFits(page);await page.screenshot({path:path.join(shots,width+'x'+height+'-locked.png')});
   await page.getByRole('button',{name:'关闭详情',exact:true}).tap();assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);pass(width+'×'+height+': 锁定条件弹窗适配，不能提前解锁，可以关闭',{modal:mg});
   if(width===390){
    const before=await page.evaluate(()=>({energy:loopApp.game.state.energy,count:loopApp.game.state.atelier.board.filter(Boolean).length}));await page.locator('.a52-cell[data-index="28"]').tap();await wait(80);const after=await page.evaluate(()=>({energy:loopApp.game.state.energy,count:loopApp.game.state.atelier.board.filter(Boolean).length}));assert.equal(after.energy,before.energy-1);assert.equal(after.count,before.count+1);pass('真实触控点击生产器出料，扣除1体力');
    await touchDrag(context,page,page.locator('.a52-cell[data-index="21"]'),page.locator('.a52-cell[data-index="22"]'));assert.equal(await page.evaluate(()=>loopApp.game.state.atelier.board[22].itemId),'top_02');pass('CDP touchStart/move/end 触摸拖动完成二合');
    const snapshot=await semanticState(page);await touchDrag(context,page,page.locator('.a52-cell[data-index="22"]'),page.locator('.a52-cell[data-family="styling"]'));assert.equal(await semanticState(page),snapshot);pass('真实触摸拖入锁定格不能交换或丢失服装');
    await wait(550);await page.locator('.a52-cell[data-family="styling"]').tap();await page.getByRole('button',{name:/去完成顾客委托/}).tap();assert.equal(await page.evaluate(()=>loopApp.ui.view),'customer');assert.ok(await page.locator('.a52-orders-full').isVisible());pass('锁定条件中的行动指引可以跳到顾客委托');
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  for(const [name,family] of [['tutorial4','styling'],['tutorial7','footwear'],['tutorial9','leather']]){
   const context=await seedContext(browser,390,844,fixtures[name]),page=await context.newPage();await login(page,url);await loadedImages(page);
   const tile=page.locator('.a52-cell[data-family="'+family+'"]');assert.ok((await tile.getAttribute('class')).includes('is-unlock-ready'));await page.screenshot({path:path.join(shots,name+'-ready.png')});
   const before=await page.evaluate(f=>{const a=loopApp.game.state.atelier;return {index:a.board.findIndex(x=>x?.kind==='lockedProducer'&&x.family===f),energy:loopApp.game.state.energy,inbox:a.inbox.length};},family);
   await tile.tap();await modalFits(page);assert.equal(await page.locator('[data-action="a52-unlock"]').isDisabled(),false);await page.locator('[data-action="a52-unlock"]').tap();await loadedImages(page);
   const after=await page.evaluate(({family,index})=>{const a=loopApp.game.state.atelier;return {token:a.board[index],energy:loopApp.game.state.energy,inbox:a.inbox.length,unlocked:a.producerUnlocks.includes(family),source:!!loopApp.workshop.source(a,loopApp.workshop.producer(family).primary),modal:document.querySelector('#modal').open};},{family,index:before.index});
   assert.equal(after.token.family,family);assert.equal(after.token.kind,'producer');assert.equal(after.token.level,4);assert.equal(after.energy,before.energy);assert.equal(after.inbox,before.inbox);assert.equal(after.source,true);assert.equal(after.modal,false);assert.equal(after.unlocked,true);
   await wait(550);await page.locator('.a52-cell[data-index="'+before.index+'"]').tap();assert.equal(await page.evaluate(()=>loopApp.game.state.energy),before.energy-1);await page.reload();await page.waitForFunction(()=>window.loopApp?.game);assert.equal(await page.evaluate(f=>loopApp.game.state.atelier.producerUnlocks.includes(f),family),true);
   pass(name+': 达标状态可见，点击原地免费解锁、立即出料、刷新后状态保留');await context.close();
  }
  const legacy=await seedContext(browser,390,844,fixtures.fullV53,'fashion.loop.mobile.v53'),legacyPage=await legacy.newPage();await login(legacyPage,url);await loadedImages(legacyPage);const migrated=await legacyPage.evaluate(()=>({a:loopApp.game.state.atelier,v53:localStorage.getItem('fashion.loop.mobile.v53'),v54:localStorage.getItem('fashion.loop.mobile.v54')}));assert.equal(migrated.a.version,2);assert.equal(migrated.a.lockMigrationMoved,6);assert.equal(migrated.a.inbox.length,6);assert.deepEqual(JSON.parse(migrated.v53),fixtures.fullV53);assert.ok(migrated.v54);pass('浏览器按 V53→V54 迁移满盘旧存档，旧键完整保留，挤出物品可领取');await legacy.close();
  const smoke=await seedContext(browser,390,844),smokePage=await smoke.newPage(),smokeErrors=[];smokePage.on('pageerror',e=>smokeErrors.push(e.message));await login(smokePage,url);
  for(const view of ['map','community','catalog','profile','ranking','customer','work']){await smokePage.evaluate(v=>loopApp.navigate(v),view);await wait(180);await loadedImages(smokePage);const bad=await smokePage.evaluate(()=>[...document.images].filter(x=>x.naturalWidth===0).map(x=>x.src));assert.deepEqual(bad,[],view);assert.equal(await smokePage.evaluate(()=>loopApp.ui.view),view);}
  assert.deepEqual(smokeErrors,[]);pass('商场、社区、背包、换装、排行榜、顾客和工坊入口均能打开，图像无缺失、无脚本异常');await smoke.close();
  if(process.env.V54_SKIP_PACKED!=='1'){
   const packed=await seedContext(browser,390,844),page=await packed.newPage();await login(page,'http://127.0.0.1:'+port+'/pack-test/v54-signed-apk/index.html');await loadedImages(page);const g=await geometry(page);assert.deepEqual(g.broken,[]);assert.deepEqual(g.overlap,[]);assert.equal(await page.locator('.is-producer-lock').count(),6);await page.locator('.a52-cell[data-family="styling"]').tap();assert.equal(await page.locator('[data-action="a52-unlock"]').isDisabled(),true);pass('签名 APK 解包网页启动、锁定逻辑和全部工作台图像加载正常');await packed.close();
  }
  fs.writeFileSync(out,JSON.stringify({pass:true,url,checks,limitation:'Chromium mobile emulation and trusted CDP touch events; no physical Android install test.'},null,2));
 }finally{await browser.close();server.kill();}
}
run().catch(error=>{console.error(error.stack||error);fs.writeFileSync(out,JSON.stringify({pass:false,checks,error:String(error.stack||error)},null,2));process.exitCode=1;});
`;
fs.writeFileSync(file,base+extra);
console.log('Generated V54 mobile and touch regression suite.');
