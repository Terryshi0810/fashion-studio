'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8'),write=(n,s)=>fs.writeFileSync(path.join(root,n),s,'utf8');
function once(s,from,to){if(s.split(from).length!==2)throw new Error('Expected exactly one match: '+from.slice(0,100));return s.replace(from,to);}
let html=read('fashion-studio-mobile-trial-v48.html'),runtime=read('fashion-studio-mobile-trial-v48-runtime.js');
// Keep old exports untouched. One relative layout is shared by file preview,
// HTTP preview and Android: index, runtime, stylesheet, assets/<filename>.
runtime=once(runtime,'(location.pathname.startsWith("/android_asset/")?n:"assets/"+n)','"assets/"+n');
runtime=runtime.replaceAll('fashion-studio-mobile-trial-v48','fashion-studio-mobile-trial-v50').replaceAll('V0.30 · MOBILE TRIAL','V0.50 · MOBILE TRIAL').replaceAll('时光街区','时尚街区');
runtime=once(runtime,"modal.classList.remove('community-chat-modal','signin-dialog')","modal.classList.remove('community-chat-modal','signin-dialog','checkin-dialog')");
// Replace the obsolete render function rather than layering more CSS on it.
const baseStart=runtime.indexOf('function renderSigninModalBase()'),baseEnd=runtime.indexOf('function openSigninModal()',baseStart);
if(baseStart<0||baseEnd<0)throw new Error('Missing sign-in base');
runtime=runtime.slice(0,baseStart)+runtime.slice(baseEnd);
const overrideStart=runtime.indexOf('function renderSigninModal(){',runtime.indexOf("let signinTabV30='signin'"));
const overrideEnd=runtime.indexOf("actions['signin-tab']",overrideStart);
if(overrideStart<0||overrideEnd<0)throw new Error('Missing sign-in overrides');
runtime=runtime.slice(0,overrideStart)+read('v50/checkin.js')+'\n'+runtime.slice(overrideEnd);
const oldBoot='renderLoginScreen();render();save();bootProgressCompleteV44();setTimeout(()=>document.getElementById("boot-splash")?.classList.add("is-ready"),700);setTimeout(()=>document.getElementById("boot-splash")?.remove(),1180);';
runtime=once(runtime,oldBoot,`renderLoginScreen();render();save();window.FashionBoot.ready(['community-city-v1.webp','mall-mobile.webp','mall-floor-v30.webp','boutique-interior-v1.webp','boutique-people-atlas-v1.webp','model-0.webp','item-00.webp','workbench-shine-background.png','profile-dressing-room-v1.webp','signin-bow-v50.png'].map(asset),render);`);
runtime=once(runtime,'notifications:noticeState,audio:', 'notifications:noticeState,signinSnapshot:()=>JSON.parse(JSON.stringify(signinState)),audio:');
// Extract historical style layers, loading them asynchronously so a visible
// self-contained splash can paint before the full app stylesheet arrives.
const styles=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const bootCSS=styles.slice(styles.indexOf('#boot-splash{'),styles.indexOf('/* V43:'))+'\n'+styles.slice(styles.indexOf('/* V44:'),styles.indexOf('/* V47:'));
const critical=`html,body{margin:0;background:#20132d}html:not([data-app-ready="true"]) .app,html:not([data-app-ready="true"]) #login-screen,html:not([data-app-ready="true"]) #mobile-nav{visibility:hidden!important}#boot-retry{margin:12px auto 0;padding:10px 22px;border:1px solid #f8c5de;border-radius:24px;background:#a65e89;color:#fff;font-size:14px}#boot-retry[hidden]{display:none}.boot-failed .boot-progress-meta{flex-direction:column;line-height:1.7}.boot-failed #boot-status{font-size:12px;letter-spacing:0;overflow-wrap:anywhere}.boot-failed .boot-progress-live{animation:none}.boot-progress-live{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from -90deg,transparent 0 24deg,#ffd7e8 42deg,#f2a9c9 92deg,transparent 118deg 360deg);-webkit-mask:radial-gradient(circle,transparent 0 87%,#000 88% 91%,transparent 92%);mask:radial-gradient(circle,transparent 0 87%,#000 88% 91%,transparent 92%);animation:boot-live-spin 1.15s linear infinite;will-change:transform}@keyframes boot-live-spin{to{transform:rotate(360deg)}}`;
html=html.replace(/<style[^>]*>[\s\S]*?<\/style>/g,'');
html=html.replace('</head>',`<style id="v50-critical-boot">${bootCSS}\n${critical}</style><link id="fashion-styles" rel="stylesheet" href="fashion-studio-mobile-trial-v50.css" media="print" onload="this.media='all';this.dataset.loaded='true'" onerror="this.dataset.failed='true'"></head>`);
html=html.replace(/<script id="v47-boot-preloader">[\s\S]*?<\/script>\\n/,`<script id="v50-boot-preloader">${read('v50/boot.js')}</script>\n`);
html=once(html,'<span>正在加载</span>','<span id="boot-status">正在读取游戏</span>');
html=once(html,'<p class="boot-caption">STYLE · STORY · CITY</p>','<p class="boot-caption">STYLE · STORY · CITY</p><button id="boot-retry" type="button" hidden>重新加载</button>');
html=html.replaceAll('fashion-studio-mobile-trial-v48-runtime.js','fashion-studio-mobile-trial-v50-runtime.js').replaceAll('V0.48','V0.50').replaceAll('时光街区','时尚街区');
write('fashion-studio-mobile-trial-v50.html',html);
// Viewport-derived units also work in WebViews predating container query units.
const checkinCss=read('v50/checkin.css')
  .replace(/@supports not \(font-size:1cqw\) \{[^}]+\}[^}]+\}[^}]+\}\s*\}/,'')
  .replace(/([\d.]+)cqw/g,(_,n)=>`calc(var(--checkin-unit) * ${n})`);
const compatibility=`#modal.checkin-dialog{--checkin-screen-height:100vh;--checkin-unit:min(calc((100vw - 24px) * .01),calc((var(--checkin-screen-height) - 40px) * .0066666667),6.8px);width:min(calc(100vw - 24px),calc((var(--checkin-screen-height) - 40px) * .6666667),680px)!important}@supports(height:100dvh){#modal.checkin-dialog{--checkin-screen-height:100dvh}}`;
write('fashion-studio-mobile-trial-v50.css',styles+'\n'+checkinCss+'\n'+compatibility);
write('fashion-studio-mobile-trial-v50-runtime.js',runtime);
const assets=fs.readdirSync(path.join(root,'assets')).filter(name=>fs.statSync(path.join(root,'assets',name)).isFile()).map(name=>{
  const bytes=fs.readFileSync(path.join(root,'assets',name));
  return {name,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
write('fashion-studio-mobile-trial-v50-manifest.json',JSON.stringify({version:'V50',layout:'assets/<name>',assets},null,2)+'\n');
console.log('Generated V50 HTML, stylesheet and runtime.');
