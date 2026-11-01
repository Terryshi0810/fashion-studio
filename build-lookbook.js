'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=__dirname,mobile=path.join(root,'mobile'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const oldPath=path.join(root,'fashion-studio-demo-mobile-v3.html'),previous=fs.readFileSync(oldPath);
cp.execFileSync(process.execPath,[path.join(root,'build-mobile.js')],{cwd:root,stdio:'pipe'});fs.writeFileSync(oldPath,previous);
let html=fs.readFileSync(path.join(mobile,'index.html'),'utf8');let css=fs.readFileSync(path.join(mobile,'styles.css'),'utf8')+'\n'+read('lookbook.css');let code=fs.readFileSync(path.join(mobile,'app.js'),'utf8');
code=code.replace('catalog:renderCatalog','catalog:()=>lookbook.render()');
code=code.replace('renderClocks(); }\nfunction renderClocks()', 'renderClocks(); lookbook.afterRender(ui.view); }\nfunction renderClocks()');
code=code.replace('const changed = ui.view !== view; ui.view = view;',"if(view==='catalog'&&ui.view!=='catalog')lookbook.enter(ui.view);const changed = ui.view !== view; ui.view = view;");
const hook="document.addEventListener('click',e=>{if(Date.now()<touchCompatUntil";
code=code.replace(hook,`const lookbook=FashionLookbook.create({game,icon,esc,openModal,closeModal,toast,rerender:()=>render(),navigate:v=>navigate(v)});Object.assign(actions,lookbook.actions);\n`+hook);
code=code.replace("?initial:'map'","?initial:'catalog'");
code=code.replace('window.fashionApp={game,ui,navigate};','window.fashionApp={game,ui,navigate,lookbook};');
if(!code.includes('lookbook.afterRender(ui.view)')||!code.includes('const lookbook=FashionLookbook.create'))throw new Error('Mobile integration location changed; review source');
html=html.replace('<script defer src="app.js"></script>','<script defer src="mesh-preview.js"></script><script defer src="lookbook-ui.js"></script><script defer src="app.js"></script>');
html=html.replace('时光百货手机试玩</title>','时光百货 · 时尚图鉴 V0.4</title>');
fs.writeFileSync(path.join(mobile,'index.html'),html);fs.writeFileSync(path.join(mobile,'styles.css'),css);fs.writeFileSync(path.join(mobile,'app.js'),code);fs.copyFileSync(path.join(root,'lookbook-ui.js'),path.join(mobile,'lookbook-ui.js'));fs.copyFileSync(path.join(root,'mesh-preview.js'),path.join(mobile,'mesh-preview.js'));
const assets={};let embeddedCss=css,embeddedCode=read('core.js')+'\n'+read('mesh-preview.js')+'\n'+read('lookbook-ui.js')+'\n'+code;
for(const name of ['department-store.png','fashion-items.png','designer.png','lookbook-bridal.png','lookbook-models.png','lookbook-items.png']){
 assets[name]='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets',name)).toString('base64');
 embeddedCss=embeddedCss.replaceAll(`url('../assets/${name}')`,`var(--fs-${name.replace('.png','')})`);
 // Static references in the existing app are inside HTML template strings. The new collection module uses the asset registry directly.
 const marker='../assets/'+name;
 embeddedCode=embeddedCode.replaceAll(marker,'${__fsAssets["'+name+'"]}');
}
let standalone=html.replace('../assets/favicon.svg','data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'assets/favicon.svg')).toString('base64'));
standalone=standalone.replace('<link rel="stylesheet" href="styles.css">','<style>'+embeddedCss+'</style>').replace(/<script defer src="(?:\.\.\/core|app|mesh-preview|lookbook-ui)\.js"><\/script>/g,'');
const registry='const __fsEncoded='+JSON.stringify(assets)+';const __fsAssets={};Object.entries(__fsEncoded).forEach(([name,data])=>{const bytes=Uint8Array.from(atob(data.split(",")[1]),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:"image/png"}));__fsAssets[name]=url;document.documentElement.style.setProperty("--fs-"+name.replace(".png",""),"url("+url+")");});globalThis.FashionAssets=__fsAssets;\n';
standalone=standalone.replace('</body>','<script>'+(registry+embeddedCode).replace(/<\/script/gi,'<\\/script')+'</script></body>');
const out=path.join(root,'fashion-studio-demo-mobile-v4.html');fs.writeFileSync(out,standalone);console.log('V0.4 fashion collection:',out,fs.statSync(out).size+' bytes');console.log('V0.3 preserved:',crypto.createHash('sha256').update(previous).digest('hex')===crypto.createHash('sha256').update(fs.readFileSync(oldPath)).digest('hex'));
