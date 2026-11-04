'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'v55-ui-results.json');
const checks = [];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const pass = (name, details = {}) => { checks.push({ name, pass: true, ...details }); console.log('PASS', name); };

function startServer(port) {
  const child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => resolve(child), 5000);
    child.stdout.on('data', data => {
      text += data.toString();
      if (text.includes(`:${port}`)) { clearTimeout(timer); resolve(child); }
    });
    child.once('error', error => { clearTimeout(timer); reject(error); });
  });
}

async function login(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FashionBoot?.state.complete, null, { timeout: 20000 });
  await page.getByRole('button', { name: /点击开始/ }).click();
  const close = page.getByRole('button', { name: '关闭签到', exact: true });
  await page.waitForFunction(()=>document.querySelector('#login-screen').hidden);
  await close.waitFor({state:'visible'});
  await close.click();
  await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));
  await page.evaluate(() => loopApp.navigate('work'));
  await wait(180);
}

async function geometry(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.atelier52');
    const nav = document.querySelector('#mobile-nav')?.getBoundingClientRect();
    const children = root ? [...root.children].filter(e => getComputedStyle(e).display !== 'none').map(e => ({ className: String(e.className), rect: e.getBoundingClientRect().toJSON() })) : [];
    const overlap = [];
    for (let i = 0; i < children.length; i++) for (let j = i + 1; j < children.length; j++) {
      const a = children[i].rect, b = children[j].rect;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) overlap.push([children[i].className, children[j].className]);
    }
    const outside = root ? [...root.querySelectorAll('button')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width && r.height && (r.left < -1 || r.right > innerWidth + 1 || (nav && r.bottom > nav.top + 1));
    }).map(e => ({ text: e.textContent.trim(), rect: e.getBoundingClientRect().toJSON() })) : [];
    const broken = [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    return {
      children, overlap, outside, broken,
      nav: nav?.toJSON(),
      work: root?.getBoundingClientRect().toJSON(),
      board: root?.querySelector('.a52-board')?.getBoundingClientRect().toJSON(),
      cells: root?.querySelectorAll('.a52-cell').length || 0,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    };
  });
}


