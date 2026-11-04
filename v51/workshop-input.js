function boardFeedback(from,to){
 try{
  const result=game.move(from,to);ui.selected=null;render();
  workshopAnimate([to],result.merge?'merge':'spawn');
  toast(result.producer?'材料箱位置已调整':result.merge?`合成成功 · 获得T${result.t+1}材料${result.reward?' · 里程碑奖励已到账':''}`:result.max?'T6已达最高阶，材料已换位':result.swap?'材料已交换位置':'材料已移动');
 }catch(err){ui.selected=game.state.board[from]?from:null;render();toast(err.message);}
}
function boardActivate(index){
 const producer=game.producerAt(index);
 if(producer>=0){try{workshopProduce(producer);}catch(err){toast(err.message);}return;}
 if(ui.selected===null){if(game.state.board[index])ui.selected=index;render();return;}
 if(ui.selected===index){ui.selected=null;render();return;}
 // Tap a different item to select it. Dragging different items swaps them.
 const a=game.state.board[ui.selected],b=game.state.board[index];
 if(a&&b&&(a.c!==b.c||a.t!==b.t)){ui.selected=index;render();return;}
 boardFeedback(ui.selected,index);
}
