 producerAt(index){return this.state.workshop.generators.indexOf(index);}
 workshopSpaces(){return this.state.board.map((x,i)=>!x&&this.producerAt(i)<0?i:-1).filter(i=>i>=0);}
 generate(c,count=1,rank=this.generatorRank()){
  return this.tx(s=>{
   assert(Number.isInteger(c)&&CHAINS[c],"材料箱不存在");assert([1,5].includes(count),"生成次数错误");
   assert(this.generatorOpen(c),c===1?"开放星光定制馆后解锁鞋履材料":"女装店升到3级后解锁配饰材料");
   const origin=s.workshop.generators[c],distance=i=>Math.abs(i%6-origin%6)+Math.abs(Math.floor(i/6)-Math.floor(origin/6));
   const spaces=this.workshopSpaces().sort((a,b)=>distance(a)-distance(b)||a-b);
   assert(spaces.length>=count,"棋盘已满，请先合成、研发或回收材料");
   assert(Number.isInteger(rank)&&rank>=0&&rank<=this.generatorRank(),"材料阶数尚未解锁");
   this.spend(s,"energy",CHAINS[c].cost*count);
   return spaces.slice(0,count).map(i=>{s.board[i]={c,t:Math.min(5,rank+(this.random()<.25?1:0)),n:1};return i;});
  });
 }
 moveProducer(from,to){
  return this.tx(s=>{
   const c=this.producerAt(from);assert(c>=0&&Number.isInteger(to)&&to>=0&&to<36&&to!==from,"请选择另一个格子");
   const other=this.producerAt(to);
   if(other>=0)s.workshop.generators[other]=from;
   else{s.board[from]=s.board[to];s.board[to]=null;}
   s.workshop.generators[c]=to;return {producer:true};
  });
 }
 move(from,to){
  if(this.producerAt(from)>=0)return this.moveProducer(from,to);
  return this.tx(s=>{
   assert(Number.isInteger(from)&&Number.isInteger(to)&&from>=0&&from<36&&to>=0&&to<36&&from!==to,"选择另一个格子");
   assert(this.producerAt(to)<0,"材料箱不能接收材料，请拖到空格或同款材料上");
   const a=s.board[from],b=s.board[to];assert(a,"这里没有材料");
   if(!b){s.board[to]=a;s.board[from]=null;return {merge:false};}
   if(a.c!==b.c||a.t!==b.t||a.t===5){s.board[from]=b;s.board[to]=a;return {merge:false,swap:true,max:a.c===b.c&&a.t===5&&b.t===5};}
   s.board[to]={c:a.c,t:a.t+1,n:1};s.board[from]=null;s.merges++;s.mergeStats.total++;
   const total=s.mergeStats.total,milestone=MERGE_MILESTONES.find(m=>total>=m&&!s.mergeStats.claimed.includes(m));
   let reward=null;
   if(milestone){
    const r={3:{coins:200,vouchers:2,energy:0,seals:0},6:{coins:400,vouchers:0,energy:5,seals:0},10:{coins:0,vouchers:5,energy:0,seals:1}}[milestone];
    s.mergeStats.claimed.push(milestone);reward={milestone,...r};
   }else if(total>10&&(total-10)%10===0)reward={milestone:total,coins:0,vouchers:5,energy:5,seals:0};
   if(reward){s.coins=Math.min(MAX,s.coins+reward.coins);s.vouchers=Math.min(MAX,s.vouchers+reward.vouchers);s.seals=Math.min(MAX,s.seals+reward.seals);s.energy=Math.min(100,s.energy+reward.energy);s.mergeStats.lastReward=reward;this.log(s,`完成${total}次合成，阶段奖励已到账`);}
   return {merge:true,t:a.t+1,need:2,reward};
  });
 }
 sort(){return this.tx(s=>{const cells=s.board.filter(Boolean).sort((a,b)=>a.c-b.c||a.t-b.t);s.board=Array(36).fill(null);for(let i=0;i<36;i++)if(this.producerAt(i)<0&&cells.length)s.board[i]=cells.shift();});}
 takeTray(){return this.tx(s=>{assert(s.workshop.tray.length,"暂存区没有材料");const i=this.workshopSpaces()[0];assert(i!==undefined,"棋盘已满，请先合成或研发材料");s.board[i]=s.workshop.tray.shift();return i;});}
 recycle(i){return this.tx(s=>{assert(this.producerAt(i)<0,"材料箱不能回收");assert(Number.isInteger(i)&&s.board[i],"先选中一件材料");s.board[i]=null;});}
 count(c,t){return [...this.state.board,...this.state.workshop.tray].reduce((n,x)=>n+(x&&x.c===c&&x.t===t?x.n:0),0);}
