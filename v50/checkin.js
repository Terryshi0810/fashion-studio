// Compiled into the existing runtime closure: use the established save and
// reward transactions, with real visible controls and one calendar date model.
function checkinArtV50(kind) {
  const symbol = {coins:'coin',energy:'energy',vouchers:'ticket',seals:'star'}[kind] || 'gift';
  return `<svg class="checkin-art" aria-hidden="true" viewBox="0 0 64 64"><use href="#g-${symbol}"/></svg>`;
}
function checkinTabsV50() {
  return `<nav class="checkin-tabs" aria-label="活动页签">${[['recommend','推荐活动'],['signin','每日签到']].map(([id,label])=>`<button type="button" data-action="signin-tab" data-tab="${id}" class="${signinTabV30===id?'active':''}" aria-pressed="${signinTabV30===id}">${label}</button>`).join('')}</nav>`;
}
function checkinCloseV50() {
  return '<button type="button" class="checkin-close" data-action="close" aria-label="关闭签到"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>';
}
function renderSigninModalBase() {
  signinSyncMonth();
  const date=signinDate(),today=date.getDate(),month=date.getMonth(),year=date.getFullYear();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const pad=new Date(year,month,1).getDay();
  const weeks=Math.ceil((pad+daysInMonth)/7);
  const selected=Math.min(daysInMonth,Math.max(1,Number(signinSelectedDay||today)));
  const selectedClaimed=signinState.days.includes(selected),past=selected<today;
  const canClaim=selected<=today&&!selectedClaimed&&(!past||signinState.makeupUsed<SIGNIN_MAKEUP_LIMIT);
  const reward=signinReward(selected),history=signinHistoryTarget();
  const historyReady=signinState.lifetimeDays>=history.day&&!signinState.lifetimeClaims.includes(history.day);
  const monthName=date.toLocaleString('en',{month:'long'}).toUpperCase();
  const cells=Array.from({length:pad},()=>'<span aria-hidden="true"></span>').concat(Array.from({length:daysInMonth},(_,i)=>{
    const day=i+1,gift=signinReward(day),claimed=signinState.days.includes(day),old=day<today;
    const enabled=day<=today&&(claimed||!old||signinState.makeupUsed<SIGNIN_MAKEUP_LIMIT);
    const state=claimed?'已签到':day===today?'可签到':old?(enabled?'可补签':'已错过'):'未开启';
    return `<button type="button" class="checkin-day ${claimed?'is-claimed':''} ${day===today?'is-today':''} ${day===selected?'is-selected':''} ${day>today?'is-future':''}" data-action="signin-select" data-day="${day}" ${enabled?'':'disabled'} aria-pressed="${day===selected}" aria-label="${month+1}月${day}日，${state}，${esc(gift.label)}"><span class="checkin-day-number">${day}</span>${checkinArtV50(gift.kind)}<b>${esc(gift.label.replace('服饰券','券'))}</b>${claimed?'<span class="checkin-day-check" aria-hidden="true">✓</span>':''}</button>`;
  })).join('');
  return `<section class="checkin-window" aria-label="${year}年${month+1}月每日签到">
    <img class="checkin-bow" src="${asset('signin-bow-v50.png')}" alt="" draggable="false">
    <header class="checkin-header"><h2>每日签到</h2>${checkinTabsV50()}</header>
    <div class="checkin-hero"><div class="checkin-portrait"><img src="${model(game.state.profile.avatar)}" alt="本月签到角色" draggable="false"><b>R</b><span>时尚街区</span></div><div class="checkin-summary"><div class="checkin-monthcount">本月累计天数 <strong>${signinState.days.length}</strong></div><div class="checkin-progress" aria-label="已完成${SIGNIN_MILESTONES.filter(x=>signinState.days.length>=x.day).length}个签到阶段">${SIGNIN_MILESTONES.map(x=>`<i class="${signinState.days.length>=x.day?'done':''}"></i>`).join('')}</div><span class="checkin-pill">♡ 每天一份心动好礼</span></div></div>
    <div class="checkin-stages" aria-label="阶段签到奖励"><small>本月可补签 ${SIGNIN_MAKEUP_LIMIT-signinState.makeupUsed}/${SIGNIN_MAKEUP_LIMIT}</small>${SIGNIN_MILESTONES.map(x=>`<div class="checkin-stage">${checkinArtV50(x.kind)}<b>${esc(x.label)}</b><span>累计${x.day}天</span>${signinState.milestones.includes(x.day)?'<i class="checkin-tick" aria-label="已领取">✓</i>':''}</div>`).join('')}</div>
    <div class="checkin-calendar-box"><div class="checkin-calendar-heading"><b>✦ ${monthName}</b><span>${year} · 每日签到奖励</span></div><div class="checkin-weekdays" aria-hidden="true">${['日','一','二','三','四','五','六'].map(x=>`<span>${x}</span>`).join('')}</div><div class="checkin-days" style="--weeks:${weeks}" aria-label="${month+1}月签到日历">${cells}</div></div>
    <div class="checkin-action"><button type="button" class="checkin-claim" data-action="signin-claim" ${canClaim?'':'disabled'}><span>${selectedClaimed?(selected===today?'今日已签到':`第${selected}天已签到`):past?`补签第${selected}天`:selected>today?'尚未开启':'立即签到'}</span><small>${selectedClaimed?'已领取':'领取'} ${esc(reward.label)}</small></button><p>奖励直接存入背包 · 选择错过的日期可补签</p></div>
    <footer class="checkin-bottom"><div class="checkin-lifetime"><span>历史签到天数</span><b>${signinState.lifetimeDays} 天</b></div><div class="checkin-history"><small>累计${history.day}天${signinState.lifetimeClaims.includes(history.day)?' · 已领取':'可领取'}</small><span>${checkinArtV50(history.kind)}${esc(history.label)}</span><button type="button" data-action="signin-history-claim" ${historyReady?'':'disabled'}>${historyReady?'领取':'未达成'}</button></div>${checkinCloseV50()}</footer>
  </section>`;
}
function renderCheckinRecommendV50() {
  const checked=signinState.days.includes(signinDate().getDate()),posts=game.state.community?.posts?.length||0;
  return `<section class="checkin-window is-recommend" aria-label="推荐活动"><img class="checkin-bow" src="${asset('signin-bow-v50.png')}" alt=""><header class="checkin-header"><h2>心动企划</h2>${checkinTabsV50()}</header><div class="checkin-event"><h3>春日衣橱 · 轻盈上新</h3><p>签到收下灵感，去工作台制作样衣，再把新搭配发布到穿搭日记。</p><div class="checkin-event-task">${checkinArtV50('energy')}<div><b>今日签到</b><small>${checked?'今日奖励已到账':'每天领取签到好礼'}</small></div><button data-action="signin-tab" data-tab="signin">${checked?'查看奖励':'去签到'}</button></div><div class="checkin-event-task">${checkinArtV50('seals')}<div><b>合成样衣</b><small>推进设计与上新目标</small></div><button data-action="nav" data-view="work">去工作台</button></div><div class="checkin-event-task">${checkinArtV50('vouchers')}<div><b>发布穿搭日记</b><small>${posts?'已有作品，继续分享灵感':'搭配成衣，分享你的设计'}</small></div><button data-action="nav" data-view="contest">去发布</button></div><p class="checkin-event-note">签到奖励、合成里程碑与日记奖励，分别在对应功能中领取。</p></div><footer class="checkin-bottom"><div class="checkin-lifetime"><span>历史签到</span><b>${signinState.lifetimeDays} 天</b></div><span>把灵感穿成自己的故事</span>${checkinCloseV50()}</footer></section>`;
}
function renderSigninModal() {return signinTabV30==='recommend'?renderCheckinRecommendV50():renderSigninModalBase();}
function signinRefreshV30() {
  modal.classList.add('signin-dialog','checkin-dialog');
  modal.innerHTML=renderSigninModal();
  if(!modal.open)modal.showModal();
  syncSigninNotice();
}
function openSigninModal() {
  signinSyncMonth();signinSelectedDay=signinDate().getDate();signinTabV30='signin';signinRefreshV30();
}
function signinSelect(day) {
  signinSyncMonth();const today=signinDate().getDate();day=Number(day);
  const max=new Date(signinDate().getFullYear(),signinDate().getMonth()+1,0).getDate();
  if(!Number.isInteger(day)||day<1||day>max||day>today||(!signinState.days.includes(day)&&day<today&&signinState.makeupUsed>=SIGNIN_MAKEUP_LIMIT))return;
  signinSelectedDay=day;signinTabV30='signin';signinRefreshV30();
}
modal.addEventListener('close',()=>modal.classList.remove('signin-dialog','checkin-dialog'));