const fixtures=require('./v55-fixtures.json');
async function loadedImages(page){await page.waitForFunction(()=>[...document.images].every(x=>x.complete),null,{timeout:10000});}
async function touchDrag(context,page,from,to){
 const a=await from.boundingBox(),b=await to.boundingBox();assert.ok(a&&b);
 const cdp=await context.newCDPSession(page),x=a.x+a.width/2,y=a.y+a.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(b.x+b.width/2-x)*i/8,y:y+(b.y+b.height/2-y)*i/8,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cdp.detach();await wait(80);
}
async function seedContext(browser,width,height,state,key='fashion.loop.mobile.v55'){
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
async function headerFits(page){
 const g=await page.evaluate(()=>{const top=document.querySelector('.topbar'),elements=[...top.querySelectorAll(':scope>.player,:scope>.resources>.resource,:scope>.audio-toggle')].filter(e=>getComputedStyle(e).display!=='none'),rows=elements.map(e=>({label:e.getAttribute('aria-label')||e.className,rect:e.getBoundingClientRect().toJSON()})),collisions=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=rows[i].rect,b=rows[j].rect;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)collisions.push([rows[i].label,rows[j].label]);}return {rows,collisions,overflow:rows.filter(x=>x.rect.left<0||x.rect.right>innerWidth+1)};});
 assert.deepEqual(g.collisions,[]);assert.deepEqual(g.overflow,[]);return g;
}
async function run(){
 const port=8141,server=await startServer(port),browser=await chromium.launch({executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 const url='http://127.0.0.1:'+port+'/fashion-studio-mobile-trial-v55.html',shots=path.join(__dirname,'v55-screenshots');fs.mkdirSync(shots,{recursive:true});
 try{
  for(const [width,height] of [[320,568],[360,640],[360,780],[390,844],[430,932],[1080,1920]]){
   const context=await seedContext(browser,width,height),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await login(page,url);await loadedImages(page);const g=await geometry(page);
   assert.deepEqual(g.overlap,[]);assert.deepEqual(g.outside,[]);assert.deepEqual(g.broken,[]);assert.equal(g.documentWidth,width);assert.equal(g.cells,63);assert.deepEqual(errors,[]);
   assert.equal(await page.locator('.is-producer-lock').count(),6);
   const lockStyle=await page.locator('.is-producer-lock').first().evaluate(e=>({border:getComputedStyle(e).borderStyle,filter:getComputedStyle(e.querySelector('img')).filter}));assert.equal(lockStyle.border,'dashed');assert.match(lockStyle.filter,/grayscale/);
   const header=await headerFits(page);await page.screenshot({path:path.join(shots,width+'x'+height+'-work.png')});pass(width+'×'+height+': 六台锁定生产器清晰可见，工作台与货币栏无重叠、无溢出，底部操作同屏',{geometry:g,header});
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
   const orderOverflow=await page.evaluate(()=>[...document.querySelectorAll('.a52-order')].flatMap(card=>{const c=card.getBoundingClientRect();return [...card.querySelectorAll('.a52-needs button')].filter(e=>{const r=e.getBoundingClientRect();return r.left<c.left||r.right>c.right;}).map(e=>e.getAttribute('aria-label'));}));assert.deepEqual(orderOverflow,[]);
   await wait(550);await page.locator('.a52-cell[data-index="'+before.index+'"]').tap();assert.equal(await page.evaluate(()=>loopApp.game.state.energy),before.energy-1);await page.reload();await page.waitForFunction(()=>window.loopApp?.game);assert.equal(await page.evaluate(f=>loopApp.game.state.atelier.producerUnlocks.includes(f),family),true);
   pass(name+': 达标状态可见，点击原地免费解锁、立即出料、刷新后状态保留');await context.close();
  }
  const legacy=await seedContext(browser,390,844,fixtures.fullV53,'fashion.loop.mobile.v53'),legacyPage=await legacy.newPage();await login(legacyPage,url);await loadedImages(legacyPage);const migrated=await legacyPage.evaluate(()=>({a:loopApp.game.state.atelier,v53:localStorage.getItem('fashion.loop.mobile.v53'),v55:localStorage.getItem('fashion.loop.mobile.v55')}));assert.equal(migrated.a.version,2);assert.equal(migrated.a.lockMigrationMoved,6);assert.equal(migrated.a.inbox.length,6);assert.deepEqual(JSON.parse(migrated.v53),fixtures.fullV53);assert.ok(migrated.v55);pass('浏览器按 V53→V55 迁移满盘旧存档，旧键完整保留，挤出物品可领取');await legacy.close();
  const v54State=require('./v54-fixtures.json').tutorial4,v54Context=await seedContext(browser,390,844,v54State,'fashion.loop.mobile.v54'),v54Page=await v54Context.newPage();await login(v54Page,url);const v54Migration=await v54Page.evaluate(()=>({key:loopApp.saveKey,old:localStorage.getItem('fashion.loop.mobile.v54'),a:loopApp.game.state.atelier}));assert.equal(v54Migration.key,'fashion.loop.mobile.v55');assert.deepEqual(JSON.parse(v54Migration.old),v54State);assert.deepEqual(v54Migration.a.producerUnlocks,v54State.atelier.producerUnlocks);assert.equal(v54Migration.a.tutorial,v54State.atelier.tutorial);assert.deepEqual(v54Migration.a.orders,v54State.atelier.orders);pass('V54→V55 保存教学节点、订单和已解锁生产器，V54存档不回写');await v54Context.close();
  const smoke=await seedContext(browser,390,844),smokePage=await smoke.newPage(),smokeErrors=[];smokePage.on('pageerror',e=>smokeErrors.push(e.message));await login(smokePage,url);
  for(const view of ['map','community','catalog','profile','ranking','customer','work']){await smokePage.evaluate(v=>loopApp.navigate(v),view);await wait(180);await loadedImages(smokePage);const bad=await smokePage.evaluate(()=>[...document.images].filter(x=>x.naturalWidth===0).map(x=>x.src));assert.deepEqual(bad,[],view);assert.equal(await smokePage.evaluate(()=>loopApp.ui.view),view);}
  assert.deepEqual(smokeErrors,[]);pass('商场、社区、背包、换装、排行榜、顾客和工坊入口均能打开，图像无缺失、无脚本异常');await smoke.close();
  if(process.env.V55_SKIP_PACKED!=='1'){
   const packed=await seedContext(browser,390,844),page=await packed.newPage();await login(page,'http://127.0.0.1:'+port+'/pack-test/v55-signed-apk/index.html');await loadedImages(page);const g=await geometry(page);assert.deepEqual(g.broken,[]);assert.deepEqual(g.overlap,[]);assert.equal(await page.locator('.is-producer-lock').count(),6);await page.locator('.a52-cell[data-family="styling"]').tap();assert.equal(await page.locator('[data-action="a52-unlock"]').isDisabled(),true);pass('签名 APK 解包网页启动、锁定逻辑和全部工作台图像加载正常');await packed.close();
  }
  fs.writeFileSync(out,JSON.stringify({pass:true,url,checks,limitation:'Chromium mobile emulation and trusted CDP touch events; no physical Android install test.'},null,2));
 }finally{await browser.close();server.kill();}
}
run().catch(error=>{console.error(error.stack||error);fs.writeFileSync(out,JSON.stringify({pass:false,checks,error:String(error.stack||error)},null,2));process.exitCode=1;});
