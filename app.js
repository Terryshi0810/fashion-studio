(() => {
'use strict';
const { Game, CHAINS, FLOORS, TASKS, THEMES, CONTEST, key, xpNeed, REGEN } = FashionGame;
const $ = s => document.querySelector(s);
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const item = (c, t, cls = '') => `<span class="sprite ${cls}" data-chain="${c}" role="img" aria-label="${CHAINS[c].names[t]}" style="background-position:${(t + .03) / 5.06 * 100}% ${(c + .03) / 2.06 * 100}%"></span>`;
const itemKey = (k, cls = '') => item(...k.split(':').map(Number), cls);
const money = (name, value) => `<span class="inline-resource ${name}">${icon({ coins: 'coin', gems: 'gem', energy: 'energy', fragments: 'flower' }[name])}${value}</span>`;
const STORAGE = 'fashionStudio.save.v1';
let loadMessage = '', storageError = false, saved;
try { const raw = localStorage.getItem(STORAGE); if (raw) { try { saved = FashionGame.validate(JSON.parse(raw)); } catch { localStorage.setItem(STORAGE + '.invalid-backup', raw); loadMessage = '旧存档格式异常，已保留备份并创建新的体验存档'; } } } catch { storageError = true; }
const game = new Game(saved);
const navs = [['map', 'map', '主地图'], ['work', 'work', '工作台'], ['shop', 'shop', '商店'], ['contest', 'contest', '评比赛'], ['catalog', 'book', '图鉴']];
const ui = { view: 'map', shopTab: 'daily', catalogTab: 'all', catalogState: 'all', closet: 0, selected: null, hint: false, floor: 0, zone: '橱窗' };
let drag = null, touchPress = null, touchCompatUntil = 0, suppressUntil = 0, priorLevel = game.state.level;
function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(game.state)); storageError = false; }
  catch { storageError = true; }
  $('#save-status').textContent = storageError ? '自动保存不可用，请手动导出存档' : '进度已自动保存 · 此浏览器专属';
  $('#save-status').classList.toggle('no-saved', storageError);
}
function toast(message) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = message; $('#toasts').append(t); while ($('#toasts').children.length > 3) $('#toasts').firstElementChild.remove(); setTimeout(() => t.remove(), 3400); }
function run(fn) { try { return fn(); } catch (e) { toast(e instanceof FashionGame.RuleError ? e.message : '操作未完成，请稍后再试'); if (!(e instanceof FashionGame.RuleError)) console.error(e); } }
function openModal(html) { $('#modal-content').innerHTML = html; if (!$('#modal').open) $('#modal').showModal(); }
function closeModal() { if ($('#modal').open) $('#modal').close(); }
function celebrate(target) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = target?.getBoundingClientRect() || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  for (let i = 0; i < 14; i++) { const p = document.createElement('span'); p.className = 'confetti'; p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${['#cf8192', '#b5cdb2', '#e2bf70'][i % 3]};--dx:${(Math.random() - .5) * 190}px;--dy:${-40 - Math.random() * 120}px`; document.body.append(p); setTimeout(() => p.remove(), 850); }
}
function heading(eyebrow, title, description, extra = '') { return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-subtitle">${description}</p></div>${extra}</div>`; }
function renderNav() {
  const reward = game.state.discovered.some(k => !game.state.claimed.includes(k));
  const html = navs.map(([view, glyph, title]) => `<button class="nav-button ${ui.view === view ? 'active' : ''}" data-action="nav" data-view="${view}" ${ui.view === view ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${title}</span>${view === 'catalog' && reward ? '<span class="nav-mark" aria-label="有奖励待领取"></span>' : ''}</button>`).join('');
  $('#desktop-nav').innerHTML = html; $('#mobile-nav').innerHTML = html;
}
function renderHud() {
  const s = game.state;
  $('#hud-energy').innerHTML = `${s.energy}<small>/${s.energyMax}</small>`;
  $('#hud-coins').textContent = s.coins.toLocaleString('zh-CN'); $('#hud-gems').textContent = s.gems.toLocaleString('zh-CN');
  $('#player-level').textContent = `LV ${s.level} · ${s.level >= 25 ? '星光设计师' : '见习设计师'}`;
}
function navigate(view) {
  if (!navs.some(n => n[0] === view)) view = 'map';
  const changed = ui.view !== view; ui.view = view; ui.selected = null; closeModal();
  if (location.hash !== '#' + view) history.pushState(null, '', '#' + view);
  render(); if (changed) window.scrollTo({ top: 0, behavior: 'instant' });
}
function taskButton(label = '立即改造', cls = '') {
  const task = TASKS[game.state.task];
  if (!task) return `<button class="button ${cls}" data-action="story">重温故事 ${icon('book')}</button>`;
  const ready = game.taskReady(), isProgress = Boolean(task.orders || task.contest);
  return `<button class="button ${cls}" data-action="task" ${ready ? '' : 'title="完成任务条件后即可领取"'}>${ready ? (isProgress ? '领取奖励' : task.unlock ? '开放楼层' : label) : (isProgress ? '去完成任务' : '查看任务')}${ready && !isProgress && !(task.unlock && game.state.floors.includes(task.floor)) ? money('coins', task.cost) : icon('arrow')}</button>`;
}
function renderMap() {
  const s = game.state, task = TASKS[s.task], next = FLOORS.findIndex((f, i) => !s.floors.includes(i) && s.level >= f.level && s.floors.includes(i - 1));
  const decorations = Object.entries(s.decorations).map(([k, theme]) => {
    const [f, zone] = k.split(':'); const left = zone === '橱窗' ? 38 : zone === '货架' ? 62 : 47;
    return `<div class="decor-overlay ${theme}" style="top:${FLOORS[Number(f)].y - 5}%;left:${left}%" aria-hidden="true"></div>`;
  }).join('');
  const pins = FLOORS.map((f, i) => `<button class="floor-pin ${s.floors.includes(i) ? 'open' : i === next ? 'next' : 'locked'}" style="--y:${f.y}%" data-action="floor" data-f="${i}" aria-label="${i + 1}楼 ${f.name} ${s.floors.includes(i) ? '已开放' : '需要等级' + f.level}"><b>${i + 1}F</b>${f.name}${s.floors.includes(i) ? icon('check') : i === next ? icon('plus') : icon('lock')}</button>`).join('');
  const taskPercent = task?.orders ? Math.min(100, s.ordersDone / task.orders * 100) : task?.contest ? Math.min(100, s.contestEntries / task.contest * 100) : Math.round(s.task / TASKS.length * 100);
  return heading('THE LITTLE DEPARTMENT STORE', '让旧时光，重新闪耀。', '整理衣服，装点角落，让百货重新变成家。', '<span class="label">第三章 · 重逢的心意</span>') +
  `<div class="map-layout"><section class="map-scene" aria-label="六层百货主地图"><img class="map-art" src="assets/department-store.png" alt="原创六层复古百货剖面：女装、鞋履、配饰、高定、秀场与天台花园"><div class="map-vignette"></div>${decorations}<div class="scene-heading">时光百货<small>MAISON AMÉLIE · SINCE 1986</small></div><button class="round-button scene-tool" data-action="settings" aria-label="试玩设置">${icon('settings')}</button>${pins}<div class="map-task-float">${icon('flower')}<div><h3>${task ? task.title : '百货的故事，仍在继续'}</h3><p>${task ? '下一步的小小心愿' : '这一章的全部心愿已完成'}</p></div>${taskButton('改造', 'small')}</div></section>
  <aside class="side-panel"><section class="panel chapter-card"><p class="eyebrow">A NEW CHAPTER</p><h2>每一次重逢，<br>都值得好好装扮。</h2><p>姑妈留下的不只是一家百货，<br>还有那些未说完的故事。</p><button class="text-button" data-action="story">读一封旧信 ${icon('arrow')}</button><img src="assets/designer.png" alt="设计师艾米"></section>
  <section class="panel task-panel"><div class="panel-top"><h2>今日的小心愿</h2><small>${Math.min(s.task + 1, TASKS.length)} / ${TASKS.length}</small></div><h3>${task ? task.title : '把美好留在这里'}</h3><p class="task-description">${task ? task.description : '所有章节任务已完成。继续搭配与收集，让百货拥有自己的风格。'}</p><div class="task-meta"><span>${task ? '+' + task.xp + ' 经验' : '章节完成'}${task?.gems ? ' · +' + task.gems + ' 钻石' : ''}</span><span>${task?.orders ? s.ordersDone + '/' + task.orders + ' 订单' : task?.contest ? s.contestEntries + '/' + task.contest + ' 评比' : task ? '设计进度' : '100%'}</span></div><div class="task-progress"><span style="width:${task ? taskPercent : 100}%"></span></div><div class="progress-copy"><span>${task?.orders || task?.contest ? '目标完成度' : '本章心愿'}</span><span>${Math.round(task ? taskPercent : 100)}%</span></div>${taskButton('立即改造', 'full')}</section>
  <section class="panel floor-overview"><div class="panel-top"><h2>百货楼层</h2><small>${s.floors.length} / 6 已开放</small></div><div class="floor-list">${FLOORS.map((f, i) => `<button data-action="floor" data-f="${i}"><span class="floor-number">${i + 1}F</span><span class="floor-name">${f.name}</span><span class="floor-state ${s.floors.includes(i) ? '' : 'closed'}">${s.floors.includes(i) ? '已开放' : 'LV ' + f.level}</span>${icon(s.floors.includes(i) ? 'arrow' : 'lock')}</button>`).join('')}</div></section>
  <section class="panel daily-goal">${icon('gift')}<div><b>${s.daily.gift ? '今天的心意已收下' : '有一份心意在等你'}</b><p>每日补给 · 让灵感持续发生</p></div><button class="text-button" data-action="nav" data-view="shop">去看看 ${icon('arrow')}</button></section></aside></div>`;
}
function renderWork() {
  const s = game.state, selected = s.board[ui.selected];
  return heading('MAKE A LITTLE MAGIC', '灵感工作台', '同款归位，叠满 10 件，就会变成下一阶的惊喜。', '<button class="text-button" data-action="help">玩法说明 ' + icon('info') + '</button>') +
  `<div class="work-layout"><section class="work-area"><div class="orders-row">${s.orders.map(o => `<article class="order-card"><div class="guest"><span class="guest-avatar">${esc(o.guest[0])}</span><span>${esc(o.guest)}</span></div><span class="order-clock" data-created="${o.created}"></span><div class="order-needs">${o.needs.map(n => `<div class="order-need ${game.count(n.c, n.t) >= n.n ? 'ready' : ''}" title="${CHAINS[n.c].names[n.t]}：已有 ${game.count(n.c, n.t)} / 需要 ${n.n}">${item(n.c, n.t, 'small')}<span class="amount">${Math.min(game.count(n.c, n.t), n.n)}/${n.n}</span></div>`).join('')}</div><div class="order-reward">${money('coins', o.coins)}${o.gems ? money('gems', o.gems) : ''}<span>+${o.xp} XP</span></div><button class="button small ${game.canDeliver(o) ? 'mint' : 'light'}" data-action="deliver" data-id="${o.id}" ${game.canDeliver(o) ? '' : 'disabled'}>${game.canDeliver(o) ? '交付订单' : '继续整理'}</button></article>`).join('')}</div>
  <div class="board-frame"><div class="board-toolbar"><span>针线与时光 · ${s.board.filter(Boolean).length}/36 格</span><button class="text-button" data-action="sort">${icon('refresh')}整理位置</button></div><div class="board" role="group" aria-label="6乘6服装棋盘">${s.board.map((i, n) => `<button class="cell ${i ? '' : 'empty'} ${ui.selected === n ? 'selected' : ''} ${ui.hint && [14, 15].includes(n) ? 'hint' : ''}" data-action="cell" data-index="${n}" aria-label="第${n + 1}格${i ? '，' + CHAINS[i.c].names[i.t] + '，' + i.n + '件，' + (i.t + 1) + '阶' : '，空位'}">${i ? item(i.c, i.t) + `<span class="tier">${i.t + 1}阶</span><span class="stack-count">${i.n}/${i.t === 5 ? '满' : '10'}</span>` : ''}</button>`).join('')}</div></div>
  <div class="generators">${CHAINS.map((ch, c) => `<button class="generator" data-action="generate" data-c="${c}" ${s.level < ch.level ? 'disabled' : ''}>${icon(['work', 'hanger', 'gift'][c])}<span><b>${ch.generator}</b><small>${s.level < ch.level ? 'LV' + ch.level + '解锁' : money('energy', ch.cost) + ' / 次'}</small></span></button>`).join('')}</div><p class="work-tip">拖拽服装到同款上，或先点一摞再点目标格。<br>归位不会扣体力，重复发现还会获得图鉴碎片。</p></section>
  <aside class="work-side side-panel">${!s.tutorial ? `<section class="panel tutorial-card"><div class="big-step">01 / 03</div><h2>先整理一摞试试？</h2><p>棋盘上有一摞 9 件的花语 T 恤。<br>把旁边的 1 件放上去，看看会发生什么。</p><button class="button gold full" data-action="hint">带我整理 ${icon('arrow')}</button><button class="text-button" data-action="tutorial-done" style="display:flex;margin:12px auto 0">我知道怎么玩了</button></section>` : `<section class="panel"><h2>好衣服，值得被发现</h2><p class="task-description">每一次升阶，都离完整的衣橱更近一点。去图鉴收下你的发现奖励吧。</p><button class="button mint full" data-action="nav" data-view="catalog">打开服装图鉴 ${icon('book')}</button></section>`}<section class="panel metrics-panel"><div class="panel-top"><h2>今天也很有收获</h2></div><div class="metrics"><div><b>${s.merges}</b><small>累计升阶</small></div><div><b>${s.ordersDone}</b><small>累计订单</small></div><div><b>${s.discovered.length}</b><small>发现服装</small></div><div><b>${s.fragments}</b><small>图鉴碎片</small></div></div></section><section class="panel"><h2>${selected ? CHAINS[selected.c].names[selected.t] : '体力慢慢回来了'}</h2>${selected ? `<div class="item-info">${item(selected.c, selected.t)}<p><strong>${selected.n} 件 · ${selected.t + 1} 阶</strong><br>${selected.t === 5 ? '最高阶可堆叠至 10 件' : '再叠 ' + (10 - selected.n) + ' 件即可升阶'}</p></div>` : `<p class="task-description">每 2 分钟恢复 1 点，离线也有效。<br><span id="regen-clock"></span></p><button class="text-button" data-action="energy-shop">补充一点灵感 ${icon('energy')}</button>`}</section></aside></div>`;
}
function product(c, t, offer) {
  const s = game.state, sold = offer && s.daily.purchased[offer.id], price = offer ? offer.price : 80 + t * t * 85 + c * 25;
  return `<article class="product-card"><span class="product-tag">${!s.discovered.includes(key(c,t)) ? '全新发现' : CHAINS[c].tags[t]}</span><div class="product-art">${item(c,t)}</div><h3>${CHAINS[c].names[t]}</h3><p>${CHAINS[c].name}系列 · ${t + 1}阶 · 购入后放入工作台</p><button class="button ${sold ? 'light' : 'gold'}" data-action="buy-item" data-c="${c}" data-t="${t}" ${offer ? 'data-offer="' + offer.id + '"' : ''} ${sold ? 'disabled' : ''}>${sold ? '今日已售罄' : money('coins', price) + ' 购入'}</button></article>`;
}
function renderShop() {
  const s = game.state;
  let body = '';
  if (ui.shopTab === 'daily') {
    body = `<section class="shop-hero">${icon('gift', 'hero-icon')}<div><h2>每日一份小确幸</h2><p>120 金币 + 3 图鉴碎片 · 每日 08:00（北京时间）更新</p></div><button class="button gold" data-action="gift" ${s.daily.gift ? 'disabled' : ''}>${s.daily.gift ? icon('check') + '已收下' : '免费领取'}</button></section>
    <div class="supply-grid"><article class="product-card supply-card"><div class="product-art">${icon('energy', 'supply-icon')}</div><div class="product-body"><h3>灵感体力瓶</h3><p>恢复 50 点，最多至体力上限</p><p>${s.daily.energyBuys === 0 ? '每天第一瓶免费' : '下次价格随购买次数递增'}</p></div><button class="button gold" data-action="buy-energy" ${s.energy === s.energyMax || s.daily.energyBuys >= 20 ? 'disabled' : ''}>${game.energyPrice() === 0 ? '免费补充' : money('gems', game.energyPrice()) + ' 补充'}</button></article>
    <article class="product-card supply-card"><div class="product-art">${icon('leaf', 'supply-icon')}</div><div class="product-body"><h3>片刻的小憩</h3><p>模拟广告补给 · 恢复 15 点</p><p>剩余 ${5 - s.daily.ad}/5 次 · 不播放真实广告</p></div><button class="button mint" data-action="ad-energy" ${s.energy === s.energyMax || s.daily.ad >= 5 ? 'disabled' : ''}>体验补给</button></article></div>
    <div class="shop-section-heading"><h2>为你挑选的小心意</h2><button class="text-button" data-action="refresh-shop">${icon('refresh')}换一批 ${money('gems',10)}</button></div><div class="shop-grid">${game.offers().map(o => product(o.c, o.t, o)).join('')}</div>`;
  } else if (ui.shopTab === 'wardrobe') {
    body = `<section class="shop-hero">${icon('hanger','hero-icon')}<div><h2>找到心动的那一件</h2><p>明码标价，不抽奖。购买会点亮图鉴，并放入工作台。</p></div></section><div class="shop-grid">${CHAINS.flatMap((_,c) => Array.from({length:6},(_,t) => product(c,t))).join('')}</div>`;
  } else {
    body = `<section class="shop-hero">${icon('flower','hero-icon')}<div><h2>一点装点，十分温柔</h2><p>买下设计方案后，可在任意已开放楼层反复使用。</p></div></section><div class="shop-grid">${Object.entries(THEMES).flatMap(([theme, name]) => ['橱窗','货架','休息区'].map(zone => {
      const owned = s.ownedDecor.includes(theme + ':' + zone);
      return `<article class="product-card"><span class="product-tag">${name}</span><div class="product-art decor-product ${theme}">${icon({sweet:'flower',natural:'leaf',elegant:'star'}[theme], 'supply-icon')}</div><h3>${name} · ${zone}</h3><p>永久设计方案 · 已开放楼层通用</p><button class="button ${owned ? 'mint' : 'gold'}" data-action="${owned ? 'use-decor' : 'buy-decor'}" data-theme="${theme}" data-zone="${zone}">${owned ? '去布置' : money('coins',240) + ' 解锁'}</button></article>`;
    })).join('')}</div>`;
  }
  return heading('A LITTLE SOMETHING FOR YOU','心意商店','灵感、衣服和装饰，每一份心意都有用。','<span class="label">仅使用游戏内货币</span>') + `<div class="tabs" role="group" aria-label="商店分类">${[['daily','每日补给'],['wardrobe','精品衣橱'],['decor','装饰设计']].map(([id,name]) => `<button class="tab ${ui.shopTab === id ? 'active' : ''}" aria-pressed="${ui.shopTab === id}" data-action="shop-tab" data-tab="${id}">${name}</button>`).join('')}</div>${body}<p class="notice">${icon('info')}所有购买均为本地试玩，不涉及真实扣款。体力满时不扣费；棋盘满时无法购入服装，也不会扣金币。</p>`;
}
function renderCatalog() {
  const s = game.state;
  const cards = CHAINS.flatMap((ch,c) => ch.names.map((name,t) => ({c,t,name}))).filter(({c,t}) => (ui.catalogTab === 'all' || String(c) === ui.catalogTab) && (ui.catalogState === 'all' || (ui.catalogState === 'found' ? s.discovered.includes(key(c,t)) : !s.discovered.includes(key(c,t)))));
  return heading('COLLECT EVERY LITTLE BEAUTY','时光衣橱图鉴','每一件衣服，都藏着一段值得收藏的故事。','<span class="label">3 个系列 · 18 件服饰</span>') +
  `<section class="catalog-overview"><div class="catalog-stat"><strong>${s.discovered.length}</strong><span>/ 18</span><small>已发现</small></div><div class="catalog-progress"><div class="progress-copy"><span>衣橱的美好，正在一点点集齐</span><span>${Math.round(s.discovered.length/18*100)}%</span></div><div class="task-progress"><span style="width:${s.discovered.length/18*100}%"></span></div></div><div class="fragment-count">${money('fragments',s.fragments)} 图鉴碎片</div></section>
  <div class="tabs" role="group" aria-label="图鉴系列">${[['all','全部'],['0','女装'],['1','鞋履'],['2','配饰']].map(([id,name])=>`<button class="tab ${ui.catalogTab === id ? 'active' : ''}" aria-pressed="${ui.catalogTab === id}" data-action="catalog-tab" data-tab="${id}">${name}</button>`).join('')}<select class="catalog-filter trailing" aria-label="筛选发现状态"><option value="all" ${ui.catalogState==='all'?'selected':''}>全部状态</option><option value="found" ${ui.catalogState==='found'?'selected':''}>已发现</option><option value="unseen" ${ui.catalogState==='unseen'?'selected':''}>未发现</option></select></div>
  <div class="catalog-grid">${cards.map(({c,t,name})=> {const found=s.discovered.includes(key(c,t)),claim=found&&!s.claimed.includes(key(c,t));return `<button class="catalog-card ${found?'':'unseen'}" data-action="catalog-item" data-c="${c}" data-t="${t}" aria-label="${name}，${found?'已发现':'未发现'}${claim?'，有奖励可领取':''}">${claim?'<span class="claim-dot"></span>':''}${item(c,t,found?'':'locked')}<h3>${name}</h3><p>${t+1}阶 · ${CHAINS[c].tags[t]}</p><span class="discover-state">${icon(found?'check':'lock')}${claim?'发现奖励待领取':found?'已收藏':'等待发现'}</span></button>`;}).join('') || '<p class="empty-state">这个筛选下暂时没有服装。换个系列看看吧。</p>'}</div>
  <div class="chain-rewards">${CHAINS.map((ch,c)=>{const n=s.discovered.filter(k=>Number(k[0])===c).length,claimed=s.chainClaims.includes(c);return `<section class="chain-reward">${icon(['hanger','star','flower'][c])}<div><h3>${ch.name}系列收藏家</h3><p>${n}/6 已发现 · 集齐奖励 15 钻石</p></div><button class="button small ${n===6?'mint':'light'}" data-action="claim-chain" data-c="${c}" ${n<6||claimed?'disabled':''}>${claimed?'已领取':n===6?'领取奖励':'收集中'}</button></section>`;}).join('')}</div><p class="notice">${icon('info')}制作、升阶与购买会点亮图鉴；重复发现每次 +1 碎片，服装仍保留在棋盘供合并与交单。碎片按顺序解锁未发现服饰，不生成实物。发现奖励与系列奖励仅可领取一次。</p>`;
}
function renderContest() {
  const s = game.state, expected = game.score(), result = s.contest.result;
  const rank = [{name:'花语设计社',score:255},{name:'苏珊的衣橱',score:236},{name:'薄荷工作室',score:218},{name:'莉莉的花园',score:195},{name:'艾米的百货（你）',score:s.contest.best,me:true}].sort((a,b)=>b.score-a.score);
  return heading('A MOMENT TO SHINE','时装评比赛','用一套心爱的搭配，说出你的时尚故事。','<span class="label">试玩提前开放 · 正式 LV25</span>') +
  `<section class="contest-banner">${icon('contest')}<div><p class="eyebrow">SEASON 01 · STYLE CHALLENGE</p><h2>${CONTEST.name}</h2><p>微风、花香与不经意的心动。请搭配一套适合花园茶会的服饰。</p></div><div class="theme-tags">${CONTEST.tags.map(t=>`<span class="theme-tag">${t}</span>`).join('')}</div></section>
  <div class="contest-layout"><section><div class="stage" aria-label="当前搭配展示"><div class="stage-stars">✦ ✧ ✦</div><div class="stage-plinth"></div><div class="stage-outfit">${itemKey(s.contest.outfit[0])}<div class="stage-accessory">${itemKey(s.contest.outfit[2])}</div><div class="stage-shoe">${itemKey(s.contest.outfit[1])}</div></div><span class="stage-label">MAISON AMÉLIE · THE GARDEN COLLECTION</span></div><div class="outfit-summary"><div><h3>今天，想穿得温柔一点</h3><p>${expected.match}/3 件契合主题 · 搭配不消耗棋盘服饰</p></div><span class="score-pill">${expected.total}<small> /300 预估</small></span></div>
  <section class="closet"><div class="closet-header"><h3>从已发现的衣橱里挑选</h3><button class="text-button" data-action="auto-outfit">${icon('star')}一键推荐</button></div><div class="closet-tabs">${CHAINS.map((ch,c)=>`<button class="tab ${ui.closet===c?'active':''}" data-action="closet-tab" data-c="${c}" aria-pressed="${ui.closet===c}">${ch.name}</button>`).join('')}</div><div class="closet-items">${s.discovered.filter(k=>Number(k[0])===ui.closet).sort().map(k=>{const c=Number(k[0]),t=Number(k[2]),selected=s.contest.outfit[c]===k;return `<button class="closet-item ${selected?'selected':''}" data-action="outfit" data-c="${c}" data-key="${k}" aria-label="选择${CHAINS[c].names[t]}" aria-pressed="${selected}">${item(c,t)}${selected?icon('check'):''}<small>${CHAINS[c].tags[t]} · ${t+1}阶</small></button>`;}).join('')}</div><button class="text-button" data-action="nav" data-view="catalog" style="font-size:10px;margin-top:14px">去发现更多搭配 ${icon('arrow')}</button></section></section>
  <aside class="contest-side"><section class="panel judging-panel"><div class="panel-top"><h2>评委席</h2><small>${result?'上次评比':'等待你的登场'}</small></div><div class="judges">${[['薇','薇薇安','整体风格与主题'],['马','马修','廓形与材质层次'],['露','露西','花园茶会的氛围']].map(([letter,name,desc],i)=>`<div class="judge"><span class="judge-avatar">${letter}</span><div class="judge-copy"><b>${name}</b><p>${desc}</p></div><span class="judge-score">${result?result.judges[i]:'—'}</span></div>`).join('')}</div><div class="contest-enter"><button class="button full" data-action="enter-contest" ${s.daily.contestAttempts>=3||s.energy<5?'disabled':''}>${icon('contest')}提交搭配 ${money('energy',5)}</button><small>今日 ${s.daily.contestAttempts}/3 次 · 最高 ${s.contest.best} 分</small></div></section>
  <section class="panel reward-panel"><div class="panel-top"><h2>闪耀的里程碑</h2><small>每档只领一次</small></div>${CONTEST.thresholds.map((threshold,i)=>{const claimed=s.contest.claimed.includes(i),ready=s.contest.best>=threshold;return `<div class="reward-row"><span class="reward-medal">${icon('contest')}</span><div><b>${['花园新秀','人气设计师','闪耀之星'][i]} · ${threshold}分</b><p>${CONTEST.rewards[i].coins}金币 · ${CONTEST.rewards[i].gems}钻石 · ${CONTEST.rewards[i].fragments}碎片</p></div><button class="button small ${ready?'gold':'light'}" data-action="claim-contest" data-id="${i}" ${claimed||!ready?'disabled':''}>${claimed?'已领取':ready?'领取':'未达成'}</button></div>`;}).join('')}</section>
  <section class="panel ranking-panel"><div class="panel-top"><h2>花园荣誉榜</h2><small>本地模拟榜</small></div><div class="ranking-list">${rank.map((r,i)=>`<div class="ranking-row ${r.me?'me':''}"><span>${String(i+1).padStart(2,'0')}</span><span>${r.name}</span><b>${r.score}</b></div>`).join('')}</div><p class="ranking-note">其他席位为预设角色，不代表真实玩家或联网排名。</p></section></aside></div><p class="notice">${icon('info')}本试玩为固定主题练习赛。评分由阶数、风格标签和搭配完整度决定，无随机判分；正式周赛、联网排名与赛季结算未接入。</p>`;
}
function render() { renderHud(); renderNav(); $('#main').innerHTML = {map:renderMap,work:renderWork,shop:renderShop,catalog:renderCatalog,contest:renderContest}[ui.view](); renderClocks(); }
function renderClocks() {
  const s=game.state, now=Date.now();
  document.querySelectorAll('.order-clock').forEach(el=>{const secs=Math.max(0,240-Math.floor((now-Number(el.dataset.created))/1000));el.textContent=secs?`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`:'随时交付';});
  const regen=$('#regen-clock');if(regen){const secs=Math.ceil((REGEN-Math.max(0,now-s.energyAt)%REGEN)/1000);regen.textContent=s.energy===s.energyMax?'体力已满，去创造一点美好吧。':`下一点体力：${Math.floor(secs/60)}分${String(secs%60).padStart(2,'0')}秒`;} 
}
const modalTitle = (title, sub='') => `<h2 id="modal-title">${title}</h2>${sub?`<p class="modal-subtitle">${sub}</p>`:''}`;
function openCatalog(c,t) {
  const s=game.state,k=key(c,t),found=s.discovered.includes(k),claimed=s.claimed.includes(k),cost=8*(t+1),prior=t===0||s.discovered.includes(key(c,t-1));
  openModal(modalTitle(CHAINS[c].names[t],`${CHAINS[c].name}系列 · ${t+1}阶 · ${CHAINS[c].tags[t]}`)+item(c,t,'large')+
  `<p class="modal-description">${[['一针一线，把日常缝成温柔。','花语之间，也藏着精致的小心意。','轻盈的裙摆，像一朵刚开的玫瑰。','把花园的微风穿在身上。','夜幕降临，仍然优雅从容。','让所有灵感，汇成属于你的光。'],['从舒适开始，去走喜欢的路。','鞋尖上的蝴蝶结，藏着少女心。','轻快的脚步，追得上花园里的风。','经典总有自己的温度。','轻轻一抬脚，就走进好心情。','为下一次远行，做好准备。'],['一枚小发结，也能点亮平凡的一天。','轻柔的丝巾，留住花开的瞬间。','遮住日晒，不遮住好心情。','把所有小心愿装进口袋。','透过琥珀色，看看温暖的世界。','指尖上的光，是岁月的小礼物。']][c][t]}</p><div class="modal-info"><div class="row"><span>发现方式</span><span>${t<2?'生成器 / 购买 / 碎片':'上阶叠满 10 件 / 购买 / 碎片'}</span></div><div class="row"><span>首次发现奖励</span><span>${money('gems',t+1)}</span></div><div class="row"><span>图鉴状态</span><span>${found?'已发现 · 可用于评比赛':'尚未发现'}</span></div></div>`+
  (found?`<button class="button full ${claimed?'light':'gold'}" data-action="claim-item" data-c="${c}" data-t="${t}" ${claimed?'disabled':''}>${claimed?icon('check')+' 发现奖励已领取':'领取发现奖励 '+money('gems',t+1)}</button>`:`<button class="button gold full" data-action="fragment-discover" data-c="${c}" data-t="${t}" ${!prior||s.fragments<cost?'disabled':''}>${!prior?'先发现上一阶服装':'用 '+cost+' 碎片点亮（现有 '+s.fragments+'）'}</button><p class="modal-subtitle" style="margin-top:12px;text-align:center">仅点亮收藏与搭配，不生成棋盘实物</p>`) + `<button class="text-button" data-action="shop-item" style="display:flex;margin:15px auto 0">去精品衣橱看看 ${icon('arrow')}</button>`);
}
function openFloor(f) {
  ui.floor=f;
  const s=game.state,floor=FLOORS[f],unlocked=s.floors.includes(f),allowed=s.level>=floor.level&&(f===0||s.floors.includes(f-1)),theme=s.decorations[`${f}:${ui.zone}`]||'elegant';
  let body=modalTitle(`${f+1}F · ${floor.name}`,floor.subtitle)+`<div class="floor-preview ${theme}" style="background-position:center ${Math.max(0,floor.y-7)}%"><span>${unlocked?'已开放 · '+THEMES[theme]:`LV${floor.level} 解锁 · 当前 LV${s.level}`}</span></div>`;
  if(!unlocked) body+=`<p class="modal-description">${allowed?'这里已经等到你了。点亮新楼层，让百货再多一种可能。':'先继续完成顾客订单提升等级，并依次开放下方楼层。每个新的空间，都有一段新故事。'}</p><div class="modal-info"><div class="row"><span>开放条件</span><span>LV${floor.level} + 下方楼层已开放</span></div><div class="row"><span>改造费用</span><span>${money('coins',floor.cost)}</span></div><div class="row"><span>开放奖励</span><span>100 经验</span></div></div><button class="button full gold" data-action="unlock-floor" data-f="${f}" ${!allowed||s.coins<floor.cost?'disabled':''}>${allowed?'点亮这一层 '+money('coins',floor.cost):'继续提升等级'}</button><button class="text-button" style="display:flex;margin:16px auto 0" data-action="nav" data-view="work">去工作台赚取金币与经验 ${icon('arrow')}</button>`;
  else body+=`<p class="modal-description">这一层的风格，由你决定。已拥有的设计方案可以免费反复切换。</p><label for="zone-select" class="modal-subtitle">选择要布置的区域</label><select id="zone-select" class="zone-select">${['橱窗','货架','休息区'].map(z=>`<option ${ui.zone===z?'selected':''}>${z}</option>`).join('')}</select><div class="style-choices">${Object.entries(THEMES).map(([id,name])=>{const owned=s.ownedDecor.includes(`${id}:${ui.zone}`),current=s.decorations[`${f}:${ui.zone}`]===id;return `<button class="style-choice ${current?'selected':''}" data-action="apply-style" data-theme="${id}" data-f="${f}" ${current?'disabled':''}>${icon({sweet:'flower',natural:'leaf',elegant:'star'}[id])}<b>${name}</b><small style="display:block;color:#a39178;margin-top:5px">${current?'当前风格':owned?'免费应用':'商店解锁'}</small></button>`;}).join('')}</div><div class="modal-info">当前${ui.zone}：${s.decorations[`${f}:${ui.zone}`]?THEMES[s.decorations[`${f}:${ui.zone}`]]:'保留原有布置'}<br>风格应用后，主地图的区域色调与标记会更新。</div><button class="button light full" data-action="decor-shop">去商店寻找新设计 ${icon('shop')}</button>`;
  openModal(body);
}
function openStory() {
  openModal(modalTitle('一封没有寄出的信','第三章 · 重逢的心意')+`<div class="story-dialog"><img src="assets/designer.png" alt="设计师艾米"><p>亲爱的艾米：<br><br>如果有一天你回到这里，别急着把旧东西都换掉。那些裙摆、铜把手和窗边的椅子，都记得来过这里的人。<br><br>把橱窗的灯再点亮吧。有人会带着自己的故事回来，而你会听见百货重新呼吸的声音。</p></div><p class="story-signature">爱你的，姑妈</p><button class="button full mint" data-action="close-modal">把这份心意记下来 ${icon('book')}</button>`);
}
function openHelp() {
  openModal(modalTitle('把日常，整理成美好','Fashion Studio · 时光百货试玩说明')+`<ul class="modal-list"><li><b>工作台：</b>点击生成器消耗 1 / 2 / 4 体力；拖拽或两次点击，把同款同阶叠在一起。满 10 件升 1 阶，最高 6 阶。</li><li><b>订单：</b>只消耗棋盘服装，获得金币、钻石和经验；倒计时结束仍可交付，不扣奖励。</li><li><b>地图：</b>金币改造区域，完成章节任务；楼层按 LV1 / 8 / 12 / 18 / 25 / 32 逐层开放。</li><li><b>商店：</b>每日心意、体力、固定服饰、装饰方案。不涉及真实付费或真实广告。</li><li><b>图鉴：</b>18 件服饰，发现奖励每件一次；重复发现 +1 碎片，保留棋盘实物。</li><li><b>评比赛：</b>三部位搭配不消耗服饰，提交耗 5 体力，每日 3 次。评分可预估，无随机判分。</li><li><b>试玩节奏：</b>初始为 LV12；生成器 40% 产出 2 阶、25% 产出双件。此为试玩加速值，不是正式平衡数值。</li><li><b>恢复与存档：</b>2 分钟 / 点，支持离线恢复。本地自动存档，每日 08:00 北京时间刷新补给；可手动导入导出。</li></ul><div class="modal-actions"><button class="button mint" data-action="nav" data-view="work">去工作台</button><button class="button light" data-action="settings">试玩与存档</button></div>`);
}
function openSettings() {
  const s=game.state;
  openModal(modalTitle('试玩与存档','你的百货，你的节奏。')+`<div class="modal-info"><div class="row"><span>当前等级</span><b>LV ${s.level}</b></div><div class="row"><span>开放楼层</span><b>${s.floors.length}/6</b></div><div class="row"><span>存档方式</span><span>${storageError?'自动保存不可用':'此浏览器本地保存'}</span></div></div><p class="modal-description">原方案的正式成长门槛仍保留。为了查看高阶楼层，可以手动开启高级体验：将存档提升至 LV32，并增加 7,000 演示金币。这会改变当前试玩进度，建议先导出备份。</p><div class="settings-grid"><button class="button light" data-action="export-save">${icon('save')}导出存档</button><button class="button light" data-action="import-save">${icon('book')}导入存档</button><button class="button gold" data-action="advanced-confirm">${icon('star')}高级体验</button><button class="button light danger" data-action="reset-confirm">${icon('refresh')}重新开始</button></div><button class="text-button" data-action="help" style="display:flex;margin:18px auto 0">玩法说明 ${icon('info')}</button><p class="modal-subtitle" style="margin:16px 0 0">本地演示，无联网排行、支付、广告 SDK 与云端同步。</p>`);
}
function openProfile() {
  const s=game.state,need=xpNeed(s.level);
  openModal(modalTitle('艾米的成长手册',`LV ${s.level} · ${s.level>=25?'星光设计师':'见习设计师'}`)+`<div class="story-dialog"><img src="assets/designer.png" alt="艾米"><div><p>每一件服装、每一处改造，都会让百货离梦想更近一点。</p><div class="task-progress"><span style="width:${s.xp/need*100}%"></span></div><div class="progress-copy"><span>当前经验</span><span>${s.xp}/${need}</span></div></div></div><div class="modal-info"><div class="row"><span>体力上限</span><span>${s.energyMax}</span></div><div class="row"><span>已完成订单</span><span>${s.ordersDone}</span></div><div class="row"><span>下一楼层</span><span>${FLOORS.find((f,i)=>!s.floors.includes(i))?.name||'全部已开放'}</span></div></div><button class="button mint full" data-action="nav" data-view="work">继续今天的营业 ${icon('arrow')}</button><button class="text-button" data-action="settings" style="display:flex;margin:15px auto 0">试玩与存档 ${icon('settings')}</button>`);
}
function doTask() {
  const s=game.state,task=TASKS[s.task];
  if(!task){openStory();return;}
  if(!game.taskReady()) {
    if(task.orders){navigate('work');toast(`再完成 ${Math.max(0,task.orders-s.ordersDone)} 个订单，就能找到手稿线索`);return;}
    if(task.contest){navigate('contest');return;}
    openModal(modalTitle(task.title,'让百货离梦想更近一步')+`<p class="modal-description">${task.description}</p><div class="modal-info">需要 ${task.cost} 金币 · 当前 ${s.coins}<br>${task.floor!==undefined?'楼层等级要求：LV '+FLOORS[task.floor].level:''}</div><button class="button mint full" data-action="nav" data-view="work">去工作台赚取金币 ${icon('arrow')}</button>`);return;
  }
  const completed=game.finishTask();
  openModal(modalTitle('又实现了一个小心愿','百货的灯，又亮了一点')+`<div class="reward-celebrate">${icon(completed.unlock?'map':'flower')}<h3>${completed.title}</h3><p>+${completed.xp} 经验${completed.gems?' · +'+completed.gems+' 钻石':''}</p></div><p class="modal-description">${completed.zone?'新布置已经记在了百货的设计手册里。姑妈一定会喜欢这个温柔的变化。':completed.unlock?'新楼层已开放，去看看新的空间吧。':'谢谢你，把这段故事继续写了下去。'}</p><button class="button full mint" data-action="close-modal">继续装点百货 ${icon('arrow')}</button>`);celebrate($('#modal-content'));
}
function doMove(from,to) {
  ui.selected=null;ui.hint=false;const result=game.move(from,to);
  if(result.type==='merge') {if(!game.state.tutorial)game.completeTutorial();toast(`升阶成功！获得${CHAINS[result.item.c].names[result.item.t]}${result.isNew?' · 新图鉴发现':''}`);const cell=$(`.cell[data-index="${to}"]`);cell?.classList.add('burst');celebrate(cell);}
  else if(result.type==='stack')toast('同款归位，离下一阶又近了一点');
}
const actions = {
 'nav': b=>navigate(b.dataset.view), 'close-modal': closeModal, 'settings':openSettings, 'help':openHelp,'story':openStory,'profile':openProfile,
 'energy-shop':()=>{ui.shopTab='daily';navigate('shop');},
 'shop-tab':b=>{ui.shopTab=b.dataset.tab;render();},
 'catalog-tab':b=>{ui.catalogTab=b.dataset.tab;render();},
 'closet-tab':b=>{ui.closet=Number(b.dataset.c);render();},
 'floor':b=>openFloor(Number(b.dataset.f)),
 'task':doTask,
 'generate':b=>{const c=Number(b.dataset.c),r=game.generate(c);toast(`${CHAINS[c].names[r.item.t]} ×${r.item.n}${r.isNew?' · 新图鉴发现':' · +1 碎片'}`);$(`.cell[data-index="${r.index}"]`)?.classList.add('burst');},
 'cell':b=>{
   const n=Number(b.dataset.index),i=game.state.board[n];
   if(ui.selected===n){ui.selected=null;render();return;}
   const from=game.state.board[ui.selected];
   if(ui.selected!==null&&from&&(!i||(i.c===from.c&&i.t===from.t))){doMove(ui.selected,n);}
   else {ui.selected=i?n:null;render();}
   requestAnimationFrame(()=>$(`.cell[data-index="${n}"]`)?.focus({preventScroll:true}));
 },
 'sort':()=>{ui.selected=null;ui.hint=false;game.sort();toast('服装已按系列与阶数归位，不会消耗或自动合并');},
 'deliver':b=>{const r=game.deliver(Number(b.dataset.id));ui.selected=null;render();toast(`订单交付！+${r.coins} 金币${r.gems?' · +'+r.gems+' 钻石':''} · +${r.xp} 经验`);},
 'hint':()=>{const s=game.state,exists=s.board[14]?.c===0&&s.board[14]?.t===0&&s.board[14]?.n===9&&s.board[15]?.c===0&&s.board[15]?.t===0;if(exists){ui.hint=true;ui.selected=15;render();toast('再点发光的 9 件 T 恤那格，或直接拖过去');}else{toast('找两摞同款同阶服装，叠满 10 件即可升阶');}},
 'tutorial-done':()=>{game.completeTutorial();toast('按自己的节奏，慢慢整理吧');},
 'gift':()=>{game.gift();toast('收下今日心意：+120 金币 · +3 图鉴碎片');},
 'buy-energy':()=>{const r=game.buyEnergy();toast(`灵感补充 +${r.amount} 体力${r.price?' · 花费 '+r.price+' 钻石':' · 今日首瓶免费'}`);},
 'ad-energy':()=>{const amount=game.adEnergy();toast(`模拟补给完成：+${amount} 体力（未播放真实广告）`);},
 'refresh-shop':()=>{game.refreshShop();toast('每日精选已换新 · 花费 10 钻石');},
 'buy-item':b=>{const c=Number(b.dataset.c),t=Number(b.dataset.t),r=game.buyItem(c,t,b.dataset.offer);toast(`已购入${CHAINS[c].names[t]} · 放入工作台${r.isNew?' · 点亮新图鉴':''}`);},
 'catalog-item':b=>openCatalog(Number(b.dataset.c),Number(b.dataset.t)),
 'claim-item':b=>{const c=Number(b.dataset.c),t=Number(b.dataset.t),n=game.claimItem(c,t);openCatalog(c,t);toast(`首次发现奖励：+${n} 钻石`);},
 'fragment-discover':b=>{const c=Number(b.dataset.c),t=Number(b.dataset.t);game.fragmentDiscover(c,t);openCatalog(c,t);toast('图鉴已点亮！可以领取发现奖励并用于搭配');},
 'claim-chain':b=>{game.claimChain(Number(b.dataset.c));toast('系列收藏完成！+15 钻石');},
 'shop-item':()=>{ui.shopTab='wardrobe';navigate('shop');},
 'decor-shop':()=>{ui.shopTab='decor';navigate('shop');},
 'buy-decor':b=>{game.buyDecoration(b.dataset.theme,b.dataset.zone);toast('设计方案已解锁，可在主地图永久反复使用');},
 'use-decor':b=>{ui.zone=b.dataset.zone;const f=game.state.floors[game.state.floors.length-1];navigate('map');openFloor(f);},
 'apply-style':b=>{const theme=b.dataset.theme,f=Number(b.dataset.f);if(!game.state.ownedDecor.includes(`${theme}:${ui.zone}`)){ui.shopTab='decor';navigate('shop');toast('先解锁对应区域的设计，再免费应用');return;}game.decorate(f,ui.zone,theme);openFloor(f);toast(`${f+1}F ${ui.zone}已换为${THEMES[theme]}`);},
 'unlock-floor':b=>{const f=Number(b.dataset.f);game.unlockFloor(f);openFloor(f);toast(`${f+1}F ${FLOORS[f].name}已开放 · +100 经验`);celebrate($('#modal-content'));},
 'outfit':b=>game.outfit(Number(b.dataset.c),b.dataset.key),
 'auto-outfit':()=>{game.autoOutfit();toast('已选出当前衣橱中最契合花园主题的搭配');},
 'enter-contest':()=>{const r=game.enterContest();openModal(modalTitle('属于你的闪耀时刻','花园午后 · 评比结果')+`<div class="reward-celebrate">${icon('contest')}<h3>${r.total} / 300 分</h3><p>${r.total>=260?'闪耀之星':r.total>=215?'人气设计师':r.total>=150?'花园新秀':'灵感正在绽放'}</p></div><div class="modal-info">薇薇安 ${r.judges[0]} · 马修 ${r.judges[1]} · 露西 ${r.judges[2]}<br>${r.match}/3 件服饰契合主题 · 本次消耗 5 体力<br>已记录最高成绩：${game.state.contest.best} 分</div><button class="button full gold" data-action="close-modal">去收下里程碑奖励 ${icon('gift')}</button>`);celebrate($('#modal-content'));},
 'claim-contest':b=>{const r=game.claimContest(Number(b.dataset.id));toast(`闪耀奖励：+${r.coins} 金币 · +${r.gems} 钻石 · +${r.fragments} 碎片`);},
 'export-save':()=>{const blob=new Blob([JSON.stringify(game.state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='时光百货存档-'+new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('存档已导出，请妥善保留');},
 'import-save':()=>{$('#save-file').value='';$('#save-file').click();},
 'reset-confirm':()=>openModal(modalTitle('重新开始这段故事？','此操作会覆盖当前浏览器的试玩进度')+`<p class="modal-description">建议先导出存档。确认后，会恢复至 LV12 的初始体验存档；已获得的服装、装修与奖励记录会重新开始。</p><div class="modal-actions"><button class="button light" data-action="settings">返回</button><button class="button" data-action="reset">确认重新开始</button></div>`),
 'reset':()=>{game.reset();ui.selected=null;closeModal();navigate('map');toast('新的故事开始了 · LV12 体验存档已就绪');},
 'advanced-confirm':()=>openModal(modalTitle('开启高级体验？','仅用于查看高阶内容，不代表正式游戏成长速度')+`<p class="modal-description">当前存档将调整为 LV32、体力回满，并增加 7,000 演示金币。楼层仍需逐层购买开放，不会自动领取任何图鉴或赛事奖励。</p><div class="modal-actions"><button class="button light" data-action="settings">返回</button><button class="button gold" data-action="advanced">确认开启</button></div>`),
 'advanced':()=>{game.previewAdvanced();closeModal();navigate('map');toast('高级体验已开启 · LV32 · +7,000 演示金币');}
};
document.addEventListener('click',e=>{if(Date.now()<touchCompatUntil&&(e.pointerType==='touch'||e.sourceCapabilities?.firesTouchEvents||(e.detail>0&&!e.pointerType))){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;if(Date.now()<touchCompatUntil&&(e.pointerType==='touch'||e.sourceCapabilities?.firesTouchEvents))return;if(b.dataset.action==='cell'&&Date.now()<suppressUntil)return;const action=actions[b.dataset.action];if(action)run(()=>action(b));});
document.addEventListener('change',e=>{if(e.target.matches('.catalog-filter')){ui.catalogState=e.target.value;render();}if(e.target.id==='zone-select'){ui.zone=e.target.value;openFloor(ui.floor);}});
$('#save-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(file.size>512000){toast('存档过大，请选择本游戏导出的 JSON 文件');return;}try{const data=JSON.parse(await file.text());game.import(data);closeModal();ui.selected=null;render();toast('存档已导入，欢迎回到百货');}catch{toast('存档格式异常，原进度未更改');}});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function cleanupDrag(){drag?.ghost?.remove();document.querySelectorAll('.drag-source,.drop-over').forEach(el=>el.classList.remove('drag-source','drop-over'));drag=null;}
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){const target=e.target.closest('[data-action]');touchPress=target?{target,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false}:null;}const cell=e.target.closest('.cell');if(!cell||e.button!==0||!game.state.board[Number(cell.dataset.index)])return;drag={from:Number(cell.dataset.index),x:e.clientX,y:e.clientY,active:false,ghost:null};});
document.addEventListener('pointermove',e=>{
  if(touchPress&&e.pointerId===touchPress.id&&Math.hypot(e.clientX-touchPress.x,e.clientY-touchPress.y)>10)touchPress.moved=true;
  if(!drag)return;
  if(!drag.active){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;drag.active=true;drag.ghost=document.createElement('div');drag.ghost.className='ghost';const i=game.state.board[drag.from];if(!i){cleanupDrag();return;}drag.ghost.innerHTML=item(i.c,i.t);document.body.append(drag.ghost);$(`.cell[data-index="${drag.from}"]`)?.classList.add('drag-source');}
  e.preventDefault();drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';document.querySelectorAll('.drop-over').forEach(el=>el.classList.remove('drop-over'));document.elementFromPoint(e.clientX,e.clientY)?.closest('.cell')?.classList.add('drop-over');
},{passive:false});
document.addEventListener('pointerup',e=>{
 const press=touchPress;touchPress=null;const active=Boolean(drag?.active),from=drag?.from;
 const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cell');cleanupDrag();
 if(active){suppressUntil=Date.now()+700;if(e.pointerType==='touch')touchCompatUntil=Date.now()+700;if(cell&&Number(cell.dataset.index)!==from)run(()=>doMove(from,Number(cell.dataset.index)));return;}
 if(e.pointerType==='touch'&&press&&e.pointerId===press.id){
  const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-action]');
  if(!press.moved&&b===press.target&&!b.disabled){const fn=actions[b.dataset.action];if(fn){touchCompatUntil=Date.now()+700;run(()=>fn(b));}}
 }
});
document.addEventListener('pointercancel',()=>{touchPress=null;cleanupDrag();});
window.addEventListener('blur',cleanupDrag);
document.addEventListener('keydown',e=>{const cell=e.target.closest('.cell');if(!cell)return;const n=Number(cell.dataset.index),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-6,ArrowDown:6}[e.key];if(delta!==undefined){e.preventDefault();const next=Math.max(0,Math.min(35,n+delta));$(`.cell[data-index="${next}"]`)?.focus();}if(e.key==='Escape'){ui.selected=null;render();}});
window.addEventListener('popstate',()=>navigate(location.hash.slice(1)));window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
game.subscribe(()=>{save();render();if(game.state.level>priorLevel){toast(`升级啦！LV ${game.state.level} · 体力已回满`);}priorLevel=game.state.level;});
const initial=location.hash.slice(1);ui.view=navs.some(n=>n[0]===initial)?initial:'map';save();render();
if(loadMessage)setTimeout(()=>toast(loadMessage),600);if(storageError)setTimeout(()=>toast('浏览器不允许自动保存，请在试玩设置中手动导出'),700);
setInterval(()=>{game.tick();renderClocks();},1000);
window.addEventListener('pagehide',save);
window.fashionApp={game,ui,navigate};
})();


