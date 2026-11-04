(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FashionWorkshop=api;})(globalThis,function(){
'use strict';
let P,items,chains,producers;
const copy=x=>JSON.parse(JSON.stringify(x)),ok=(v,m)=>{if(!v)throw Error(m);};
const integer=(v,max=1e9)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
function configure(plan){P=plan;chains=Object.fromEntries(P.chains.map(c=>[c.id,c]));items=Object.fromEntries(P.chains.flatMap(c=>c.items.map(i=>[i.id,i])));producers=Object.fromEntries(P.producers.map(p=>[p.id,p]));return api;}
const item=id=>items[id],producer=id=>producers[id];
const art=x=>x.kind==='producer'?`workshop-v52/producers/${x.family}/generator_${x.family}_g${String(x.level).padStart(2,'0')}.png`:`workshop-v52/items/${item(x.itemId).chainId}/merge_${x.itemId}.png`;
const name=x=>x.kind==='producer'?`${producer(x.family).name} G${x.level}`:item(x.itemId).name;
const designCount=a=>(a?.discovered||[]).filter(id=>item(id)?.level>=3).length;
function newerSave(state,text){if(!text)return true;try{const incoming=JSON.parse(text);return !Number.isFinite(incoming.savedAt)||incoming.savedAt>state.savedAt;}catch{return true;}}
const iid=(chain,level)=>chain+'_'+String(level).padStart(2,'0');
function token(a,data){return {uid:'w'+a.nextUid++,...data};}
function part(a,family,level,now){return token(a,{kind:'producer',family,level,charge:level>=4?P.producerLevels[level-1].capacity:0,chargeAt:now,misses:0});}
function material(a,id){return token(a,{kind:'item',itemId:id});}
function xpNeed(level){return P.growth.levelXpNeeds[level-1]||300+50*(level-10);}
function addXp(a,n){a.xp+=n;while(a.level<30&&a.xp>=xpNeed(a.level)){a.xp-=xpNeed(a.level);a.level++;}if(a.level===30)a.xp=Math.min(a.xp,xpNeed(30)-1);}
function give(a,key,grants,now){if(a.grants.includes(key))return; a.grants.push(key);for(const g of grants){if(g.kind==='producer'||g.kind==='producer_part')for(let i=0;i<g.amount;i++)a.inbox.push(part(a,g.family,g.level,now));else if(g.kind==='energy')a.energyGifts+=g.amount;else if(g.kind==='chapter_flag'&&!a.flags.includes(g.flag))a.flags.push(g.flag);}}
function fresh(now=Date.now()){
 const a={version:1,nextUid:1,nextOrder:1,level:1,xp:0,board:Array(63).fill(null),open:35,inventory:[],inbox:[],grants:[],energyGifts:0,orders:[],delivered:[],deliveredCount:0,supplyClaims:0,tutorial:0,discovered:[],merges:0,collections:[],storySeen:[],reputation:0,flags:[],boost:1,rerollAt:0,tools:{scissors:1,upgrade:1,hourglass:1},undo:null,lastDelivery:null};
 a.board[28]=part(a,'tailoring',4,now);a.board[21]=material(a,'top_01');a.board[22]=material(a,'top_01');a.discovered=['top_01'];a.grants=['unlock_tailoring'];ensure(a,now);return a;
}
function validToken(x){ok(x&&/^w\d+$/.test(x.uid),'工坊物品编号异常');if(x.kind==='item')ok(items[x.itemId],'工坊物品不存在');else{ok(x.kind==='producer'&&producers[x.family]&&integer(x.level,9)&&x.level>=1,'生产器数据异常');ok(Number.isFinite(x.charge)&&x.charge>=0&&x.charge<=(x.level<4?0:P.producerLevels[x.level-1].capacity),'充能数据异常');ok(Number.isFinite(x.chargeAt)&&x.chargeAt>0&&integer(x.misses,12),'充能时间异常');}}
function validate(a){
 ok(a?.version===1&&Array.isArray(a.board)&&a.board.length===63,'服装二合工坊存档异常');ok(integer(a.open,63)&&a.open>=35&&a.open%7===0,'棋盘区域异常');
 for(const k of ['inventory','inbox','orders','delivered','grants','discovered','collections','storySeen','flags'])ok(Array.isArray(a[k]),'工坊记录异常');
 ok(a.inventory.length<=8&&a.inbox.length<10000,'工坊仓库异常');
 const all=[...a.board.filter(Boolean),...a.inventory,...a.inbox];all.forEach(validToken);ok(new Set(all.map(x=>x.uid)).size===all.length,'物品重复');ok(a.board.slice(a.open).every(x=>x===null),'未开放格有物品');
 for(const k of ['nextUid','nextOrder','level','xp','deliveredCount','tutorial','merges','energyGifts','reputation'])ok(integer(a[k]),'工坊数值异常');
 a.supplyClaims??=0;ok(integer(a.supplyClaims)&&a.supplyClaims<=Math.floor(a.deliveredCount/5),'零件补给记录异常');
 ok(a.level>=1&&a.level<=30&&a.xp<xpNeed(a.level)&&a.tutorial<=8,'工坊成长异常');ok([1,2,4].includes(a.boost)&&a.boost<=(a.level>=15?4:a.level>=8?2:1),'加速等级异常');
 ok(new Set(a.orders.map(o=>o.id)).size===a.orders.length&&a.orders.length<=3,'顾客订单重复');ok(new Set(a.delivered).size===a.delivered.length,'交付记录重复');
 for(const o of a.orders){ok(/^order-\d+$/.test(o.id)&&!a.delivered.includes(o.id)&&o.needs.length>=1&&o.needs.length<=3,'订单记录异常');for(const n of o.needs)ok(items[n.itemId]&&integer(n.quantity,3)&&n.quantity>0,'订单需求异常');ok(integer(o.coins)&&integer(o.xp),'订单奖励异常');}
 for(const n of Object.values(a.tools))ok(integer(n,100),'道具数量异常');return a;
}
function tick(a,now){for(const x of [...a.board.filter(Boolean),...a.inventory,...a.inbox]){if(x.kind!=='producer'||x.level<4)continue;const g=P.producerLevels[x.level-1];if(now<x.chargeAt){x.chargeAt=now;continue;}x.charge=Math.min(g.capacity,x.charge+(now-x.chargeAt)/1000*g.capacity/g.rechargeSeconds);x.chargeAt=now;}if(a.undo&&now>a.undo.until)a.undo=null;}
function source(a,chainId){const c=chains[chainId],p=producer(c.producerId),need=c.id===p.secondary?p.secondaryAt:4;return [...a.board.filter(Boolean),...a.inventory].filter(x=>x.kind==='producer'&&x.family===p.id&&x.level>=need).sort((a,b)=>b.level-a.level)[0]||null;}
function available(a){return P.chains.filter(c=>a.level>=c.unlockPlayerLevel&&source(a,c.id));}
function empty(a,from=28){let best=-1,dist=1e9;for(let i=0;i<a.open;i++){if(a.board[i])continue;const d=Math.abs(i%7-from%7)+Math.abs((i/7|0)-(from/7|0));if(d<dist){dist=d;best=i;}}return best;}
function count(a,id){return [...a.board,...a.inventory].filter(x=>x?.kind==='item'&&x.itemId===id).length;}
function allocation(a,needs){const pool=[...a.board.map((x,i)=>({x,place:'board',i})),...a.inventory.map((x,i)=>({x,place:'inventory',i}))];const chosen=[];for(const n of needs){const matches=pool.filter(e=>e.x?.kind==='item'&&e.x.itemId===n.itemId&&!chosen.some(c=>c.x.uid===e.x.uid)).slice(0,n.quantity);if(matches.length!==n.quantity)return null;chosen.push(...matches);}return chosen;}
function expectedUnits(p,x,secondary){const table=P.producerLevels[x.level-1][secondary?'secondaryLevels':'primaryLevels'];return table.reduce((v,[l,w])=>v+2**(l-1)*w,0)*(x.level>=p.secondaryAt?(secondary?p.secondaryWeight:p.primaryWeight):1);}
function estimate(a,needs){const families={},used={};for(const n of needs){const i=item(n.itemId),c=chains[i.chainId],x=source(a,c.id);if(!x)return Infinity;const p=producer(x.family),secondary=c.id===p.secondary,stock=Math.max(0,count(a,n.itemId)-(used[n.itemId]||0)),taken=Math.min(n.quantity,stock);used[n.itemId]=(used[n.itemId]||0)+taken;const remaining=(n.quantity-taken)*i.baseUnits,cost=remaining/expectedUnits(p,x,secondary),f=families[p.id]||(families[p.id]={primary:0,secondary:0});f[secondary?'secondary':'primary']+=cost;}return Object.values(families).reduce((sum,f)=>sum+Math.max(f.primary,f.secondary),0);}
function phase(a){return P.chapters.find(c=>a.level>=c.playerLevels[0]&&a.level<=c.playerLevels[1])||P.chapters[0];}
function makeOrder(a,role,needs,customer,text,tutorialIndex=null){const units=needs.reduce((v,n)=>v+item(n.itemId).baseUnits*n.quantity,0);return {id:'order-'+a.nextOrder++,role,needs,customer,text,tutorialIndex,coins:Math.max(20,units*5),xp:tutorialIndex!==null?P.tutorial[tutorialIndex].xp:Math.max(5,Math.round(units*.5))};}
function normalOrder(a,role){
 const cands=available(a),ch=phase(a),budget=ch.costRanges[role][1];const options=[];
 for(const c of cands)for(let level=c.orderMinLevel;level<=Math.min(c.ordinaryOrderMaxLevel,ch.normalTierCap);level++){const needs=[{itemId:iid(c.id,level),quantity:1}],cost=estimate(a,needs);if(cost<=budget)options.push({needs,cost});}
 if(role!=='fast'){
  const singles=options.slice();
  for(let i=0;i<singles.length;i++)for(let j=i+1;j<singles.length;j++){
   const one=singles[i].needs[0],two=singles[j].needs[0];
   if(item(one.itemId).chainId===item(two.itemId).chainId)continue;
   const needs=[one,two],cost=estimate(a,needs);if(cost<=budget)options.push({needs,cost});
  }
 }
 // Sources can remain in the warehouse; recall is always possible by storing any item.
 ok(options.length,'暂无可生产的订单来源，请召回生产器');const target=role==='fast'?4:role==='medium'?12:30;
 options.sort((x,y)=>Math.abs(x.cost-target)-Math.abs(y.cost-target));const best=options.slice(0,Math.min(4,options.length));const chosen=best[(a.nextOrder+(role==='fast'?0:1))%best.length];
 const people=['小悠','阿澈','林夕','米娅','买手许薇'];const id=a.nextOrder%people.length;
 return makeOrder(a,role,chosen.needs,people[id],['我要把今天的好心情穿出来。','这次上新，别让我输给前同事。','预算有限，气场不限。','买手已经在路上，衣服还在路上。','先看版型，再谈品牌故事。'][id]);
}
function ensure(a,now){
 for(const p of P.producers)if(a.level>=p.unlockPlayerLevel)give(a,'unlock_'+p.id,[{kind:'producer',family:p.id,level:4,amount:1}],now);
 if(a.tutorial<8&&!a.orders.some(o=>o.tutorialIndex!==null)){
  const t=P.tutorial[a.tutorial],ready=a.level>=t.minimumPlayerLevel&&t.needs.every(n=>source(a,item(n.itemId).chainId))&&t.producerPrerequisites.every(p=>[...a.board.filter(Boolean),...a.inventory].some(x=>x.kind==='producer'&&x.family===p.id&&x.level>=p.minLevel));
  if(ready){if(a.orders.length>=3)a.orders.pop();a.orders.unshift(makeOrder(a,'story',copy(t.needs),t.customer,t.text,a.tutorial));}
 }
 const roles=['fast','medium',a.level>=5?'long':'fast'];while(a.orders.length<3){const used=a.orders.filter(o=>o.tutorialIndex===null).map(o=>o.role);const role=roles.find(r=>!used.includes(r))||'fast';a.orders.push(normalOrder(a,role));}
 return a;
}
function pick(table,rng){let n=rng();for(const [v,w] of table){n-=w;if(n<0)return v;}return table.at(-1)[0];}
function produce(a,index,{now,energy,rng=Math.random}){
 const x=a.board[index];ok(x?.kind==='producer','请点击生产器');ok(x.level>=4,'两份同级零件合成，G4开始生产');tick(a,now);
 const dest=empty(a,index);ok(dest>=0,'棋盘已满，先合成、交付或存入仓库');ok(energy>=a.boost,'体力不足，可领取补给或等待恢复');ok(x.charge>=1,'生产器正在充能，可用沙漏加速');
 const p=producer(x.family),g=P.producerLevels[x.level-1],hasSide=x.level>=p.secondaryAt,side=hasSide&&(x.misses>=12||rng()<p.secondaryWeight);
 const chainId=side?p.secondary:p.primary,level=Math.min(chains[chainId].maxLevel,pick(g[side?'secondaryLevels':'primaryLevels'],rng)+Math.log2(a.boost));
 const id=iid(chainId,level);x.misses=side?0:Math.min(12,x.misses+1);x.charge-=1;a.board[dest]=material(a,id);if(!a.discovered.includes(id))a.discovered.push(id);
 return {type:'produce',from:index,to:dest,energyCost:a.boost,itemId:id};
}
function move(a,from,to,now){
 ok(integer(from,62)&&integer(to,62)&&from<a.open&&to<a.open&&from!==to,'不能移动到未开放格');const x=a.board[from],y=a.board[to];ok(x,'起点没有物品');
 const same=x&&y&&x.kind===y.kind&&(x.kind==='item'?x.itemId===y.itemId:x.family===y.family&&x.level===y.level);
 const next=same&&(x.kind==='item'?item(x.itemId).mergeTo:x.level<9);
 if(next){
  if(x.kind==='item'){a.board[to]=material(a,item(x.itemId).mergeTo);if(!a.discovered.includes(a.board[to].itemId))a.discovered.push(a.board[to].itemId);}
  else{tick(a,now);const z=part(a,x.family,x.level+1,now);z.charge=Math.min(P.producerLevels[z.level-1].capacity,x.charge+y.charge);if(z.level===4&&x.level===3)z.charge=P.producerLevels[3].capacity;a.board[to]=z;}
  a.board[from]=null;a.merges++;ensure(a,now);return {type:'merge',to,name:name(a.board[to])};
 }
 a.board[from]=y;a.board[to]=x;return {type:y?'swap':'move',to};
}
function deliver(a,id,now){const at=a.orders.findIndex(o=>o.id===id);ok(at>=0&&!a.delivered.includes(id),'订单已交付或已刷新');const o=a.orders[at],matched=allocation(a,o.needs);ok(matched,'服饰尚未齐备，点击需求查看来源');
 const used=new Set(matched.map(x=>x.x.uid));a.board=a.board.map(x=>used.has(x?.uid)?null:x);a.inventory=a.inventory.filter(x=>!used.has(x.uid));a.orders.splice(at,1);a.delivered.push(id);a.deliveredCount++;addXp(a,o.xp);a.reputation+=o.role==='story'?3:1;
 if(o.tutorialIndex!==null){ok(o.tutorialIndex===a.tutorial,'教学订单阶段异常');const t=P.tutorial[a.tutorial];give(a,t.grantDeduplicationKey,t.grant.filter(g=>g.kind!=='producer'||!a.grants.includes('unlock_'+g.family)),now);a.tutorial++;}
 a.lastDelivery={id,customer:o.customer,coins:o.coins,xp:o.xp,at:now};ensure(a,now);return {type:'delivery',coins:o.coins,xp:o.xp,customer:o.customer,needs:o.needs};
}
function safeRemove(a,x){if(x.kind!=='producer'||x.level<4)return;ok([...a.board.filter(Boolean),...a.inventory].filter(v=>v.kind==='producer'&&v.family===x.family&&v.level>=4).length>1,'最后一台可工作生产器不能回收');}
function act(a,action,args,{now=Date.now(),energy=100,rng=Math.random}={}){
 tick(a,now);
 if(action==='produce')return produce(a,args[0],{now,energy,rng});
 if(action==='move')return move(a,args[0],args[1],now);
 if(action==='deliver')return deliver(a,args[0],now);
 if(action==='claim'){const x=a.inbox[args[0]],i=empty(a);ok(x,'奖励已领取');ok(i>=0,'棋盘已满，先存入仓库再领取');a.inbox.splice(args[0],1);a.board[i]=x;ensure(a,now);return {type:'claim',to:i};}
 if(action==='supply'){ok(Math.floor(a.deliveredCount/5)>a.supplyClaims,'每完成5单获得一箱零件补给');const p=producer(args[0]);ok(p&&a.level>=p.unlockPlayerLevel,'该生产器尚未开放');a.supplyClaims++;give(a,'supply_'+a.supplyClaims,[{kind:'producer_part',family:p.id,level:3,amount:2}],now);return {type:'supply'};}
 if(action==='energy'){ok(a.energyGifts>0,'暂无待领体力，使用每日补给');ok(energy<100,'体力已满，礼盒为你保留');const n=Math.min(100-energy,a.energyGifts);a.energyGifts-=n;return {energyGain:n};}
 if(action==='boost'){const values=a.level>=15?[1,2,4]:a.level>=8?[1,2]:[1];ok(values.length>1,'工坊Lv8开放2倍生产，Lv15开放4倍');a.boost=values[(values.indexOf(a.boost)+1)%values.length];return {};}
 if(action==='store'){const i=args[0],x=a.board[i];ok(x,'请先选中物品');ok(a.inventory.length<8,'仓库已满，先取出物品');a.board[i]=null;a.inventory.push(x);return {};}
 if(action==='recall'){const x=a.inventory[args[0]],i=empty(a);ok(x,'仓库物品已取出');ok(i>=0,'棋盘已满');a.inventory.splice(args[0],1);a.board[i]=x;return {to:i};}
 if(action==='recycle'){const i=args[0],x=a.board[i];ok(x,'请先选中物品');safeRemove(a,x);ok(x.kind==='item','生产器零件请保留用于升级');a.undo={item:x,until:now+10000};a.board[i]=null;return {};}
 if(action==='undo'){ok(a.undo&&now<=a.undo.until,'撤销时间已过');const i=empty(a);ok(i>=0,'棋盘已满');a.board[i]=a.undo.item;a.undo=null;return {to:i};}
 if(action==='tool'){
  const [tool,index]=args,x=a.board[index];ok(a.tools[tool]>0,'该道具已用完');ok(x,'请先选择目标');
  if(tool==='hourglass'){ok(x.kind==='producer'&&x.level>=4,'沙漏用于可工作的生产器');x.charge=P.producerLevels[x.level-1].capacity;x.chargeAt=now;}
  else{ok(x.kind==='item','该道具用于服装物品');const i=item(x.itemId);if(tool==='scissors'){ok(i.level>=2,'L1不能拆分');const dest=empty(a,index);ok(dest>=0,'拆分需要一个空格');const id=iid(i.chainId,i.level-1);a.board[index]=material(a,id);a.board[dest]=material(a,id);}else{ok(i.mergeTo&&i.level<11,'升级卡最高升至L11');a.board[index]=material(a,i.mergeTo);if(!a.discovered.includes(i.mergeTo))a.discovered.push(i.mergeTo);}}
  a.tools[tool]--;return {to:index,type:'merge'};
 }
 if(action==='reroll'){ok(now>=a.rerollAt,'免费换单每30分钟一次');const o=a.orders.find(o=>o.id===args[0]);ok(o&&o.tutorialIndex===null,'剧情委托不能刷新');a.orders.splice(a.orders.indexOf(o),1,normalOrder(a,o.role));a.rerollAt=now+1800000;return {};}
 if(action==='publish'){const n=a.collections.length,threshold=[2,5,10,18,28][n];ok(threshold&&a.deliveredCount>=threshold,'完成更多顾客委托后上新');a.collections.push('collection-'+(n+1));a.open=Math.min(63,35+a.collections.length*7);return {type:'publish',coins:100*(n+1),xp:20};}
 if(action==='story'){const index=a.collections.length-1;ok(index>=0&&!a.storySeen.includes(index),'先完成系列上新，或该剧情已读');ok([0,1].includes(args[0]),'请选择回应');a.storySeen.push(index);a.flags.push('choice-'+index+'-'+args[0]);a.reputation+=args[0]===0?3:2;return {type:'story',coins:50,xp:10};}
 throw Error('未知工坊操作');
}
const api={configure,fresh,validate,act,tick,ensure,item,producer,art,name,designCount,newerSave,count,allocation,source,available,estimate,phase,xpNeed,empty,copy};return api;
});
