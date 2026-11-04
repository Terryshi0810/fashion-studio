'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const h=require('./v56-ui.cjs'),checks=[];
async function run(){
 const server=await h.startServer(8142),browser=await chromium.launch({executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 try{
  for(const [width,height] of [[390,844],[430,932]]){
   const context=await h.seedContext(browser,width,height),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await h.login(page,'http://127.0.0.1:8142/pack-test/v56-signed-apk/index.html');await h.loadedImages(page);await h.portraitsFit(page);await h.headerFits(page);
   const g=await h.geometry(page);assert.deepEqual(g.broken,[]);assert.deepEqual(g.overlap,[]);assert.deepEqual(g.outside,[]);
   for(let i=0;i<5;i++){
    await page.locator('.a52-cell[data-family="styling"]').tap();await h.modalFits(page);assert.equal(await page.locator('[data-action="a52-unlock"]').isDisabled(),true);
    await page.getByRole('button',{name:'关闭详情',exact:true}).tap();assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);
   }
   await page.screenshot({path:path.join(__dirname,'v56-screenshots',width+'-signed-apk.png')});assert.deepEqual(errors,[]);checks.push({name:width+'×'+height+' signed APK startup, portraits, geometry and 5 repeated touch open/close cycles',pass:true});await context.close();
  }
  fs.writeFileSync(path.join(__dirname,'v56-package-results.json'),JSON.stringify({pass:true,checks,deviceInstallTest:false},null,2));console.log('PASS signed APK mobile resource and touch regressions');
 }finally{await browser.close();server.kill();}
}
run().catch(error=>{fs.writeFileSync(path.join(__dirname,'v56-package-results.json'),JSON.stringify({pass:false,checks,error:String(error.stack||error)},null,2));console.error(error);process.exitCode=1;});
