// V51: one item per tile, movable producers and a lossless legacy inventory tray.
function workshopMigrate(s){
 assert(s.board.every(x=>!x||Number.isInteger(x.c)&&x.c>=0&&x.c<3&&Number.isInteger(x.t)&&x.t>=0&&x.t<=5&&Number.isInteger(x.n)&&x.n>=1&&x.n<=(x.t===5?10:9)),"材料数据异常");
 if(!s.workshop){
  const generators=[30,32,34],extras=[];
  s.board=s.board.map((x,i)=>{if(!x)return null;for(let k=0;k<x.n;k++)if(k>0||generators.includes(i))extras.push({c:x.c,t:x.t,n:1});return generators.includes(i)?null:{c:x.c,t:x.t,n:1};});
  s.workshop={version:1,generators,tray:[]};
  for(const x of extras){const i=s.board.findIndex((v,i)=>!v&&!generators.includes(i));if(i<0)s.workshop.tray.push(x);else s.board[i]=x;}
 }
 const w=s.workshop;
 assert(w.version===1&&Array.isArray(w.generators)&&w.generators.length===3&&new Set(w.generators).size===3&&w.generators.every(i=>Number.isInteger(i)&&i>=0&&i<36&&!s.board[i]),"材料箱位置异常");
 assert(Array.isArray(w.tray)&&w.tray.length<=10000&&w.tray.every(x=>x&&Number.isInteger(x.c)&&x.c>=0&&x.c<3&&Number.isInteger(x.t)&&x.t>=0&&x.t<=5&&x.n===1),"暂存材料异常");
 assert(s.board.every(x=>!x||x.n===1),"每格只能放一件材料");
 return s;
}
