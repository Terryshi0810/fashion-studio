'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname,mobile=path.join(root,'mobile');fs.mkdirSync(mobile,{recursive:true});
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
// Promote phone rules and remove all desktop layout breakpoints.
function phoneStyles(source){
 let base='',phone='',pos=0;const media=/@media[^{}]+\{/g;let match;
 while((match=media.exec(source))){base+=source.slice(pos,match.index);let depth=1,end=media.lastIndex;while(depth&&end<source.length){if(source[end]==='{')depth++;else if(source[end]==='}')depth--;end++;}const inside=source.slice(media.lastIndex,end-1),header=match[0];if(/max-width:\s*700px/.test(header))phone+=inside+'\n';else if(/prefers-reduced-motion/.test(header))base+=source.slice(match.index,end);pos=end;media.lastIndex=end;}
 return base+source.slice(pos)+'\n'+phone+'\n'+read('mobile-overrides.css');
}
let css=phoneStyles(read('styles.css')).replaceAll('assets/','../assets/');
let html=read('index.html');
html=html.replace(/<aside class="sidebar"[\s\S]*?<\/aside>/,'').replace(/<footer class="desktop-footer"[\s\S]*?<\/footer>/,'');
const nav='<nav id="mobile-nav" class="mobile-nav" aria-label="底部导航"></nav>';
if(!html.includes(nav))throw new Error('Source navigation changed; review mobile build.');
html=html.replace(nav,'').replace('<main id="main" tabindex="-1"></main>','<main id="main" tabindex="-1"></main>'+nav);
html=html.replace('<body>','<body class="phone-demo"><div class="portrait-preview-label"><b>时光百货</b>手机竖屏试玩<small><br>触屏拖拽 · 单手操作<br>在手机上打开即可全屏宽度游玩</small></div>');
html=html.replace('<title>Fashion Studio · 时光百货</title>','<title>Fashion Studio · 时光百货手机试玩</title>');
html=html.replace('<meta name="theme-color" content="#faf6ef">','<meta name="theme-color" content="#faf6ef"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="时光百货">');
html=html.replace('src="core.js"','src="../core.js"').replaceAll('assets/','../assets/');
let code=read('app.js');
code=code.replace(`$('#desktop-nav').innerHTML = html;`,`const desktop=$('#desktop-nav');if(desktop)desktop.innerHTML = html;`);
code=code.replace(`$('#save-status').textContent = storageError ? '自动保存不可用，请手动导出存档' : '进度已自动保存 · 此浏览器专属';\n  $('#save-status').classList.toggle('no-saved', storageError);`,`const status=$('#save-status');if(status){status.textContent=storageError?'自动保存不可用，请手动导出存档':'进度已自动保存';status.classList.toggle('no-saved',storageError);}`);
code=code.replace('function renderHud() {\n  const s = game.state;','function renderHud() {\n  const s = game.state;\n  $(".player").dataset.level = "LV" + s.level;');
code=code.replace(`$('#hud-coins').textContent = s.coins.toLocaleString('zh-CN'); $('#hud-gems').textContent = s.gems.toLocaleString('zh-CN');`,`const compact=n=>n>=10000?(n/10000).toFixed(1).replace(/\\.0$/,'')+'万':n.toLocaleString('zh-CN');$('#hud-coins').textContent=compact(s.coins);$('#hud-gems').textContent=compact(s.gems);$('.resource.coins').setAttribute('aria-label',s.coins+' 金币，打开商店');$('.resource.gems').setAttribute('aria-label',s.gems+' 钻石，打开图鉴');`);
code=code.replace("if (changed) window.scrollTo({ top: 0, behavior: 'instant' });","if (changed) $('#main').scrollTo({ top: 0, behavior: 'instant' });");
code=code.replace('function render() { renderHud();',"function render() { $('#main').dataset.view=ui.view; renderHud();");
code=code.replace("'让旧时光，重新闪耀。'","'时光百货'");
code=code.replaceAll('assets/','../assets/');
fs.writeFileSync(path.join(mobile,'index.html'),html);fs.writeFileSync(path.join(mobile,'styles.css'),css);fs.writeFileSync(path.join(mobile,'app.js'),code);
// Embed every original asset once. Blob URLs also keep CSS variables short.
const assets={};let embeddedCss=css,embeddedCode=read('core.js')+'\n'+code;
for(const name of ['department-store.png','fashion-items.png','designer.png']){
 assets[name]='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets',name)).toString('base64');
 embeddedCss=embeddedCss.replaceAll(`url('../assets/${name}')`,`var(--fs-${name.replace('.png','')})`);
 embeddedCode=embeddedCode.replaceAll('../assets/'+name,'${__fsAssets["'+name+'"]}');
}
let standalone=html.replace('../assets/favicon.svg','data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'assets/favicon.svg')).toString('base64'));
standalone=standalone.replace('<link rel="stylesheet" href="styles.css">','<style>'+embeddedCss+'</style>').replace(/<script defer src="(?:\.\.\/core|app)\.js"><\/script>/g,'');
const registry='const __fsEncoded='+JSON.stringify(assets)+';const __fsAssets={};Object.entries(__fsEncoded).forEach(([name,data])=>{const bytes=Uint8Array.from(atob(data.split(",")[1]),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:"image/png"}));__fsAssets[name]=url;document.documentElement.style.setProperty("--fs-"+name.replace(".png",""),"url("+url+")");});\n';
standalone=standalone.replace('</body>','<script>'+(registry+embeddedCode).replace(/<\/script/gi,'<\\/script')+'</script></body>');
const out=path.join(root,'fashion-studio-demo-mobile-v3.html');fs.writeFileSync(out,standalone);
console.log('Mobile source:',mobile);console.log('Offline mobile demo:',out,fs.statSync(out).size+' bytes');
