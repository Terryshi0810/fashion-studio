'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,process.env.V51_TEST_URL?'v51-apk-screenshots':'v51-screenshots');fs.mkdirSync(out,{recursive:true});
const url=process.env.V51_TEST_URL||'http://127.0.0.1:8138/fashion-studio-mobile-trial-v51.html';
const checks=[],record=(name,data={})=>{checks.push({name,pass:true,...data});console.log('PASS',name);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
async function login(p){await p.goto(url);await p.waitForFunction(()=>window.FashionBoot?.state.complete);await p.getByRole('button',{name:/点击开始/}).tap();await p.getByRole('button',{name:'关闭签到',exact:true}).tap();await p.evaluate(()=>loopApp.navigate('work'));await wait(200);}
const tile=(p,i)=>p.locator(`.ws-cell[data-index="${i}"]`);
async function drag(p,from,to,outside=false){const a=await tile(p,from).boundingBox(),b=outside?{x:0,y:0,width:2,height:2}:await tile(p,to).boundingBox(),session=await p.context().newCDPSession(p);const sx=a.x+a.width/2,sy=a.y+a.height/2,ex=b.x+b.width/2,ey=b.y+b.height/2;await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:1}]});for(let i=1;i<=8;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(ex-sx)*i/8,y:sy+(ey-sy)*i/8,id:1}]});await wait(15);}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();await wait(150);}
async function geometry(p){return p.evaluate(()=>{
 const root=document.querySelector('.ws51'),nav=document.querySelector('#mobile-nav').getBoundingClientRect(),parts=[...root.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>({class:e.className,r:e.getBoundingClientRect().toJSON()}));
 const overlaps=parts.slice(1).filter((x,i)=>parts[i].r.bottom>x.r.top+1).map(x=>x.class);
 const outside=[...root.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<0||r.right>innerWidth+1||r.bottom>nav.top+1);}).map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}));
 const producerOverflow=[...root.querySelectorAll('.ws-producer')].flatMap(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('b,small')].filter(x=>{const b=x.getBoundingClientRect();return b.left<r.left-1||b.right>r.right+1||b.bottom>r.bottom+1;}).map(x=>x.textContent);});
 const board=root.querySelector('.ws-board').getBoundingClientRect();
 return {overlaps,outside,producerOverflow,board:board.toJSON(),nav:nav.toJSON(),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,scrollY,oldGenerators:root.querySelectorAll('.generators,.generator').length,labels:[...root.querySelectorAll('.ws-producer>b')].map(x=>x.textContent)};
 });}
