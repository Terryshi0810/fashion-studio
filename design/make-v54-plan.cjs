'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const plan=JSON.parse(fs.readFileSync(path.join(root,'design/v53-appstore-benchmark.json'),'utf8'));
plan.version='V54-locked-producers-1';
plan.status='implemented_independent_v54';
plan.date='2026-11-04';
plan.title='时尚街区：可见目标与分阶段解锁的服装二合工坊';
plan.migration={...plan.migration,branch:'V54; preserve V53/V52/V51',saveKey:'fashion.loop.mobile.v54',oldKey:'fashion.loop.mobile.v53',schema:2};
plan.rules.unlockGrant='Persistent locked board token -> requirements complete -> explicit unlock in the same cell. No automatic inbox G4 grant.';
// These thresholds map the existing fashion tutorial, rather than claiming
// knowledge of a private, version-specific Gossip Harbor progression table.
const gates={
 tailoring:{slot:28,level:1,tutorial:0,deliveries:0,collections:0,previous:null,chapter:'重开工作室'},
 styling:{slot:6,level:4,tutorial:4,deliveries:4,collections:0,previous:'tailoring',chapter:'第一套通勤装'},
 footwear:{slot:13,level:7,tutorial:7,deliveries:7,collections:0,previous:'styling',chapter:'买手的造型课'},
 leather:{slot:20,level:9,tutorial:9,deliveries:9,collections:0,previous:'footwear',chapter:'街区全套造型'},
 jewelry:{slot:27,level:12,tutorial:10,deliveries:14,collections:2,previous:'leather',chapter:'配饰系列上新'},
 couture:{slot:34,level:16,tutorial:10,deliveries:22,collections:3,previous:'jewelry',chapter:'秀场高定邀请'},
 precision:{slot:0,level:21,tutorial:10,deliveries:32,collections:4,previous:'couture',chapter:'品牌细节工艺'},
};
for(const p of plan.producers){p.unlock={...gates[p.id]};p.unlockPlayerLevel=p.unlock.level;}
plan.producerUnlocks={
 policy:'visible-locked-ready-unlocked',initialUnlocked:['tailoring'],
 reserveLockedCells:true,unlockCost:0,keepCellOnUnlock:true,protectLockedToken:true,
 ordinaryOrdersRequireRealSource:true,legacyOwnedProducersStayUnlocked:true,
 pacingOrigin:'Local fashion tutorial/collection mapping; original exact unlock thresholds remain unverified.',
 newPlayerRange:'1–10: tailoring immediately; styling after tutorial 4; footwear after tutorial 7; leather after tutorial 9.',
};
const fourth=plan.tutorial[3];
fourth.grant=[{kind:'energy',amount:15}];
fourth.grantDeduplicationKey='tutorial_4';
fourth.unlockHint='造型台条件达成，在棋盘点击锁定生产器启用。';
plan.tutorial[6].unlockHint='制鞋台条件达成，在棋盘点击锁定生产器启用。';
plan.tutorial[8].unlockHint='皮具配饰台条件达成，在棋盘点击锁定生产器启用。';
plan.benchmark={...plan.benchmark,
 primaryVersion:null,
 previousVersionAnchor:{version:'4.11.0',verification:'Inherited V53 note; not reverified as latest on 2026-11-04.'},
 alternateListing:{...plan.benchmark.alternateListing,verification:'Inherited V53 note; current listing not reverified.'},
 acceptanceMode:'fashion-playable-mapping-original-thresholds-pending',
 unlockParity:'Not verified. Do not present the local level/tutorial/collection gates as original 1:1 values.',
 verdict:'可见锁定、条件提示、原地解锁、解锁后接单已实现；原作同版本逐级门槛仍待实测。',
};
fs.writeFileSync(path.join(root,'design/v54-workshop-plan.json'),JSON.stringify(plan,null,2)+'\n');
console.log('Generated V54 plan: visible locks and explicit unlocks; exact reference thresholds unverified.');
