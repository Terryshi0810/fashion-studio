'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'v51-screenshots');fs.mkdirSync(out,{recursive:true});
const web='http://127.0.0.1:8138/fashion-studio-mobile-trial-v51.html';
const local='file:///D:/garden/fashion-studio/fashion-studio-mobile-trial-v51.html';
const packaged='file:///D:/garden/fashion-studio/pack-test/v51-signed-apk/index.html';
const report={version:'V51',pass:false,checks:[],limitations:['Chromium touch emulation and extracted APK resource regression; no physical Android installation test performed.']};
let browser;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const record=(name,data={})=>{report.checks.push({name,pass:true,...data});console.log('PASS',name);};
async function ready(p){await p.waitForFunction(()=>window.FashionBoot?.state.complete,{timeout:16000});await p.waitForFunction(()=>!document.getElementById('boot-splash'),{timeout:3000});}
async function images(p){
 await p.waitForFunction(()=>[...document.images].every(i=>i.complete),{timeout:10000});
 const missing=await p.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src));assert.deepEqual(missing,[]);
 const css=await p.evaluate(async()=>{
  const urls=new Set();
  document.querySelectorAll('*').forEach(e=>{for(const pseudo of [null,'::before','::after']){const s=getComputedStyle(e,pseudo);for(const m of s.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)){if(!m[1].startsWith('#')&&!m[1].startsWith('data:'))urls.add(new URL(m[1],document.baseURI).href);}}});
  return await Promise.all([...urls].map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({src,ok:true});i.onerror=()=>resolve({src,ok:false});i.src=src;})));
 });assert.deepEqual(css.filter(x=>!x.ok),[]);return {images:await p.locator('img').count(),backgrounds:css.length};
}
async function geometry(p){
 const g=await p.evaluate(()=>{
  const m=document.getElementById('modal'),window=document.querySelector('.checkin-window'),r=m.getBoundingClientRect();
  const outside=[...window.querySelectorAll('button,svg,b,small,p,img')].filter(e=>{
   if(e.classList.contains('checkin-bow'))return false;const b=e.getBoundingClientRect();return b.width&&b.height&&(b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1);
  }).map(e=>({tag:e.tagName,cls:e.className?.baseVal||e.className,text:e.textContent.slice(0,30),rect:e.getBoundingClientRect().toJSON()}));
  const textOverlap=[];
  window.querySelectorAll('.checkin-day,.checkin-stage,.checkin-claim').forEach(e=>{
   const children=[...e.children].filter(n=>getComputedStyle(n).position!=='absolute');
   for(let i=1;i<children.length;i++){const a=children[i-1].getBoundingClientRect(),b=children[i].getBoundingClientRect();if(a.bottom>b.top+1)textOverlap.push(e.className);}
  });
  const sections=[...window.children].filter(e=>e.tagName!=='IMG');
  for(let i=1;i<sections.length;i++){
   const prev=sections[i-1],next=sections[i].getBoundingClientRect();
   const children=[prev,...prev.querySelectorAll('*')].filter(e=>getComputedStyle(e).position!=='absolute');
   if(children.some(e=>e.getBoundingClientRect().bottom>next.top+1))textOverlap.push(prev.className+' overlaps '+sections[i].className);
  }
  return {bounds:r.toJSON(),viewport:{width:innerWidth,height:innerHeight},scroll:m.scrollHeight>m.clientHeight+1,outside,textOverlap,close:document.querySelector('.checkin-close').getBoundingClientRect().toJSON()};
 });
 assert.ok(g.bounds.x>=0&&g.bounds.y>=0);assert.ok(g.bounds.right<=g.viewport.width&&g.bounds.bottom<=g.viewport.height);
 assert.ok(Math.abs(g.bounds.height/g.bounds.width-1.5)<.01);assert.equal(g.scroll,false);assert.deepEqual(g.outside,[]);assert.deepEqual(g.textOverlap,[]);assert.ok(g.close.width>=44);
 return g;
}
async function phone(width,height,url=local){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,timezoneId:'Asia/Shanghai'});
 const p=await context.newPage(),errors=[],bad=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()});});
 await p.goto(url,{waitUntil:'domcontentloaded'});await ready(p);
 assert.equal(await p.locator('.login-brand h1').textContent(),'时尚街区');
 await p.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=2&&v.videoWidth>0;},{timeout:8000});
 await images(p);
 await p.getByRole('button',{name:/点击开始/}).tap();await p.waitForSelector('#modal.checkin-dialog[open]');
 const g=await geometry(p);await images(p);
 assert.equal((await p.evaluate(()=>loopApp.signinSnapshot())).days.length,1);
 await p.screenshot({path:path.join(out,`${width}x${height}-signin.png`)});
 await p.getByRole('button',{name:'推荐活动',exact:true}).tap();await geometry(p);await p.getByRole('button',{name:'每日签到',exact:true}).tap();
 await p.getByRole('button',{name:'关闭签到',exact:true}).tap();assert.equal(await p.locator('#modal').evaluate(e=>e.open),false);
 // Real touch buttons close and reopen the dialog, then keyboard/platform close.
 await p.locator('[data-action="daily"]').first().tap();await p.waitForSelector('#modal[open]');await p.keyboard.press('Escape');
 assert.equal(await p.locator('#modal').evaluate(e=>e.open),false);
 const views=[];
 for(const view of ['map','work','customer','catalog','contest','profile','community','home','ranking']){
  await p.evaluate(v=>loopApp.navigate(v),view);await delay(140);
  const assets=await images(p);
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${view} horizontal overflow`);
  if(['map','work','catalog','profile','community'].includes(view)&&[390,1080].includes(width))await p.screenshot({path:path.join(out,`${width}x${height}-${view}.png`)});
  views.push({view,...assets});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 record(`Mobile ${width}x${height} ${url.startsWith('file:')?'file':'HTTP'}: login video, sign-in bounds/close, nine views`,{geometry:g,views});
 await context.close();
}
async function boot(){
 const p=await browser.newPage({viewport:{width:390,height:844}});
 let release;const gate=new Promise(r=>release=r);
 await p.route('**/fashion-studio-mobile-trial-v51-runtime.js',async route=>{await gate;await route.continue();});
 const navigation=p.goto(web,{waitUntil:'load'});navigation.catch(()=>{});
 await p.locator('#boot-splash').waitFor({state:'visible'});
 const firstValue=Number((await p.locator('#boot-progress-value').textContent()).replace('%',''));assert.ok(firstValue>=1&&firstValue<=4);
 const first=await p.locator('.boot-progress-live').evaluate(e=>getComputedStyle(e).transform);await delay(220);
 const second=await p.locator('.boot-progress-live').evaluate(e=>getComputedStyle(e).transform);assert.notEqual(first,second);
 await p.screenshot({path:path.join(out,'delayed-runtime-boot.png')});
 release();await navigation;await ready(p);assert.equal(await p.evaluate(()=>FashionBoot.state.error),null);record('First-paint logo and animated loading while runtime is delayed');await p.close();
 const slow=await browser.newPage({viewport:{width:360,height:640},hasTouch:true,isMobile:true});
 await slow.route('**/fashion-studio-mobile-trial-v51.css',async route=>{await delay(900);await route.continue();});
 await slow.goto(web,{waitUntil:'domcontentloaded'});await ready(slow);
 await slow.getByRole('button',{name:/点击开始/}).tap();await slow.waitForSelector('#modal.checkin-dialog[open]');await geometry(slow);
 await slow.getByRole('button',{name:'关闭签到',exact:true}).tap();await images(slow);
 record('Slow stylesheet still keeps the loader visible and initializes scene layout correctly');await slow.close();
 for(const [pattern,label] of [['**/fashion-studio-mobile-trial-v51-runtime.js','script'],['**/assets/mall-floor-v30.webp','scene']]){
  const q=await browser.newPage({viewport:{width:390,height:844}});await q.route(pattern,r=>r.abort());await q.goto(web,{waitUntil:'domcontentloaded'});
  await q.locator('.boot-failed').waitFor();await q.getByRole('button',{name:'重新加载'}).waitFor({state:'visible'});assert.ok(await q.locator('#boot-status').textContent());record('Missing '+label+' produces visible recovery screen');await q.close();
 }
 const response=await fetch('http://127.0.0.1:8138/assets/fashion-magazine-opening.mp4',{headers:{Range:'bytes=0-1023'}});
 assert.equal(response.status,206);assert.equal(response.headers.get('content-type'),'video/mp4');assert.equal((await response.arrayBuffer()).byteLength,1024);record('Video MIME type and byte-range streaming');
}
async function calendar(){
 const context=await browser.newContext({viewport:{width:360,height:640},hasTouch:true,isMobile:true,timezoneId:'Asia/Shanghai'});
 const p=await context.newPage();await p.clock.setFixedTime(new Date('2026-08-16T12:00:00+08:00'));
 await p.addInitScript(()=>{localStorage.setItem('fashion.loop.signin.v1',JSON.stringify({version:1,month:'2026-08',days:[1,2,3,4,5,6,7,8,9],makeupUsed:0,lifetimeDays:9,milestones:[2,7],lifetimeClaims:[]}));});
 await p.goto(local);await ready(p);await p.getByRole('button',{name:/点击开始/}).tap();await p.waitForSelector('#modal.checkin-dialog[open]');
 await geometry(p);assert.equal(await p.locator('.checkin-days').evaluate(e=>getComputedStyle(e).gridTemplateRows.split(' ').length),6);
 const dates=await p.locator('.checkin-day').count();assert.equal(dates,31);
 const first=await p.locator('.checkin-day').first().boundingBox(),heading=await p.locator('.checkin-days').boundingBox();assert.ok(first.x>heading.x+heading.width*.8,'August 1 should be in Saturday column');
 assert.equal(await p.locator('.checkin-day[data-day="17"]').isDisabled(),true);
 const balance=await p.evaluate(()=>loopApp.game.state.vouchers);
 await p.locator('[data-action="signin-history-claim"]').tap();assert.equal(await p.evaluate(()=>loopApp.game.state.vouchers),balance+50);
 assert.equal(await p.locator('[data-action="signin-history-claim"]').isDisabled(),true);
 await p.locator('.checkin-day[data-day="10"]').tap();assert.match(await p.locator('.checkin-claim').textContent(),/补签第10天/);
 const coins=await p.evaluate(()=>loopApp.game.state.coins);await p.locator('.checkin-claim').tap();
 assert.equal(await p.evaluate(()=>loopApp.game.state.coins),coins+900);assert.equal(await p.evaluate(()=>loopApp.signinSnapshot().makeupUsed),1);
 await p.screenshot({path:path.join(out,'six-week-calendar.png')});
 // Remove the seeding init script by testing persistence in a second page of the
 // same isolated browser context (it never touches the user's real save).
 const q=await context.newPage();await q.clock.setFixedTime(new Date('2026-08-16T12:00:00+08:00'));
 await q.goto(local);await ready(q);
 assert.equal(await q.evaluate(()=>loopApp.signinSnapshot().makeupUsed),1);
 assert.deepEqual(await q.evaluate(()=>loopApp.signinSnapshot().lifetimeClaims),[10]);
 const saved=await q.evaluate(()=>({coins:loopApp.game.state.coins,vouchers:loopApp.game.state.vouchers,signin:loopApp.signinSnapshot()}));
 await q.getByRole('button',{name:/点击开始/}).tap();await q.waitForSelector('#modal.checkin-dialog[open]');
 assert.deepEqual(await q.evaluate(()=>({coins:loopApp.game.state.coins,vouchers:loopApp.game.state.vouchers,signin:loopApp.signinSnapshot()})),saved);
 await q.clock.setFixedTime(new Date('2026-09-01T12:00:00+08:00'));await q.evaluate(()=>loopApp.openSignin());
 const after=await q.evaluate(()=>loopApp.signinSnapshot());assert.equal(after.month,'2026-09');assert.deepEqual(after.days,[]);assert.equal(after.lifetimeDays,saved.signin.lifetimeDays);assert.deepEqual(after.lifetimeClaims,[10]);
 record('Six-week month, correct weekday alignment, future disabled, auto sign-in once, makeup reward, history reward once, persistence and month rollover');
 await context.close();
}
async function allAssets(){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'fashion-studio-mobile-trial-v51-manifest.json'),'utf8'));
 const p=await browser.newPage();await p.goto(web);await ready(p);
 const names=manifest.assets.map(x=>x.name).filter(x=>/\.(png|webp)$/.test(x));
 const checked=await p.evaluate(async names=>{
  const results=[];let index=0;
  async function worker(){while(index<names.length){const name=names[index++];const result=await new Promise(resolve=>{const image=new Image();image.onload=()=>resolve({name,ok:image.naturalWidth>0});image.onerror=()=>resolve({name,ok:false});image.src='assets/'+name;});results.push(result);}}
  await Promise.all(Array.from({length:4},worker));return results;
 },names);assert.deepEqual(checked.filter(x=>!x.ok),[]);
 for(const name of manifest.assets.map(x=>x.name)){
  const response=await fetch('http://127.0.0.1:8138/assets/'+name);assert.equal(response.status,200,name);assert.equal(Number(response.headers.get('content-length')),manifest.assets.find(x=>x.name===name).size,name);
 }
 record(`All ${manifest.assets.length} assets present; ${checked.length} raster files decoded successfully`);await p.close();
}
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 try{
  await boot();
  for(const [w,h] of [[320,568],[360,640],[390,844],[430,932],[1080,1920]])await phone(w,h);
  await phone(390,844,web);await calendar();await allAssets();
  if(fs.existsSync(path.join(root,'pack-test/v51-signed-apk/index.html')))await phone(360,640,packaged);
  report.pass=true;
 }finally{await browser.close();fs.writeFileSync(path.join(__dirname,'v51-results.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
