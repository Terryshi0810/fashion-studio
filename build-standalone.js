'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
let code=fs.readFileSync(path.join(root,'core.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'app.js'),'utf8');
const assets={};
for(const name of ['department-store.png','fashion-items.png','designer.png']){
 assets[name]='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets',name)).toString('base64');
 css=css.replaceAll(`url('assets/${name}')`,`var(--fs-${name.replace('.png','')})`);
 code=code.replaceAll('assets/'+name,'${__fsAssets["'+name+'"]}');
}
html=html.replace('assets/favicon.svg','data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'assets/favicon.svg')).toString('base64'));
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>');
html=html.replace(/<script defer src="(?:core|app)\.js"><\/script>/g,'');
const registry='const __fsEncoded='+JSON.stringify(assets)+';const __fsAssets={};Object.entries(__fsEncoded).forEach(([name,data])=>{const bytes=Uint8Array.from(atob(data.split(",")[1]),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:"image/png"}));__fsAssets[name]=url;document.documentElement.style.setProperty("--fs-"+name.replace(".png",""),"url("+url+")");});\n';
html=html.replace('</body>','<script>'+(registry+code).replace(/<\/script/gi,'<\\/script')+'</script></body>');
const out=path.join(root,'fashion-studio-demo-v2.html');fs.writeFileSync(out,html);
console.log('Built offline single-file demo:',out,fs.statSync(out).size+' bytes');