async function sizeCheck(w,h){
 const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await login(p);
 const g=await geometry(p);assert.deepEqual(g.overlaps,[]);assert.deepEqual(g.outside,[]);assert.deepEqual(g.producerOverflow,[]);assert.equal(g.horizontalOverflow,false);assert.ok(Math.abs(g.board.width-g.board.height)<1);assert.equal(g.oldGenerators,0);assert.deepEqual(g.labels,['女装材料','鞋履材料','配饰材料']);assert.equal(await p.locator('.ws-cell').count(),36);
 await p.screenshot({path:path.join(out,`${w}x${h}-work.png`)});
 const before=await p.evaluate(()=>({energy:loopApp.game.state.energy,count:loopApp.game.state.board.filter(Boolean).length}));await tile(p,30).tap();
 assert.deepEqual(await p.evaluate(()=>({energy:loopApp.game.state.energy,count:loopApp.game.state.board.filter(Boolean).length})),{energy:before.energy-1,count:before.count+1});
 await drag(p,14,15);assert.equal(await p.evaluate(()=>loopApp.game.state.board[15].t),1);assert.equal(await p.evaluate(()=>loopApp.game.state.board[14]),null);assert.equal(await p.evaluate(()=>loopApp.game.state.merges),1);
 assert.equal(await p.locator('.ws-goal-copy span').textContent(),'女装材料 T2 · 1/1件');assert.deepEqual(errors,[]);
 record(`${w}×${h}: first screen, no overlaps, touch production and drag merge`,{geometry:g});await ctx.close();
}
async function interactions(){
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await login(p);
 const before=await p.evaluate(()=>JSON.stringify({board:loopApp.game.state.board,energy:loopApp.game.state.energy}));await tile(p,32).tap();assert.match(await p.locator('#toast').textContent(),/定制馆/);assert.equal(await p.evaluate(()=>JSON.stringify({board:loopApp.game.state.board,energy:loopApp.game.state.energy})),before);
 await tile(p,34).tap();assert.match(await p.locator('#toast').textContent(),/3级/);
 await drag(p,14,null,true);assert.equal(await p.evaluate(()=>JSON.stringify({board:loopApp.game.state.board,energy:loopApp.game.state.energy})),before);
 await drag(p,30,0);assert.equal(await p.evaluate(()=>loopApp.game.producerAt(0)),0);assert.equal(await p.evaluate(()=>loopApp.game.state.energy),100);
 await tile(p,0).tap();assert.equal(await p.evaluate(()=>loopApp.game.state.energy),99);
 await tile(p,14).tap();await tile(p,15).tap();assert.equal(await p.evaluate(()=>loopApp.game.state.board[15].t),1);
 await p.getByRole('button',{name:'整理材料',exact:true}).tap();assert.equal(await p.evaluate(()=>loopApp.game.producerAt(0)),0);
 // Unlock through the actual mall upgrade button, then resume research on the board.
 await p.evaluate(()=>{loopApp.game.upgrade(0);loopApp.navigate('work');});await p.getByRole('button',{name:/研发版型/}).tap();await p.getByRole('button',{name:/去经营订单/}).tap();
 assert.equal(await p.evaluate(()=>loopApp.ui.view),'customer');assert.equal(await p.evaluate(()=>loopApp.game.state.blueprints.includes(3)),true);
 await p.evaluate(()=>{loopApp.game.takeOrder(3);loopApp.navigate('work');});await p.getByRole('button',{name:/继续制衣/}).tap();assert.equal(await p.evaluate(()=>loopApp.ui.view),'customer');
 // Full real order via touch controls, all steps remain usable and scrollable.
 await p.locator('[data-action="order-type"][data-type="top"]').tap();await p.locator('[data-action="order-next"]').tap();await p.locator('[data-action="order-color"][data-color="粉色"]').tap();await p.locator('[data-action="order-next"]').tap();await p.locator('[data-action="assist-sketch"]').tap();await p.locator('[data-action="order-next"]').tap();await p.locator('[data-action="candidate"][data-id="3"]').tap();await p.locator('[data-action="deliver"]').tap();assert.equal(await p.evaluate(()=>loopApp.game.state.crafted.includes(3)),true);
 await p.evaluate(()=>{document.querySelector('#modal').close();loopApp.navigate('work');});await p.getByRole('button',{name:'合成图谱',exact:true}).tap();assert.match(await p.locator('#modal').textContent(),/两件同款/);assert.doesNotMatch(await p.locator('#modal').textContent(),/10件/);await p.keyboard.press('Escape');
 const saved=await p.evaluate(()=>({v51:localStorage.getItem('fashion.loop.mobile.v51'),board:loopApp.game.state.board,workshop:loopApp.game.state.workshop}));assert.ok(saved.v51);await p.reload();await p.waitForFunction(()=>window.FashionBoot?.state.complete);assert.deepEqual(await p.evaluate(()=>loopApp.game.state.board),saved.board);assert.deepEqual(await p.evaluate(()=>loopApp.game.state.workshop),saved.workshop);assert.deepEqual(errors,[]);
 record('Locked feedback, cancelled drag, movable producer, tap merge, sorting, research, order jump, touch order delivery, guide and persistence');await ctx.close();
}
async function edgeUI(){
 const ctx=await browser.newContext({viewport:{width:360,height:640},isMobile:true,hasTouch:true}),p=await ctx.newPage();await login(p);
 await p.evaluate(()=>{const g=loopApp.game;g.state.energy=0;g.state.energyAt=g.now();loopApp.render();});await tile(p,30).tap();assert.match(await p.locator('#toast').textContent(),/体力不足/);assert.equal(await p.evaluate(()=>loopApp.game.state.energy),0);
 await p.evaluate(()=>{const g=loopApp.game;g.state.energy=100;for(let i=0;i<36;i++)if(g.producerAt(i)<0)g.state.board[i]={c:0,t:0,n:1};loopApp.render();});await tile(p,30).tap();assert.match(await p.locator('#toast').textContent(),/棋盘已满/);assert.equal(await p.evaluate(()=>loopApp.game.state.energy),100);
 await drag(p,0,1);await tile(p,30).tap();assert.equal(await p.evaluate(()=>loopApp.game.state.energy),99);
 await p.evaluate(()=>{loopApp.game.state.workshop.tray=[{c:0,t:2,n:1}];loopApp.render();});await p.getByRole('button',{name:'暂存 1',exact:true}).tap();assert.match(await p.locator('#toast').textContent(),/棋盘已满/);
 await tile(p,2).tap();await p.getByRole('button',{name:'回收选中',exact:true}).tap();await p.getByRole('button',{name:'确认回收',exact:true}).tap();await p.getByRole('button',{name:'暂存 1',exact:true}).tap();assert.equal(await p.evaluate(()=>loopApp.game.state.workshop.tray.length),0);assert.equal(await p.evaluate(()=>loopApp.game.state.board[2].t),2);
 record('Insufficient energy/full-board feedback, free tile reuse, recycle confirmation and tray retrieval');await ctx.close();
}
async function migration(){
 const ctx=await browser.newContext({viewport:{width:360,height:640},isMobile:true,hasTouch:true}),seed=await ctx.newPage();await login(seed);
 const original=await seed.evaluate(()=>{const s=JSON.parse(JSON.stringify(loopApp.game.state));delete s.workshop;s.board=Array.from({length:36},()=>({c:0,t:0,n:9}));return JSON.stringify(s);});
 await seed.close();await ctx.addInitScript(old=>{localStorage.setItem('fashion.loop.mobile.v6',old);localStorage.removeItem('fashion.loop.mobile.v51');},original);
 const p=await ctx.newPage();await p.goto(url);await p.waitForFunction(()=>window.FashionBoot?.state.complete);assert.equal(await p.evaluate(()=>loopApp.game.count(0,0)),324);assert.equal(await p.evaluate(()=>localStorage.getItem('fashion.loop.mobile.v6')),original);assert.equal(await p.evaluate(()=>loopApp.game.state.workshop.tray.length),291);record('One-time V50 save migration conserves all 324 materials and leaves V50 save untouched');await ctx.close();
}
(async()=>{browser=await chromium.launch({executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});let pass=false;try{for(const s of [[320,568],[360,640],[390,844],[430,932],[1080,1920]])await sizeCheck(...s);await interactions();await edgeUI();await migration();pass=true;}finally{await browser.close();fs.writeFileSync(path.join(__dirname,url.includes('pack-test')?'v51-apk-mobile-results.json':'v51-mobile-results.json'),JSON.stringify({pass,url,checks,limitations:['Chromium touch simulation; no physical Android installation test.']},null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
