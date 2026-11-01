const fs = require('node:fs');
const root = 'D:/garden/fashion-studio';

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error((label || from) + ': expected 1 match, got ' + count);
  return source.replace(from, to);
}

let html = fs.readFileSync(root + '/fashion-studio-mobile-trial-v46.html', 'utf8');
let runtime = fs.readFileSync(root + '/fashion-studio-mobile-trial-v46-runtime.js', 'utf8');

// V47 keeps the same assets, but serves them as files instead of forcing the
// browser to parse a 100+ MB Base64 JavaScript literal before the first frame.
// The runtime already has a relative-assets fallback, so local preview and APK
// both use the same asset paths.
const packedStart = runtime.indexOf('globalThis.LoopAssets={};const packed=');
const packedJsonStart = packedStart + 'globalThis.LoopAssets={};const packed='.length;
const packedJsonEnd = runtime.indexOf('};for(const [name,value] of Object.entries(packed))', packedJsonStart) + 1;
if (packedStart !== 0 || packedJsonEnd <= packedJsonStart) throw new Error('packed asset block not found');
const packedAssets = JSON.parse(runtime.slice(packedJsonStart, packedJsonEnd));
const assetsDir = root + '/assets';
fs.mkdirSync(assetsDir, {recursive: true});
for (const [name, value] of Object.entries(packedAssets)) {
  fs.writeFileSync(assetsDir + '/' + name, Buffer.from(value.data, 'base64'));
}
const packedBlockEnd = runtime.indexOf('\n(function(root,factory)', packedJsonEnd);
if (packedBlockEnd < 0) throw new Error('packed asset loader end not found');
runtime = 'globalThis.LoopAssets={};' + runtime.slice(packedBlockEnd);

html = html.replaceAll('V0.46', 'V0.47');
html = replaceOnce(html, 'fashion-studio-mobile-trial-v46-runtime.js', 'fashion-studio-mobile-trial-v47-runtime.js', 'runtime script reference');
html = replaceOnce(
  html,
  '<div class="boot-progress-ring" aria-hidden="true"><svg',
  '<div class="boot-progress-ring" aria-hidden="true"><div class="boot-progress-live" aria-hidden="true"></div><svg',
  'live boot progress element'
);

const preStart = html.indexOf('<script id="v45-boot-preloader">');
const preEnd = html.indexOf('</script>', preStart);
if (preStart < 0 || preEnd < 0) throw new Error('boot preloader block not found');
const preloader = '<script id="v47-boot-preloader">(function(){const splash=document.getElementById("boot-splash"),stroke=document.getElementById("boot-progress-stroke"),label=document.getElementById("boot-progress-value");let value=1,completionStart=null,completionAt=0;const paint=n=>{value=Math.max(value,Math.min(100,Math.round(n)));if(stroke)stroke.style.strokeDashoffset=String(100-value);if(label)label.textContent=value+"%";};const complete=()=>{if(completionStart===null){completionStart=value;completionAt=performance.now();}};globalThis.__bootProgressV47=true;globalThis.__bootProgressV45=true;globalThis.__bootProgressV44={paint,complete};paint(1);const started=performance.now();const tick=()=>{if(!splash?.isConnected)return;let target;if(completionStart!==null){const t=Math.min(1,(performance.now()-completionAt)/680);target=completionStart+(100-completionStart)*t;}else{const elapsed=performance.now()-started;const t=elapsed/1000;target=Math.min(96,1+95*(1-Math.exp(-1.15*t)));}paint(target);if(value<100)requestAnimationFrame(tick);};requestAnimationFrame(tick);})();</script>';
html = html.slice(0, preStart) + preloader + html.slice(preEnd + 9);

