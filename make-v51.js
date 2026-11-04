'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8'),write=(n,s)=>fs.writeFileSync(path.join(root,n),s,'utf8');
function once(s,a,b){if(s.split(a).length!==2)throw Error('Expected one match: '+a.slice(0,80));return s.replace(a,b);}
let runtime=read('fashion-studio-mobile-trial-v50-runtime.js');
runtime=runtime.replaceAll('fashion-studio-mobile-trial-v50','fashion-studio-mobile-trial-v51').replaceAll('V0.50','V0.51');
runtime=runtime.replaceAll('女装样衣','女装材料').replaceAll('鞋履样衣','鞋履材料').replaceAll('配饰样衣','配饰材料');
runtime=runtime.replaceAll('const MERGE_NEEDS=[10,10,8,6,4]','const MERGE_NEEDS=[2,2,2,2,2]');
runtime=once(runtime,'function fresh(now=Date.now()){',read('v51/workshop-core.js')+'\nfunction fresh(now=Date.now()){');
runtime=once(runtime,'board[14]={c:0,t:0,n:9}','board[14]={c:0,t:0,n:1}');
runtime=once(runtime,'board[20]={c:2,t:0,n:9}','board[20]={c:2,t:0,n:1}');
runtime=once(runtime,'shops:[{open:true,level:1,business:[],staff:false},{open:false,level:1,business:[],staff:false}],board,','shops:[{open:true,level:1,business:[],staff:false},{open:false,level:1,business:[],staff:false}],board,workshop:{version:1,generators:[30,32,34],tray:[]},');
runtime=once(runtime,'assert(Array.isArray(s.board)&&s.board.length===36,"工作台数据异常");','assert(Array.isArray(s.board)&&s.board.length===36,"工作台数据异常");workshopMigrate(s);');
const start=runtime.indexOf(' generate(c,count=1,rank='),end=runtime.indexOf(' researchInfo(id)',start);
if(start<0||end<0)throw Error('Missing board methods');
runtime=runtime.slice(0,start)+read('v51/workshop-methods.js')+'\n'+runtime.slice(end);
runtime=once(runtime,'s.blueprints.push(id);this.addXP(s,60);','for(let i=0;i<s.workshop.tray.length&&remaining;){const item=s.workshop.tray[i];if(item.c===info.c&&item.t===info.t){s.workshop.tray.splice(i,1);remaining--;}else i++;}assert(remaining===0,"材料数量发生变化，请重试");s.blueprints.push(id);this.addXP(s,60);');
// Separate save key preserves V50's stacking rules when rolling back.
runtime=once(runtime,'const KEY="fashion.loop.mobile.v6"','const KEY="fashion.loop.mobile.v51"');
runtime=once(runtime,'const text=localStorage.getItem(KEY);','const text=localStorage.getItem(KEY)||localStorage.getItem("fashion.loop.mobile.v6");');
runtime=once(runtime,'function effectiveRank(){return Math.min(game.generatorRank(),game.researchInfo(ui.recipe??3).t);}','function effectiveRank(){return Math.min(game.generatorRank(),game.researchInfo(game.state.activeOrder?.item??ui.recipe??3).t);}');
const viewStart=runtime.indexOf('function renderWork(){'),viewEnd=runtime.indexOf('function orderMaterialPanel',viewStart);
runtime=runtime.slice(0,viewStart)+read('v51/workshop-view.js')+'\n'+runtime.slice(viewEnd);
runtime=once(runtime,'if(ui.view==="work")$("#view").insertAdjacentHTML("afterbegin",renderStoryMiniCard());','if(ui.view==="work")requestAnimationFrame(workshopFit);');
const inputStart=runtime.indexOf('function boardFeedback(from,to){'),inputEnd=runtime.indexOf('let boardGesture=',inputStart);
runtime=runtime.slice(0,inputStart)+read('v51/workshop-input.js')+'\n'+runtime.slice(inputEnd);
runtime=once(runtime,'source:!!game.state.board[Number(cell.dataset.index)]','source:!!game.state.board[Number(cell.dataset.index)]||game.producerAt(Number(cell.dataset.index))>=0');
runtime=once(runtime,'if(n!==g.index&&a&&(!b||a.c===b.c&&a.t===b.t&&(a.t!==5||b.n<10)))','if(n!==g.index&&(game.producerAt(g.index)>=0||a&&game.producerAt(n)<0))');
runtime=once(runtime,'if(target===g.index)boardActivate(g.index);','if(target===g.index&&!g.moved)boardActivate(g.index);');
runtime=once(runtime,'else if(target!==null&&g.source)boardFeedback(g.index,target);','else if(target!==null&&target!==g.index&&g.source&&g.moved)boardFeedback(g.index,target);');
const hook=`
actions.generate=e=>workshopProduce(Number(e.dataset.c),Number(e.dataset.count||1));
actions['ws-tray']=()=>{if(!game.state.workshop.tray.length)return toast('暂存区为空 · 旧版多余材料会保留在这里');try{const i=game.takeTray();workshopAnimate([i]);toast('暂存材料已放入棋盘');}catch(e){toast(e.message);}};
function workshopFit(){
 const section=document.querySelector('.ws51'),board=section?.querySelector('.ws-board');if(!section||!board||ui.view!=='work')return;
 const nav=document.getElementById('mobile-nav'),navRect=nav?.getBoundingClientRect(),bottom=navRect&&navRect.height&&getComputedStyle(nav).display!=='none'?navRect.top:innerHeight;
 const rect=section.getBoundingClientRect(),style=getComputedStyle(section),children=[...section.children].filter(e=>getComputedStyle(e).display!=='none'&&e!==board);
 const scale=rect.width/section.clientWidth;
 const fixed=children.reduce((n,e)=>n+e.getBoundingClientRect().height/scale,0)+parseFloat(style.gap)*(children.length)+parseFloat(style.paddingBottom||0);
 const size=Math.max(180,Math.floor(Math.min(section.clientWidth,(bottom-rect.top)/scale-fixed-6)));
 document.getElementById('view').style.setProperty('--ws-board-size',size+'px');
}
window.addEventListener('resize',()=>requestAnimationFrame(workshopFit),{passive:true});
window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(workshopFit),{passive:true});
`;
runtime=once(runtime,'actions.cell=e=>boardActivate(Number(e.dataset.index));','actions.cell=e=>boardActivate(Number(e.dataset.index));\n'+hook);
runtime=runtime.replaceAll('同款10件升一阶','两件同款材料合成升一阶').replaceAll('10件同款升阶','两件同款材料升阶').replaceAll('把9件与1件样衣堆叠','拖动两件同款材料合成').replaceAll('先点1件再点9件，或把1件拖到9件上；','点击棋盘内材料箱，再拖动两件同款材料；').replaceAll('在工作台把1件女装材料放到9件那摞上，','在工作台拖动两件女装材料进行合成，');
runtime=runtime.replaceAll('样衣','材料').replaceAll('手游V0.6独立进度','V51独立进度');
// Reuse category-appropriate clothing artwork across recipes and chain guide.
const pixelStart=runtime.indexOf('function pixelSample(c,t,extra='),pixelEnd=runtime.indexOf('function pixelLibrary()',pixelStart);
runtime=runtime.slice(0,pixelStart)+'function pixelSample(c,t,extra=""){return materialIcon(c,t,"pixel-sprite "+extra);}\n'+runtime.slice(pixelEnd);
runtime=runtime.replaceAll('PixelWorkshop.SAMPLES.map((row,c)=>','PixelWorkshop.SAMPLES.slice(0,3).map((row,c)=>').replaceAll('${PixelWorkshop.categories[c]}','${CHAINS[c].name}');
let html=read('fashion-studio-mobile-trial-v50.html').replaceAll('fashion-studio-mobile-trial-v50','fashion-studio-mobile-trial-v51').replaceAll('V0.50','V0.51').replaceAll('V0.30','V0.51');
write('fashion-studio-mobile-trial-v51.html',html);
write('fashion-studio-mobile-trial-v51-runtime.js',runtime);
write('fashion-studio-mobile-trial-v51.css',read('fashion-studio-mobile-trial-v50.css')+'\n'+read('v51/workshop.css'));
const manifest=JSON.parse(read('fashion-studio-mobile-trial-v50-manifest.json'));manifest.version='V51';write('fashion-studio-mobile-trial-v51-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Generated independent V51 material workshop.');
