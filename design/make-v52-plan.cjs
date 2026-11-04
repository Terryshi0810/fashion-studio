'use strict';
// Design deliverables only. This script never changes the playable V51 build.
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const data=[
 ['hair','头发','styling',3,3,'发丝束|假发胚|清爽短发|柔顺中发|空气刘海|微卷长发|法式波浪|编发半披|丝带盘发|花冠编发|舞台公主发|星光高定发'],
 ['top','上衣','tailoring',1,3,'棉布卷|上衣裁片|基础白T|条纹短袖|雪纺衬衫|荷叶边上衣|针织开衫|缎面衬衫|丝绒短上衣|珠绣罩衫|花边披肩|玫瑰礼服上装|星钻披肩|月光高定上装|典藏秀场上装'],
 ['pants','裤子','tailoring',1,3,'丹宁布料|裤装裁片|日常短裤|直筒长裤|阔腿牛仔裤|高腰西裤|缎面阔腿裤|刺绣喇叭裤|星砂舞台裤|典藏高定裤'],
 ['shoes','鞋子','footwear',6,3,'鞋材包|鞋面胚|帆布鞋|系带短靴|小皮鞋|蝴蝶结单鞋|漆皮高跟鞋|缎带舞鞋|珠光长靴|水晶礼鞋|玫瑰高定鞋|星耀典藏鞋'],
 ['dress','连衣裙','couture',16,3,'裙装丝料|裙装裁片|日常吊带裙|碎花短裙|学院百褶裙|轻纱连衣裙|法式茶歇裙|缎面长裙|蕾丝晚礼裙|流光鱼尾裙|玫瑰舞会裙|星河高定裙|王冠典藏裙|终章秀场礼服'],
 ['accessory','饰品','leather',9,3,'饰品零件|缎带结|蝴蝶结胸针|珍珠发夹|花语腰饰|羽毛肩饰|水晶胸针|典藏珠宝胸饰'],
 ['hat','帽子','styling',3,3,'帽饰布片|帽胚|针织帽|贝雷帽|缎带礼帽|花饰宽檐帽|羽饰小礼帽|典藏冠帽'],
 ['bag','包包','leather',9,3,'皮料包|包袋胚|帆布托特包|迷你斜挎包|学院双肩包|链条手袋|蝴蝶结提包|珠光晚宴包|刺绣方包|水晶手拿包|玫瑰高定包|典藏艺术包'],
 ['handheld','手持','couture',16,2,'花艺素材|单枝玫瑰|丝带花束|折扇|蕾丝洋伞|珠光捧花|星光手杖|典藏舞会权杖'],
 ['earrings','耳坠','jewelry',12,2,'耳饰零件|银色耳钉|珍珠耳坠|花瓣耳饰|流苏长耳坠|星钻耳环|典藏水晶耳坠'],
 ['necklace','项链','jewelry',12,2,'金属链|细链项链|爱心吊坠|珍珠项链|缎带颈饰|花语宝石链|层叠珠链|星光锁骨链|玫瑰高定项链|典藏钻石项链'],
 ['glasses','眼镜','precision',21,2,'镜架零件|圆框眼镜|细框眼镜|复古方框镜|猫眼眼镜|浅色墨镜|金边墨镜|蝶翼装饰镜|星钻秀场镜|典藏艺术眼镜'],
 ['gloves','手套','footwear',6,3,'针织线|手套胚|日常针织手套|蕾丝短手套|缎面长手套|珠绣礼服手套|典藏丝绒手套'],
 ['ring','戒指','precision',21,2,'戒托零件|素银戒指|爱心戒指|珍珠戒指|宝石花戒|星钻戒指|典藏皇冠戒指']
];
const stages=[
 {id:'raw',name:'材料与基础胚',min:1,max:2},
 {id:'daily',name:'日常成品',min:3,max:5},
 {id:'fashion',name:'潮流精品',min:6,max:8},
 {id:'runway',name:'秀场设计',min:9,max:11},
 {id:'couture',name:'高定典藏',min:12,max:15}
];
const producers=[
 {id:'tailoring',name:'裁缝台',primary:'top',secondary:'pants',unlockPlayerLevel:1,secondaryAt:5},
 {id:'styling',name:'造型台',primary:'hair',secondary:'hat',unlockPlayerLevel:3,secondaryAt:5},
 {id:'footwear',name:'制鞋台',primary:'shoes',secondary:'gloves',unlockPlayerLevel:6,secondaryAt:5},
 {id:'leather',name:'皮具配饰台',primary:'bag',secondary:'accessory',unlockPlayerLevel:9,secondaryAt:5},
 {id:'jewelry',name:'珠宝台',primary:'necklace',secondary:'earrings',unlockPlayerLevel:12,secondaryAt:5},
 {id:'couture',name:'高定台',primary:'dress',secondary:'handheld',unlockPlayerLevel:16,secondaryAt:6},
 {id:'precision',name:'精工台',primary:'glasses',secondary:'ring',unlockPlayerLevel:21,secondaryAt:5}
].map(p=>({...p,maxLevel:9,firstFunctionalLevel:4,initialGrantLevel:4,upgrade:'two_same_family_same_level',protectLastFunctionalProducer:true,primaryWeight:.75,secondaryWeight:.25}));
const producerLevels=[
 {level:1,kind:'part',capacity:0,rechargeSeconds:0,primaryLevels:[],secondaryLevels:[]},
 {level:2,kind:'part',capacity:0,rechargeSeconds:0,primaryLevels:[],secondaryLevels:[]},
 {level:3,kind:'part',capacity:0,rechargeSeconds:0,primaryLevels:[],secondaryLevels:[]},
 {level:4,kind:'functional',capacity:24,rechargeSeconds:300,primaryLevels:[[1,1]],secondaryLevels:[]},
 {level:5,kind:'functional',capacity:30,rechargeSeconds:240,primaryLevels:[[1,.8],[2,.2]],secondaryLevels:[[1,1]]},
 {level:6,kind:'functional',capacity:36,rechargeSeconds:210,primaryLevels:[[1,.65],[2,.3],[3,.05]],secondaryLevels:[[1,.9],[2,.1]]},
 {level:7,kind:'functional',capacity:42,rechargeSeconds:180,primaryLevels:[[1,.5],[2,.38],[3,.12]],secondaryLevels:[[1,.8],[2,.2]]},
 {level:8,kind:'functional',capacity:48,rechargeSeconds:150,primaryLevels:[[1,.35],[2,.45],[3,.2]],secondaryLevels:[[1,.65],[2,.3],[3,.05]]},
 {level:9,kind:'functional',capacity:60,rechargeSeconds:120,primaryLevels:[[1,.2],[2,.5],[3,.3]],secondaryLevels:[[1,.5],[2,.35],[3,.15]]}
];
const chains=data.map(([id,name,producerId,unlockPlayerLevel,orderMinLevel,line])=>{
 const names=line.split('|');return {id,name,producerId,unlockPlayerLevel,orderMinLevel,maxLevel:names.length,ordinaryOrderMaxLevel:Math.min(names.length,11),
  items:names.map((name,i)=>{const level=i+1;return {id:`${id}_${String(level).padStart(2,'0')}`,chainId:id,level,name,stageId:stages.find(s=>level>=s.min&&level<=s.max).id,baseUnits:2**i,mergeTo:level<names.length?`${id}_${String(level+1).padStart(2,'0')}`:null,orderable:level>=orderMinLevel,longTermOnly:level>=12,asset:null,assetStatus:'to_author',wardrobeUnlockId:null};})};
});
const chapters=[
 {id:1,name:'重开工作室',playerLevels:[1,5],producers:['tailoring','styling'],normalTierCap:5,costRanges:{fast:[2,8],medium:[8,20],long:[20,40]},plot:'前搭档卷走样衣；完成邻居的开业订单，找回第一位造型买手。'},
 {id:2,name:'街区上新',playerLevels:[6,10],producers:['footwear','leather'],normalTierCap:7,costRanges:{fast:[4,12],medium:[12,30],long:[30,80]},plot:'原料商临时涨价；用通勤套装订单证明自己的供应能力。'},
 {id:3,name:'第一位品牌买手',playerLevels:[11,15],producers:['jewelry'],normalTierCap:8,costRanges:{fast:[6,16],medium:[16,45],long:[45,120]},plot:'对手买通博主嘲笑你的配饰；完成买手审查订单，争取橱窗位置。'},
 {id:4,name:'被调包的秀场',playerLevels:[16,20],producers:['couture'],normalTierCap:9,costRanges:{fast:[8,20],medium:[20,60],long:[60,160]},plot:'秀场礼服临时被调包；从客户订单和材料线索找出泄密者。'},
 {id:5,name:'时尚街区首秀',playerLevels:[21,30],producers:['precision'],normalTierCap:11,costRanges:{fast:[8,24],medium:[24,80],long:[80,240]},plot:'用独立设计系列赢回主场；完整造型揭晓供应链背后的利益关系。'}
];
const tutorial=[
 {id:'intro_01',customer:'小悠',needs:[['top',3,1]],text:'面试可以紧张，白T不能皱。',grant:[{kind:'energy',amount:10}]},
 {id:'intro_02',customer:'阿澈',needs:[['top',4,1]],text:'第一次见买手，我想穿得像有备而来。',grant:[{kind:'producer_part',family:'tailoring',level:3,amount:2}]},
 {id:'intro_03',customer:'林夕',needs:[['pants',3,1]],text:'老板让我气场两米，我先从裤子开始。',grant:[{kind:'energy',amount:15}]},
 {id:'intro_04',customer:'小悠',needs:[['top',3,1],['pants',3,1]],text:'上衣和裤子都齐了，勇气我自己搭。',grant:[{kind:'producer',family:'styling',level:4,amount:1}],minimumPlayerLevel:3},
 {id:'intro_05',customer:'米娅',needs:[['hair',3,1]],text:'开店可以熬夜，发型不能替我承认。',grant:[{kind:'energy',amount:10}]},
 {id:'intro_06',customer:'林夕',needs:[['hair',4,1],['top',4,1]],text:'今天见前搭档，状态必须像已经翻篇。',grant:[{kind:'producer_part',family:'styling',level:3,amount:2}]},
 {id:'intro_07',customer:'阿澈',needs:[['hat',3,1]],text:'买手说我没记忆点，这顶帽子应该有。',grant:[{kind:'energy',amount:15}]},
 {id:'intro_08',customer:'买手许薇',needs:[['top',5,1],['pants',4,1],['hat',3,1]],text:'别给我讲品牌故事，让你的第一套通勤造型自己说。',story:true,grant:[{kind:'chapter_flag',flag:'first_collection',amount:1}]}
].map((o,i)=>({...o,index:i+1,minimumPlayerLevel:o.minimumPlayerLevel??(i<3?1:3),needs:o.needs.map(([chainId,level,quantity])=>({itemId:`${chainId}_${String(level).padStart(2,'0')}`,quantity})),autoGenerate:false,completion:'all_items_atomic',rewardProfile:i===7?'story':'tutorial',xp:[15,15,45,20,20,25,25,65][i],producerPrerequisites:i===2?[{id:'tailoring',minLevel:5}]:i===6?[{id:'styling',minLevel:5}]:[],grantDeduplicationKey:i===3?'unlock_styling':`tutorial_${i+1}`}));
const plan={
 version:'V52-design-1',status:'design_only_not_integrated',date:'2026-11-03',title:'时尚街区：服装图谱与订单驱动二合工坊',
 provenance:{mechanics:'Reference public Gossip Harbor gameplay; fashion mapping and tuning are our proposal.',hiddenEconomy:'Unverified. Do not describe proposed probabilities, counts or rewards as exact original values.',sources:[
  {id:'official_cn',type:'publisher_listing',url:'https://www.taptap.cn/app/472491',fact:'制作、顾客需求、修复经营与情节联动'},
  {id:'official_global',type:'publisher_listing',url:'https://apps.apple.com/us/app/gossip-harbor-merge-story/id1623318294',fact:'合成、顾客、修复及人物剧情'},
  {id:'wiki_generator',type:'community_observation',url:'https://gossip-harbor.fandom.com/wiki/Coffee/Tea_Generators',fact:'G1–3零件、G4主产出、G5第二品类；不能推断所有家族同级数'},
  {id:'wiki_bread',type:'community_observation',url:'https://gossip-harbor.fandom.com/wiki/Bread',fact:'玩家图谱列至L15；L12后注明测试差异'},
  {id:'wiki_tea',type:'community_observation',url:'https://gossip-harbor.fandom.com/wiki/Tea',fact:'玩家图谱茶链7级'},
  {id:'wiki_boost',type:'community_observation',url:'https://gossip-harbor.fandom.com/wiki/Generator_Booster',fact:'1x/2x/4x；8x存在条件/版本差异，首版不照搬'}
 ]},
 board:{columns:7,rows:9,totalTiles:63,initialOpenTiles:35,openingPolicy:'blocked tiles open through chapter objectives; retain at least 8 empty tiles after initial rewards',maxFunctionalProducersOnBoard:7,inventorySlots:8,shortScreenMode:'smaller cells plus tap-to-merge; never hide last row',allNumbers:'project_proposal'},
 rules:{mergeInputs:2,maxTierMerge:false,normalDropEnergy:1,boosts:[{factor:1,energy:1,tierOffset:0},{factor:2,energy:2,tierOffset:1,unlockPlayerLevel:8},{factor:4,energy:4,tierOffset:2,unlockPlayerLevel:15}],energyCap:100,energyRegenSeconds:120,boostUsesCapacityPerTap:1,boostNeverRaisesPastChainMax:true,chargeRecovery:'one token each rechargeSeconds/capacity seconds, fractional progress persists',unlockGrant:'first G4 from chapter milestone; player must claim it before source is considered available'},
 growth:{levelXpNeeds:[30,45,65,90,120,150,180,220,260,300],laterLevelXp:'300 + 50 * (level - 10)',origin:'new branch proposal; do not inherit V51 curve 200+120*(level-1)',tutorial:'first 3 fixed orders yield 75 XP total and unlock level3 before the fourth order'},
 stages,producers,producerLevels,chains,chapters,tutorial,
 orderRules:{normalSlots:3,slotRoles:['fast','medium','long'],storySlots:1,chapter1LongUnlockPlayerLevel:5,itemsPerOrder:[1,3],atMostLongOrders:1,tutorialSequential:true,
  requireFunctionalSource:true,requireSecondaryProducerLevel:true,requireReachableTierAndBudget:true,ordinaryNeverRequiresLevel12Plus:true,mustHaveAtLeastOneFastOrder:true,deadline:false,
  delivery:'consume matching production inventory only; atomically validate and consume all requirements, then grant rewards once by order id',wardrobeIsNotProductionInventory:true,
  estimatedEnergy:'For each producer: max(unfilled primary base units / expected primary units per energy, unfilled secondary base units / expected secondary units per energy); sum across producer families. Inventory allocator cannot split higher tiers without an explicit tool.',
  guards:['ignore unclaimed producer grants','never ask unreleased item assets','exclude inactive family until it can be recalled','reserve enough charges for fast order or provide recovery path','reroll only not-yet-completed orders without consuming stock'],
  rewardDraft:{coinsPerCanonicalBaseUnit:5,minimumCoins:20,xpPerCanonicalBaseUnit:.5,minimumXp:5,storyProgress:'chapter objective per specified delivered order; idle bank cannot supply it',tuningStatus:'proposal_not_original_values'},
  reroll:{cost:0,cooldownSeconds:1800,keepItems:true},longTerm:'max-tier auto-buy or special commission; never a mandatory early story gate',
  sideChainPity:{enabledForDemo:true,maxMisses:12,meaning:'after 12 primary results, next eligible tap yields secondary; resets per producer family',origin:'our demo protection, not a verified original rule'}},
 inventory:{productionConsumes:true,wardrobePermanent:true,firstDiscoveryMarksOnly:true,actualWardrobeGrantRequiresAuthoredMapping:true,trashProtectsLastProducer:true,recycleUndoSeconds:10},
 tools:[{id:'scissors',name:'拆分剪刀',effect:'one non-producer item level2+ becomes two previous-level items; require a spare tile; cannot split borrowed or special story items'},{id:'upgrade_card',name:'灵感升级卡',effect:'one production item gains one level; ordinary items up to level11 only; cannot upgrade producers or max-tier items'},{id:'hourglass',name:'充能沙漏',effect:'subtract a fixed amount of producer recovery time; no energy generation'},{id:'energy_box',name:'体力礼盒',effect:'finite chapter or daily grants; claim atomically with unique reward id'}],
 effects:{drop:'producer compression, output flight to nearest empty tile, one sound per tap',merge:'source follows finger, valid-target outline, brief squash/pop and tier spark, no whole-board displacement',delivery:'reserve requirements, play item flight, grant rewards after atomic commit, input disabled only for the current order',bubbles:{enabledAfterTutorial:true,dropChanceDraft:.05,lifetimeSecondsDraft:60,definition:'optional copy for visible voucher price, can dismiss; no real payment in demo',origin:'proposal_not_original_values'}},
 art:{itemIcons:chains.reduce((n,c)=>n+c.maxLevel,0),producerIcons:producers.length*9,extraAssets:'customer portraits, blockers, energy and tool chains; not counted in 203 base icons',baseIconSize:256,masterIconSize:512,background:'transparent',pivot:'consistent within each chain',genericIconsCannotStandForDifferentNamedItems:true,wardrobeLayers:'Separate authored assets aligned to base model; 140 icons do not imply 140 wearable parts.'},
 migration:{branch:'V52-prototype, keep V51 unchanged',saveKey:'fashion.loop.mobile.v52',oldKey:'fashion.loop.mobile.v51',preserveBackup:true,neverInferCategoryFromOldThreeChainId:true,oldMaterials:'legacy tray, freely exchange with visible preview at preserved old economic value; no silent category remap',oldOrders:'finish in legacy mode or cancel/refund before starting new order queue',oldCloset:'preserve all ownership and outfits'},
 rollout:[{id:'A',scope:'new board, producers, unit item schema, 3 direct-delivery orders; 2 families, first8 tutorial orders',maxOrdinaryTier:5},{id:'B',scope:'all7 families /14 chains, weighted drops, cooldowns, inventory, tools, order budgets and guards'},{id:'C',scope:'chapter milestones, mall upgrades, authored wardrobe rewards, story and full balance tests'}]
};
fs.writeFileSync(path.join(root,'v52-fashion-merge-plan.json'),JSON.stringify(plan,null,2)+'\n','utf8');
let md='# V52 服装合成图谱：140个节点清单\n\n这是规划清单，尚未生成美术，也未接入V51。所有等级配置为项目提案。\n\n';
for(const c of chains){md+=`## ${c.name}：L1–L${c.maxLevel}\n\n生产器：${producers.find(p=>p.id===c.producerId).name}。常规订单最低L${c.orderMinLevel}；是否出单还需检查生产器、预算和章节。\n\n| 等级 | 名称 | 表现阶段 | L1等价值 | 后继 |\n| --- | --- | --- | ---: | --- |\n`;for(const item of c.items)md+=`| L${item.level} | ${item.name} | ${stages.find(s=>s.id===item.stageId).name} | ${item.baseUnits} | ${item.mergeTo?'L'+(item.level+1):'满级'} |\n`;md+='\n';}
fs.writeFileSync(path.join(root,'V52-服装合成图谱节点清单.md'),md,'utf8');
console.log(`Design only: ${producers.length} producers, ${chains.length} chains, ${plan.art.itemIcons} item nodes, ${tutorial.length} tutorial orders. V51 unchanged.`);