const css = [
  '<style id="v47-workbench-scroll-loading">',
  '/* V47: workbench uses one predictable mobile scroll owner; bottom controls clear the fixed navigation. */',
  '@media (max-width:720px), (min-width:900px) and (max-aspect-ratio:3/4){',
  '  html,body{width:100%;min-width:0;}',
  '  body[data-view="work"]{height:auto;min-height:100dvh;overflow-x:hidden;overflow-y:visible;}',
  '  body[data-view="work"] .app{height:auto;min-height:100dvh;display:block!important;}',
  '  body[data-view="work"] .main{height:auto;min-height:100dvh;display:block!important;padding-bottom:0!important;}',
  '  body[data-view="work"] .topbar{height:auto;min-height:68px;}',
  '  body[data-view="work"] #view{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;-webkit-overflow-scrolling:auto;overscroll-behavior-y:auto;scroll-behavior:auto;padding-bottom:0!important;scroll-padding-bottom:calc(96px + var(--safe-bottom));}',
  '  body[data-view="work"] .work-mobile{min-height:0;padding-bottom:calc(96px + var(--safe-bottom))!important;}',
  '  body[data-view="work"] .demo-note{display:none!important;}',
  '  body[data-view="work"] .scroll-cue{position:relative;left:auto;bottom:auto;transform:none;width:max-content;margin:8px auto 4px;z-index:2;animation:work-scroll-cue-float 1.7s ease-in-out infinite;}',
  '  body[data-view="work"] .work-mobile>.work-actions{margin-bottom:20px!important;}',
  '}',
  '/* The live sweep is compositor-friendly, so the launch screen keeps moving while the large runtime parses. */',
  '.boot-progress-ring{isolation:isolate;}',
  '.boot-progress-live{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from -90deg,transparent 0 24deg,#ffd7e8 42deg,#f2a9c9 92deg,transparent 118deg 360deg);-webkit-mask:radial-gradient(circle,transparent 0 87%,#000 88% 91%,transparent 92%);mask:radial-gradient(circle,transparent 0 87%,#000 88% 91%,transparent 92%);opacity:.82;transform:rotate(0deg);animation:boot-live-spin 1.15s linear infinite;will-change:transform;}',
  '@keyframes boot-live-spin{to{transform:rotate(360deg)}}',
  '@keyframes work-scroll-cue-float{0%,100%{opacity:.82;transform:translateY(0)}50%{opacity:1;transform:translateY(4px)}}',
  '@media(prefers-reduced-motion:reduce){.boot-progress-live{animation:none!important}}',
  '</style>'
].join('\n');
const headEnd = html.indexOf('</head>');
if (headEnd < 0) throw new Error('head end not found');
html = html.slice(0, headEnd) + css + html.slice(headEnd);
html = html.replace('</head>', '<style id="v47-workbench-safe-area">html{width:100%;min-width:0;min-height:100%;overflow-x:hidden!important;overflow-y:auto!important;}body{width:100%;min-width:0;min-height:100dvh!important;height:auto!important;overflow-x:hidden!important;overflow-y:visible!important;}@media (max-width:720px), (min-width:900px) and (max-aspect-ratio:3/4){body[data-view="work"]{height:auto!important;min-height:100dvh!important;overflow-x:hidden!important;overflow-y:visible!important;}body[data-view="work"] .app{display:block!important;width:100%!important;height:auto!important;min-height:100dvh!important;}body[data-view="work"] .main{display:block!important;width:100%!important;height:auto!important;min-height:100dvh!important;padding-bottom:0!important;}body[data-view="work"] #view{display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;padding-bottom:0!important;scroll-padding-bottom:calc(96px + var(--safe-bottom));}body[data-view="work"] .work-mobile{height:auto!important;min-height:0!important;padding-bottom:calc(96px + var(--safe-bottom))!important;overflow:visible!important;}body[data-view="work"] .work-mobile>.work-actions{position:relative!important;bottom:auto!important;margin-top:0!important;margin-bottom:20px!important;}body[data-view="work"] .work-mobile>.generators{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;margin-top:8px!important;margin-bottom:8px!important;}}</style></head>');
html = html.replace('</head>', '<style id="v47-workbench-flow-final">@media (max-width:720px), (min-width:900px) and (max-aspect-ratio:3/4){body[data-view="work"] #view{padding-bottom:0!important;scroll-padding-bottom:calc(96px + var(--safe-bottom));}body[data-view="work"] #view .work-mobile{display:block!important;position:relative!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;padding-bottom:calc(96px + var(--safe-bottom))!important;}body[data-view="work"] #view .work-mobile>.generators,body[data-view="work"] #view .work-mobile>.work-actions{position:relative!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;z-index:2!important;width:100%!important;transform:none!important;}body[data-view="work"] #view .work-mobile>.generators{margin:8px 0 6px!important;}body[data-view="work"] #view .work-mobile>.work-actions{margin:6px 0 0!important;}body[data-view="work"] #view .scroll-cue{position:relative!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;display:flex!important;width:max-content!important;margin:8px auto 4px!important;transform:none!important;z-index:2!important;animation:work-scroll-cue-float 1.7s ease-in-out infinite!important;}}</style></head>');

