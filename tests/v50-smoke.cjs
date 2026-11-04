'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.join(__dirname,'v50-screenshots');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  p.on('pageerror',e=>console.log('ERROR',e.message));p.on('requestfailed',r=>console.log('FAILED',r.url(),r.failure()));
  await p.goto('file:///D:/garden/fashion-studio/fashion-studio-mobile-trial-v50.html',{waitUntil:'domcontentloaded'});
  await p.screenshot({path:path.join(out,'boot.png')});
  await p.waitForFunction(()=>window.FashionBoot?.state.complete,{timeout:12000});
  await p.waitForTimeout(450);
  await p.screenshot({path:path.join(out,'login.png')});
  await p.getByRole('button',{name:/点击开始/}).tap();
  await p.waitForSelector('#modal.checkin-dialog[open]');
  await p.waitForTimeout(200);
  await p.screenshot({path:path.join(out,'signin.png')});
  console.log(await p.evaluate(()=>({boot:FashionBoot.state,dialog:document.querySelector('#modal').getBoundingClientRect().toJSON(),window:document.querySelector('.checkin-window').getBoundingClientRect().toJSON(),close:document.querySelector('.checkin-close').getBoundingClientRect().toJSON(),images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),snapshot:loopApp.signinSnapshot()})));
  await p.getByRole('button',{name:'关闭签到',exact:true}).tap();
  console.log('closed',await p.locator('#modal').evaluate(e=>!e.open));
  await p.screenshot({path:path.join(out,'map.png')});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
