const fs=require('node:fs');
const root='D:/garden/fashion-studio';
const html45=fs.readFileSync(root+'/fashion-studio-mobile-trial-v45.html','utf8');
let runtime=fs.readFileSync(root+'/fashion-studio-mobile-trial-v45-runtime.js','utf8');

const replaceOnce=(source,from,to,label)=>{
  const count=source.split(from).length-1;
  if(count!==1)throw new Error(`${label||from}: expected 1 match, got ${count}`);
  return source.replace(from,to);
};

runtime=replaceOnce(
  runtime,
  "const phases=[{name:'进店',seconds:4,from:0,to:1},{name:'选购',seconds:4,from:1,to:2},{name:'看陈列',seconds:5,from:2,to:3},{name:'排队',seconds:3,from:3,to:4},{name:'等待服务',seconds:4,from:4,to:4},{name:'结账',seconds:4,from:4,to:5},{name:'离店',seconds:5,from:5,to:7}];",
  "const phases=[{name:'进店',seconds:7,from:0,to:1},{name:'选购',seconds:7,from:1,to:2},{name:'看陈列',seconds:9,from:2,to:3},{name:'排队',seconds:5,from:3,to:4},{name:'等待服务',seconds:7,from:4,to:4},{name:'结账',seconds:7,from:4,to:5},{name:'离店',seconds:9,from:5,to:7}];",
  'npc traffic speed'
);

runtime=replaceOnce(
  runtime,
  '<span class="npc-bubble" hidden></span>',
  '<span class="npc-bubble" hidden></span><span class="npc-click-bubble" hidden></span>',
  'npc bubble markup'
);

const paintNeedle="bubble.textContent=g.phase===5?'谢谢，下次再来♡':'这件真好看';}";
runtime=replaceOnce(
  runtime,
  paintNeedle,
  "bubble.textContent=g.phase===5?'谢谢，下次再来♡':'这件真好看';syncNpcClickFeedback(el);}",
  'paint feedback hook'
);

runtime=replaceOnce(
  runtime,
  "function mountShopScene(){cancelAnimationFrame(sceneFrame);",
  `const NPC_QUIPS={
 '小悠':['这件版型要是能顺便修饰黑眼圈，我立刻下单！','买手说这色能卖，我先确认它能不能显白。'],
 '顾然':['版型很稳，像我今天的情绪——暂时没有崩。','这件衣服的肩线，比我的工作计划靠谱。'],
 '林夕':['供应链说面料到了，我的灵感还在路上。','通勤要体面，最好还能装下三杯咖啡。'],
 '安娜':['晚宴可以迟到，礼服的气场不能迟到。','这件高光够亮，刚好照出我的加班黑眼圈。'],
 '周周':['再加一点蝴蝶结，浪漫预算还没有超支。','买手请放心，我只试穿，不把整家店搬走。'],
 '珊珊':['今天的上新目标：先让自己心动，再让顾客心动。','这件颜色很会说话，比我开会时有说服力。']
};
function syncNpcClickFeedback(el){const bubble=el.querySelector('.npc-click-bubble');if(!bubble)return;const active=Number(el.dataset.feedbackUntil||0)>Date.now();bubble.hidden=!active;bubble.textContent=active?(el.dataset.feedbackText||''):' ';el.classList.toggle('is-click-feedback',active);if(!active){delete el.dataset.feedbackUntil;delete el.dataset.feedbackText;}}
function showNpcClickFeedback(e){if(Number(e.dataset.feedbackUntil||0)>Date.now())return;const shop=Number(e.dataset.shop),index=Number(e.dataset.npc),scene=sceneFor(shop),g=scene.snapshot().guests[index];if(!g)return;const lines=NPC_QUIPS[g.name]||['这件设计很有灵感，先让我原地心动三秒。'];const text=lines[Math.floor(Math.random()*lines.length)];e.dataset.feedbackUntil=String(Date.now()+2400);e.dataset.feedbackText=g.name+'：'+text;ui.sceneTouchUntil=Date.now()+2400;syncNpcClickFeedback(e);paintShopScene(scene);toast(g.name+'：'+text);}
function mountShopScene(){cancelAnimationFrame(sceneFrame);`,
  'shop scene hook'
);
runtime=replaceOnce(
  runtime,
  "time>=(ui.sceneTouchUntil||0)",
  "Date.now()>=(ui.sceneTouchUntil||0)",
  'npc touch time base'
);