const newScroll = 'function scrollCueHost(){const view=$(\'#view\');if(!view)return null;return document.scrollingElement||document.documentElement;}function mountScrollCue(){const view=$(\'#view\'),cue=view?.querySelector(\'[data-action="scroll-cue"]\');if(!view||!cue)return;view.__scrollCueCleanup?.();const host=scrollCueHost();if(!host)return;const isDocument=host===document.scrollingElement||host===document.documentElement;const metrics=()=>isDocument?{top:window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0,client:window.innerHeight,height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)}:{top:host.scrollTop,client:host.clientHeight,height:host.scrollHeight};const update=()=>{const m=metrics();cue.hidden=!(m.height>m.client+12)||m.top+m.client>=m.height-18;};const onScroll=()=>update();const onCueClick=e=>{e.preventDefault();e.stopPropagation();scrollCueAction();};cue.addEventListener(\'click\',onCueClick,true);host.addEventListener(\'scroll\',onScroll,{passive:true});if(isDocument)window.addEventListener(\'scroll\',onScroll,{passive:true});window.addEventListener(\'resize\',update,{passive:true});view.__scrollCueCleanup=()=>{cue.removeEventListener(\'click\',onCueClick,true);host.removeEventListener(\'scroll\',onScroll);if(isDocument)window.removeEventListener(\'scroll\',onScroll);window.removeEventListener(\'resize\',update);};requestAnimationFrame(update);}function scrollCueAction(){const host=scrollCueHost();if(!host)return;const isDocument=host===document.scrollingElement||host===document.documentElement;const m=isDocument?{top:window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0,client:window.innerHeight,height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)}:{top:host.scrollTop,client:host.clientHeight,height:host.scrollHeight};const next=Math.min(Math.max(0,m.height-m.client),m.top+Math.max(220,Math.round(m.client*.78)));if(isDocument){window.scrollTo({top:next,behavior:\'auto\'});document.documentElement.scrollTop=next;document.body.scrollTop=next;}else{host.scrollTo({top:next,behavior:\'auto\'});host.scrollTop=next;}}';
const scrollStart = runtime.indexOf('function mountScrollCue');
const scrollEnd = runtime.indexOf('function render()', scrollStart);
if (scrollStart < 0 || scrollEnd < 0) throw new Error('scroll cue block not found');
const scrollWithActionVisibility = newScroll.replace(
  'const update=()=>{const m=metrics();cue.hidden=!(m.height>m.client+12)||m.top+m.client>=m.height-18;};',
  'const update=()=>{const m=metrics(),actions=ui.view===\'work\'?view.querySelector(\'.work-actions\'):null,rect=actions?.getBoundingClientRect(),actionsVisible=Boolean(rect&&rect.top>=0&&rect.bottom<=window.innerHeight-8&&m.top>24),showInitialWorkCue=ui.view===\'work\'&&m.top<=24&&m.height>m.client+12;cue.hidden=showInitialWorkCue?false:(actionsVisible||!(m.height>m.client+12)||m.top+m.client>=m.height-18);};'
);
const finalScrollAction = 'function scrollCueAction(){const host=scrollCueHost();if(!host)return;const isDocument=host===document.scrollingElement||host===document.documentElement;const m=isDocument?{top:window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0,client:window.innerHeight,height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)}:{top:host.scrollTop,client:host.clientHeight,height:host.scrollHeight};const next=Math.min(Math.max(0,m.height-m.client),m.top+Math.max(220,Math.round(m.client*.78)));if(isDocument){window.scrollTo({top:next,behavior:\'auto\'});document.documentElement.scrollTop=next;document.body.scrollTop=next;}else{host.scrollTo({top:next,behavior:\'auto\'});host.scrollTop=next;}requestAnimationFrame(()=>{const view=$(\'#view\'),cue=view?.querySelector(\'[data-action="scroll-cue"]\');if(cue)cue.hidden=true;});}\n';
runtime = runtime.slice(0, scrollStart) + scrollWithActionVisibility + finalScrollAction + runtime.slice(scrollEnd);
runtime = runtime.replace('</p><div class="generators">', '</p>${scrollCueMarkup("work")}<div class="generators">');
runtime = runtime.replace('if(["work","catalog","contest"].includes(ui.view))$("#view").insertAdjacentHTML("beforeend",scrollCueMarkup(ui.view));', 'if(["catalog","contest"].includes(ui.view))$("#view").insertAdjacentHTML("beforeend",scrollCueMarkup(ui.view));');
runtime = runtime.replace(
  "const onScroll=()=>update();host.addEventListener('scroll',onScroll,{passive:true});",
  "const onScroll=()=>update();const onCueClick=e=>{e.preventDefault();e.stopPropagation();scrollCueAction();};cue.addEventListener('click',onCueClick,true);host.addEventListener('scroll',onScroll,{passive:true});"
);
runtime = runtime.replace(
  "view.__scrollCueCleanup=()=>{host.removeEventListener('scroll',onScroll);",
  "view.__scrollCueCleanup=()=>{cue.removeEventListener('click',onCueClick,true);host.removeEventListener('scroll',onScroll);"
);
runtime = runtime.replace(
  "else host.scrollTo({top:next,behavior:'smooth'});}",
  "else {host.scrollTo({top:next,behavior:'smooth'});requestAnimationFrame(()=>{if(Math.abs(host.scrollTop-next)>1)host.scrollTop=next;});}}"
);
runtime = runtime.replace(
  "if(isDocument)window.scrollTo({top:next,behavior:'smooth'});else {host.scrollTo",
  "if(isDocument){window.scrollTo({top:next,behavior:'smooth'});document.documentElement.scrollTop=next;document.body.scrollTop=next;}else {host.scrollTo"
);
runtime = runtime.replace(
  'function bootProgressCompleteV44(){globalThis.__bootProgressV44?.paint(100);}',
  'function bootProgressCompleteV44(){if(globalThis.__bootProgressV44?.complete)globalThis.__bootProgressV44.complete();else globalThis.__bootProgressV44?.paint(100);}'
);
runtime = runtime.replace('setTimeout(()=>{bootProgressCompleteV44();document.getElementById("boot-splash")?.classList.add("is-ready");},650);', 'bootProgressCompleteV44();setTimeout(()=>document.getElementById("boot-splash")?.classList.add("is-ready"),700);');
runtime = runtime.replace('setTimeout(()=>document.getElementById("boot-splash")?.remove(),1100);', 'setTimeout(()=>document.getElementById("boot-splash")?.remove(),1180);');

