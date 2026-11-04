'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const p=JSON.parse(fs.readFileSync(path.join(__dirname,'../design/v52-fashion-merge-plan.json'),'utf8'));
assert.equal(p.status,'design_only_not_integrated');assert.equal(p.chains.length,14);assert.equal(p.producers.length,7);assert.equal(p.art.itemIcons,140);assert.equal(p.art.producerIcons,63);
const items=new Map(p.chains.flatMap(c=>c.items).map(x=>[x.id,x]));assert.equal(items.size,140);
for(const c of p.chains){assert.equal(c.items.length,c.maxLevel);assert.ok(p.producers.some(g=>g.id===c.producerId));for(const [i,x]of c.items.entries()){assert.equal(x.level,i+1);assert.equal(x.baseUnits,2**i);assert.equal(x.mergeTo,i<c.maxLevel-1?c.items[i+1].id:null);assert.equal(p.stages.filter(s=>x.level>=s.min&&x.level<=s.max).length,1);}}
for(const g of p.producers){assert.ok(p.chains.some(c=>c.id===g.primary));assert.ok(p.chains.some(c=>c.id===g.secondary));assert.ok(g.primaryWeight+g.secondaryWeight===1);assert.equal(g.initialGrantLevel,g.firstFunctionalLevel);assert.equal(p.chains.filter(c=>c.producerId===g.id).length,2);}
for(const g of p.producerLevels){for(const dist of[g.primaryLevels,g.secondaryLevels])if(dist.length)assert.ok(Math.abs(dist.reduce((n,[l,w])=>n+w,0)-1)<1e-9);}
for(const o of p.tutorial){assert.ok(o.needs.length>=1&&o.needs.length<=3);for(const r of o.needs){const item=items.get(r.itemId),chain=p.chains.find(c=>c.id===item.chainId);assert.ok(item);assert.ok(item.orderable);assert.ok(chain.unlockPlayerLevel<=o.minimumPlayerLevel);}}
// Walk tutorial grants and level gates: upgrade parts can produce the functional
// sources before a secondary-chain order appears. This does not simulate drops.
const inventory=Object.fromEntries(p.producers.map(g=>[g.id,Array(10).fill(0)]));inventory.tailoring[4]=1;
let level=1,xp=0;
const xpNeed=l=>l<=10?p.growth.levelXpNeeds[l-1]:300+50*(l-10);
for(const o of p.tutorial){
 assert.ok(level>=o.minimumPlayerLevel,`Unreachable player gate before ${o.id}`);
 for(const r of o.needs){const item=items.get(r.itemId),chain=p.chains.find(c=>c.id===item.chainId),g=p.producers.find(g=>g.id===chain.producerId),required=g.secondary===chain.id?g.secondaryAt:4;assert.ok(inventory[g.id].some((n,l)=>n>0&&l>=required),`Missing source before ${o.id}: ${g.id} G${required}`);}
 for(const g of o.grant){if(g.kind==='producer'||g.kind==='producer_part')inventory[g.family][g.level]+=g.amount;}
 for(const row of Object.values(inventory))for(let l=1;l<9;l++){row[l+1]+=Math.floor(row[l]/2);row[l]%=2;}
 xp+=o.xp;while(xp>=xpNeed(level)){xp-=xpNeed(level);level++;}
}
assert.equal(level,5,'Tutorial should end at player level5');
const required=['头发','上衣','裤子','鞋子','连衣裙','饰品','帽子','包包','手持','耳坠','项链','眼镜','手套','戒指'];assert.deepEqual(p.chains.map(x=>x.name),required);
assert.equal(p.board.columns*p.board.rows,p.board.totalTiles);assert.ok(p.board.initialOpenTiles-p.producers.length>=8);assert.equal(p.migration.saveKey,'fashion.loop.mobile.v52');
console.log('PASS design integrity: 7 families, 14 chains, 140 contiguous item nodes, 63 producer levels, complete links, normalized drop distributions and 8 tutorial order references.');
console.log('Design validation only; gameplay balance and implementation have not been tested.');
