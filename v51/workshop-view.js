function materialIcon(c,t=0,extra=''){
 const files=[['item-03.webp','item-04.webp','item-16.webp','item-21.webp','item-00.webp','item-09.webp'],['item-05.webp','item-15.webp','item-19.webp','item-24.webp','item-05.webp','item-24.webp'],['work-hairclip-t1.png','work-necklace-t2.png','work-earrings-t3.png','work-bag-t4.png','work-perfume-t5.png','work-necklace-t6.png']];
 return `<img class="ws-material-art ${extra}" src="${asset(files[c][t])}" alt="${CHAINS[c].name} T${t+1}" draggable="false">`;
}
function producerArt(c){return `<span class="ws-producer-art" aria-hidden="true"><svg viewBox="0 0 64 64"><defs><linearGradient id="producer-${c}" x2=".2" y2="1"><stop stop-color="${['#fff4ec','#eaf7ff','#f8efff'][c]}"/><stop offset="1" stop-color="${['#db8ba1','#7caac9','#b299cf'][c]}"/></linearGradient></defs><ellipse cx="32" cy="56" rx="24" ry="5" fill="#72526b" opacity=".16"/><path d="M10 21 32 13 54 21 51 52 32 59 13 52Z" fill="url(#producer-${c})" stroke="#b18192" stroke-width="1.5"/><path d="m10 21 22 9 22-9M32 30v29" fill="none" stroke="#fff8ef" stroke-width="2"/><path d="M18 17V9h28v8" fill="none" stroke="#be9a70" stroke-width="4" stroke-linecap="round"/></svg>${materialIcon(c,0)}<i>ϟ</i></span>`;}
function renderWork(){
 const s=game.state,id=s.activeOrder?.item??ui.recipe??3,x=FASHION[id],info=game.researchInfo(id),known=s.blueprints.includes(id),have=game.count(info.c,info.t),reason=game.researchReason(id),m=mergeMilestoneView(s.mergeStats.total),selected=Number.isInteger(ui.selected)?s.board[ui.selected]:null;
 const action=s.activeOrder?'order-resume':known?'orders':have>=info.n&&!reason?'research':'blueprint-detail';
 const actionText=s.activeOrder?'继续制衣':known?'接待顾客':have>=info.n&&!reason?'研发版型':'研发详情';
 const occupied=s.board.filter(Boolean).length;
 return `<section class="ws51" aria-label="服饰材料合成工作台">
  <header class="ws-header"><div><small>FASHION ATELIER</small><h1>设计工坊</h1></div><button data-action="patterns">${icon('book')}<span>我的版型</span><small>${s.blueprints.length}/25</small></button></header>
  <article class="ws-goal"><button class="ws-goal-art" data-action="blueprint-detail" data-id="${id}" aria-label="查看${x.name}研发详情">${photo(id)}</button><div class="ws-goal-copy"><small>${s.activeOrder?'当前制衣订单':known?'已研发版型':'当前研发目标'}</small><b>${x.name}</b><span>${known?'版型已解锁，可接待顾客':`${CHAINS[info.c].name} T${info.t+1} · ${Math.min(have,info.n)}/${info.n}件`}</span><small>${known?'成衣永久加入衣橱':`${fmt(info.cost)}元${info.seals?' · '+info.seals+'印章':''}`}</small></div><button class="ws-primary" data-action="${action}" data-id="${id}">${actionText}<span>›</span></button></article>
  <article class="ws-milestone" aria-label="合成里程碑"><div><b>合成里程碑</b><small>${m.label} ${m.current}/${m.target} · 累计合成${s.mergeStats.total}次</small></div><span class="ws-milestone-meter" role="progressbar" aria-valuemin="0" aria-valuemax="${m.target}" aria-valuenow="${m.current}"><i style="width:${m.current/m.target*100}%"></i></span><span aria-hidden="true">${icon('gift')}</span></article>
  <div class="ws-board-head"><span>材料 ${occupied}/33</span><span>两件同款 · 拖动合成</span><button data-action="sort" aria-label="整理材料">整理</button></div>
  <div class="ws-board" role="group" aria-label="六乘六合成棋盘，材料箱位于格子中">${s.board.map((item,i)=>{
   const c=game.producerAt(i),producer=c>=0,open=producer&&game.generatorOpen(c),match=selected&&item&&i!==ui.selected&&selected.c===item.c&&selected.t===item.t&&item.t<5,goal=item&&item.c===info.c&&item.t===info.t;
   const name=producer?`${CHAINS[c].name}箱，${open?'点击生产，消耗'+CHAINS[c].cost+'体力':c===1?'定制馆开业解锁':'女装店3级解锁'}`:item?`${CHAINS[item.c].name} T${item.t+1}`:'空位';
   return `<button class="cell ws-cell ${producer?'ws-producer '+(open?'':'is-locked'):item?'ws-item':'ws-empty'} ${ui.selected===i?'selected':''} ${match?'matching':''} ${goal?'goal-material':''}" data-action="cell" data-index="${i}" ${producer?`data-producer="${c}"`:''} aria-label="第${i+1}格，${name}" aria-pressed="${ui.selected===i}">${producer?`${producerArt(c)}<b>${CHAINS[c].name}</b><small>${open?'ϟ '+CHAINS[c].cost:c===1?'定制馆开业':'女装店3级'}</small>`:item?`${materialIcon(item.c,item.t)}<span class="ws-tier">T${item.t+1}</span>${goal?'<span class="ws-goal-mark">目标</span>':''}`:''}</button>`;
  }).join('')}</div>
  <p class="ws-hint" role="status">${selected?`${CHAINS[selected.c].name} T${selected.t+1} · ${selected.t===5?'已达最高阶，可用于研发':'拖到发光同款升阶，或点空格移动'}`:'点击格内材料箱出料 · 拖动两件同款合成'}</p>
  <div class="ws-tools"><button data-action="chains">${icon('book')}<span>合成图谱</span></button><button data-action="ws-tray">${icon('orders')}<span>暂存 ${s.workshop.tray.length}</span></button><button data-action="daily">${icon('energy')}<span>体力补给</span></button><button data-action="recycle" ${!selected?'disabled':''}>${icon('work')}<span>回收选中</span></button></div>
  <button class="ws-story" data-action="story-feedback"><span>主线 ${s.story.chapter} · 设计师成长</span><span>查看剧情 ›</span></button>
 </section>`;
}
function workshopAnimate(indices,type='spawn'){
 requestAnimationFrame(()=>indices.forEach(index=>{
  const tile=document.querySelector(`.ws-cell[data-index="${index}"]`);if(!tile)return;
  tile.classList.add('ws-'+type);tile.addEventListener('animationend',()=>tile.classList.remove('ws-'+type),{once:true});
 }));
}
function workshopProduce(c,count=1){
 ui.selected=null;
 const indices=game.generate(c,count,effectiveRank());ui.chain=c;workshopAnimate(indices);
 toast(`${CHAINS[c].name} +${indices.length} · 体力 −${CHAINS[c].cost*count}`);
}