const build46 = fs.readFileSync(root + '/android-apk/build-apk-v46.ps1', 'utf8');
const build47 = build46
  .replaceAll('v46', 'v47')
  .replaceAll('V46', 'V47')
  .replace('--version-code 48 --version-name 0.48', '--version-code 49 --version-name 0.49')
  .replace(
    "Copy-Item $runtime (Join-Path $work 'assets\\fashion-studio-mobile-trial-v47-runtime.js')",
    "Copy-Item $runtime (Join-Path $work 'assets\\fashion-studio-mobile-trial-v47-runtime.js')\nCopy-Item (Join-Path $project 'assets\\*') (Join-Path $work 'assets') -Recurse -Force"
  );
fs.writeFileSync(root + '/fashion-studio-mobile-trial-v47.html', html);
fs.writeFileSync(root + '/fashion-studio-mobile-trial-v47-runtime.js', runtime);
fs.writeFileSync(root + '/android-apk/build-apk-v47.ps1', build47);
console.log(JSON.stringify({
  htmlBytes: fs.statSync(root + '/fashion-studio-mobile-trial-v47.html').size,
  runtimeBytes: fs.statSync(root + '/fashion-studio-mobile-trial-v47-runtime.js').size,
  build: root + '/android-apk/build-apk-v47.ps1',
  hasLiveSweep: html.includes('boot-progress-live'),
  hasScrollHost: runtime.includes('scrollCueHost'),
  bootDelay: runtime.includes('},420);')
}));