runtime=replaceOnce(
  runtime,
  "'npc-guest':e=>{const g=sceneFor(Number(e.dataset.shop)).snapshot().guests[Number(e.dataset.npc)];openModal('顾客 · '+g.name,`<div class=\"guest-dialogue\"><div class=\"guest-dialogue-art\">${shopSprite(g.sprite)}</div><div><h3>${g.name}</h3><p>当前正在${g.label}，喜欢轻松又有小巧思的新衣。</p><blockquote>“这里的新衣好温柔，下次还想带朋友来！”</blockquote></div></div><p class=\"modal-text\">普通顾客用于店内购物表现，收益已计入营业金。点击带「！」的特殊顾客可以接受真实制衣委托。</p><button class=\"btn full\" data-action=\"close\">继续营业</button>`);},",
  "'npc-guest':e=>showNpcClickFeedback(e),",
  'npc click action'
);

runtime=replaceOnce(
  runtime,
  "document.addEventListener('pointerdown',event=>{if(event.target.closest('.shop-npc'))ui.sceneTouchUntil=performance.now()+600;},true);",
  "document.addEventListener('pointerdown',event=>{const guest=event.target.closest('.guest-npc');if(guest){ui.sceneTouchUntil=Date.now()+2400;showNpcClickFeedback(guest);return;}if(event.target.closest('.shop-npc'))ui.sceneTouchUntil=Date.now()+1200;},true);",
  'npc touch pause'
);

fs.writeFileSync(root+'/fashion-studio-mobile-trial-v46-runtime.js',runtime);

let html=html45
  .replace('时光街区 · 手游试玩 V0.45 · 动态服装排行榜','时光街区 · 手游试玩 V0.46 · 动态服装排行榜')
  .replace('fashion-studio-mobile-trial-v45-runtime.js','fashion-studio-mobile-trial-v46-runtime.js');
const css=`
/* V46: NPC click feedback stays anchored to the clicked character. */
.npc-click-bubble{position:absolute;bottom:88px;left:50%;z-index:190;max-width:min(190px,38vw);transform:translateX(-50%) translateY(2px);white-space:normal;text-align:center;font-size:9px;line-height:1.45;color:#8e6574;background:linear-gradient(180deg,#fffdf8f5,#fff0f4f2);border:1px solid #d9a9b9;border-radius:10px;padding:5px 8px;pointer-events:none;box-shadow:0 4px 12px #6d46542b;animation:npc-feedback-in .18s ease-out both}
.npc-click-bubble:after{content:'';position:absolute;bottom:-5px;left:calc(50% - 5px);border-top:5px solid #fff0f4;border-left:5px solid transparent;border-right:5px solid transparent}
.shop-npc.is-click-feedback{z-index:180!important}
.shop-npc.tap-feedback{animation:npc-tap-feedback .18s ease-out!important}
.shop-npc.tap-feedback.is-click-feedback{animation:npc-tap-feedback .18s ease-out!important}
.shop-npc.is-click-feedback>.shop-sprite{animation:npc-feedback-pop .24s ease-out 1!important}
@keyframes npc-feedback-in{from{opacity:0;transform:translateX(-50%) translateY(8px) scale(.94)}to{opacity:1;transform:translateX(-50%) translateY(2px) scale(1)}}
@keyframes npc-feedback-pop{0%{transform:scale(1)}45%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes npc-tap-feedback{0%{filter:brightness(1.18);transform:translate(-50%,-100%) scale(1)}55%{filter:brightness(1.08);transform:translate(-50%,-100%) scale(.94)}100%{filter:brightness(1);transform:translate(-50%,-100%) scale(1)}}
@media(max-width:600px){.npc-click-bubble{max-width:42vw;font-size:8px;padding:4px 6px}}
`;
const styleEnd=html.indexOf('</style>');
if(styleEnd<0)throw new Error('style end not found');
html=html.slice(0,styleEnd)+css+html.slice(styleEnd);
fs.writeFileSync(root+'/fashion-studio-mobile-trial-v46.html',html);
console.log(JSON.stringify({html:root+'/fashion-studio-mobile-trial-v46.html',runtime:root+'/fashion-studio-mobile-trial-v46-runtime.js',htmlBytes:fs.statSync(root+'/fashion-studio-mobile-trial-v46.html').size,runtimeBytes:fs.statSync(root+'/fashion-studio-mobile-trial-v46-runtime.js').size,feedback:runtime.includes('showNpcClickFeedback'),pause:runtime.includes('Date.now()+2400'),markup:runtime.includes('npc-click-bubble'),slowerTraffic:runtime.includes("name:'进店',seconds:7")}));
